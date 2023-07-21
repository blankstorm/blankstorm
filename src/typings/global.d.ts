import type { BuildOptions } from '../../.build/options';
import type * as fs from 'fs';

declare global {
	const $build: BuildOptions;

	interface globalThis {
		_fs: typeof fs;
	}
}

export {};
