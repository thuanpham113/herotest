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
    this.renderer.setSize(window.innerWidth,window.innerHeight);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    document.body.appendChild(this.renderer.domElement);
    this.renderer.setPixelRatio( window.devicePixelRatio );

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

      sourceWidth: window.innerWidth > window.innerHeight ? 1920 : 1080,
      sourceHeight: window.innerWidth > window.innerHeight ? 1080 : 1920,
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
      "https://storage.googleapis.com/download/storage/v1/b/rely-media/o/synode%2F19%2Fassets%2Ftesla_apr15.glb?generation=1650049677688642&alt=media",
      (gltf) => {
        model = gltf.scene.getObjectByName("Group006")
        const boundingBox = new THREE.Box3()
			  boundingBox.setFromObject(gltf.scene)
			  var middle = new THREE.Vector3()
			  var size = new THREE.Vector3()
			  boundingBox.getSize(size)
			  boundingBox.getCenter(middle)  
        const maxSize=Math.max(size.x, size.y, size.z)
        console.log("maxSize")
        console.log(maxSize)
        model.scale.set(2*1/maxSize,2*1/maxSize, 2* 1/maxSize);
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
          patternUrl: "./data/synode.patt",
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
      window.arToolkitSource = this.arToolkitSource;
      setTimeout(() => {
        this.onResize();
      }, 2000);
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