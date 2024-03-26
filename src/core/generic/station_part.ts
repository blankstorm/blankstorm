import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export interface GenericStationPart {
	type: string;
	hp: number;
	connecters: {
		type: GenericStationPartID | '*' | GenericStationPartID[] | string;
		position: Vector3;
		rotation: Vector3;
	}[];
}

const stationParts = {
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

export type GenericStationPartID = keyof typeof stationParts;

const _parts: Record<GenericStationPartID, GenericStationPart> = stationParts;
export { _parts as stationParts };
