export function playsound(id: string, vol = 1) {
	if (vol > 0) {
		const a = new Audio(`${$build.asset_dir}/sounds/${id}.mp3`);
		a.volume = +vol;
		a.play();
	}
}
