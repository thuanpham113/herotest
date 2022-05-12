<template></template>

<script>
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";
export default {
  data() {
    return {
      renderer: null,
      scene: null,
      camera: null,
      arToolkitSource: null,
      arToolkitContext: null,
      markerControls: null,
      mixers: null,
      clock: null,
    };
  },
  mounted() {
    //////////////////////////////////////////////////////////////////////////////////
    //		Init
    //////////////////////////////////////////////////////////////////////////////////

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "mediump",
    });

    this.clock = new THREE.Clock();

    this.mixers = [];

    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    document.body.appendChild(this.renderer.domElement);

    // init scene and camera
    this.scene = new THREE.Scene();

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);

    var light = new THREE.AmbientLight(0xffffff);
    this.scene.add(light);

    ////////////////////////////////////////////////////////////////////////////////
    //          handle arToolkitSource
    ////////////////////////////////////////////////////////////////////////////////

    this.arToolkitSource = new THREEx.ArToolkitSource({
      sourceType: "webcam",
      sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
      sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
      displayWidth: window.innerWidth,
      displayHeight: window.innerHeight,
    });

    this.arToolkitSource.init(() => {
      // use a resize to fullscreen mobile devices
      setTimeout(() => {
        this.onResize();
      }, 1000);
    });

    // handle resize
    window.addEventListener("resize", () => {
      this.onResize();
    });

    // listener for end loading of NFT marker
    window.addEventListener("arjs-nft-loaded", function (ev) {
      console.log(ev);
    });

    function onResize() {
      this.arToolkitSource.onResizeElement();
      this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
      console.log("arToolkitContext.arController");
      console.log(this.arToolkitContext.arController);
      if (this.arToolkitContext.arController !== null) {
        this.arToolkitSource.copyElementSizeTo(
          this.arToolkitContext.arController.canvas
        );
      }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //          initialize arToolkitContext
    ////////////////////////////////////////////////////////////////////////////////

    // create atToolkitContext
    this.arToolkitContext = new THREEx.ArToolkitContext(
      {
        detectionMode: "mono",
        canvasWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        canvasHeight: window.innerWidth > window.innerHeight ? 480 : 640,
      },
      {
        sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
        sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
      }
    );
    console.log("arToolkitContext");
    console.log(this.arToolkitContext);
    // initialize it
    this.arToolkitContext.init(() => {
      // copy projection matrix to camera
      this.camera.projectionMatrix.copy(
        this.arToolkitContext.getProjectionMatrix()
      );
    });

    ////////////////////////////////////////////////////////////////////////////////
    //          Create a ArMarkerControls
    ////////////////////////////////////////////////////////////////////////////////

    // init controls for camera
    this.markerControls = new THREEx.ArMarkerControls(
      this.arToolkitContext,
      this.camera,
      {
        type: "nft",
        descriptorsUrl: "./data/pinball",
        changeMatrixMode: "cameraTransformMatrix",
      }
    );
    this.scene.visible = false;

    var root = new THREE.Object3D();
    this.scene.add(root);
    console.log(this.markerControls);
    console.log(this.camera);
    //////////////////////////////////////////////////////////////////////////////////
    //		add an object in the this.scene
    //////////////////////////////////////////////////////////////////////////////////

    var threeGLTFLoader = new GLTFLoader();
    var model;

    threeGLTFLoader.load(
      "https://storage.googleapis.com/download/storage/v1/b/rely-media/o/synode%2F20%2Fassets%2FGLB_NO_Animation4.glb?generation=1650634453394030&alt=media",
      (gltf) => {
        model = gltf.scene.children[0];
        model.name = "Flamingo";
        model.scale.set(400, 400, 400);
        var animation = gltf.animations[0];
        var mixer = new THREE.AnimationMixer(model);
        this.mixers.push(mixer);
        var action = mixer.clipAction(animation);
        action.play();

        root.matrixAutoUpdate = false;
        root.add(model);

        model.position.z = -200;
        model.position.x = 100;
        model.position.y = 100;

        //////////////////////////////////////////////////////////////////////////////////
        //		render the whole thing on the page
        //////////////////////////////////////////////////////////////////////////////////

        requestAnimationFrame(this.animate);
      }
    );
  },
  methods: {
    animate() {
      requestAnimationFrame(this.animate);

      if (this.mixers.length > 0) {
        for (var i = 0; i < this.mixers.length; i++) {
          this.mixers[i].update(this.clock.getDelta());
        }
      }

      if (!this.arToolkitSource.ready) {
        return;
      }

      this.arToolkitContext.update(this.arToolkitSource.domElement);

      // update this.scene.visible if the marker is seen
      this.scene.visible = this.camera.visible;
      console.log(this.camera.position.x);
      this.renderer.render(this.scene, this.camera);
    },
    onResize() {
      this.arToolkitSource.onResizeElement();
      this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
      console.log("arToolkitContext.arController");
      console.log(this.arToolkitContext.arController);
      if (this.arToolkitContext.arController !== null) {
        this.arToolkitSource.copyElementSizeTo(
          this.arToolkitContext.arController.canvas
        );
      }
    },
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
