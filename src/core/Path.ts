import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Level } from './Level';
import type { CelestialBody } from './nodes/CelestialBody';

export class PathNode {
	position = Vector3.Zero();
	parent = null;
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

export default class Path {
	path: PathNode[];
	openNodes = [];
	closedNodes = [];
	startNode = null;
	endNode = null;
	gizmo = null;
	constructor(path?: PathNode[]) {
		this.path = path;
	}

	serialize(): number[][] {
		return this.path.map(node => node.position.asArray());
	}

	static FromData(path: number[][]) {
		return new this(path.map(vector => new PathNode(Vector3.FromArray(vector))));
	}

	static NodeDistance(nodeA: PathNode, nodeB: PathNode) {
		if (!(nodeA instanceof PathNode && nodeB instanceof PathNode)) throw new TypeError('passed nodes must be path.Node');
		const distanceX = Math.abs(nodeA.position.x - nodeB.position.x);
		const distanceY = Math.abs(nodeA.position.z - nodeB.position.z);
		return Math.SQRT2 * (distanceX > distanceY ? distanceY : distanceX) + (distanceX > distanceY ? 1 : -1) * (distanceX - distanceY);
	}

	static Trace(startNode: PathNode, endNode: PathNode) {
		const path = [];
		let currentNode = endNode;
		while (!currentNode.equals(startNode)) {
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		return path.reverse();
	}

	static Find(start: Vector3, end: Vector3, level: Level) {
		const path = new this();
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
				path.path = this.Trace(path.startNode, path.endNode);
				pathFound = true;
			}
			const relatives = [0, 1, -1].flatMap(x => [0, 1, -1].map(y => new Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
			const neighbors = relatives.map(v =>
				path.openNodes.some(node => node.position.equals(v)) ? path.openNodes.find(node => node.position.equals(v)) : new PathNode(currentNode.position.add(v), currentNode)
			);
			for (const neighbor of neighbors) {
				for (const node of level.nodes.values()) {
					if (Vector3.Distance(node.absolutePosition, neighbor.position) <= (node.nodeTypes.includes('celestialbody') ? (<CelestialBody>node).radius : 1) + 1)
						neighbor.intersects.push(node);
				}
				if (!neighbor.intersects.length && !path.closedNodes.some(node => node.equals(neighbor))) {
					const costToNeighbor = currentNode.gCost + this.NodeDistance(currentNode, neighbor);
					if (costToNeighbor < neighbor.gCost || !path.openNodes.some(node => node.equals(neighbor))) {
						neighbor.gCost = costToNeighbor;
						neighbor.hCost = this.NodeDistance(neighbor, path.endNode);
						if (!path.openNodes.some(node => node.equals(neighbor))) path.openNodes.push(neighbor);
					}
				}
			}
		}

		return path;
	}
}
