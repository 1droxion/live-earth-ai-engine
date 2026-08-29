from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Dict, List


@dataclass
class BodyState:
    hunger: float = 20.0
    thirst: float = 15.0
    energy: float = 90.0
    health: float = 100.0


@dataclass
class MindState:
    mood: float = 0.0
    stress: float = 10.0
    curiosity: float = 50.0
    sociability: float = 50.0


@dataclass
class Agent:
    id: str
    name: str
    age_days: int
    alive: bool = True
    location: str = "origin"
    food: float = 2.0
    water: float = 2.0
    body: BodyState = field(default_factory=BodyState)
    mind: MindState = field(default_factory=MindState)
    memories: List[str] = field(default_factory=list)


@dataclass
class WorldState:
    seed: int
    tick: int = 0
    day: int = 0
    resources: Dict[str, float] = field(default_factory=lambda: {"wild_food": 250.0, "fresh_water": 500.0})
    agents: Dict[str, Agent] = field(default_factory=dict)
    events: List[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)
