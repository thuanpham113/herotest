<template>
  <div id="app"></div>
</template>

<script>
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";
import { RoomEnvironment } from "../node_modules/three/examples/jsm/environments/RoomEnvironment";
export default {
  data() {
    return {
      renderer: null,
      scene: null,
      camera: null,
      arToolkitSource: null,
      arToolkitContext: null,
      arMarkerControls: null,
      lastTimeMsec: null,
      onRenderFcts: [],
    };
  },
  mounted() {
    //////////////////////////////////////////////////////////////////////////////////
    //		Init
    //////////////////////////////////////////////////////////////////////////////////

    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    this.renderer.setSize(640, 480);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    document.body.appendChild(this.renderer.domElement);

    // init scene and camera
    this.scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);

    ////////////////////////////////////////////////////////////////////////////////
    //          handle arToolkitSource
    ////////////////////////////////////////////////////////////////////////////////

    this.arToolkitSource = new THREEx.ArToolkitSource({
      // to read from the webcam
      sourceType: "webcam",

      sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
      sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
      displayWidth: window.innerWidth,
      displayHeight: window.innerHeight,

      // // to read from an image
      // sourceType : 'image',
      // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

      // to read from a video
      // sourceType : 'video',
      // sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
    });

    this.arToolkitSource.init(() => this.onReady());

    // handle resize
    window.addEventListener("resize", () => this.onResize());

    // update artoolkit on every frame
    this.onRenderFcts.push(() => {
      if (
        !this.arToolkitContext ||
        !this.arToolkitSource ||
        !this.arToolkitSource.ready
      ) {
        return;
      }

      this.arToolkitContext.update(this.arToolkitSource.domElement);

      // update this.scene.visible if the marker is seen
      this.scene.visible = this.camera.visible;
    });

    //////////////////////////////////////////////////////////////////////////////////
    //		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    // add a torus knot

    var threeGLTFLoader = new GLTFLoader();
    var model;

    threeGLTFLoader.load(
      "https://storage.googleapis.com/download/storage/v1/b/rely-media/o/synode%2F23%2Fassets%2FGLB.glb?generation=1652451211787861&alt=media",
      (gltf) => {
        model = gltf.scene.children[1];
        model.scale.set(10, 10, 10);
        this.scene.add(model);
      }
    );


    //////////////////////////////////////////////////////////////////////////////////
    //		render the whole thing on the page
    //////////////////////////////////////////////////////////////////////////////////

    // render the scene
    this.onRenderFcts.push(() => {
      this.renderer.render(this.scene, this.camera);
    });

    // run the rendering loop
    this.lastTimeMsec = null;
    this.animate();
  },
  methods: {
    animate(nowMsec) {
      console.log("11");
      // keep looping
      requestAnimationFrame(this.animate);
      // measure time
      this.lastTimeMsec = this.lastTimeMsec || nowMsec - 1000 / 60;
      var deltaMsec = Math.min(200, nowMsec - this.lastTimeMsec);
      this.lastTimeMsec = nowMsec;
      // call each update function
      this.onRenderFcts.forEach((onRenderFct) => {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000);
      });
    },
    onResize() {
      this.arToolkitSource.onResizeElement();
      this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
      if (window.arToolkitContext.arController !== null) {
        this.arToolkitSource.copyElementSizeTo(
          window.arToolkitContext.arController.canvas
        );
      }
    },
    initARContext() {
      // create atToolkitContext
      this.arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: "./data/camera_para.dat",
        detectionMode: "mono",
      });
      // initialize it
      this.arToolkitContext.init(() => {
        // copy projection matrix to camera
        this.camera.projectionMatrix.copy(
          this.arToolkitContext.getProjectionMatrix()
        );

        this.arToolkitContext.arController.orientation =
          this.getSourceOrientation();
        this.arToolkitContext.arController.options.orientation =
          this.getSourceOrientation();

        console.log("arToolkitContext", this.arToolkitContext);
        window.arToolkitContext = this.arToolkitContext;
      });

      // MARKER
      this.arMarkerControls = new THREEx.ArMarkerControls(
        this.arToolkitContext,
        this.camera,
        {
          type: "pattern",
          patternUrl: "./data/LogoSynode.patt",
          // patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
          // as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
          changeMatrixMode: "cameraTransformMatrix",
        }
      );

      this.scene.visible = false;

      console.log("ArMarkerControls", this.arMarkerControls);
      window.arMarkerControls = this.arMarkerControls;
    },
    getSourceOrientation() {
      if (!this.arToolkitSource) {
        return null;
      }

      console.log(
        "actual source dimensions",
        this.arToolkitSource.domElement.videoWidth,
        this.arToolkitSource.domElement.videoHeight
      );

      if (
        this.arToolkitSource.domElement.videoWidth >
        this.arToolkitSource.domElement.videoHeight
      ) {
        console.log("source orientation", "landscape");
        return "landscape";
      } else {
        console.log("source orientation", "portrait");
        return "portrait";
      }
    },
    onReady() {
      this.arToolkitSource.domElement.addEventListener("canplay", () => {
        console.log(
          "canplay",
          "actual source dimensions",
          this.arToolkitSource.domElement.videoWidth,
          this.arToolkitSource.domElement.videoHeight
        );

        this.initARContext();
      });
      window.arToolkitSource = arToolkitSource;
      setTimeout(() => {
        this.onResize();
      }, 2000);
    },
  },
};
</script>
