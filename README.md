# Live Earth / Live Universe v0.1

Live Earth is a persistent autonomous digital civilization. The goal is not to script a story, but to define stable rules and let world history emerge from persistent agents, needs, memory, relationships, resources, and consequences.

## v0.1 goals

- deterministic world seed
- persistent simulation clock
- autonomous agents with body needs
- memory and mood state
- resources and locations
- actions chosen from state, not scripted story beats
- append-only event history
- reproducible simulation runs
- protected kernel boundaries

## Architecture

- `engine/kernel.py` - protected simulation clock, seed, invariants
- `engine/models.py` - world and agent data models
- `engine/simulation.py` - autonomous decision and world-update loop
- `engine/main.py` - local runner

## First milestone

Run 100 persistent people for simulated years and produce history that is caused by the simulation state rather than generated as a narrative prompt.

## Later layers

Biology, relationships, reproduction, economy, settlements, law, language emergence, technology, 3D observation, planetary systems, alien civilizations, and sandboxed AI code-improvement agents.
