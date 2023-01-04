const Tech = new Map([
	['armor', { recipe: { metal: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['laser', { recipe: { minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['reload', { recipe: { metal: 4000, minerals: 1500 }, xp: 1, scale: 1.2, max: 10, requires: {} }],
	['thrust', { recipe: { fuel: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['energy', { recipe: { fuel: 5000, minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['shields', { recipe: { metal: 2500, minerals: 5000 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 } }],
	['storage', { recipe: { metal: 10000, minerals: 10000, fuel: 10000 }, xp: 2, scale: 10, requires: {} }],
	['missle', { recipe: { metal: 10000, minerals: 1000, fuel: 5000 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 } }],
	['regen', { recipe: { metal: 50000, minerals: 10000, fuel: 10000 }, xp: 1, scale: 1.5, max: 25, requires: { reload: 5, armor: 15 } }],
	['build', { recipe: { metal: 100000 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 } }],
	['salvage', { recipe: { metal: 250000, minerals: 50000, fuel: 100000 }, xp: 5, scale: 1.25, max: 25, requires: { build: 5 } }],
]);

Tech.priceOf = (type, level) => {
	let recipe = { ...Tech.get(type).recipe };
	for (let p in Tech.get(type).recipe) {
		for (let i = 1; i < level; i++) {
			recipe[p] *= Tech.get(type).scale;
		}
	}
	return recipe;
};
Tech.isLocked = (type, current) => {
	for (let i in Tech.get(type).requires) {
		if ((Tech.get(type).requires[i] > 0 && current.tech[i] < Tech.get(type).requires[i]) || (Tech.get(type).requires[i] == 0 && current.tech[i] > 0)) {
			return true;
		}
	}
	return false;
};

export default Tech;
