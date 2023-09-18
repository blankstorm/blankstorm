import type { BuildOptions } from '../.build/options';

interface CliOptions {
	'bs-debug': boolean;
	'bs-open-devtools': boolean;
}

declare global {
	const $build: BuildOptions;
	const app: {
		require: typeof require,
		getCliOptions(): Promise<CliOptions>;
	};
}

export {};
