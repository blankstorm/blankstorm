# Changes

These are the changes for the next update[s].

## Future
*For a furture release*

- Economy
- Particles and laser collisions

## Planned
*For the next release[s]*

- Hover over ships to see info
- Better stars (see https://www.babylonjs-playground.com/#MX2Z99#7)
- Hardpoints (see https://playground.babylonjs.com/#PU4WYI#291)
- Fix warp
- Fix logger messages
- Fix fleet distribution
- Fix log levels and use of `console.verbose`

## Changes since Alpha 1.1.0 release

### Features
- Improved ship selection
- New ships with better artwork
- Added support for regex in locale version matches

### Bug Fixes
- Logger would try to check the log level before it was defined
- Path gizmos would throw an error when being disposed
- `Vector3.ScreenToWorldPlane` will return `Vector3.Zero()` instead of null if a point isn't picked
- The link to the current changelog would not open to the correct version

### Technical Changes
- Removed the embeded en locale
- Entities will always spawn at y=0
