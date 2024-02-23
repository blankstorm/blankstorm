import type { Node } from '../../core/nodes/Node';
import type { Star } from '../../core/nodes/Star';
import type { Planet } from '../../core/nodes/Planet';
import type { Ship } from '../../core/nodes/Ship';
import type { Waypoint } from '../waypoints';
import { toDegrees } from '../../core/utils';
import { $svg, getColorForBiome } from '../utils';
import { account, system } from '../user';

export const supportedMarkerNodeTypes = ['Planet', 'Star', 'Ship', 'Waypoint'];

export class MapMarker {
	gui = $svg<SVGGElement>('g');

	get markerID(): string {
		return 'map-marker:' + this.target.id;
	}

	get color(): string {
		switch (this.target.nodeType) {
			case 'Star':
			case 'Waypoint':
				return (<Star | Waypoint>this.target).color.toHexString();
			case 'Planet':
				return getColorForBiome((<Planet>this.target).biome);
			case 'Ship':
				return account.id == (<Ship>this.target).owner.id ? '#0f0' : '#f00';
		}
	}

	constructor(public readonly target: Node) {
		this.gui.attr('id', this.markerID).addClass('map-marker').appendTo('#map-markers');
		let internalMarker: JQuery<SVGElement>;
		switch (target.nodeType) {
			case 'Star':
			case 'Planet':
				internalMarker = $svg('circle');
				break;
			case 'Ship':
				internalMarker = $svg('svg').append($svg<SVGPolygonElement>(`polygon`).attr('points', `0,0 10,0 5,15`));
				break;
			case 'Waypoint':
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
		if (this.target.nodeType == 'Waypoint') {
			this.gui.find('.internal-marker use').attr({
				href: '_build.asset_dir/images/icons.svg#' + ('icon' in this.target ? this.target.icon : 'location-dot'),
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
		this.target.system.id == system().id ? this.gui.show() : this.gui.hide();
	}

	static supportsNodeType(nodeType: string): boolean {
		return supportedMarkerNodeTypes.includes(nodeType);
	}
}
