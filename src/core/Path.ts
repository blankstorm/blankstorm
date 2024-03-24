import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { System } from './System';

export class PathNode {
	position = Vector3.Zero();
	parent: PathNode = null;
	constructor(...args) {
		this.position = PathNode.Round(args[0] instanceof Vector3 ? args[0] : new Vector3(args[0], args[1], args[2]));
		if (args.at(-1) instanceof PathNode) this.parent = args.at(-1);
	}
	gCost = 0;
	hCost = 0;
	intersects = [];
	heapIndex = null;
	get fCost() {
		return this.gCost + this.hCost;
	}
	equals(node: PathNode) {
		return this.position.equals(node.position);
	}
	static Round(vector: Vector3) {
		return new Vector3(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z));
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
	let currentNode = endNode;
	while (!currentNode.equals(startNode)) {
		path.push(currentNode);
		currentNode = currentNode.parent;
	}
	return path.reverse();
}

export class Path {
	path: PathNode[];
	openNodes: PathNode[] = [];
	closedNodes: PathNode[] = [];
	startNode: PathNode = null;
	endNode: PathNode = null;
	gizmo = null;
	constructor(path?: PathNode[]) {
		this.path = path;
	}

	toJSON(): number[][] {
		return this.path.map(node => node.position.asArray());
	}

	static FromJSON(path: number[][]) {
		return new this(path.map(vector => new PathNode(Vector3.FromArray(vector))));
	}
}

export function findPath(start: Vector3, end: Vector3, system: System): Path {
	const path = new Path();
	if (!(start instanceof Vector3)) throw new TypeError('Start must be a Vector');
	if (!(end instanceof Vector3)) throw new TypeError('End must be a Vector');
	path.startNode = new PathNode(start);
	path.endNode = new PathNode(end);
	path.openNodes.push(path.startNode);
	let pathFound = false;
	while (!pathFound && path.openNodes.length > 0 && path.openNodes.length < 1e4 && path.closedNodes.length < 1e4) {
		const currentNode: PathNode = path.openNodes.reduce(
			(previous, current) => (previous.fCost < current.fCost || (previous.fCost == current.fCost && previous.hCost > current.hCost) ? previous : current),
			path.openNodes[0]
		);
		path.openNodes.splice(
			path.openNodes.findIndex(node => node == currentNode),
			1
		);
		path.closedNodes.push(currentNode);
		if (currentNode.equals(path.endNode)) {
			path.endNode = currentNode;
			path.path = trace(path.startNode, path.endNode);
			pathFound = true;
		}
		const relatives = [0, 1, -1].flatMap(x => [0, 1, -1].map(y => new Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
		const neighbors = relatives.map(v =>
			path.openNodes.some(node => node.position.equals(v)) ? path.openNodes.find(node => node.position.equals(v)) : new PathNode(currentNode.position.add(v), currentNode)
		);
		for (const neighbor of neighbors) {
			for (const entity of system.entities) {
				const distance = Vector3.Distance(entity.absolutePosition, neighbor.position);
				if (distance <= (entity.has('radius') ? (entity).radius : 1) + 1)
					neighbor.intersects.push(entity);
			}
			if (!neighbor.intersects.length && !path.closedNodes.some(node => node.equals(neighbor))) {
				const costToNeighbor = currentNode.gCost + nodeDistance(currentNode, neighbor);
				if (costToNeighbor < neighbor.gCost || !path.openNodes.some(node => node.equals(neighbor))) {
					neighbor.gCost = costToNeighbor;
					neighbor.hCost = nodeDistance(neighbor, path.endNode);
					if (!path.openNodes.some(node => node.equals(neighbor))) path.openNodes.push(neighbor);
				}
			}
		}
	}

	return path;
}
