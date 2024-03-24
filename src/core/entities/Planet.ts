import type { Level } from '../Level';
import type { PlanetBiome } from '../generic/planets';
import { Entity } from './Entity';
import type { Fleet } from '../components/fleet';
import type { Storage } from '../components/storage';
import type { JSONValue } from '../components/json';
import type { BooleanValue } from '../components/boolean';

export class Planet extends Entity<{
	fleet: Fleet;
	rewards: Storage;
	radius: JSONValue<number>;
	biome: JSONValue<PlanetBiome>;
	capture: BooleanValue;
}> {
	constructor(id?: string, level?: Level) {
		super(id, level);
	}
}
