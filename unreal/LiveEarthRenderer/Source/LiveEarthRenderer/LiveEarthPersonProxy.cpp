#include "LiveEarthPersonProxy.h"
#include "LiveEarthWorldSubsystem.h"
#include "Engine/GameInstance.h"

ALiveEarthPersonProxy::ALiveEarthPersonProxy()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ALiveEarthPersonProxy::BeginPlay()
{
    Super::BeginPlay();

    if (UGameInstance* GameInstance = GetGameInstance())
    {
        WorldSubsystem = GameInstance->GetSubsystem<ULiveEarthWorldSubsystem>();
        if (WorldSubsystem)
        {
            WorldSubsystem->OnSnapshotUpdated.AddDynamic(this, &ALiveEarthPersonProxy::ApplyLatestState);
            ApplyLatestState();
        }
    }
}

void ALiveEarthPersonProxy::ApplyLatestState()
{
    if (!WorldSubsystem || PersonId.IsEmpty()) return;

    FLiveEarthPersonState State;
    if (!WorldSubsystem->FindPersonById(PersonId, State)) return;

    PersonName = State.Name;
    CurrentAction = State.Action;
    Hunger = State.Body.Hunger;
    Thirst = State.Body.Thirst;
    Energy = State.Body.Energy;
    Health = State.Body.Health;

    const FVector TargetLocation(
        State.Position.X * WorldUnitsPerMeter,
        State.Position.Y * WorldUnitsPerMeter,
        State.Position.Z * WorldUnitsPerMeter
    );
    SetActorLocation(TargetLocation);

    SetActorHiddenInGame(!State.bAlive);
    SetActorEnableCollision(State.bAlive);

    OnPersonStateApplied();
}
