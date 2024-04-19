import type { Level } from '../level';

export interface Component<TJSON = unknown> {
	//readonly component: string;

	readonly id?: string;

	update?(): void;

	toJSON(): TJSON;

	fromJSON(data: TJSON): void;
}

export type ComponentData<T extends Component> = T extends Component<infer TJSON> ? TJSON : never;

export interface ComponentStatic<T extends Component = Component> {
	name: string;

	FromJSON(data: ComponentData<T>, level?: Level): T;
}

export function isComponent(value: unknown): value is Component {
	return typeof value == 'object' && 'component' in value && typeof value.component == 'string';
}

export const components = new Map<string, ComponentStatic>();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function register<Class extends ComponentStatic>(target: Class, _context: ClassDecoratorContext) {
	components.set(target.name, target);
}
