import {
  Viewer,
  Matrix4,
  Cartesian3,
  Rectangle,
  Camera,
  EasingFunction, Transforms, HeadingPitchRoll, HeadingPitchRange
} from 'cesium'
import * as Cesium from 'cesium'

class FlyTo {
  private viewer: Viewer

  constructor(viewer: Viewer) {
    this.viewer = viewer
  }

  flyTo(options: {
    destination: Cartesian3 | Rectangle
    orientation?: any
    duration?: number
    complete?: Camera.FlightCompleteCallback
    cancel?: Camera.FlightCancelledCallback
    endTransform?: Matrix4
    maximumHeight?: number
    pitchAdjustHeight?: number
    flyOverLongitude?: number
    flyOverLongitudeWeight?: number
    convert?: boolean
    easingFunction?: EasingFunction.Callback,
    offset?:{
      heading:number
      pitch:number,
      range:number
    },
  }): void {
    if(!options.offset){
      this.viewer.camera.flyTo(options)
    }else if(options.destination instanceof Cartesian3){
    const {heading,pitch,range}=options.offset;
      // 将经纬度高度转换为笛卡尔坐标
      var targetPosition =options.destination.clone();

// 获取目标位置的参考帧
      var transform = Cesium.Transforms.eastNorthUpToFixedFrame(targetPosition);

// 计算偏移向量
      var offsetDirection = new Cesium.Cartesian3(
        range * Math.cos(pitch) * Math.sin(heading),
        range * Math.cos(pitch) * Math.cos(heading),
        range * Math.sin(pitch)
      );

// 将 Cartesian3 转换为 Cartesian4
      var offsetDirection4 = new Cesium.Cartesian4(offsetDirection.x, offsetDirection.y, offsetDirection.z, 1);

// 将偏移向量转换到目标位置的参考帧
      var offsetInWorld4 = Cesium.Matrix4.multiplyByVector(transform, offsetDirection4, new Cesium.Cartesian4());

// 将 Cartesian4 转换回 Cartesian3
      var offsetInWorld = new Cesium.Cartesian3(offsetInWorld4.x, offsetInWorld4.y, offsetInWorld4.z);

// // 计算偏移后的位置
//       var offsetPosition = Cesium.Cartesian3.add(targetPosition, offsetInWorld, new Cesium.Cartesian3());
      this.viewer.camera.flyTo({
        ...options,
        destination: offsetInWorld,
        complete:()=>{
          console.log('飞到了')
          this.viewer.camera.lookAt( targetPosition,new Cartesian3(0, -20, 20));
          this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        }
      })
    }
  }

  flyToEarth(): void {
    this.flyTo({
      destination: Cartesian3.fromDegrees(110, 16, 20000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
      },
      duration: 1
    })
  }

  flyToChina(): void {
    this.flyTo({
      destination: Cartesian3.fromDegrees(109, 33.2, 5000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0.0
      },
      duration: 1
    })
  }

  flyToHome(): void {
    this.flyTo({
      destination:new Cartesian3(-2353027.804312873, 5401212.113082644,2440218.556375086),
      orientation: {
        heading: 6.283185307179291,
        pitch: -0.7853981348242258,
        roll: 6.283185307179486
      },
      duration: 1,
      complete:()=>{
        console.log('回到首页')
      }
    })
  }
}

export default FlyTo
