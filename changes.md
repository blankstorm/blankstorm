# Changes

These are the changes for the next update[s].

## Ideas
*Possible features*

- Fleet class

## Future
*For a furture release*

- Economy
- Hardpoints
- Particles and laser collisions

## Planned
*For the next release[s]*

- Hover over ships to see info
- Better stars (see https://www.babylonjs-playground.com/#MX2Z99#7)
- Hardpoints (see https://playground.babylonjs.com/#PU4WYI#291)
- New ships with better artwork
- Fix warp

## Changes since Alpha 1.0.0 release

### Features

- Moved to using a core (for shared code between client and server)
- Saves now only use one scene and generate regions of the scene
- Removed RCS
- Removed locale caching
- Added debug log viewer & console (F10)
- Smooth ship movement

### Bugs

- Issues with `level.getEntities` and `level.getBodies`
- Entities' hitboxes to F4
- Fixed loading storagedata
- Some issues with commands
- Cruiser was mispelled as crusier
- Loading the IndexedDB from a version before 2 to 3 (the locales objectStore wouldn't exist)

### Technical Changes

- Changed locale version format
- Moved `game.getEntity` and `game.getBody` to `level.getEntities` and `level.getBodies`
- Removed `game.removeEntity` and `game.removeBody` (use `(Entity).remove`)
- Removed local difficulty
- `item` and `tech` are maps 