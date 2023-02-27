//core info and setup
import { version, versions } from './meta.js';
import Items from './items.js';
import Tech from './tech.js';
import Path from './Path.js';
import Storage from './Storage.js';

import Entity from './entities/Entity.js';
import Player from './entities/Player.js';
import Hardpoint from './entities/Hardpoint.js';
import Ship from './entities/Ship.js';

import CelestialBody from './bodies/CelestialBody.js';
import Planet from './bodies/Planet.js';
import Star from './bodies/Star.js';
import StationComponent from './bodies/StationComponent.js';
import Station from './bodies/Station.js';

import Level from './Level.js';

export * from './meta.js';
export * from './utils.js';
export * from './commands.js';
export { Items, Tech, Path, Storage, Player, Hardpoint, Entity, Ship, CelestialBody, Planet, Star, StationComponent, Station, Level };

console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`);
