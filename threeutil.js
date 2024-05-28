import * as THREE from 'three';
import { XRButton } from 'https://code4fukui.github.io/fisheyes-viewer/XRButton.js';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const supportsWebXR = "xr" in navigator;
export const isVisionPro = () => supportsWebXR && navigator.userAgent.indexOf("Macintosh") >= 0 && navigator.userAgent.indexOf("Chrome") == -1;

export const initXR = () => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha for AR
  //renderer.setClearColor(new THREE.Color(0xFDFDFD)); // 周りが明るい時
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);

  if (!isVisionPro()) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // WebXR
  //document.body.appendChild(XRButton.createButton(renderer, { spaceType: "local-floor" }));
  document.body.appendChild(XRButton.createButton(renderer, { spaceType: "local" }));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 100);

  // アンビエントライト
  const light = new THREE.AmbientLight(0xffffff); // soft white light
  scene.add(light);

  container.appendChild(renderer.domElement);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.zoomSpeed = .1;
  //orbitControls.listenToKeyEvents(renderer.domElement);

  orbitControls.target = new THREE.Vector3(0, 0, -1);

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  //camera.layers.enable(1); // render left view when no stereo available
  return { renderer, scene, camera };
};

export const waitLoadGLTF = (path) => {
  const loader = new GLTFLoader();
  return new Promise((resolve) => {
    loader.load(path, gltf => {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.material.map) {
          child.material.map.encoding = THREE.sRGBEncoding;
        }
      });
      resolve(gltf.scene);
    });
  });
};

export const createModelImage =  (img, w = 0.5, h = 0.5, parent) => {
  const geometry = new THREE.PlaneGeometry(w, h);
  const map = new THREE.Texture(img);
  map.needsUpdate = true;
  const material = new THREE.MeshBasicMaterial({
    //color: 0xffff00,
    map,
    side: THREE.FrontSide, //side: THREE.DoubleSide,
    transparent: true,
  });
  const plane = new THREE.Mesh(geometry, material);
  return plane;
};

export const createModelText = (s, w = 1.0, color = "white", size = 128, parent) => {
  const canvas = document.createElement("canvas");
  const g = canvas.getContext("2d");
  g.font = `bold ${size}px sans-serif`;
  const m = g.measureText(s);
  const sw = m.width;
  const sh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  canvas.width = sw;
  canvas.height = Math.floor(sh * 2);
  //g.fillStyle = "red";
  //g.fillRect(0, 0, canvas.width, canvas.height);
  g.font = `${size}px sans-serif`;
  g.fillStyle = color;
  g.fillText(s, 0, size - m.actualBoundingBoxDescent);
  g.strokeStyle = "black";
  g.lineWidth = size * .02;
  g.strokeText(s, 0, size - m.actualBoundingBoxDescent);
  //size - m.actualBoundingBoxDescent);
  //const img = canvas.toDataURL();
  // w *= .2; // difference from old textASCII
  const h = w / canvas.width * canvas.height;
  return createModelImage(canvas, w, h, false, parent);
};
