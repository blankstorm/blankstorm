import { Component, registerComponent } from 'deltablank/core/component.js';
import type { EntityJSON } from 'deltablank/core/entity.js';
import type { Recipe } from '../data';

export interface BuildInfo {
	buildTime?: number;
}

@registerComponent
export class Build extends Component<BuildInfo, BuildInfo, { recipe: Recipe }> {
	setup(): BuildInfo {
		return {};
	}

	load(data: EntityJSON & BuildInfo) {
		if (data.buildTime) this.entity.buildTime = data.buildTime;
	}

	tick(): void {
		if (this.entity.buildTime) this.entity.buildTime--;
	}

	dispose(): void {}

	toJSON(): BuildInfo {
		return this.entity.buildTime ? { buildTime: this.entity.buildTime } : {};
	}
}
