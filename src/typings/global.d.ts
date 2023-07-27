import type { BuildOptions } from '../../.build/options';

declare global {
	const $build: BuildOptions;
	const _require: typeof require;
}

export {};
