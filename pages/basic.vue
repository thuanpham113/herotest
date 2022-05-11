<template></template>

<script>
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";
export default {
  mounted() {
    //////////////////////////////////////////////////////////////////////////////////
    //		Init
    //////////////////////////////////////////////////////////////////////////////////

    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "mediump",
    });

    var clock = new THREE.Clock();

    var mixers = [];

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    document.body.appendChild(renderer.domElement);

    // init scene and camera
    var scene = new THREE.Scene();

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    var camera = new THREE.Camera();
    scene.add(camera);

    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    ////////////////////////////////////////////////////////////////////////////////
    //          handle arToolkitSource
    ////////////////////////////////////////////////////////////////////////////////

    var arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
      sourceWidth: 480,
      sourceHeight: 640,
    });

    arToolkitSource.init(function onReady() {
      // use a resize to fullscreen mobile devices
      setTimeout(function () {
        onResize();
      }, 1000);
    });

    // handle resize
    window.addEventListener("resize", function () {
      onResize();
    });

    // listener for end loading of NFT marker
    window.addEventListener("arjs-nft-loaded", function (ev) {
      console.log(ev);
    });

    function onResize() {
      arToolkitSource.onResizeElement();
      arToolkitSource.copyElementSizeTo(renderer.domElement);
      console.log("arToolkitContext.arController");
      console.log(arToolkitContext.arController);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //          initialize arToolkitContext
    ////////////////////////////////////////////////////////////////////////////////

    // create atToolkitContext
    var arToolkitContext = new THREEx.ArToolkitContext(
      {
        detectionMode: "mono",
        canvasWidth: 480,
        canvasHeight: 640,
      },
      {
        sourceWidth: 480,
        sourceHeight: 640,
      }
    );
    console.log("arToolkitContext");
    console.log(arToolkitContext);
    // initialize it
    arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    ////////////////////////////////////////////////////////////////////////////////
    //          Create a ArMarkerControls
    ////////////////////////////////////////////////////////////////////////////////

    // init controls for camera
    var markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
      type: "nft",
      descriptorsUrl: "data/pattern-iconsynode",
      changeMatrixMode: "cameraTransformMatrix",
    });
    scene.visible = false;

    var root = new THREE.Object3D();
    scene.add(root);
    console.log(markerControls);
    console.log(camera);
    //////////////////////////////////////////////////////////////////////////////////
    //		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    var threeGLTFLoader = new GLTFLoader();
    var model;

    threeGLTFLoader.load("./data/synode_24_assets_Big_Berkey_Water_Filter_System_No_Animation_Apr19.glb", function (gltf) {
      model = gltf.scene.children[0];
      model.scale.set(300,300,300)
      console.log("model")
      console.log(model)
      model.name = "Flamingo";

      var animation = gltf.animations[0];

      root.matrixAutoUpdate = false;
      root.add(model);

      model.position.z = -200;
      model.position.x = 100;
      model.position.y = 100;

      //////////////////////////////////////////////////////////////////////////////////
      //		render the whole thing on the page
      //////////////////////////////////////////////////////////////////////////////////

      var animate = function () {
        requestAnimationFrame(animate);

       

        if (!arToolkitSource.ready) {
          return;
        }

        arToolkitContext.update(arToolkitSource.domElement);

        // update scene.visible if the marker is seen
        scene.visible = camera.visible;

        renderer.render(scene, camera);
      };

      requestAnimationFrame(animate);
      console.console;
    });
  },
};
</script>

<style>
.arjs-loader {
  margin: 0 auto;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.arjs-loader-spinner {
  z-index: 10;
  -webkit-transform: spin 1s linear infinite;
  animation: spin 1s linear infinite;
  border: 3px solid #ddd;
  border-top: 3px solid #42a5f5;
  border-radius: 50%;
  height: 75px;
  width: 75px;
}

@-webkit-keyframes spin {
  to {
    border-top-color: #42a5f5;
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes spin {
  to {
    border-top-color: #42a5f5;
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
</style>
