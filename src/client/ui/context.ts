import type { ClientSystem } from '../ClientSystem';

export interface UIContext {
	get system(): ClientSystem;
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
