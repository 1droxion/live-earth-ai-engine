from __future__ import annotations

import random

from .kernel import advance_clock, assert_invariants
from .models import Agent, WorldState


def _remember(agent: Agent, message: str) -> None:
    agent.memories.append(message)
    if len(agent.memories) > 100:
        del agent.memories[:-100]


def _choose_action(agent: Agent, world: WorldState, rng: random.Random) -> str:
    body = agent.body
    if body.thirst >= 70:
        return "drink"
    if body.hunger >= 70:
        return "eat"
    if body.energy <= 25:
        return "rest"

    options = ["explore", "gather_food", "gather_water", "rest"]
    weights = [
        1.0 + agent.mind.curiosity / 50.0,
        1.0 + body.hunger / 50.0,
        1.0 + body.thirst / 50.0,
        0.5 + (100 - body.energy) / 100.0,
    ]
    return rng.choices(options, weights=weights, k=1)[0]


def _apply_action(agent: Agent, world: WorldState, action: str, rng: random.Random) -> None:
    body = agent.body

    if action == "drink":
        if agent.water >= 1:
            agent.water -= 1
            body.thirst = max(0, body.thirst - 65)
            _remember(agent, f"Day {world.day}: drank stored water")
        else:
            action = "gather_water"

    if action == "eat":
        if agent.food >= 1:
            agent.food -= 1
            body.hunger = max(0, body.hunger - 60)
            _remember(agent, f"Day {world.day}: ate stored food")
        else:
            action = "gather_food"

    if action == "gather_food":
        available = world.resources.get("wild_food", 0)
        amount = min(available, rng.uniform(0.2, 1.5))
        world.resources["wild_food"] = available - amount
        agent.food += amount
        body.energy = max(0, body.energy - 4)
        _remember(agent, f"Day {world.day}: gathered {amount:.2f} food")

    elif action == "gather_water":
        available = world.resources.get("fresh_water", 0)
        amount = min(available, rng.uniform(0.5, 2.0))
        world.resources["fresh_water"] = available - amount
        agent.water += amount
        body.energy = max(0, body.energy - 2)
        _remember(agent, f"Day {world.day}: gathered {amount:.2f} water")

    elif action == "rest":
        body.energy = min(100, body.energy + rng.uniform(10, 22))
        agent.mind.stress = max(0, agent.mind.stress - 2)

    elif action == "explore":
        body.energy = max(0, body.energy - 3)
        agent.mind.curiosity = min(100, agent.mind.curiosity + rng.uniform(-1, 1))

    world.events.append({
        "tick": world.tick,
        "day": world.day,
        "type": "agent_action",
        "agent_id": agent.id,
        "action": action,
    })


def _metabolism(agent: Agent) -> None:
    body = agent.body
    body.hunger = min(100, body.hunger + 1.2)
    body.thirst = min(100, body.thirst + 1.8)
    body.energy = max(0, body.energy - 0.7)

    if body.hunger >= 95:
        body.health = max(0, body.health - 0.4)
    if body.thirst >= 95:
        body.health = max(0, body.health - 1.0)
    if body.energy <= 2:
        body.health = max(0, body.health - 0.2)

    if body.health <= 0:
        agent.alive = False


def step(world: WorldState) -> WorldState:
    rng = random.Random((world.seed << 32) ^ world.tick)
    advance_clock(world)

    for agent in world.agents.values():
        if not agent.alive:
            continue
        _metabolism(agent)
        if not agent.alive:
            world.events.append({"tick": world.tick, "day": world.day, "type": "death", "agent_id": agent.id})
            continue
        action = _choose_action(agent, world, rng)
        _apply_action(agent, world, action, rng)

    assert_invariants(world)
    return world


def run(world: WorldState, ticks: int) -> WorldState:
    for _ in range(ticks):
        step(world)
    return world
