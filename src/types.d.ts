import type { BuildOptions } from '../.build/options';
import type package from '../package.json';
import type { ClientOptions } from './client/client';

declare global {
	const $build: BuildOptions;
	const $package: typeof package;
	const $app: {
		require: NodeJS.Require & {
			<const T extends 'fs' | 'node:url' | 'node:path'>(id: T): typeof import(T);
		};
		options(): Promise<ClientOptions>;
		log(message: IOMessage): Promise<void>;
	};
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}

export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
