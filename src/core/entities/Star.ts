import type { Level } from '../Level';
import { Entity } from './Entity';
import type { JSONValue } from '../components/json';
import type { IColor3Like } from '@babylonjs/core/Maths/math.like';
import type { ComponentsData } from '../components/component';

type Components = {
	radius: JSONValue<number>;
	color: JSONValue<IColor3Like>;
};

export class Star extends Entity<Components> {
	constructor(id: string, level: Level, options: ComponentsData<Components>) {
		super(id, level, options);
	}
}
