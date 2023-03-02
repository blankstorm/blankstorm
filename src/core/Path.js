import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Path3D } from '@babylonjs/core/Maths/math.path.js';

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
	equals(node) {
		return this.position.equals(node.position);
	}
	static Round(vector) {
		return new Vector3(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z));
	}
}

export class Path extends Path3D {
	openNodes = [];
	closedNodes = [];
	startNode = null;
	endNode = null;
	gizmo = null;
	path = [];
	constructor(path = []) {
		super(path);
	}

	serialize(){

	}

	FromData(path){
		return new this(path.map(vector => Vector3.FromArray(vector)));
	}

	static NodeDistance(nodeA, nodeB) {
		if (!(nodeA instanceof PathNode && nodeB instanceof PathNode)) throw new TypeError('passed nodes must be path.Node');
		let distanceX = Math.abs(nodeA.position.x - nodeB.position.x);
		let distanceY = Math.abs(nodeA.position.z - nodeB.position.z);
		return Math.SQRT2 * (distanceX > distanceY ? distanceY : distanceX) + (distanceX > distanceY ? 1 : -1) * (distanceX - distanceY);
	}

	static Trace(startNode, endNode) {
		let path = [],
			currentNode = endNode;
		while (!currentNode.equals(startNode)) {
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		return path.reverse();
	}

	static Find(start, end, level){
		const path = new this();
		if (!(start instanceof Vector3)) throw new TypeError('Start must be a Vector');
			if (!(end instanceof Vector3)) throw new TypeError('End must be a Vector');
			path.startNode = new PathNode(start);
			path.endNode = new PathNode(end);
			path.openNodes.push(path.startNode);
			let pathFound = false;
			while (!pathFound && path.openNodes.length > 0 && path.openNodes.length < 1e4 && path.closedNodes.length < 1e4) {
				let currentNode = path.openNodes.reduce(
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
				let relatives = [0, 1, -1].flatMap(x => [0, 1, -1].map(y => new Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
				let neighbors = relatives.map(v =>
					path.openNodes.some(node => node.position.equals(v))
						? path.openNodes.find(node => node.position.equals(v))
						: new PathNode(currentNode.position.add(v), currentNode)
				);
				for (let neighbor of neighbors) {
					for (let body of level.bodies.values()) {
						if (Vector3.Distance(body.absolutePosition, neighbor.position) <= body.radius + 1) neighbor.intersects.push(body);
					}
					if (!neighbor.intersects.length && !path.closedNodes.some(node => node.equals(neighbor))) {
						let costToNeighbor = currentNode.gCost + this.NodeDistance(currentNode, neighbor);
						if (costToNeighbor < neighbor.gCost || !path.openNodes.some(node => node.equals(neighbor))) {
							neighbor.gCost = costToNeighbor;
							neighbor.hCost = this.NodeDistance(neighbor, path.endNode);
							if (!path.openNodes.some(node => node.equals(neighbor))) path.openNodes.push(neighbor);
						}
					}
				}
			}
	}
}