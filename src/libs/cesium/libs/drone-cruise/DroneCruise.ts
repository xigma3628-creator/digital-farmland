import { Cartesian3, JulianDate, Model, ModelAnimation, ModelAnimationLoop, Transforms, Viewer } from 'cesium'
import * as Cesium from 'cesium'

/**
 * 无人机巡航
 * **/
class DroneCruise {
  private viewer: Viewer
  private path: any
  private drone: Model | null

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.drone = null
    this.initPath()
  }

  loadDroneCruiseModel() {

  }

  private async initPath() {
    if (this.path) return
    const response = await fetch('https://coderfmc.github.io/three.js-demo/入侵路径_ESPG_4326_WGS84.geojson')
    const geoJson = await response.json()

    const obj: any = {}
    const pathList: any[] = []
    geoJson.features.forEach((feature: any, index: number) => {
      const group = feature.properties.group
      if (!obj[group]) {
        obj[group] = []
      }
      obj[group].push(feature)
    })
    for (const key of Object.keys(obj)) {
      obj[key] = obj[key].sort((a: any, b: any) => a.properties.vertex_index - b.properties.vertex_index)
      pathList.push(obj[key])
    }
    this.path = pathList[0]
    this.initDrone(Cartesian3.fromDegrees(
      this.path[0].geometry.coordinates[0],
      this.path[0].geometry.coordinates[1],
      100
    ))
    // this.initE(Cartesian3.fromDegrees(
    //   this.path[0].geometry.coordinates[0],
    //   this.path[0].geometry.coordinates[1],
    //   100
    // ))
  }

  private async initDrone(position: Cartesian3) {
    if (this.drone) return;

    try {
      // 异步加载模型
      const model = await Model.fromGltfAsync({
        url: 'https://coderfmc.github.io/three.js-demo/drone.glb',
        modelMatrix: Transforms.eastNorthUpToFixedFrame(position),
        scale: 10
      });

      this.drone = model;
      this.viewer.scene.primitives.add(model);

      // 等待模型完全加载（通过轮询检查 model.ready）
      await this.waitForModelReady(model);
      // debugger
      // 添加并播放动画
      const animations = model.activeAnimations.addAll({
        multiplier: 1.0,
        loop: ModelAnimationLoop.REPEAT
      });
      // debugger

      animations.forEach((animation: ModelAnimation) => {
        // animation.play();
        // animation.start.addEventListener(() => {
        //   debugger
        //   console.log(`Animation started: ${animation.name}`);
        // });
      });

    } catch (e) {
      debugger
      console.error("Failed to load drone model:", e);
    }
  }

  // 辅助函数：等待模型加载完成
  private waitForModelReady(model: Model): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (model.ready) {
          resolve();
        } else {
          requestAnimationFrame(checkReady);
        }
      };
      checkReady();
    });
  }



}

export default DroneCruise
