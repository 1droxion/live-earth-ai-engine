#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "LiveEarthFirstValleyDirector.generated.h"

class ALiveEarthPersonProxy;
class ULiveEarthWorldSubsystem;

UCLASS(Blueprintable)
class LIVEEARTHRENDERER_API ALiveEarthFirstValleyDirector : public AActor
{
    GENERATED_BODY()

public:
    ALiveEarthFirstValleyDirector();
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth|Population")
    TSubclassOf<ALiveEarthPersonProxy> PersonProxyClass;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth|Population")
    bool bAutoSpawnPeople = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth|World")
    float WorldUnitsPerMeter = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth|World")
    float GroundZ = 0.0f;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth|World")
    int64 LastAppliedRevision = -1;

    UFUNCTION(BlueprintCallable, Category="Live Earth")
    void SyncWorldNow();

    UFUNCTION(BlueprintImplementableEvent, Category="Live Earth|Environment")
    void OnEnvironmentStateUpdated(float TemperatureC, float Humidity, float CloudCover, float Precipitation, float WindMps, int64 WorldTick, int64 WorldDay);

private:
    UPROPERTY() ULiveEarthWorldSubsystem* WorldSubsystem = nullptr;
    UPROPERTY() TMap<FString, ALiveEarthPersonProxy*> SpawnedPeople;

    UFUNCTION()
    void HandleSnapshotUpdated();

    void SyncPeople();
    void SyncEnvironment();
};
