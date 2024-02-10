import type { BuildOptions } from '../.build/options';
import type package from '../package.json';
import type { ClientOptions } from './client/client';

declare global {
	const $build: BuildOptions;
	const $package: typeof package;
	const $app: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		require: NodeJS.Require & (<M = any>(id: string) => M);
		options(): Promise<ClientOptions>;
		log(message: IOMessage): Promise<void>;
	};
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}

export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
