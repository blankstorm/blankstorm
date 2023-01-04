export const config = {
	mesh_segments: 32,
	render_quality: 0,
	load_remote_manifest: false,
	playerCamera: {
		wheelPrecision: 5,
		lowerRadiusLimit: 1,
		upperRadiusLimit: 50,
		minZ: 0.1,
		radius: 10,
	},
	settings: {},
};

export const version = 'alpha_1.4.0';
export const versions = new Map([
	['infdev_1', { text: 'Infdev 1', group: 'infdev' }],
	['infdev_2', { text: 'Infdev 2', group: 'infdev' }],
	['infdev_3', { text: 'Infdev 3', group: 'infdev' }],
	['infdev_4', { text: 'Infdev 4', group: 'infdev' }],
	['infdev_5', { text: 'Infdev 5', group: 'infdev' }],
	['infdev_6', { text: 'Infdev 6', group: 'infdev' }],
	['infdev_7', { text: 'Infdev 7', group: 'infdev' }],
	['infdev_8', { text: 'Infdev 8', group: 'infdev' }],
	['infdev_9', { text: 'Infdev 9', group: 'infdev' }],
	['infdev_10', { text: 'Infdev 10', group: 'infdev' }],
	['infdev_11', { text: 'Infdev 11', group: 'infdev' }],
	['infdev_12', { text: 'Infdev 12', group: 'infdev' }],
	['alpha_1.0.0', { text: 'Alpha 1.0.0', group: 'alpha' }],
	['alpha_1.1.0', { text: 'Alpha 1.1.0', group: 'alpha' }],
	['alpha_1.2.0', { text: 'Alpha 1.2.0', group: 'alpha' }],
	['alpha_1.2.1', { text: 'Alpha 1.2.1', group: 'alpha' }],
	['alpha_1.3.0', { text: 'Alpha 1.3.0', group: 'alpha' }],
	['alpha_1.3.1', { text: 'Alpha 1.3.1', group: 'alpha' }],
	['alpha_1.4.0', { text: 'Alpha 1.4.0', group: 'alpha' }],
]);

if (config.load_remote_manifest) {
	fetch('https://blankstorm.drvortex.dev/versions/manifest.json')
		.then(response => response.json())
		.then(data => {
			for (let [key, value] of data) {
				versions.set(key, value);
			}
		})
		.catch(err => console.warn('Failed to retrieve version manifest: ' + err));
}
