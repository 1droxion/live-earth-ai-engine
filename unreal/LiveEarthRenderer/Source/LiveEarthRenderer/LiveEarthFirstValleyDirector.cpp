#include "LiveEarthFirstValleyDirector.h"

#include "LiveEarthPersonProxy.h"
#include "LiveEarthWorldSubsystem.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

ALiveEarthFirstValleyDirector::ALiveEarthFirstValleyDirector()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ALiveEarthFirstValleyDirector::BeginPlay()
{
    Super::BeginPlay();

    if (UGameInstance* GI = GetGameInstance())
    {
        WorldSubsystem = GI->GetSubsystem<ULiveEarthWorldSubsystem>();
    }

    if (WorldSubsystem)
    {
        WorldSubsystem->OnSnapshotUpdated.AddDynamic(this, &ALiveEarthFirstValleyDirector::HandleSnapshotUpdated);
        SyncWorldNow();
    }
}

void ALiveEarthFirstValleyDirector::HandleSnapshotUpdated()
{
    SyncWorldNow();
}

void ALiveEarthFirstValleyDirector::SyncWorldNow()
{
    if (!WorldSubsystem || WorldSubsystem->Revision == LastAppliedRevision) return;

    SyncPeople();
    SyncEnvironment();
    LastAppliedRevision = WorldSubsystem->Revision;
}

void ALiveEarthFirstValleyDirector::SyncPeople()
{
    if (!bAutoSpawnPeople || !PersonProxyClass || !GetWorld()) return;

    TSet<FString> AliveIds;

    for (const FLiveEarthPersonState& Person : WorldSubsystem->People)
    {
        if (!Person.bAlive) continue;
        AliveIds.Add(Person.Id);

        ALiveEarthPersonProxy* Proxy = SpawnedPeople.FindRef(Person.Id);
        if (!IsValid(Proxy))
        {
            FActorSpawnParameters Params;
            Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;
            Proxy = GetWorld()->SpawnActor<ALiveEarthPersonProxy>(PersonProxyClass, FVector::ZeroVector, FRotator::ZeroRotator, Params);
            if (!Proxy) continue;

            Proxy->PersonId = Person.Id;
            Proxy->WorldUnitsPerMeter = WorldUnitsPerMeter;
            SpawnedPeople.Add(Person.Id, Proxy);
        }

        Proxy->ApplyLatestState();
        FVector Desired = Person.Position * WorldUnitsPerMeter;
        Desired.Z += GroundZ;
        Proxy->SetActorLocation(Desired);
    }

    TArray<FString> RemoveIds;
    for (const TPair<FString, ALiveEarthPersonProxy*>& Pair : SpawnedPeople)
    {
        if (!AliveIds.Contains(Pair.Key))
        {
            if (IsValid(Pair.Value)) Pair.Value->Destroy();
            RemoveIds.Add(Pair.Key);
        }
    }

    for (const FString& Id : RemoveIds)
    {
        SpawnedPeople.Remove(Id);
    }
}

void ALiveEarthFirstValleyDirector::SyncEnvironment()
{
    if (WorldSubsystem->Locations.IsEmpty()) return;

    const FLiveEarthWeatherState& Weather = WorldSubsystem->Locations[0].Weather;
    OnEnvironmentStateUpdated(
        Weather.TemperatureC,
        Weather.Humidity,
        Weather.CloudCover,
        Weather.Precipitation,
        Weather.WindMps,
        WorldSubsystem->WorldTick,
        WorldSubsystem->WorldDay
    );
}
