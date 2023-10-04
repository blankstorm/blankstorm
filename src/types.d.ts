import type { BuildOptions } from '../.build/options';
import type { AppContext } from './client/contexts';
import type package from '../package.json';

declare global {
	const $build: BuildOptions;
	const $package: typeof package;
	const app: AppContext;
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}

export {};
