import type { Node } from '../../core/nodes/Node';
import type { Star } from '../../core/nodes/Star';
import type { Planet } from '../../core/nodes/Planet';
import type { Ship } from '../../core/nodes/Ship';
import { toDegrees } from '../../core/utils';
import type { Waypoint } from '../waypoint';
import type { MarkerContext } from './context';
import { $svg, getColorForBiome } from '../utils';
import type { ClientLevel } from '../ClientLevel';

export const supportedMarkerNodeTypes = ['planet', 'star', 'ship', 'waypoint'];

export class Marker {
	gui = $svg<SVGGElement>('g');

	get markerID(): string {
		return 'map-marker:' + this.target.id;
	}

	get color(): string {
		switch (this.target.nodeType) {
			case 'star':
			case 'waypoint':
				return (this.target as unknown as Star | Waypoint).color.toHexString();
			case 'planet':
				return getColorForBiome((this.target as unknown as Planet).biome);
			case 'ship':
				return this.context.uiContext.system.level.activePlayer == (this.target as unknown as Ship).parent.id ? '#0f0' : '#f00';
		}
	}

	constructor(public readonly target: Node, public context: MarkerContext) {
		this.gui.attr('id', this.markerID).addClass('map-marker').appendTo('#map-markers');
		let internalMarker: JQuery<SVGElement>;
		switch (target.nodeType) {
			case 'star':
			case 'planet':
				internalMarker = $svg('circle');
				break;
			case 'ship':
				internalMarker = $svg('svg').append($svg<SVGPolygonElement>(`polygon`).attr('points', `0,0 10,0 5,15`));
				break;
			case 'waypoint':
				internalMarker = $svg('svg').append($svg('use'));
				break;
			default:
				throw new TypeError(`Unsupported nodeType for marker: ` + target.nodeType);
		}
		internalMarker.addClass('internal-marker');
		this.gui.append(internalMarker);
		this.update();
	}

	update() {
		if (this.target.nodeType == 'waypoint') {
			this.gui.find('.internal-marker use').attr({
				href: 'images/icons.svg#' + ('icon' in this.target ? this.target.icon : 'location-dot'),
				transform: 'scale(.025)',
			});
		}
		const marker = this.gui.find('.internal-marker');
		const isCircle = marker.is('circle');
		marker.attr({
			[isCircle ? 'cx' : 'x']: this.target.absolutePosition.x, // scale,
			[isCircle ? 'cy' : 'y']: this.target.absolutePosition.z, // scale,
		});
		if (isCircle && 'radius' in this.target) {
			marker.attr('r', this.target.radius as number);
		}
		(<JQuery>(marker.is('svg') ? marker : this.gui)).attr('transform', `rotate(${toDegrees(this.target.absoluteRotation.y)})`).css('fill', this.color);
		(<ClientLevel>this.target.system.level).isActive ? this.gui.show() : this.gui.hide();
	}

	static supportsNodeType(nodeType: string): boolean {
		return supportedMarkerNodeTypes.includes(nodeType);
	}
}
