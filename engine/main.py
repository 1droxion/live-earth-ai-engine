from __future__ import annotations

import argparse
import json
from pathlib import Path

from .kernel import make_world
from .simulation import run


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Live Earth / Live Universe v0.1")
    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--population", type=int, default=100)
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--output", default="world_state.json")
    args = parser.parse_args()

    world = make_world(seed=args.seed, population=args.population)
    run(world, ticks=args.days * 24)

    output = Path(args.output)
    output.write_text(json.dumps(world.to_dict(), indent=2), encoding="utf-8")

    alive = sum(1 for person in world.agents.values() if person.alive)
    print(f"seed={world.seed} day={world.day} population={len(world.agents)} alive={alive}")
    print(f"events={len(world.events)} saved={output}")


if __name__ == "__main__":
    main()
