import Vue from "vue";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "../node_modules/three/examples/jsm/loaders/DRACOLoader";

const assemblyLoader = {
	loadingUrl: null,
	queue: [],
	loadGLTF (url, callback) {
		// Instantiate a loader
		if (this.loadingUrl === null) {
			this.loadingUrl = url;
			const loader = new GLTFLoader();
			const dracoLoader = new DRACOLoader();

			dracoLoader.setDecoderPath("/draco/");
			loader.setDRACOLoader(dracoLoader);

			loader.load(
				url,
				gltf => this.doneLoading(gltf, callback),
				function () {
					// callback(xhr.loaded/xhr.total);
				},
				function (error) {
					console.error(`ERROR : ${error}`);
				}
			);
		} else {
			this.queue.push({ url, callback });
		}
	},
	doneLoading (gltf, callback) {
		if (this.queue.length > 0) {
			this.loadingUrl = null;
			this.loadGLTF(this.queue[0].url, this.queue[0].callback);
			this.queue.shift();
		}
		callback(gltf);
	}
};

export default ({ app }, inject) => {
	inject("assemblyLoader", Vue.observable(assemblyLoader));
};
