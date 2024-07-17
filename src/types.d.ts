import type { $app } from './client/preload';

declare global {
	const $debug: boolean;
	const $revision: string;
	const $app: $app;
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}
