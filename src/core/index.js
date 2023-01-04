//core info and setup
import { version, versions } from './meta.js';
import Items from './items.js';
import Tech from './tech.js';
import Path from './Path.js';
import StorageData from './StorageData.js';
import PlayerData from './PlayerData.js';
import Hardpoint from './Hardpoint.js';
import Entity from './entities/Entity.js';
import Ship from './entities/Ship.js';
import CelestialBodyMaterial from './bodies/CelestialBodyMaterial.js';
import CelestialBody from './bodies/CelestialBody.js';
import Planet from './bodies/Planet.js';
import Star from './bodies/Star.js';
import StationComponent from './StationComponent.js';
import Station from './bodies/Station.js';
import Level from './Level.js';

export * from './meta.js';
export * from './utils.js';
export * from './commands.js';
export { Items, Tech, Path, StorageData, PlayerData, Hardpoint, Entity, Ship, CelestialBodyMaterial, CelestialBody, Planet, Star, StationComponent, Station, Level };

console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`);
