import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { System } from './system';
import type { CelestialBody } from './entities/body';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';

function roundVector({ x, y, z }: IVector3Like) {
	return new Vector3(Math.round(x), Math.round(y), Math.round(z));
}

export class PathNode {
	public position = Vector3.Zero();
	public constructor(
		position: IVector3Like,
		public parent?: PathNode
	) {
		this.position = roundVector(position);
	}
	public gCost = 0;
	public hCost = 0;
	public get fCost() {
		return this.gCost + this.hCost;
	}

	public get id(): string {
		return this.position.asArray().toString();
	}
}

function nodeDistance(nodeA: PathNode, nodeB: PathNode): number {
	if (!(nodeA instanceof PathNode && nodeB instanceof PathNode)) throw new TypeError('passed nodes must be path.Node');
	const distanceX = Math.abs(nodeA.position.x - nodeB.position.x);
	const distanceY = Math.abs(nodeA.position.z - nodeB.position.z);
	return Math.SQRT2 * (distanceX > distanceY ? distanceY : distanceX) + (distanceX > distanceY ? 1 : -1) * (distanceX - distanceY);
}

function trace(startNode: PathNode, endNode: PathNode): PathNode[] {
	const path: PathNode[] = [];
	let currentNode: PathNode = endNode;
	while (currentNode.id != startNode.id) {
		path.push(currentNode);
		currentNode = currentNode.parent!;
	}
	return path.reverse();
}

function getLeastExpensiveNode(nodes: Iterable<PathNode>): PathNode {
	let best: PathNode | undefined;

	for (const node of nodes) {
		best ||= node;
		if (best.fCost > node.fCost || (best.fCost == node.fCost && best.hCost < node.hCost)) {
			best = node;
		}
	}

	if (!best) {
		throw new Error('No nodes in list');
	}

	return best;
}

export function findPath(start: Vector3, end: Vector3, system: System): Vector3[] {
	if (!(start instanceof Vector3)) throw new TypeError('Start must be a Vector');
	if (!(end instanceof Vector3)) throw new TypeError('End must be a Vector');
	const openNodes: Map<string, PathNode> = new Map();
	const closedNodes: Map<string, PathNode> = new Map();
	const startNode: PathNode = new PathNode(start);
	let endNode: PathNode = new PathNode(end);
	openNodes.set(startNode.id, startNode);
	for (
		let node = getLeastExpensiveNode(openNodes.values());
		node.id != endNode.id && openNodes.size > 0 && openNodes.size < 1e4 && closedNodes.size < 1e4;
		node = getLeastExpensiveNode(openNodes.values())
	) {
		openNodes.delete(node.id);
		closedNodes.set(node.id, node);
		if (node.id == endNode.id) {
			endNode = node;
			break;
		}
		const neighbors = [0, 1, -1]
			.flatMap(x => [0, 1, -1].map(y => new Vector3(x, 0, y)))
			.filter(v => v.x != 0 || v.z != 0)
			.map(v => openNodes.get(v.asArray().toString()) || new PathNode(node.position.add(v), node));
		for (const neighbor of neighbors) {
			let intersects = false;
			for (const node of system?.entities() || []) {
				if (Vector3.Distance(node.absolutePosition, neighbor.position) <= (node.entityTypes.includes('CelestialBody') ? (<CelestialBody>node).radius : 1) + 1) {
					intersects = true;
				}
			}
			if (intersects || closedNodes.has(neighbor.id)) {
				continue;
			}

			const costToNeighbor = node.gCost + nodeDistance(node, neighbor);
			if (costToNeighbor > neighbor.gCost && openNodes.has(neighbor.id)) {
				continue;
			}

			neighbor.gCost = costToNeighbor;
			neighbor.hCost = nodeDistance(neighbor, endNode);
			if (!openNodes.has(neighbor.id)) {
				openNodes.set(neighbor.id, neighbor);
			}
		}
	}
	return trace(startNode, endNode).map(node => node.position);
}
