import type package from '../package.json';
import type { ClientInit } from './client/client';
import type { IOMessage } from 'logzen';

declare global {
	const $debug: boolean;
	const $package: typeof package;
	const $app: {
		require<const T extends 'fs' | 'node:url' | 'node:path'>(
			id: T
		): {
			/* eslint-disable @typescript-eslint/consistent-type-imports */
			fs: typeof import('fs');
			'node:url': typeof import('node:url');
			'node:path': typeof import('node:path');
			[K: string]: typeof import(K);
			/* eslint-enable @typescript-eslint/consistent-type-imports */
		}[T];
		options(): Promise<ClientInit>;
		log(message: IOMessage): Promise<void>;
	};
	interface Performance {
		memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
	}
}

export type WithOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
