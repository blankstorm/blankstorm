import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface GenericStationComponent {
	type: string;
	hp: number;
	connecters: {
		type: GenericStationComponentID | '*' | GenericStationComponentID[] | string;
		position: Vector3;
		rotation: Vector3;
	}[];
}

const stationComponents = {
	core: {
		type: 'core',
		hp: 100,
		connecters: [
			{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, 0, 0) },
			{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, Math.PI / 2, 0) },
			{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, Math.PI, 0) },
			{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, (3 * Math.PI) / 2, 0) },
		],
	},
	connecter_i: {
		type: 'connecter',
		hp: 50,
		connecters: [
			{ type: '*', position: new Vector3(0, 0, -0.5), rotation: Vector3.Zero() },
			{ type: '*', position: new Vector3(0, 0, 0.5), rotation: Vector3.Zero() },
		],
	},
};

export type GenericStationComponentID = keyof typeof stationComponents;

export type GenericStationComponentCollection<T = number> = { [key in GenericStationComponentID]: T };

const _components: GenericStationComponentCollection<GenericStationComponent> = stationComponents;
export { _components as stationComponents };
