import type { ClientLevel } from '../ClientLevel';

export interface UIContext {
	get level(): ClientLevel;
	get playerID(): string;
}

export interface MarkerContext {
	x: number;
	y: number;
	get svgX(): number;
	get svgY(): number;
	rotation: number;
	scale: number;
	uiContext: UIContext;
}
