#include "LiveEarthWorldSubsystem.h"

#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "TimerManager.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

namespace LiveEarthJson
{
    static double Number(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Key, double DefaultValue = 0.0)
    {
        double Value = DefaultValue;
        return Obj.IsValid() && Obj->TryGetNumberField(Key, Value) ? Value : DefaultValue;
    }

    static FString String(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Key)
    {
        FString Value;
        return Obj.IsValid() && Obj->TryGetStringField(Key, Value) ? Value : FString();
    }

    static bool Bool(const TSharedPtr<FJsonObject>& Obj, const TCHAR* Key, bool DefaultValue = false)
    {
        bool Value = DefaultValue;
        return Obj.IsValid() && Obj->TryGetBoolField(Key, Value) ? Value : DefaultValue;
    }

    static FVector Vector(const TSharedPtr<FJsonObject>& Obj)
    {
        if (!Obj.IsValid()) return FVector::ZeroVector;
        return FVector(Number(Obj, TEXT("x")), Number(Obj, TEXT("y")), Number(Obj, TEXT("z")));
    }
}

void ULiveEarthWorldSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    RefreshNow();

    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(
            PollTimer,
            this,
            &ULiveEarthWorldSubsystem::RefreshNow,
            FMath::Max(0.5f, PollIntervalSeconds),
            true
        );
    }
}

void ULiveEarthWorldSubsystem::Deinitialize()
{
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().ClearTimer(PollTimer);
    }

    Super::Deinitialize();
}

void ULiveEarthWorldSubsystem::RefreshNow()
{
    if (bRequestInFlight || SnapshotUrl.IsEmpty()) return;

    bRequestInFlight = true;
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(SnapshotUrl);
    Request->SetVerb(TEXT("GET"));
    Request->SetHeader(TEXT("Accept"), TEXT("application/json"));
    Request->SetTimeout(10.0f);
    Request->OnProcessRequestComplete().BindUObject(this, &ULiveEarthWorldSubsystem::HandleSnapshotResponse);
    Request->ProcessRequest();
}

void ULiveEarthWorldSubsystem::HandleSnapshotResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    bRequestInFlight = false;

    if (!bWasSuccessful || !Response.IsValid() || !EHttpResponseCodes::IsOk(Response->GetResponseCode()))
    {
        UE_LOG(LogTemp, Warning, TEXT("Live Earth snapshot request failed"));
        return;
    }

    if (ParseSnapshot(Response->GetContentAsString()))
    {
        OnSnapshotUpdated.Broadcast();
    }
}

