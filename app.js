import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { XREstimatedLight } from "three/addons/webxr/XREstimatedLight.js";
import { XRButton } from "three/addons/webxr/XRButton.js";

let scene, camera, renderer, xrLight;
let reticle,
  hitTestSource,
  hitTestSourceRequested = false;
let placedFurniture = [];
let selectedFurnitureType = null;
let selectedFurnitureEntity = null;
const furnitureData = {};
const gltfLoader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let startARBtn,
  exitARBtn,
  furniturePanel,
  instructionText,
  deleteBtn,
  arContainer,
  arInterface;
let furnitureCards = [];
let isARActive = false;

// --- Highlight helper
let selectionHelper = null;

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  startARBtn = document.getElementById("startAR");
  exitARBtn = document.getElementById("exitAR");
  furniturePanel = document.getElementById("furniturePanel");
  instructionText = document.getElementById("instructionText");
  deleteBtn = document.getElementById("deleteBtn");
  arContainer = document.getElementById("arContainer");
  arInterface = document.getElementById("arInterface");

  loadFurnitureData();
  setupEventListeners();
}

function loadFurnitureData() {
  Object.assign(furnitureData, {
    chair: {
      id: "chair",
      name: "Modern Chair",
      model_url: "assets/chair.glb",
      scale: 0.5,
    },
    sofa: {
      id: "sofa",
      name: "Comfortable Sofa",
      model_url: "assets/sofa1.glb",
      scale: 0.4,
    },
    table: {
      id: "table",
      name: "Coffee Table",
      model_url: "assets/table.glb",
      scale: 0.4,
    },
    bookshelf: {
      id: "bookshelf",
      name: "Tall Bookshelf",
      model_url: "assets/bookshelf.glb",
      scale: 0.6,
    },
  });
  checkWebXRSupport();
}

function checkWebXRSupport() {
  if ("xr" in navigator) {
    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if (supported) startARBtn.disabled = false;
      else alert("WebXR AR not supported on this device");
    });
  } else {
    alert("WebXR not available. Please use Chrome on Android.");
  }
}

function setupEventListeners() {
  startARBtn.addEventListener("click", startARSession);
  exitARBtn.addEventListener("click", exitARSession);

  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteSelectedFurniture();
    });
  }

  document.addEventListener("click", onScreenTap); // Raycaster selection

  furnitureCards = document.querySelectorAll(".furniture-card-mini");
  furnitureCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = card.getAttribute("data-type");
      selectFurnitureType(type);
    });
  });
}

async function startARSession() {
  document.querySelector(".hero-section").classList.add("hidden");
  document.querySelector(".remix-suggestion").classList.add("hidden");
  arInterface.classList.remove("hidden");
  setupThreeJS();

  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "local-floor"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });

    await renderer.xr.setSession(session);
    session.addEventListener("end", exitARSession);
    isARActive = true;

    const controller = renderer.xr.getController(0);
    if (controller) controller.addEventListener("select", onXRSelect);

    setTimeout(() => {
      furniturePanel.classList.add("fade-in");
      furniturePanel.classList.remove("hidden");
    }, 500);

    updateInstructions("Point your camera at the floor to place furniture");
  } catch (error) {
    alert("Failed to start AR. Please try again.");
    isARActive = false;
  }
}

function setupThreeJS() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20,
  );
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  arContainer.appendChild(renderer.domElement);

  xrLight = new XREstimatedLight(renderer);
  xrLight.addEventListener("estimationstart", () => {
    scene.add(xrLight);
    if (xrLight.environment) scene.environment = xrLight.environment;
  });
  xrLight.addEventListener("estimationend", () => {
    scene.remove(xrLight);
    scene.environment = null;
  });

  const reticleGeometry = new THREE.RingGeometry(0.1, 0.12, 32).rotateX(
    -Math.PI / 2,
  );
  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  const controller = renderer.xr.getController(0);
  controller.addEventListener("select", onXRSelect);
  scene.add(controller);

  renderer.setAnimationLoop(render);
}

