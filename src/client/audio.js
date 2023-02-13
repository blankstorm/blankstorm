export const sounds = new Map(
	Object.entries({
		rift: 'music/rift.mp3',
		planets: 'music/planets.mp3',
		destroy_ship: 'sfx/destroy_ship.mp3',
		warp_start: 'sfx/warp_start.mp3',
		warp_end: 'sfx/warp_end.mp3',
		laser_fire: 'sfx/laser_fire.mp3',
		laser_hit: 'sfx/laser_hit.mp3',
		ui: 'sfx/ui.mp3',
	})
);

export function playsound(url, vol = 1) {
	if (vol > 0) {
		let a = new Audio(url);
		a.volume = +vol;
		a.play();
	}
}