bool ULiveEarthWorldSubsystem::ParseSnapshot(const FString& JsonText)
{
    TSharedPtr<FJsonObject> Root;
    const TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonText);
    if (!FJsonSerializer::Deserialize(Reader, Root) || !Root.IsValid()) return false;

    const TSharedPtr<FJsonObject>* WorldObjPtr = nullptr;
    if (!Root->TryGetObjectField(TEXT("world"), WorldObjPtr) || !WorldObjPtr || !WorldObjPtr->IsValid()) return false;
    const TSharedPtr<FJsonObject>& WorldObj = *WorldObjPtr;

    WorldName = LiveEarthJson::String(WorldObj, TEXT("name"));
    WorldTick = static_cast<int64>(LiveEarthJson::Number(WorldObj, TEXT("tick")));
    WorldDay = static_cast<int64>(LiveEarthJson::Number(WorldObj, TEXT("day")));
    Revision = static_cast<int64>(LiveEarthJson::Number(WorldObj, TEXT("revision")));

    TArray<FLiveEarthPersonState> ParsedPeople;
    const TArray<TSharedPtr<FJsonValue>>* PeopleArray = nullptr;
    if (Root->TryGetArrayField(TEXT("people"), PeopleArray) && PeopleArray)
    {
        for (const TSharedPtr<FJsonValue>& Value : *PeopleArray)
        {
            const TSharedPtr<FJsonObject> Obj = Value.IsValid() ? Value->AsObject() : nullptr;
            if (!Obj.IsValid()) continue;

            FLiveEarthPersonState Person;
            Person.Id = LiveEarthJson::String(Obj, TEXT("id"));
            Person.Name = LiveEarthJson::String(Obj, TEXT("name"));
            Person.Species = LiveEarthJson::String(Obj, TEXT("species"));
            Person.Sex = LiveEarthJson::String(Obj, TEXT("sex"));
            Person.Action = LiveEarthJson::String(Obj, TEXT("action"));
            Person.LocationId = LiveEarthJson::String(Obj, TEXT("locationId"));
            Person.bAlive = LiveEarthJson::Bool(Obj, TEXT("alive"), true);
            Person.ActionStartedTick = static_cast<int64>(LiveEarthJson::Number(Obj, TEXT("actionStartedTick")));

            const TSharedPtr<FJsonObject>* PositionObj = nullptr;
            if (Obj->TryGetObjectField(TEXT("position"), PositionObj) && PositionObj) Person.Position = LiveEarthJson::Vector(*PositionObj);

            const TSharedPtr<FJsonObject>* BodyObj = nullptr;
            if (Obj->TryGetObjectField(TEXT("body"), BodyObj) && BodyObj && BodyObj->IsValid())
            {
                Person.Body.Hunger = LiveEarthJson::Number(*BodyObj, TEXT("hunger"));
                Person.Body.Thirst = LiveEarthJson::Number(*BodyObj, TEXT("thirst"));
                Person.Body.Energy = LiveEarthJson::Number(*BodyObj, TEXT("energy"));
                Person.Body.Health = LiveEarthJson::Number(*BodyObj, TEXT("health"), 100);
                Person.Body.AgeDays = static_cast<int32>(LiveEarthJson::Number(*BodyObj, TEXT("ageDays")));
                Person.Body.bSleeping = LiveEarthJson::Bool(*BodyObj, TEXT("sleeping"));
            }

            const TSharedPtr<FJsonObject>* MindObj = nullptr;
            if (Obj->TryGetObjectField(TEXT("mind"), MindObj) && MindObj && MindObj->IsValid())
            {
                Person.Mind.Mood = LiveEarthJson::Number(*MindObj, TEXT("mood"), 50);
                Person.Mind.Stress = LiveEarthJson::Number(*MindObj, TEXT("stress"));
                Person.Mind.Curiosity = LiveEarthJson::Number(*MindObj, TEXT("curiosity"), 50);
                Person.Mind.Sociability = LiveEarthJson::Number(*MindObj, TEXT("sociability"), 50);
                Person.Mind.Goal = LiveEarthJson::String(*MindObj, TEXT("goal"));
            }

            ParsedPeople.Add(MoveTemp(Person));
        }
    }

    TArray<FLiveEarthLocationState> ParsedLocations;
    const TArray<TSharedPtr<FJsonValue>>* LocationArray = nullptr;
    if (Root->TryGetArrayField(TEXT("locations"), LocationArray) && LocationArray)
    {
        for (const TSharedPtr<FJsonValue>& Value : *LocationArray)
        {
            const TSharedPtr<FJsonObject> Obj = Value.IsValid() ? Value->AsObject() : nullptr;
            if (!Obj.IsValid()) continue;

            FLiveEarthLocationState Location;
            Location.Id = LiveEarthJson::String(Obj, TEXT("id"));
            Location.Name = LiveEarthJson::String(Obj, TEXT("name"));
            Location.Kind = LiveEarthJson::String(Obj, TEXT("kind"));
            Location.Biome = LiveEarthJson::String(Obj, TEXT("biome"));

            const TSharedPtr<FJsonObject>* PositionObj = nullptr;
            if (Obj->TryGetObjectField(TEXT("position"), PositionObj) && PositionObj) Location.Position = LiveEarthJson::Vector(*PositionObj);

            const TSharedPtr<FJsonObject>* WeatherObj = nullptr;
            if (Obj->TryGetObjectField(TEXT("weather"), WeatherObj) && WeatherObj && WeatherObj->IsValid())
            {
                Location.Weather.TemperatureC = LiveEarthJson::Number(*WeatherObj, TEXT("temperatureC"), 21);
                Location.Weather.Humidity = LiveEarthJson::Number(*WeatherObj, TEXT("humidity"), 0.55);
                Location.Weather.CloudCover = LiveEarthJson::Number(*WeatherObj, TEXT("cloudCover"), 0.25);
                Location.Weather.Precipitation = LiveEarthJson::Number(*WeatherObj, TEXT("precipitation"));
                Location.Weather.WindMps = LiveEarthJson::Number(*WeatherObj, TEXT("windMps"), 2);
            }

            ParsedLocations.Add(MoveTemp(Location));
        }
    }

    People = MoveTemp(ParsedPeople);
    Locations = MoveTemp(ParsedLocations);
    return true;
}

bool ULiveEarthWorldSubsystem::FindPersonById(const FString& PersonId, FLiveEarthPersonState& OutPerson) const
{
    for (const FLiveEarthPersonState& Person : People)
    {
        if (Person.Id == PersonId)
        {
            OutPerson = Person;
            return true;
        }
    }
    return false;
}
