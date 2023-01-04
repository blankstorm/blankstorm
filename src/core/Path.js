import { random } from './utils.js';

import { Vector3 } from '../../node_modules/@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '../../node_modules/@babylonjs/core/Maths/math.color.js';
import { Path3D } from '../../node_modules/@babylonjs/core/Maths/math.path.js';
import { MeshBuilder } from '../../node_modules/@babylonjs/core/Meshes/meshBuilder.js';
import { Scene } from '../../node_modules/@babylonjs/core/scene.js';

const Path = class extends Path3D {
	static Node = class {
		position = Vector3.Zero();
		parent = null;
		constructor(...args) {
			this.position = Path.Node.Round(args[0] instanceof Vector3 ? args[0] : new Vector3(args[0], args[1], args[2]));
			if (args.at(-1) instanceof Path.Node) this.parent = args.at(-1);
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
	};
	static nodeDistance(nodeA, nodeB) {
		if (!(nodeA instanceof Path.Node && nodeB instanceof Path.Node)) throw new TypeError('passed nodes must be path.Node');
		let distanceX = Math.abs(nodeA.position.x - nodeB.position.x);
		let distanceY = Math.abs(nodeA.position.z - nodeB.position.z);
		return Math.SQRT2 * (distanceX > distanceY ? distanceY : distanceX) + (distanceX > distanceY ? 1 : -1) * (distanceX - distanceY);
	}
	static trace(startNode, endNode) {
		let path = [],
			currentNode = endNode;
		while (!currentNode.equals(startNode)) {
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		return path.reverse();
	}
	openNodes = [];
	closedNodes = [];
	startNode = null;
	endNode = null;
	gizmo = null;
	path = [];
	#pathFound = false;
	constructor(start, end, scene) {
		super([]);
		try {
			if (!(start instanceof Vector3)) throw new TypeError('Start must be a Vector');
			if (!(end instanceof Vector3)) throw new TypeError('End must be a Vector');
			this.startNode = new Path.Node(start);
			this.endNode = new Path.Node(end);
			this.openNodes.push(this.startNode);
			while (!this.#pathFound && this.openNodes.length > 0 && this.openNodes.length < 1e4 && this.closedNodes.length < 1e4) {
				let currentNode = this.openNodes.reduce(
					(previous, current) => (previous.fCost < current.fCost || (previous.fCost == current.fCost && previous.hCost > current.hCost) ? previous : current),
					this.openNodes[0]
				);
				this.openNodes.splice(
					this.openNodes.findIndex(node => node == currentNode),
					1
				);
				this.closedNodes.push(currentNode);
				if (currentNode.equals(this.endNode)) {
					this.endNode = currentNode;
					this.path = Path.trace(this.startNode, this.endNode);
					this.#pathFound = true;
				}
				let relatives = [0, 1, -1].flatMap(x => [0, 1, -1].map(y => new Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
				let neighbors = relatives.map(v =>
					this.openNodes.some(node => node.position.equals(v))
						? this.openNodes.find(node => node.position.equals(v))
						: new Path.Node(currentNode.position.add(v), currentNode)
				);
				for (let neighbor of neighbors) {
					if (scene instanceof Scene) {
						//Should be Level. Level is not imported due to overhead.
						scene.bodies.forEach(body => {
							if (Vector3.Distance(body.position, neighbor.position) <= body.radius + 1) neighbor.intersects.push(body);
						});
					}
					if (!neighbor.intersects.length && !this.closedNodes.some(node => node.equals(neighbor))) {
						let costToNeighbor = currentNode.gCost + Path.nodeDistance(currentNode, neighbor);
						if (costToNeighbor < neighbor.gCost || !this.openNodes.some(node => node.equals(neighbor))) {
							neighbor.gCost = costToNeighbor;
							neighbor.hCost = Path.nodeDistance(neighbor, this.endNode);
							if (!this.openNodes.some(node => node.equals(neighbor))) this.openNodes.push(neighbor);
						}
					}
				}
			}
		} catch (e) {
			throw e.stack;
		}
	}
	drawGizmo(scene, color = Color3.White()) {
		if (this.path.length > 0) {
			if (!(scene instanceof Scene)) throw new TypeError('scene must be a scene');
			if (this.gizmo) console.warn('Path gizmo was already drawn!');
			this.gizmo = MeshBuilder.CreateLines('pathGizmo.' + random.hex(16), { points: this.path.map(node => node.position) }, scene);
			this.gizmo.color = color;
			return this.gizmo;
		}
	}
	disposeGizmo() {
		if (this.gizmo) this.gizmo.dispose();
		this.gizmo = undefined;
	}
};

export default Path;
