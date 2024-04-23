export default function counterPlugin(watch: boolean) {
	return {
		name: 'counter',
		setup(build) {
			let count = 0;
			build.onStart(() => {
				console.log(watch ? `---- Building #${++count} --` : 'Building...');
			});
			build.onEnd(() => {
				try {
					console.log(watch ? `---- Built #${count} -----` : 'Built!');
				} catch (err) {
					console.error(`Build failed: ` + err.stack);
					console.log(watch ? `- Build #${count} Failed -` : 'Build failed!');
				}
			});
		},
	};
}
