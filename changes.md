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

- right click to see info

## Features and Changes

- Ctrl + S to save
- Strobing / RGB UI easter egg
- Support for save upgrading
- Support for `Ctrl` and `Alt` with keybinds
- Update favicon
- Copyright notice in main menu
- Input field styling
- Tab list
- Inventory and navigation GUIs changed
- Waypoints
- Items capacity/usage bar
- Fully implemented criticals
- Material descriptions
- Localization support
- New ships: small and medium transport
- Scroll (middle) click to rotate the camera
- WASD are camera only
- left click to move/attack
- Shift clicking delete on a save will skip the confirmation dialog

## Bugs

- Save creation input misaligned
- Volume settings not affecting sound
- Screenshot context menu not preventing default menu
- `(Entity).removeFromScene()` did not delete the internally stored mesh
- Couldn't warp
- warp range limit was not applied
- Modal would not vertically align the inputs properly
- Connection refused messages would be prefixed with connection error
- Player fleet did not use power for determining new ship positions
- Death when opening or creating saves
- Fixed a compatibility issue with accessing memory data on Firefox (thanks to Matgamer641)
- Creating save from cached data would not convert to JSON properly
- HUD xp bar misalignment
- Player data would not load from saves properly
- Changing settings would not update the 
- Incorrect thrust description
- Game would not save levels with more than one digit or a negative for either coordinate
- Incorrect spelling in game loaded message
- Toggling chat would try to fire `preventDefault()` internally
- Changing levels would not call `ui.update`
- Changing levels did not reassign the camera's target to the player
- Levels without any bodies would fail to render
- ships would not load storage correctly after saving

## Technical Changes

- Support for timed actions with updates at intervals (using `Action`)
- Support for meshless entities
- Saves round numbers to 3 decimal places
- Simplified modal code using forms with `method=dialog`
- Remove dead code
- External SVG Icon loading
- Changed message for when game is fully loaded
- Removed `navigator.platform` from debug screen
- Change star materials to `StandardMaterial` and removed the materials library
- Ships use relative cordinates with a parent
- Added `Array.prototype.spliceOut`