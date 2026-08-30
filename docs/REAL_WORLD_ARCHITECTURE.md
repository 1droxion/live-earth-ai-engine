# Live Earth real-world architecture

The public experience must feel like observing another reality, not using a dashboard or a browser game.

## Runtime layers

1. **World Kernel**
   - Owns time, immutable identity, causality, event ordering, versioning and rollback boundaries.
   - Never depends on the renderer.

2. **Living World Service**
   - Advances people, bodies, needs, memory, relationships, resources, locations and consequences.
   - Writes append-only events and current state to PostgreSQL/Supabase.
   - Continues while no viewer is connected.

3. **Renderer Bridge**
   - Produces a compact snapshot for the currently observed region.
   - The renderer consumes state; it does not invent canonical world history.
   - Visual animation can interpolate between snapshots, but authoritative events come from the world service.

4. **Unreal Engine 5 Client**
   - Photoreal environment, digital humans, animation, lighting, weather, audio and camera.
   - Initial target: one high-quality location and 1-5 persistent humans.
   - Later target: streamed world cells, cities, continents, planets and non-human civilizations.

5. **GPU Streaming Runtime**
   - Unreal runs on a GPU machine.
   - Pixel Streaming sends video/audio to the browser and receives observer camera input.
   - Vercel is not the GPU renderer.

6. **Vercel Web Entry**
   - Login/launch page, session negotiation, status and fallback experience.
   - Connects the viewer to an available Pixel Streaming session.
   - `/admin` remains diagnostic only.

## First reality milestone

A viewer enters one persistent location and can watch 1-5 digital humans whose basic actions are caused by their saved body state and world state. The scene must continue across viewer disconnects.

Required behavior:
- persistent world clock
- persistent human identity
- hunger, thirst, fatigue and health
- movement and simple autonomous actions
- day/night and weather state
- memory/event persistence
- renderer receives authoritative state
- observer cannot directly command inhabitants

## Visual quality rule

Do not expand map size until one small scene passes the visual bar. A tiny scene that feels real is more valuable than a huge scene that looks like a game.

## Self-building system

Automatic code generation is a later layer around the kernel. Generated changes must be built and tested in an isolated environment, evaluated, versioned and rollback-safe before promotion. The self-builder must not directly rewrite protected kernel rules or production history.
