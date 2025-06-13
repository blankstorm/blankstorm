import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Component, registerComponent } from 'deltablank/core/component.js';
import type { EntityJSON } from 'deltablank/core/entity.js';

@registerComponent
export class Color extends Component<{ color: Color3 }, { color: number[] }> {
	setup(): { color: Color3 } {
		return { color: Color3.Black() };
	}
	load(data: EntityJSON & { color: [number, number, number] }): void {
		this.entity.color = Color3.FromArray(data.color);
	}

	toJSON(): { color: [number, number, number] } {
		return { color: this.entity.color.asArray() };
	}
}
