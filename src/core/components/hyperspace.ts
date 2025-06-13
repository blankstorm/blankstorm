import { Component, registerComponent } from 'deltablank/core/component.js';
import type { Entity, EntityJSON } from 'deltablank/core/entity.js';
import type { System } from '../system';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';

export interface HyperspaceMixin {
	jumpCoolDown: number;
	system?: System;
	jumpTo(this: Entity<[Hyperspace]> & HyperspaceMixin & { system?: System }, targetSystem: System): boolean;
}

export interface HyperspaceJSON {
	jumpCoolDown: number;
}

export interface HyperspaceConfig {
	hyperspace: {
		range: number;
		cooldown: number;
	};
}

@registerComponent
export class Hyperspace extends Component<HyperspaceMixin, HyperspaceJSON, HyperspaceConfig> {
	public setup(): HyperspaceMixin {
		return {
			jumpCoolDown: 0,
			jumpTo: this.jumpTo.bind(this.entity),
		};
	}

	public load(data: EntityJSON & HyperspaceJSON): void {
		if (data.jumpCoolDown) this.entity.jumpCoolDown = data.jumpCoolDown;
	}

	public toJSON(): HyperspaceJSON {
		return {
			jumpCoolDown: this.entity.jumpCoolDown,
		};
	}

	protected jumpTo(this: Entity<[Hyperspace]> & HyperspaceMixin, targetSystem: System): boolean {
		if (this.jumpCoolDown) return false;

		if (Vector2.Distance(this.system!.position, targetSystem.position) > this.constructor.config.hyperspace.range) {
			return false;
		}

		this.system = targetSystem;
		this.jumpCoolDown = +this.constructor.config.hyperspace.cooldown;
		return true;
	}
}
