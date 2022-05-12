<template>
	<div id="app"></div>
</template>

<script>
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex";
export default {
	data() {
		return {
			renderer: null,
			onRenderFcts: null,
			scene: null,
			camera: null,
			arToolkitSource: null,
			arToolkitContext: null,
			arMarkerControls: null,
			lastTimeMsec: null,
		};
	},
	mounted() {
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

		this.scene = new THREE.Scene();

		this.camera = new THREE.Camera();
		this.scene.add(this.camera);

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
		const value = window;
		console.log(value);
		this.arToolkitSource.init(this.onReady);
		window.addEventListener("resize", this.onResize());

		var geometry = new THREE.BoxGeometry(1, 1, 1);
		var material = new THREE.MeshNormalMaterial({
			transparent: true,
			opacity: 0.5,
			side: THREE.DoubleSide,
		});
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = geometry.parameters.height / 2;
		this.scene.add(mesh);

		var geometry = new THREE.TorusKnotGeometry(0.3, 0.1, 64, 16);
		var material = new THREE.MeshNormalMaterial();
		var mesh = new THREE.Mesh(geometry, material);
		mesh.position.y = 0.5;
		this.scene.add(mesh);
		console.log("this.arToolkitSource")
		console.log(this.arMarkerControls)
	},
	methods: {
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
		onResize() {
			this.arToolkitSource.onResizeElement();
			this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);
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
				console.log(this.arToolkitContext);
				this.arToolkitContext.arController.orientation =
					this.getSourceOrientation();
				this.arToolkitContext.arController.options.orientation =
					this.getSourceOrientation();

				window.arToolkitContext = this.arToolkitContext;
				console.log("arToolkitContext", this.arToolkitContext);
			});

			// MARKER
			this.arMarkerControls = new THREEx.ArMarkerControls(
				this.arToolkitContext,
				this.camera,
				{
					type: "pattern",
					patternUrl: "./data/patt.hiro",
					// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji',
					// as we controls the camera, set changeMatrixMode: 'cameraTransformMatrix'
					changeMatrixMode: "cameraTransformMatrix",
				}
			);

			this.scene.visible = false;

			window.arMarkerControls = this.arMarkerControls;
			console.log("ArMarkerControls", this.arMarkerControls);
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
	},
};
</script>
