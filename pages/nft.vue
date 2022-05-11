<template>
  <div id="ARScene"></div>
</template>

<script>
import * as THREE from "three";
import {
  ArToolkitProfile,
  ArToolkitSource,
  ArToolkitContext,
  ArMarkerControls,
} from "@ar-js-org/ar.js/three.js/build/ar-threex";

export default {
  name: "ARScene",
  data() {
    return {
      scene: null,
      renderer: null,
      camera: null,
      arToolkitContext: null,
      arToolkitSource: null,
    };
  },
  mounted() {
    ArToolkitContext.baseURL = "./";
    console.log("ARScene mounted");

    // init renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setClearColor(new THREE.Color("lightgrey"), 0);
    // renderer.setPixelRatio( 2 );
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0px";
    this.renderer.domElement.style.left = "0px";
    document.body.appendChild(this.renderer.domElement); // We should be able to specify an html element to append AR.js related elements to.

    // init scene and camera
    this.scene = new THREE.Scene();

    //////////////////////////////////////////////////////////////////////////////////
    //		Initialize a basic camera
    //////////////////////////////////-////////////////////////////////////////////////

    // Create a camera
    this.camera = new THREE.Camera();
    this.scene.add(this.camera);
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
      displayHeight: window.innerHeight,
    };

    Object.assign(artoolkitProfile.sourceParameters, additionalParameters);
    console.log(artoolkitProfile.sourceParameters); // now includes the additionalParameters

    this.arToolkitSource = new ArToolkitSource(
      artoolkitProfile.sourceParameters
    );

    this.arToolkitSource.init(this.onReady);

    // handle resize
    window.addEventListener("resize", this.onReady);

    // resize is not called for the canvas on init. The canvas with the cube seems to be resized correctly at start.
    // Is that maybe a vue-specific problem?

    ////////////////////////////////////////////////////////////////////////////////
    //          initialize arToolkitContext
    ////////////////////////////////////////////////////////////////////////////////

    // create atToolkitContext
    this.arToolkitContext = new ArToolkitContext({
      debug: false,
      cameraParametersUrl: ArToolkitContext.baseURL + "data/camera_para.dat",
      detectionMode: "mono",
      canvasWidth: 640,
      canvasHeight: 490,
      imageSmoothingEnabled: true, // There is still a warning about mozImageSmoothingEnabled when using Firefox
    });

    const arToolkitSource = this.arToolkitSource;
    const arToolkitContext = this.arToolkitContext;

    // initialize it
    const camera = this.camera;
    this.arToolkitContext.init(function onCompleted() {
      // copy projection matrix to camera
      camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    });

    // update artoolkit on every frame

    ////////////////////////////////////////////////////////////////////////////////
    //          Create a ArMarkerControls
    ////////////////////////////////////////////////////////////////////////////////

    var markerGroup = new THREE.Group();
    this.scene.add(markerGroup);

    var markerControls = new ArMarkerControls(
      this.arToolkitContext,
      markerGroup,
      {
       type: "nft",
				descriptorsUrl: "./data/pinball",
				changeMatrixMode: "cameraTransformMatrix",
      }
    );

    //////////////////////////////////////////////////////////////////////////////////
    //		add an object in the scene
    //////////////////////////////////////////////////////////////////////////////////

    var markerScene = new THREE.Scene();
    markerGroup.add(markerScene);

    var mesh = new THREE.AxesHelper();
    markerScene.add(mesh);

    // add a torus knot
    var geometry = new THREE.BoxGeometry(1000, 1000, 1000);
    var material = new THREE.MeshNormalMaterial({
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = geometry.parameters.height / 2;
    markerScene.add(mesh);

    var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
    var material = new THREE.MeshNormalMaterial();
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    markerScene.add(mesh);
    requestAnimationFrame(this.animate);
    
    //////////////////////////////////////////////////////////////////////////////////
    //		render the whole thing on the page
    //////////////////////////////////////////////////////////////////////////////////
    // run the rendering loop
  },
  methods: {
    animate(){
      requestAnimationFrame(this.animate);
       if (!this.arToolkitSource.ready) {
        return;
      }

      this.arToolkitContext.update(this.arToolkitSource.domElement);

      // update scene.visible if the marker is seen
      this.scene.visible = this.camera.visible;

      this.renderer.render(this.scene, this.camera);
      
    },
    onResize() {
      this.arToolkitSource.onResizeElement();
      this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
      if (this.arToolkitContext.arController !== null) {
        this.arToolkitSource.copyElementSizeTo(
          this.arToolkitContext.arController.canvas
        );
      }
    },
    onReady() {
      this.onResize();
    },
  },
};
</script>

<style></style>
