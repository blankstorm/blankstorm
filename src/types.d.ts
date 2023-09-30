import type { BuildOptions } from '../.build/options';
import type { AppContext } from './client/contexts';

declare global {
	const $build: BuildOptions;
	const app: AppContext;
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}

export {};