function render(timestamp, frame) {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    if (hitTestSourceRequested === false) {
      session.requestReferenceSpace("viewer").then((referenceSpace) => {
        session
          .requestHitTestSource({ space: referenceSpace })
          .then((source) => {
            hitTestSource = source;
          });
      });
      hitTestSourceRequested = true;
    }

    if (hitTestSource) {
      const hitTestResults = frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
}

// XR controller model placement
function onXRSelect() {
  if (reticle.visible && selectedFurnitureType) placeFurniture();
}

// Raycaster tap for selection logic
function onScreenTap(event) {
  // Ignore clicks on UI controls
  if (
    event.target.closest("#furniturePanel") ||
    event.target.closest("button") ||
    event.target.closest(".instructions")
  ) {
    return;
  }
  if (!isARActive || !renderer) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(placedFurniture, true);

  if (intersects.length > 0) {
    let selectedModel = intersects[0].object;
    // Traverse up to find the root placed model
    while (selectedModel.parent && !placedFurniture.includes(selectedModel)) {
      selectedModel = selectedModel.parent;
    }

    if (placedFurniture.includes(selectedModel)) {
      selectObject(selectedModel);
    }
  } else {
    deselectAllObjects();
    updateInstructions(
      "Tap on furniture to select it, then click DELETE to remove.",
    );
  }
}

function placeFurniture() {
  const furnitureItem = furnitureData[selectedFurnitureType];
  gltfLoader.load(
    furnitureItem.model_url,
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(
        furnitureItem.scale,
        furnitureItem.scale,
        furnitureItem.scale,
      );
      model.position.setFromMatrixPosition(reticle.matrix);
      model.userData.furnitureType = selectedFurnitureType;
      scene.add(model);
      placedFurniture.push(model);
      selectObject(model); // Select immediately after placement
      updateInstructions(
        `${furnitureItem.name} placed and selected! Tap DELETE to remove.`,
      );
    },
    undefined,
    (error) => {
      updateInstructions(`Error loading ${furnitureItem.name}. Check console.`);
    },
  );
}

function selectObject(object) {
  deselectAllObjects();
  selectedFurnitureEntity = object;
  highlightSelectedModel(object);
  updateInstructions(
    `${object.userData.furnitureType} selected. Click DELETE to remove.`,
  );
}

function deselectAllObjects() {
  selectedFurnitureEntity = null;
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper = null;
  }
}

function highlightSelectedModel(model) {
  if (selectionHelper) {
    scene.remove(selectionHelper);
    selectionHelper = null;
  }
  selectionHelper = new THREE.BoxHelper(model, 0xffff00);
  selectionHelper.userData.isSelectionHelper = true;
  scene.add(selectionHelper);
}

function selectFurnitureType(type) {
  selectedFurnitureType = type;
  deselectAllObjects();
  furnitureCards.forEach((card) => {
    if (card.getAttribute("data-type") === type) card.classList.add("selected");
    else card.classList.remove("selected");
  });
  updateInstructions(`${furnitureData[type].name} selected. Tap to place.`);
}

function deleteSelectedFurniture() {
  if (selectedFurnitureEntity) {
    scene.remove(selectedFurnitureEntity);
    const index = placedFurniture.indexOf(selectedFurnitureEntity);
    if (index > -1) placedFurniture.splice(index, 1);
    deselectAllObjects();
    updateInstructions("Item deleted! Select furniture type to place more.");
  } else {
    updateInstructions("Select furniture first by tapping on it.");
  }
}

function exitARSession() {
  const session = renderer.xr.getSession();
  if (session) session.end();
  isARActive = false;
  arInterface.classList.add("hidden");
  document.querySelector(".hero-section").classList.remove("hidden");
  document.querySelector(".remix-suggestion").classList.remove("hidden");
  furniturePanel.classList.remove("fade-in");
  furniturePanel.classList.add("hidden");
  placedFurniture.forEach((model) => {
    if (model && model.parent) model.parent.remove(model);
  });
  placedFurniture = [];
  deselectAllObjects();
  hitTestSourceRequested = false;
  hitTestSource = null;
}

function updateInstructions(text) {
  if (instructionText) instructionText.textContent = text;
}
