export interface GenericStationPart {
	type: string;
	hp: number;
	connectors: {
		type: GenericStationPartID | '*' | GenericStationPartID[] | string;
		position: number[];
		rotation: number[];
	}[];
}

const stationParts = {
	core: {
		type: 'core',
		hp: 100,
		connectors: [
			{ type: '*', position: [0, 0, 0], rotation: [0, 0, 0] },
			{ type: '*', position: [0, 0, 0], rotation: [0, Math.PI / 2, 0] },
			{ type: '*', position: [0, 0, 0], rotation: [0, Math.PI, 0] },
			{ type: '*', position: [0, 0, 0], rotation: [0, (3 * Math.PI) / 2, 0] },
		],
	},
	connector_i: {
		type: 'connector',
		hp: 50,
		connectors: [
			{ type: '*', position: [0, 0, -0.5], rotation: [0, 0, 0] },
			{ type: '*', position: [0, 0, 0.5], rotation: [0, 0, 0] },
		],
	},
	warehouse: {
		type: 'special',
		hp: 100,
		connectors: [{ type: '*', position: [0, 0, 0], rotation: [0, 0, 0] }],
	},
	shipyard: {
		type: 'special',
		hp: 100,
		connectors: [{ type: '*', position: [0, 0, 0], rotation: [0, 0, 0] }],
	},
	lab: {
		type: 'special',
		hp: 100,
		connectors: [{ type: '*', position: [0, 0, 0], rotation: [0, 0, 0] }],
	},
};

export type GenericStationPartID = keyof typeof stationParts;

const _parts: Record<GenericStationPartID, GenericStationPart> = stationParts;
export { _parts as stationParts };
