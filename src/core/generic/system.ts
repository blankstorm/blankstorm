export const systemNames = [
	'Abrigato',
	'Kerali',
	'Kaltez',
	'Suzum',
	'Vespa',
	'Coruscare',
	'Vulca',
	'Jaeger',
	'Kashyyyk',
	'Outpost42',
	'Victoria',
	'Gesht',
	'Sanctuary',
	'Snowmass',
	'Ja',
	'Keeg',
	'Haemeiguli',
	'Borebalae',
	'Albataetarius',
	'Hataerius',
	'Achernaiphoros',
	'Antadrophei',
	'Hoemeirai',
	'Antabalis',
	'Hoereo',
	'Pazadam',
	'Equidor',
	'Pax',
	'Xena',
	'Titan',
	'Oturn',
	'Thuamia',
	'Heuthea',
	'Ditharus',
	'Muxater',
	'Trukovis',
	'Bichotune',
	'Etis',
	'Leorus',
	'Aphus',
	'Harophos',
	'Athena',
	'Hades',
	'Icarus',
	'Ureus',
	'Xentos Prime',
	'Ketlak',
	'Aerox',
	'Thryox',
	'Stratus',
	'Nox',
	'Sanctum',
	'Pastūra',
	'Tinctus',
	'Morbus',
	'Neos',
	'Nomen',
	'Numerus',
	'Pax',
	'Fornax',
	'Skorda',
	'Alli',
	'Resurs',
];

export interface CelestialBodyGenerationOptions {
	min: number;
	max: number;
	radius_min: number;
	radius_max: number;
}

export interface StarGenerationOptions extends CelestialBodyGenerationOptions {
	color_min: number[];
	color_max: number[];
}

export interface PlanetGenerationOptions extends CelestialBodyGenerationOptions {
	distance_max: number;
}

export interface ConnectionsGenerationOptions {
	probability: number;
	distance_min: number;
	distance_max: number;
}

export interface SystemGenerationOptions {
	difficulty: number;
	stars: StarGenerationOptions;
	planets: PlanetGenerationOptions;
	connections: ConnectionsGenerationOptions;
}
