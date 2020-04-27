import {vec3, mat4} from 'gl-matrix';
import {scale} from 'gl-mat4';

let idCount: number = 1; // generate a unique id for each agent

export class Agent {
	id: number; // agent id: unique per agent
	pos: vec3; // agent's current position
	col: vec3; // agent color (based on goals/decisions)
	transMat: mat4; // agent's transformation matrix
	dest: vec3; // agent's destination
	markerId: number; // index of the marker where the agent exists
	isSick: boolean; // is the agent sick?
	isRecovered: boolean; // is the agent recovered?
	sickTime: number;
	doesStay: boolean;

	constructor(pos: vec3, col:vec3, mId: number, stay: boolean) {
		this.id = idCount;
		idCount++; // increment the id counter
		this.pos = pos;
		this.col = col;
		this.markerId = mId;
		this.dest = vec3.fromValues(0, 0, 0); // default destination
		this.isSick = false;
		this.isRecovered = false;
		this.sickTime = 0;
		this.doesStay = stay;
	}

	// Compare two Agent instances by id
	equals(other: Agent) {
		return this.id == other.id;
	}

	// return agent's id
	getId() {
		return this.id;
	}

	// return agent's position
	getPos() {
		return this.pos;
	}

	makeStay() {
		this.doesStay = true;
	}

	makeSick(time: number) {
		this.isSick = true;
		// change color
		this.col = vec3.fromValues(1.0, 1.0, 0.0);
		// set sick time
		this.sickTime = time;
	}

	makeRecovered() {
		this.isSick = false;
		this.isRecovered = true;
		// change color
		this.col = vec3.fromValues(1.0, 0.0, 1.0);
	}

	// Change the color of the agent
	changeCol(newCol: vec3) {
		this.col = newCol;
	}

	// Change the destination of the agent
	changeDest(newDest: vec3) {
		this.dest = newDest;
	}

	// Calculate the corresponding transformation matrix for instanced rendering
	computeMatrix() {
		var h = 2.0;
	    var trans = mat4.fromValues(1.0, 0.0, 0.0, 0.0,
	                                0.0, h, 0.0, 0.0,
	                                0.0, 0.0, 1.0, 0.0,
	                                this.pos[0], this.pos[1], this.pos[2], 1.0);
		this.transMat = scale(trans, trans, vec3.fromValues(1.0, 1.0, 1.0));
	}

	// Calculate the distance between two agents
	distanceTo(other: Agent) {
		return Math.sqrt(Math.pow(this.pos[0] - other.pos[0], 2) +
						 Math.pow(this.pos[1] - other.pos[1], 2) +
						 Math.pow(this.pos[2] - other.pos[2], 2));
	}

}

export function resetId(): void {
	idCount = 1;
}