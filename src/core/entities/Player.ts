import { research } from '../generic/research';
import { Ship } from './Ship';
import type { Level } from '../Level';
import type { ShipType } from '../generic/ships';
import { Entity, type EntityData } from './Entity';
import type { Research } from '../components/research';
import type { Fleet } from '../components/fleet';
import type { Experience } from '../components/xp';
import type { Combatant } from '../components/combat';


export class Player extends Entity<{
	research: Research;
	fleet: Fleet;
	xp: Experience;
}> implements Combatant {
	speed = 1;
	oplvl?: number;
	get power(): number {
		return this.fleet.power;
	}

	constructor(id: string, level: Level, { fleet }: { fleet: (EntityData<Ship> | Ship | string)[] }) {
		super(id, level);
		for (const shipData of fleet) {
			const ship: Ship = shipData instanceof Ship ? shipData : typeof shipData == 'string' ? level.getEntityByID<Ship>(shipData) : Ship.FromJSON(shipData, level);
			ship.owner = this;
			ship.position.addInPlace(this.absolutePosition);
			this.fleet.ships.add(ship);
		}
		setTimeout(() => level.emit('player.created', this.toJSON()));
	}

	reset() {
		this.get('fleet').removeAllItems();
		for (const type of Object.keys(research)) {
			this.research[type] = 0;
		}
		for (const ship of this.fleet.ships) {
			ship.remove();
		}
		this.level.emit('player.reset', this.toJSON());
	}

	remove() {
		this.level.emit('player.removed', this.toJSON());
		super.remove();
	}

}
