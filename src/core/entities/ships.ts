import { Component } from 'deltablank/core/component.js';
import { EntityWith, type EntityConfig, type EntityConstructor, type EntityWithOptions } from 'deltablank/core/entity.js';
import { randomInt, type Entries } from 'utilium';
import type { InstancesFor } from 'utilium/types.js';
import { Combat, Container, Hyperspace, Owner, Velocity, View, type CombatConfigJSON } from '../components';
import { Movement } from '../components/movement';
import { computeProductionDifficulty, getRecipes } from '../data';
import configs from '../data/ships.json' with { type: 'json' };
import { randomInSphere } from '../utils';
import { hardpointConfig, parseSlot, type HardpointType } from './hardpoints';

interface ShipConfigJSON extends EntityConfig<[Owner, Container, Hyperspace, Movement, View]>, CombatConfigJSON {
	id: string;
}

export type ShipType = keyof typeof configs;

export const shipConfigs = Object.fromEntries(
	Object.entries(configs satisfies Record<string, ShipConfigJSON>).map(([k, v]) => [k, parse(v)])
) as Record<ShipType, ShipConfig>;

export interface ShipConfig extends EntityConfig<InstancesFor<typeof components>> {
	name: ShipType;
}

function parse(data: ShipConfigJSON): ShipConfig {
	return {
		...data,
		name: data.id as ShipType,
		hardpoints: data.hardpoints.map(parseSlot),
	};
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
class ShipOffset extends Component<{}, {}, { power?: number }> {
	onSetup(): void {
		this.entity.position.addInPlace(randomInSphere(Math.log(randomInt(0, this.config.power || 1) ** 3 + 1), true));
	}
}

const components = [Velocity, Owner, Container, Combat, ShipOffset, Hyperspace, Movement, View] as const;

export const ships = {} as Record<ShipType, EntityConstructor<InstancesFor<typeof components>> & EntityWithOptions<typeof components>>;

for (const [name, config] of Object.entries(shipConfigs) as Entries<typeof shipConfigs>) {
	ships[name] = EntityWith({ name, components, config });
}

export type Ship = { [K in ShipType]: InstanceType<(typeof ships)[K]> }[ShipType];

export function generateFleetFromPower(power: number, noEnemy: boolean = false): ShipType[] {
	//enemy spawning algorithm
	const fleet: ShipType[] = [],
		generic = Object.values(configs)
			.map(parse)
			.filter(cfg => (noEnemy || cfg.enemy) && 'power' in cfg) as (ShipConfig & { power: number })[];
	generic.sort((a, b) => b.power - a.power); //descending
	for (const ship of generic) {
		const count = Math.floor(power / ship.power);
		fleet.push(...new Array<ShipType>(count).fill(ship.name));
		power -= ship.power * count;
	}
	return fleet;
}

export type ShipCountCollection<T = number> = Record<ShipType, T>;

export interface ShipRatings {
	combat: number;
	movement: number;
	support: number;
	production: number;
}

export function computeRatings(rawConfig: ShipConfigJSON): ShipRatings {
	const ship = parse(rawConfig);
	let combat = Math.log10(ship.hp);
	for (const info of ship.hardpoints) {
		const hardpoint = hardpointConfig[info.type as HardpointType];
		const hardpointRating = hardpoint.damage / hardpoint.reload + hardpoint.critChance * hardpoint.critFactor;
		combat += hardpointRating;
	}

	const movement = ship.speed + ship.agility + Math.log10(ship.hyperspace.range) / Math.log10(ship.hyperspace.cooldown);

	const support = Math.log10(ship.max_items);

	const recipe = getRecipes(ship.name)[0];
	const production = !recipe ? 0 : computeProductionDifficulty(recipe);

	return { combat, movement, support, production };
}
