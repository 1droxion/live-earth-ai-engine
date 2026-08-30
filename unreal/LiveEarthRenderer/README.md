# Live Earth Unreal Renderer v0.4

This directory is the photoreal renderer client for Live Earth. It is intentionally separate from the canonical world simulation.

## What is already connected

`ULiveEarthWorldSubsystem` polls the production Live Earth snapshot endpoint and exposes world tick, day, locations, weather and persistent person state to Unreal Blueprints/C++.

`ALiveEarthPersonProxy` binds a placed Unreal actor to one persistent Live Earth person ID. The actor receives the authoritative person's position, action and body state. A Blueprint subclass can map `CurrentAction` and body/mind values to MetaHuman animation, locomotion, facial state, breathing and other presentation.

The renderer is read-only. It must not decide canonical world history.

## First visual target: First Valley

Do not build a giant map yet. Build one small photoreal location that can pass the reality test:

- realistic landscape/foliage/river
- Lumen lighting and physically plausible exposure
- day/night and weather driven from `Locations[0].Weather`
- 1-5 MetaHuman-quality people
- natural idle breathing, eye movement and locomotion
- actions driven by Live Earth state, not scripted story beats
- free observer camera only
- Pixel Streaming browser delivery

## Opening

1. Install Unreal Engine 5.6 (or update the `.uproject` association to the installed compatible version).
2. Open `LiveEarthRenderer.uproject` and allow Unreal to generate/build project files.
3. If the Pixel Streaming 2 plugin is unavailable in that engine build, enable the supported Pixel Streaming plugin for that version and adjust the `.uproject` plugin entry.
4. Create a map named `FirstValley`.
5. Create Blueprint children of `ALiveEarthPersonProxy` for visual humans.
6. Set each actor's `PersonId` to one of the IDs returned by `/api/world`.
7. In `OnPersonStateApplied`, route `CurrentAction`, Hunger, Thirst, Energy and Health into the character animation/behavior presentation layer.

## Important boundary

This scaffold has been written and reviewed at source level, but cannot be compiled or packaged from this ChatGPT environment because Unreal Editor/Unreal Build Tool and a GPU runtime are not connected here. The first editor compile is the next validation gate before adding photoreal assets.
