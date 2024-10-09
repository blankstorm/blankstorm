import { Container } from '../../components/storage.js';
import type { StationPartJSON } from './part.js';
import { StationPart } from './part.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WarehouseJSON extends StationPartJSON {}

export class Warehouse extends StationPart {
	public readonly type = 'warehouse' as const;

	protected _storage: Container = new Container(1e6);
}
