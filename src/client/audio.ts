export const sounds = new Map(
	Object.entries({
		rift: 'music/rift',
		planets: 'music/planets',
		destroy_ship: 'sfx/destroy_ship',
		warp_start: 'sfx/warp_start',
		warp_end: 'sfx/warp_end',
		laser_fire: 'sfx/laser_fire',
		laser_hit: 'sfx/laser_hit',
	})
);

export function playsound(id: string, vol = 1) {
	if (vol > 0) {
		const a = new Audio(`${$build.asset_dir}/${sounds.get(id)}.mp3`);
		a.volume = +vol;
		a.play();
	}
}
