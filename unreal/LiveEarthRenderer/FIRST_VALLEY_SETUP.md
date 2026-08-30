# First Valley scene contract

This folder is the handoff between the persistent Live Earth brain and the photoreal Unreal renderer.

## Create these Unreal assets

- `/Game/FirstValley/Maps/FirstValley`
- `BP_FirstValleyDirector` derived from `ALiveEarthFirstValleyDirector`
- `BP_LiveEarthPerson` derived from `ALiveEarthPersonProxy`
- one photoreal human/MetaHuman presentation layer per spawned proxy
- landscape, river, foliage, physical sky, volumetric clouds, directional sun, skylight, exponential height fog
- observer pawn/camera with no inhabitant control

## Director setup

Place one `BP_FirstValleyDirector` in the level and set `PersonProxyClass` to `BP_LiveEarthPerson`.

The director listens to the Live Earth snapshot service. It creates one proxy for every living person, binds the persistent person ID, updates world position, then calls `ApplyLatestState` so Blueprint/animation code can react to hunger, thirst, energy, health and action.

Implement `OnEnvironmentStateUpdated` in Blueprint to drive:
- sun/day-night rotation
- cloud density
- rain/wetness
- wind
- fog/haze
- temperature-dependent ambience

## Person presentation

In `BP_LiveEarthPerson`, implement `OnPersonStateApplied` as presentation only. Canonical decisions must stay in the world service.

Examples:
- `walk` / `explore` -> locomotion target and natural gait
- `rest` -> sit/idle/rest animation
- `drink` / `eat` -> contextual interaction animation
- energy -> locomotion speed / posture
- health -> body posture / movement quality
- stress/mood -> facial and idle presentation

Do not let Blueprint choose canonical actions or write history.

## Visual quality bar

First Valley is intentionally small. Do not expand the map until one location passes this test:

1. camera-level environment could plausibly be mistaken for photographed footage at a glance
2. human skin, eyes, hair and clothing hold up at conversation distance
3. body motion has breathing, weight transfer, eye motion and non-repeating idle variation
4. lighting/weather physically agree with the world snapshot
5. no floating labels, health bars or game HUD in the public observer view

## Pixel Streaming

`PixelStreaming2` is enabled in the project descriptor. Package the Windows renderer and run it on a supported GPU host with Epic's Pixel Streaming infrastructure/signalling stack. The public Vercel page should negotiate/launch a stream rather than attempt to reproduce the photoreal renderer in Three.js.

## Current boundary

C++ source, data bridge and runtime synchronization are ready in the repository. The `.uasset` map, environment content and photoreal human assets must be created/saved by Unreal Editor on a Windows/GPU machine; those binary editor assets cannot be generated or validated by the current chat runtime.
