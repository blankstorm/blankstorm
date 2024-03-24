import type { BooleanValue } from './boolean';
import type { Combat } from './combat';
import type { Fleet } from './fleet';
import type { Hardpoints } from './hardpoints';
import type { Jump } from './jump';
import type { Move } from './move';
import type { Owner } from './owner';
import type { Production } from './production';
import type { Research } from './research';
import type { Storage } from './storage';
import type { Experience } from './xp';

export interface WellKnownComponents {
	capture: BooleanValue;
	combat: Combat;
	fleet: Fleet;
	hardpoints: Hardpoints;
	jump: Jump;
	move: Move;
	owner: Owner;
	research: Research;
	select: BooleanValue;
	storage: Storage;
	xp: Experience;
	production: Production;
}
