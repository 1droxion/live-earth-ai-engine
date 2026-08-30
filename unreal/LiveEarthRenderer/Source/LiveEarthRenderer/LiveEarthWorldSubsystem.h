#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "LiveEarthWorldSubsystem.generated.h"

USTRUCT(BlueprintType)
struct FLiveEarthBodyState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) float Hunger = 0;
    UPROPERTY(BlueprintReadOnly) float Thirst = 0;
    UPROPERTY(BlueprintReadOnly) float Energy = 0;
    UPROPERTY(BlueprintReadOnly) float Health = 100;
    UPROPERTY(BlueprintReadOnly) int32 AgeDays = 0;
    UPROPERTY(BlueprintReadOnly) bool bSleeping = false;
};

USTRUCT(BlueprintType)
struct FLiveEarthMindState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) float Mood = 50;
    UPROPERTY(BlueprintReadOnly) float Stress = 0;
    UPROPERTY(BlueprintReadOnly) float Curiosity = 50;
    UPROPERTY(BlueprintReadOnly) float Sociability = 50;
    UPROPERTY(BlueprintReadOnly) FString Goal;
};

USTRUCT(BlueprintType)
struct FLiveEarthPersonState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) FString Name;
    UPROPERTY(BlueprintReadOnly) FString Species;
    UPROPERTY(BlueprintReadOnly) FString Sex;
    UPROPERTY(BlueprintReadOnly) FString Action;
    UPROPERTY(BlueprintReadOnly) FString LocationId;
    UPROPERTY(BlueprintReadOnly) FVector Position = FVector::ZeroVector;
    UPROPERTY(BlueprintReadOnly) bool bAlive = true;
    UPROPERTY(BlueprintReadOnly) int64 ActionStartedTick = 0;
    UPROPERTY(BlueprintReadOnly) FLiveEarthBodyState Body;
    UPROPERTY(BlueprintReadOnly) FLiveEarthMindState Mind;
};

USTRUCT(BlueprintType)
struct FLiveEarthWeatherState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) float TemperatureC = 21;
    UPROPERTY(BlueprintReadOnly) float Humidity = 0.55f;
    UPROPERTY(BlueprintReadOnly) float CloudCover = 0.25f;
    UPROPERTY(BlueprintReadOnly) float Precipitation = 0;
    UPROPERTY(BlueprintReadOnly) float WindMps = 2;
};

USTRUCT(BlueprintType)
struct FLiveEarthLocationState
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly) FString Id;
    UPROPERTY(BlueprintReadOnly) FString Name;
    UPROPERTY(BlueprintReadOnly) FString Kind;
    UPROPERTY(BlueprintReadOnly) FString Biome;
    UPROPERTY(BlueprintReadOnly) FVector Position = FVector::ZeroVector;
    UPROPERTY(BlueprintReadOnly) FLiveEarthWeatherState Weather;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnLiveEarthSnapshotUpdated);

UCLASS()
class LIVEEARTHRENDERER_API ULiveEarthWorldSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth")
    FString SnapshotUrl = TEXT("https://live-earth-droxion-1a8a6bea.vercel.app/api/world?slug=world-001");

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth")
    float PollIntervalSeconds = 2.0f;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    int64 WorldTick = 0;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    int64 WorldDay = 0;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    int64 Revision = 0;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    FString WorldName;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    TArray<FLiveEarthPersonState> People;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    TArray<FLiveEarthLocationState> Locations;

    UPROPERTY(BlueprintAssignable, Category="Live Earth")
    FOnLiveEarthSnapshotUpdated OnSnapshotUpdated;

    UFUNCTION(BlueprintCallable, Category="Live Earth")
    void RefreshNow();

    UFUNCTION(BlueprintPure, Category="Live Earth")
    bool FindPersonById(const FString& PersonId, FLiveEarthPersonState& OutPerson) const;

private:
    FTimerHandle PollTimer;
    bool bRequestInFlight = false;
    void HandleSnapshotResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful);
    bool ParseSnapshot(const FString& JsonText);
};
