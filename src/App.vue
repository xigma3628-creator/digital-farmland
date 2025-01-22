<script setup lang="ts">
import * as Cesium from 'cesium';
import './Widgets/widgets.css';
import { onMounted } from 'vue';
window.CESIUM_BASE_URL = '/';
onMounted(()=>{
  const viewer=new Cesium.Viewer("cesiumContainer")
})
</script>

<template>
  <div id="cesiumContainer" ref="cesiumContainer"></div>
</template>

<style scoped>
*{
  padding: 0;
  margin: 0;
}
#cesiumContainer{
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}
</style>
