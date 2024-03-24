import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { wait } from '../utils';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointType, GenericHardpoint } from '../generic/hardpoints';
import type { Level } from '../Level';
import type { HardpointInfo } from '../generic/ships';
import { Entity } from './Entity';
import { Owner } from '../components/owner';
import type { JSONValue } from '../components/json';
import type { Target } from '../components/combat';

export class Hardpoint extends Entity<{
	owner: Owner;
	reload: JSONValue<number>;
	type: JSONValue<HardpointType>;
	info: JSONValue<HardpointInfo>;
}> {
	constructor(id: string, level: Level, { type, reload }: { type?: HardpointType; reload?: number } = {}) {
		super(id, level);

		this['type'].value = type;

		this.get('type').value = type;
		this.get('reload').value = reload ?? this.generic.reload;

		this.rotation.addInPlaceFromFloats(0, Math.PI, 0);
	}

	get generic(): GenericHardpoint {
		return genericHardpoints[this.get('type').value];
	}

	remove() {
		super.remove();
		if (this.owner) {
			this.owner.hardpoints.delete(this);
		}
	}

	/**
	 * @todo implement projectile logic on the core
	 */
	async fire({ combatant: target }: Target) {
		this.level.emit('entity.fire_projectile', this.id, target.id, this.generic.projectile);
		const time = Vector3.Distance(this.absolutePosition, target.absolutePosition) / this.generic.projectile.speed;
		this.get('reload').value = this.generic.reload;
		await wait(time);
		target.combat.hp -= this.generic.damage * (Math.random() < this.generic.critChance ? this.generic.critFactor : 1);
	}
}
