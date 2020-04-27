import {vec3, vec2} from 'gl-matrix';
import {angle} from 'gl-vec3';
import {Agent, resetId} from './Agent';
import Marker from './Marker';

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

let minHeight = 5; // minimum height for buildings
let maxHeight = 30; // maximum height for buildings
let rad = 5; // radius for building occupance

export default class Simulation {

	agents: Agent[]; // store all the created agents here
	numAgents: number; // number of agents to generate
	dimensions: vec2; // dimensions of the plane
	locationMap: number[][]; // data structure to store cell occupation: 0 = empty, other = occupied
	height: number; // simulation height
	markers: Marker[]; // markers in the simulation

	constructor(n: number, d: vec2, h: number) {
		this.agents = [];
		this.markers = [];
		this.locationMap = new Array(d[0]).fill(0).map(() => new Array(d[1]).fill(0));
		this.numAgents = n;
		this.dimensions = d;
		this.height = h;
		this.initializeSimulation();
	}

	// Setup the agents in random marker locations
	initializeSimulation() {
		// reset agent id counter
		resetId();
		// Create numAgents * 100 markers
		for (var i = 0; i < this.numAgents * 50; i++) {
			// generate random marker position until it's valid
			var x = 0;
			var z = 0;
			while (true) {
				x = getRandomInt(this.dimensions[0] - 20) + 10;
				z = getRandomInt(this.dimensions[1] - 20) + 10;
				// found valid location
				if (this.locationMap[x][z] == 0) {
					break;
				}
			}
			// create a marker at this location
			var posM = vec3.fromValues(x - this.dimensions[0] / 2, 
									   this.height + 2.0, 
									   z - this.dimensions[1] / 2);
			var newMarker = new Marker(posM);
			this.locationMap[x][z] = 1;
			this.markers.push(newMarker);
		}
		// Create numAgents amount of agents and put them at random markers
		for (var i = 0; i < this.numAgents; i++) {
			var idx = 0;
			while (true) {
				idx = getRandomInt(this.markers.length);
				var marker = this.markers[idx];
				if (marker.agents.length == 0) {
					break;
				}
			}
			var posA = this.markers[idx].pos;
			var colA = vec3.fromValues(0.0, 1.0, 1.0);
			var newA = new Agent(posA, colA, idx);
			if (i > this.numAgents - 10) {
				// Make 1 agent sick
				newA.makeSick(0);
			}
			newA.changeDest(this.markers[getRandomInt(this.markers.length)].pos);
			// associate this agent with the given marker
			this.markers[idx].agents = [newA.getId()];
			// put the agent to the list of agents
			this.agents.push(newA);
		}
	}

	// Simulate the crowd by one tick towards given destination point
	simulationStep(rad: number, time: number) {
		for (var a = 0; a < this.agents.length; a++) {
			var maxWeight = -1; // keep track of largest weight
			var closestMarker = -1;	// keep track of the closest marker index
			for (var m = 0; m < this.markers.length; m++) {
				// check if the marker is in the given search scope
				var vecM = vec3.fromValues(this.markers[m].pos[0] - this.agents[a].getPos()[0],
										   this.markers[m].pos[1] - this.agents[a].getPos()[1],
										   this.markers[m].pos[2] - this.agents[a].getPos()[2]);
				var lM = Math.sqrt(vecM[0] * vecM[0] +
								   vecM[1] * vecM[1] +
								   vecM[2] * vecM[2]);
				if (lM > rad) {
					continue;
				}
				// find the angle between the marker vector and the destination vector
				var destM = vec3.fromValues(this.agents[a].dest[0] - this.agents[a].getPos()[0],
											this.agents[a].dest[1] - this.agents[a].getPos()[1],
											this.agents[a].dest[2] - this.agents[a].getPos()[2]);

				var lDest = Math.sqrt(destM[0] * destM[0] +
								      destM[1] * destM[1] +
								      destM[2] * destM[2]);
				// vector between the marker and destination
				var destDist = vec3.fromValues(this.agents[a].dest[0] - this.markers[m].pos[0],
											   this.agents[a].dest[1] - this.markers[m].pos[1],
											   this.agents[a].dest[2] - this.markers[m].pos[2]);
				var ldestM = Math.sqrt(destDist[0] * destDist[0] +
								      destDist[1] * destDist[1] +
								      destDist[2] * destDist[2]);
				if (lDest <= ldestM) {
					continue;
				}
				var ang = angle(vecM, destM);

				// calculate the weight
				var w = Math.abs(1 + Math.cos(ang) / (1 + lM));
				if (w > maxWeight) {
					maxWeight = w;
					closestMarker = m;
				}
			}
			// If closest marker found, move the agent there
			if (closestMarker != -1) {
				// free the marker and the location where agent is currently located
				const index = this.markers[this.agents[a].markerId].agents.indexOf(this.agents[a].getId(), 0);
				if (index > -1) {
					this.markers[this.agents[a].markerId].agents.splice(index, 1);
				}
				// move the agent to the new marker
				this.agents[a].markerId = closestMarker;
				this.agents[a].pos = this.markers[closestMarker].pos;
				this.markers[closestMarker].agents.push(this.agents[a].getId());
				// if the marker is occupied with other agents, check if one of the occupying agents is sick
				if (!this.agents[a].isSick && !this.agents[a].isRecovered) {
					for (var i = 0; i < this.markers[closestMarker].agents.length; i++) {
						if (this.markers[closestMarker].agents[i] == this.agents[a].getId()) {
							continue;
						}
						// buraya bak
						if (this.agents[this.markers[closestMarker].agents[i] - 1].isSick) {
							this.agents[a].makeSick(time);
							break;
						}
					}
				} else if (this.agents[a].isSick) {
					// if this agent is sick, make the other agents sick
					for (var i = 0; i < this.markers[closestMarker].agents.length; i++) {
						if (this.markers[closestMarker].agents[i] == this.agents[a].getId()) {
							continue;
						}
						if (!this.agents[this.markers[closestMarker].agents[i] - 1].isSick && !this.agents[this.markers[closestMarker].agents[i] - 1].isRecovered) {
							this.agents[this.markers[closestMarker].agents[i] - 1].makeSick(time);
						}
					}
				}
			} else {
				// if no possible movement found and there is no event, assign a new destination
				this.agents[a].changeDest(this.markers[getRandomInt(this.markers.length)].pos);
			}
			// If the agent has been sick for 100 seconds, recover
			if (this.agents[a].isSick) {
				if (time - this.agents[a].sickTime > 150) {
					this.agents[a].makeRecovered();
				}
			}
		}
	}

	// Get the agent array
	getAgents() {
		return this.agents;
	}

};