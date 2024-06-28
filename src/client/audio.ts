export function playsound(id: string, vol = 1) {
	if (vol > 0) {
		const a = new Audio(`assets/sounds/${id}.mp3`);
		a.volume = +vol;
		a.play();
	}
}
