import {vec2, vec3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Mesh from './geometry/Mesh';
import Square from './geometry/Square';
import Plane from './geometry/Plane';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import Simulation from './Simulation';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {readTextFile} from './globals';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  numAgents: 75,
};

let agent: Mesh; // agent instance
let plane : Plane; // plane
let simulation: Simulation; // simulation instance
let square: Square;

let time: number = 0.0;
let frameRate: number = 0.0;
let obj0: string = readTextFile('./obj_files/cylinder.obj');
let dimensions: vec2 = vec2.fromValues(100, 100);
let planePos: vec2;
let prevNumAgent: number = 75;

function loadScene() {

  // Background
  square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  // Terrain
  plane = new Plane(vec3.fromValues(0,-3,0), dimensions, 20);
  plane.create();

  // Instances
  let center = vec3.fromValues(0.0, 0.0, 0.0);
  agent = new Mesh(obj0, center); // the agent instance
  agent.create();

  simulation = new Simulation(controls.numAgents, plane.scale, 0);
  planePos = vec2.fromValues(0,0);

    // generate the agents
    let agents = simulation.getAgents();
    let t0Array = []; // col0 array for agent
    let t1Array = []; // col1 array for agent
    let t2Array = []; // col2 array for agent
    let t3Array = []; // col3 array for agent
    let colorsArray = []; // colors array for agent
    let typeArray = []; // type array for agent
    let n: number = agents.length; // number of agent instances
    for(let i = 0; i < n; i++) {
      var a = agents[i];
      a.computeMatrix();
      var mat = a.transMat;
      t0Array.push(mat[0]);
      t0Array.push(mat[1]);
      t0Array.push(mat[2]);
      t0Array.push(mat[3]);
      t1Array.push(mat[4]);
      t1Array.push(mat[5]);
      t1Array.push(mat[6]);
      t1Array.push(mat[7]);
      t2Array.push(mat[8]);
      t2Array.push(mat[9]);
      t2Array.push(mat[10]);
      t2Array.push(mat[11]);
      t3Array.push(mat[12]);
      t3Array.push(mat[13]);
      t3Array.push(mat[14]);
      t3Array.push(mat[15]);
      colorsArray.push(a.col[0]);
      colorsArray.push(a.col[1]);
      colorsArray.push(a.col[2]);
      colorsArray.push(1.0); // Alpha channel
      typeArray.push(1.0);
    }
  
    let t0: Float32Array = new Float32Array(t0Array);
    let t1: Float32Array = new Float32Array(t1Array);
    let t2: Float32Array = new Float32Array(t2Array);
    let t3: Float32Array = new Float32Array(t3Array);
    let colors: Float32Array = new Float32Array(colorsArray);
    let types: Float32Array = new Float32Array(typeArray);
    agent.setInstanceVBOs(t0, t1, t2, t3, colors, types);
    agent.setNumInstances(n);
}

function instanceRendering() {
  // generate the agents
  let agents = simulation.getAgents();
  let t0Array = []; // col0 array for agent
  let t1Array = []; // col1 array for agent
  let t2Array = []; // col2 array for agent
  let t3Array = []; // col3 array for agent
  let colorsArray = []; // colors array for agent
  let typeArray = []; // type array for agent
  let n: number = agents.length; // number of agent instances
  for(let i = 0; i < n; i++) {
    var a = agents[i];
    a.computeMatrix();
    var mat = a.transMat;
    t0Array.push(mat[0]);
    t0Array.push(mat[1]);
    t0Array.push(mat[2]);
    t0Array.push(mat[3]);
    t1Array.push(mat[4]);
    t1Array.push(mat[5]);
    t1Array.push(mat[6]);
    t1Array.push(mat[7]);
    t2Array.push(mat[8]);
    t2Array.push(mat[9]);
    t2Array.push(mat[10]);
    t2Array.push(mat[11]);
    t3Array.push(mat[12]);
    t3Array.push(mat[13]);
    t3Array.push(mat[14]);
    t3Array.push(mat[15]);
    colorsArray.push(a.col[0]);
    colorsArray.push(a.col[1]);
    colorsArray.push(a.col[2]);
    colorsArray.push(1.0); // Alpha channel
    typeArray.push(1.0);
  }

  let t0: Float32Array = new Float32Array(t0Array);
  let t1: Float32Array = new Float32Array(t1Array);
  let t2: Float32Array = new Float32Array(t2Array);
  let t3: Float32Array = new Float32Array(t3Array);
  let colors: Float32Array = new Float32Array(colorsArray);
  let types: Float32Array = new Float32Array(typeArray);
  agent.setInstanceVBOs(t0, t1, t2, t3, colors, types);
  agent.setNumInstances(n);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'numAgents', 10, 100).step(1);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 30, -20), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  //renderer.setClearColor(0.5, 0.5, 0.5, 1);
  renderer.setClearColor(0.0, 0.0, 0.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ]);
  lambert.setDimensions(plane.scale);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    instanceRendering();
    renderer.clear();
    lambert.setMode(1.0);
    if (controls.numAgents != prevNumAgent) {
      prevNumAgent = controls.numAgents;
      loadScene();
    }
    renderer.render(camera, lambert, [
      plane,
    ], time, 0);
    lambert.setMode(2.0);
    renderer.render(camera, lambert, [
      square,
    ], time, 0);
    lambert.setMode(0.0);
    //renderer.render(camera, flat, [screenQuad], time, 0);
    renderer.render(camera, lambert, [
      agent,
    ],time, 1);
    if (time % 3 == 0) {
      simulation.simulationStep(10, time); // simulation step
    }
    time += 1.0;
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  // Start the render loop
  tick();
}

main();
