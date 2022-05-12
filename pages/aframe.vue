<template>
  <body style="margin: 0px; overflow: hidden">
    <div class="arjs-loader">
      <div>Loading, please wait...</div>
    </div>

    <!-- a-frame scene -->
    <a-scene
      vr-mode-ui="enabled: false;"
      renderer="logarithmicDepthBuffer: true;"
      embedded
      v-if="isStripeLoaded"
      arjs="trackingMethod: best; sourceType: webcam;debugUIEnabled: false;"
    >
      <!-- a-nft is the anchor that defines an Image Tracking entity -->
      <!-- on 'url' use the path to the Image Descriptors created before. -->
      <!-- the path should end with the name without the extension e.g. if file is 'pinball.fset' the path should end with 'pinball' -->
      <a-nft
        type="nft"
        url="./data/pattern-iconsynode"
        smooth="true"
        smoothCount="10"
        smoothTolerance=".01"
        smoothThreshold="5"
      >
        <!-- as a child of the a-nft entity, you can define the content to show. here's a GLTF model entity -->
        <a-entity
          gltf-model="https://192.168.2.42:3000/data/synode_24_assets_Big_Berkey_Water_Filter_System_No_Animation_Apr19.glb"
          scale="5 5 5"
          position="50 150 0"
        >
        </a-entity>
      </a-nft>
      <!-- static camera that moves according to the device movemenents -->
      <a-entity camera></a-entity>
    </a-scene>
  </body>
</template>

<!-- style for the loader -->
<style>
.arjs-loader {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.arjs-loader div {
  text-align: center;
  font-size: 1.25em;
  color: white;
}
</style>
<script>
// /pages/payment-page.vue
export default {
  data() {
    return {
      isStripeLoaded: false,
    };
  },
  head() {
    return {
      title: "Payment Page - My awesome project",
      script: [
        {
          hid: "aframe-ar-nft",
          src: "https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js",
          defer: true,
          // Changed after script load
          callback: () => {
            this.isStripeLoaded = true;
          },
        },
        {
          hid: "aframe",
          src: "https://aframe.io/releases/1.0.4/aframe.min.js",
          defer: true,
          // Changed after script load
          callback: () => {
            this.isStripeLoaded = true;
          },
        },
      ],
    };
  },
};
</script>
