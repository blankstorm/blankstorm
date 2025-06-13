import { Component, registerComponent } from 'deltablank/core/component.js';
import type { Entity, EntityJSON } from 'deltablank/core/entity.js';
import type { UUID } from 'utilium/string.js';

@registerComponent
export class Owner extends Component<{ owner?: Entity }, { owner?: UUID }, { self_owned?: boolean; owner_types?: string[] }> {
	setup(): { owner?: Entity } {
		return {
			owner: this.entity.constructor.config.self_owned ? this.entity : undefined,
		};
	}

	load(data: EntityJSON & { owner?: UUID }): void {
		this.entity.owner = data.owner ? this.entity.level.getEntityByID(data.owner) : undefined;
	}

	toJSON(): { owner?: UUID } {
		return { owner: this.entity.owner?.id };
	}
}
