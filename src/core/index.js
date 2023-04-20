//core info and setup
import { version, versions } from './meta.js';
export { default as Items } from './items.js';
export { default as Tech } from './tech.js';
export { default as Path } from './Path.js';
export { default as Storage } from './Storage.js';

export { default as Entity } from './entities/Entity.js';
export { default as Player } from './entities/Player.js';
export { default as Hardpoint } from './entities/Hardpoint.js';
export { default as Ship } from './entities/Ship.js';

export { default as CelestialBody } from './bodies/CelestialBody.js';
export { default as Planet } from './bodies/Planet.js';
export { default as Star } from './bodies/Star.js';
export { default as StationComponent } from './bodies/StationComponent.js';
export { default as Station } from './bodies/Station.js';

export { default as Level } from './Level.js';

export * from './meta.js';
export * from './utils.js';
export * from './commands.js';
export * from './api.js';

console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`);
