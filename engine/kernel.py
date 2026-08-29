from __future__ import annotations

import random
import uuid

from .models import Agent, WorldState


KERNEL_VERSION = "0.1.0"
TICKS_PER_DAY = 24


def make_world(seed: int = 1, population: int = 100) -> WorldState:
    rng = random.Random(seed)
    world = WorldState(seed=seed)
    for i in range(population):
        agent_id = str(uuid.UUID(int=rng.getrandbits(128)))
        world.agents[agent_id] = Agent(
            id=agent_id,
            name=f"Person-{i+1:04d}",
            age_days=rng.randint(18 * 365, 45 * 365),
        )
    world.events.append({"tick": 0, "type": "world_created", "population": population, "seed": seed})
    return world


def advance_clock(world: WorldState) -> None:
    world.tick += 1
    if world.tick % TICKS_PER_DAY == 0:
        world.day += 1
        for agent in world.agents.values():
            if agent.alive:
                agent.age_days += 1


def assert_invariants(world: WorldState) -> None:
    if world.tick < 0 or world.day < 0:
        raise RuntimeError("Simulation time cannot move backward")
    for key, value in world.resources.items():
        if value < 0:
            raise RuntimeError(f"Resource {key} became negative")
    for agent in world.agents.values():
        if not (0 <= agent.body.health <= 100):
            raise RuntimeError(f"Invalid health for {agent.id}")
