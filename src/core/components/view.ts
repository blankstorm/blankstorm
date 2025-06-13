/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Component, registerComponent } from 'deltablank/core/component.js';
import type { EntityJSON } from 'deltablank/core/entity.js';

@registerComponent
export class View extends Component<{}, {}, { view_radius: number }> {
	setup(): {} {
		return {};
	}

	toJSON(): {} {
		return {};
	}

	load(data: EntityJSON): void {}
}
