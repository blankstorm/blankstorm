//core info and setup
import { version, versions } from './meta';
export * from './generic/items';
export * from './generic/research';
export * from './generic/ships';
export * from './generic/hardpoints';
export * from './generic/stationComponents';
export { default as Path } from './Path';
export * from './Storage';

export * from './entities/Entity';
export * from './entities/Player';
export * from './entities/Hardpoint';
export * from './entities/Ship';

export * from './bodies/CelestialBody';
export * from './bodies/Planet';
export * from './bodies/Star';
export * from './bodies/StationComponent';
export * from './bodies/Station';

export * from './Level';

export * from './meta';
export * from './utils';
export * from './commands';
export * from './api';

console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`);
