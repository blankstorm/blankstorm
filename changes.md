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
*For the next release*

- right click ships to see info

## Changes since Alpha 1.0.0 release

### Features

- Moved to using a core (for shared code between client and server)
- Saves now only use one scene and generate regions of the scene
- Removed RCS

### Bugs

- Issues with `level.getEntities` and `level.getBodies`
- Entities' hitboxes to F4
- Fixed loading storagedata
- Fixed some issues with commands

### Technical Changes

- Changed locale version format
- Moved `game.getEntity` and `game.getBody` to `level.getEntities` and `level.getBodies`
- Removed `game.removeEntity` and `game.removeBody` (use `(Entity).remove`)
- Removed local difficulty