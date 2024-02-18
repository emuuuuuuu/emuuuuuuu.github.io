//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(2, window.innerWidth / window.innerHeight, 10, 1000);

//Keep track of the mouse position, so we can make the eye move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

//Keep the 3D object on a global variable so we can access it later
let object;

//OrbitControls allow the camera to move around the scene
let controls;

//Set which object to render
let objToRender = 'head4.glb';

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//Load the file
loader.load(
  `models/${objToRender}`,
  function (glb) {
    //If the file is loaded, add it to the scene
    object = glb.scene;
    //model.castShadow = true; // Enable shadow casting for the model
    //model.receiveShadow = true; // Allow it to receive shadows
    scene.add(object);
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow mapping
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFSoftShadowMap for softer edges

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

//Set how far the camera will be from the 3D model
camera.position.z = objToRender === "dino" ? 25 : 500;

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(1, 1, 7);
directionalLight.castShadow = true; // Enable casting shadows for directional light
directionalLight.shadow.mapSize.width = 512; // Shadow map resolution
directionalLight.shadow.mapSize.height = 512;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
scene.add(directionalLight);

let isMouseDown = false;
let isDragging = false; // Flag to track dragging
let lastRotationY = 0; // Initialize to match the model's initial rotation
let lastRotationX = 0;
let initialMouseX = window.innerWidth / 2;
let initialMouseY = window.innerHeight / 2;
let zoomSpeed = 35; // Control how fast the zoom changes per wheel event
let momentumX = 0; // Momentum for rotation around the X axis
let momentumY = 0; // Momentum for rotation around the Y axis
let friction = 0.95; // Friction factor to slow down the momentum over time

// Listen for mouse wheel events to zoom in and out
document.addEventListener('wheel', (e) => {
  camera.position.z += e.deltaY * 0.01 * zoomSpeed;
  camera.position.z = Math.min(Math.max(camera.position.z, minZoomLimit), maxZoomLimit);
});

let lastMouseX = 0, lastMouseY = 0; // To store the last mouse positions
let deltaRotationY = 0, deltaRotationX = 0; // To calculate the change in rotation

document.onmousedown = (e) => {
  if (e.button === 0) { // Left mouse button
    isMouseDown = true;
    isDragging = false; // Reset dragging to false initially
    initialMouseX = lastMouseX = e.clientX;
    initialMouseY = lastMouseY = e.clientY;
  }
};

document.onmousemove = (e) => {
  if (isMouseDown) {
    let deltaX = e.clientX - lastMouseX;
    let deltaY = e.clientY - lastMouseY;
    if (!isDragging && (deltaX !== 0 || deltaY !== 0)) {
      isDragging = true;
    }

    if (isDragging) {
      // Calculate change in rotation
      deltaRotationY = deltaX / window.innerWidth * 8;
      deltaRotationX = deltaY / window.innerHeight * 7;
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
};

document.onmouseup = (e) => {
  if (e.button === 0) {
    if (isDragging) {
      // Apply the last moment's delta as the starting momentum
      momentumY = deltaRotationY;
      momentumX = deltaRotationX;
    }
    isMouseDown = false;
    isDragging = false;
  }
};

function animate() {
  requestAnimationFrame(animate);

  if (object) {
    if (isDragging) {
      // Apply direct rotation based on mouse movement
      object.rotation.y = lastRotationY + (mouseX - initialMouseX) / window.innerWidth * 3;
      object.rotation.x = lastRotationX + (mouseY - initialMouseY) / window.innerHeight * 2.5;
    } else if (!isDragging && (Math.abs(momentumX) > 0.001 || Math.abs(momentumY) > 0.001)) {
      // Apply momentum when not dragging
      object.rotation.y += momentumY;
      object.rotation.x += momentumX;
      momentumY *= friction;
      momentumX *= friction;

      // Update lastRotation to ensure continuity
      lastRotationY = object.rotation.y;
      lastRotationX = object.rotation.x;
    }
  }

  renderer.render(scene, camera);
}


animate();