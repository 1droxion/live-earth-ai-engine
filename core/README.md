# Live Earth Genesis Core v0.1

This is the first **headless** proof of Live Earth. It is intentionally not a game UI and it does not control stories.

## What this version proves

- A persistent world clock keeps advancing.
- 25 Genesis humans have persistent identity, age, health, hunger, energy, social needs, traits and memory.
- Humans choose routine actions from their own state instead of receiving a scripted story.
- Social affinity can create partnerships.
- Partnerships can lead to abstractly modeled pregnancy and birth.
- People age and can die permanently.
- Food exists as a world resource, regenerates through a simple ecosystem rule, and is moved by foraging/work/eating.
- Every meaningful world event is appended to `data/events.ndjson`.
- The complete world state is checkpointed to `data/world.json` and resumes from that state on the next run.
- The simulation uses a seeded pseudo-random stream so runs can be reproduced while preserving continuity after restart.

## What this version does NOT claim

This is not yet the final AI brain, full biology, real economics, emergent science, language invention, Unreal rendering, infinite terrain or self-modifying engineering system. Those are later layers. This baseline gives us a stable source of truth before adding expensive AI and photorealistic rendering.

## Run it

Requires Node.js 20+.

```bash
cd core
npm run simulate -- --days=30 --reset
```

Continue the same universe for another 30 simulated days:

```bash
npm run simulate -- --days=30
```

Run a longer accelerated test:

```bash
npm run simulate -- --days=365 --reset --seed=26071999
```

## Files

- `genesis.mjs` - deterministic universe loop, agents, needs, actions, relationships, reproduction, death and persistence.
- `data/world.json` - current checkpoint, created at runtime.
- `data/events.ndjson` - append-only history, created at runtime.

## Core rule

**Reality exists in the Core. Visuals only show reality.**

Unreal Engine, iOS, AI video and future world models must never become the source of truth for Live Earth history.
