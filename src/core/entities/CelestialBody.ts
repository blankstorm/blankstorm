/*export class CelestialBody extends Entity<{
	fleet: Fleet;
	rewards: Storage;
	radius: JSONValue<number>;
}> {
	option?: JQuery<HTMLElement>;

	constructor(id: string, level: Level, { radius = 1, rewards = {}, fleet = { position: randomCords(randomInt(radius + 5, radius * 1.2), true), ships: [] } }: { radius: number; rewards: Partial<Record<ItemID, number>>; fleet: ComponentData<Fleet> }) {
		super(id, level, {
			radius,
			rewards: { items: rewards, max: 1e10 },
			fleet
		});
		setTimeout(() => level.emit('body.created', this.toJSON()));
	}

	remove() {
		this.level.emit('body.removed', this.toJSON());
		super.remove();
	}
}*/
