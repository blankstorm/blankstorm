import type { System } from '../system';

declare module 'deltablank/core/entity.js' {
	interface Entity {
		system?: System;
		isObstacle?: boolean;
		isSelected?: boolean;
	}
}
