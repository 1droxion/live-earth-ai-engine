#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "LiveEarthPersonProxy.generated.h"

class ULiveEarthWorldSubsystem;

UCLASS(Blueprintable)
class LIVEEARTHRENDERER_API ALiveEarthPersonProxy : public AActor
{
    GENERATED_BODY()

public:
    ALiveEarthPersonProxy();
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth")
    FString PersonId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="Live Earth")
    float WorldUnitsPerMeter = 100.0f;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    FString PersonName;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    FString CurrentAction;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    float Hunger = 0;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    float Thirst = 0;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    float Energy = 100;

    UPROPERTY(BlueprintReadOnly, Category="Live Earth")
    float Health = 100;

    UFUNCTION(BlueprintImplementableEvent, Category="Live Earth")
    void OnPersonStateApplied();

    UFUNCTION(BlueprintCallable, Category="Live Earth")
    void ApplyLatestState();

private:
    UPROPERTY() ULiveEarthWorldSubsystem* WorldSubsystem = nullptr;
};
