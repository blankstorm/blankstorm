import type { BuildOptions } from '../../build/options';
import type * as fs from 'fs';

declare global {
	const _config: BuildOptions['config'];

	interface globalThis {
		_fs: typeof fs;
	}
}

export {};
