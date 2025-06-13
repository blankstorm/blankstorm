import { Component } from 'deltablank/core/component.js';
import type { System } from '../system';
import type { UUID } from 'utilium';
import type { EntityJSON } from 'deltablank/core/entity.js';

export class EntitySystem extends Component<{ system: System }, { system: UUID }> {
	load(data: EntityJSON & { system: UUID }): void | Promise<void> {}

	toJSON(): { system: UUID } {
		return {
			system: this.entity.system.id,
		};
	}
}
