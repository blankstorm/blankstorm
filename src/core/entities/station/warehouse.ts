import { Container } from '../../components/storage';
import type { StationPartJSON } from './part';
import { StationPart } from './part';

export interface WarehouseJSON extends StationPartJSON {}

export class Warehouse extends StationPart {
	public readonly type = 'warehouse' as const;

	protected _storage: Container = new Container(1e6);
}
