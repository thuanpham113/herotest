<template>
  <div id="ARScene">
      {{camera.matrix}}
  </div>
</template>

<script>
import * as THREE from "three";
import {
  ArToolkitProfile,
  ArToolkitSource,
  ArToolkitContext,
  ArMarkerControls,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";

export default {
  name: "ARScene",
  mounted() {
    ArToolkitContext.baseURL = "./";
    console.log("ARScene mounted");

    // init renderer
    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "mediump",
    });

    var clock = new THREE.Clock();

    var mixers = [];

    renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    // renderer.setPixelRatio( 2 );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0px";
    renderer.domElement.style.left = "0px";
    document.body.appendChild(renderer.domElement); // We should be able to specify an html element to append AR.js related elements to.

    // array of functions for the rendering loop
    var onRenderFcts = [];

    // init scene and camera
    var scene = new THREE.Scene();
    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    var camera = new THREE.Camera();
    scene.add(camera);
    const artoolkitProfile = new ArToolkitProfile();
    artoolkitProfile.sourceWebcam(); // Is there good reason for having a function to set the sourceWebcam but not the displayWidth/Height etc?

    // add existing parameters, this is not well documented
    let additionalParameters = {
      // Device id of the camera to use (optional)
      deviceId: null,
      // resolution of at which we initialize in the source image
      sourceWidth: 640,
      sourceHeight: 480,
      // resolution displayed for the source
      displayWidth: window.innerWidth,
      displayHeight:window.innerHeight,
    };

    Object.assign(artoolkitProfile.sourceParameters, additionalParameters);
    console.log(artoolkitProfile.sourceParameters); // now includes the additionalParameters

    const arToolkitSource = new ArToolkitSource(
      artoolkitProfile.sourceParameters
    );

    arToolkitSource.init(function onReady() {
      onResize();
    });

    // handle resize
    window.addEventListener("resize", function () {
      onResize();
    });

    // resize is not called for the canvas on init. The canvas with the cube seems to be resized correctly at start.
    // Is that maybe a vue-specific problem?
    function onResize() {
      arToolkitSource.onResizeElement();
      arToolkitSource.copyElementSizeTo(renderer.domElement);
      if (arToolkitContext.arController !== null) {
        arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
      }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //          initialize arToolkitContext
    ////////////////////////////////////////////////////////////////////////////////

    // create atToolkitContext
    var arToolkitContext = new ArToolkitContext({
      debug: false,
      cameraParametersUrl: ArToolkitContext.baseURL + "data/camera_para.dat",
      detectionMode: "mono",
      canvasWidth: 640,
      canvasHeight: 490,
      imageSmoothingEnabled: true, // There is still a warning about mozImageSmoothingEnabled when using Firefox
    });

    // initialize it
    arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // update artoolkit on every frame
    onRenderFcts.push(function () {
      if (arToolkitSource.ready === false) return;

      arToolkitContext.update(arToolkitSource.domElement);
    });

    ////////////////////////////////////////////////////////////////////////////////
    //          Create a ArMarkerControls
    ////////////////////////////////////////////////////////////////////////////////

    var markerGroup = new THREE.Group();
    scene.add(markerGroup);

    var markerControls = new ArMarkerControls(arToolkitContext, camera, {
      type: "pattern",
      patternUrl: ArToolkitContext.baseURL + "data/patt.hiro",
      smooth: true,
      smoothCount: 5,
      smoothTolerance: 0.01,
      smoothThreshold: 2,
    });

    //////////////////////////////////////////////////////////////////////////////////
    //		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    var markerScene = new THREE.Scene();
    markerGroup.add(markerScene);

    var mesh = new THREE.AxesHelper();
    markerScene.add(mesh);

    // add a torus knot
    onRenderFcts.push(function (delta) {
      mesh.rotation.x += delta * Math.PI;
    });
    var root = new THREE.Object3D();
    scene.add(root);
    //////////////////////////////////////////////////////////////////////////////////
    //		render the whole thing on the page
    //////////////////////////////////////////////////////////////////////////////////
    var threeGLTFLoader = new GLTFLoader();
    var model;

    threeGLTFLoader.load(
      "http://localhost:3000/data/Flamingo.glb",
      function (gltf) {
        model = gltf.scene.children[0];
        model.name = "Flamingo";

        var animation = gltf.animations[0];
        var mixer = new THREE.AnimationMixer(model);
        mixers.push(mixer);
        var action = mixer.clipAction(animation);
        action.play();

        root.matrixAutoUpdate = false;
        root.add(model);
        scene.add(model);

        model.scale.set(0.01, 0.01, 0.01);

        //////////////////////////////////////////////////////////////////////////////////
        //		render the whole thing on the page
        //////////////////////////////////////////////////////////////////////////////////

        var animate = function () {
          requestAnimationFrame(animate);

          if (mixers.length > 0) {
            for (var i = 0; i < mixers.length; i++) {
              mixers[i].update(clock.getDelta());
            }
          }

          if (!arToolkitSource.ready) {
            return;
          }

          arToolkitContext.update(arToolkitSource.domElement);

          // update scene.visible if the marker is seen
          scene.visible = camera.visible;

          renderer.render(scene, camera);
        };

        requestAnimationFrame(animate);
      }
    );
  },
};
</script>

<style>
.arjs-video{
    width: 100%;
  height: 100%;
}
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
