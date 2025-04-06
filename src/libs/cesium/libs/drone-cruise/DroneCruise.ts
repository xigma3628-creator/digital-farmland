import {
  BoundingSphere,
  Cartesian3, Cartographic, Color, Entity, HeadingPitchRange,
  JulianDate, Matrix3, Matrix4,
  Model,
  ModelAnimation,
  ModelAnimationLoop, Quaternion,
  SampledPositionProperty,
  Transforms,
  Viewer
} from 'cesium'
import * as Cesium from 'cesium'
import CustomVelocityOrientationProperty from '@/libs/cesium/libs/drone-cruise/CustomVelocityOrientationProperty'
import { ElMessage } from 'element-plus'

enum DroneCruiseState{
  'RUNNING' = 'RUNNING',
  'STOPPING' = 'STOPPING',
  'PASSED' = 'PASSED',
}
/**
 * 无人机巡航
 * **/
class DroneCruise {
  private viewer: Viewer
  private path: any
  private drone: Model | null
  private pos: SampledPositionProperty;
  private flyHeight: number;
  private scale: number;
  private orientationProp!: CustomVelocityOrientationProperty;
  public state:string=DroneCruiseState.STOPPING;
  private speed: number = 100;
  private pathUrl:string=''
  private route!:Entity;
  // 成员变量定义
  private lastCameraPosition:Cartesian3 |null=null;

  private modelReady:boolean=false;
  private pathReady:boolean=false;
  private modelLoaing:boolean=false;
  private pathLoading:boolean=false;
  public handleEnd:any;
  public handleStart:any;

  constructor(viewer: Viewer,options:{
    speed?:number,
    flyHeight?:number,
    scale?:number,
    pathUrl?:string
  }) {
    this.viewer = viewer
    this.drone = null
    this.pos = new SampledPositionProperty();
    this.flyHeight =options.flyHeight||10;
    this.scale = options.scale||5;
    this.pathUrl = options.pathUrl||'https://coderfmc.github.io/three.js-demo/入侵路径_ESPG_4326_WGS84.geojson';
    this.handleEnd=null;
    this.handleStart=null;
    // this.initPath(this.pathUrl);
    // this.initDrone();
    // this.viewer.jt?.flyTo.flyToHome();
  }
  private async initPath(
    url:string
  ) {
    if (this.path) return
    const response = await fetch(url)
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
    this.path = pathList[0];
    this.initPosSampledPositionProperty();
    this.pathReady=true;
  }

  public async initDrone() {
    if (this.drone) return;

    try {
      // 异步加载模型
      const model = await Model.fromGltfAsync({
        url: 'https://coderfmc.github.io/three.js-demo/drone.glb',
        modelMatrix: Transforms.eastNorthUpToFixedFrame(new Cartesian3()),
        scale: this.scale
      });
      model.show=false;

      this.drone = model;

      this.viewer.scene.primitives.add(model);
      // 等待模型完全加载（通过轮询检查 model.ready）
      await this.waitForModelReady(model);
      //
      // 添加并播放动画
      const animations = model.activeAnimations.addAll({
        multiplier: 1.0,
        loop: ModelAnimationLoop.REPEAT
      });
      this.modelReady=true;
      return true
    } catch (e) {
      console.error("Failed to load drone model:", e);
      return false;
    }
  }

  public async init(){
    this.modelLoaing=true;
    this.pathLoading=true;
    await this.initPath(this.pathUrl);
    await this.initDrone();
    this.modelLoaing=false;
    this.pathLoading=false;
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


  private initRoute(startTime:JulianDate,endTime:JulianDate){
    this.route=this.viewer.entities.add({
      position:this.pos,
      show:true,
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start: startTime, stop: endTime})
      ]),
      path:{
        material:Color.YELLOW,
        leadTime:3600,
        trailTime:3600,
        resolution:1,
        width:5
      }
    })
  }


  private initPosSampledPositionProperty() {
    // 检查路径数据的完整性
    this.path.forEach((feature: any, index: number) => {
      if (!feature.geometry || !feature.geometry.coordinates || !feature.properties || !feature.properties.timestamp) {
        console.error("Invalid feature:", feature);
        return;
      }
      const coordinates = feature.geometry.coordinates;
      const timestamp = feature.properties.timestamp;

      // 添加位置样本
      this.pos.addSample(
        JulianDate.fromDate(new Date(timestamp)),
        Cartesian3.fromDegrees(coordinates[0], coordinates[1], this.flyHeight)
      );
    });
    this.orientationProp = new CustomVelocityOrientationProperty(this.pos, Cesium.Ellipsoid.WGS84, Math.PI);
  }


  private cameraTrack(currentPosition: Cesium.Cartesian3) {
    if (!this.drone) return;
    // const a=Cartographic.fromCartesian(currentPosition);
    // const  b==C
    if(!this.lastCameraPosition){
      this.lastCameraPosition=currentPosition.clone();
    }else{
     const lastCartographic=Cartographic.fromCartesian(this.lastCameraPosition);
     const curCartographic=Cartographic.fromCartesian(currentPosition);
     const heading=this.bearing(
       lastCartographic.latitude,
       lastCartographic.longitude,
       curCartographic.latitude,
       curCartographic.longitude
     )
      this.lastCameraPosition=currentPosition.clone();
      // this.viewer.camera.lookAt(
      //   currentPosition,
      //   new HeadingPitchRange(heading, -20, 1000));
    }


    // 更新相机视角
    this.viewer.camera.lookAt(currentPosition, new Cartesian3(0, -400, 400));

  }

  /**
   * @name bearing 计算两点的角度 heading
   * @param startLat 初始点的latitude
   * @param startLng 初始点的longitude
   * @param destLat 第二个点的latitude
   * @param destLng 第二个点的latitude
   * @return {number} heading值
   */
 private bearing(startLat:number, startLng:number, destLat:number, destLng:number) {
    startLat = Cesium.Math.toRadians(startLat);
    startLng = Cesium.Math.toRadians(startLng);
    destLat = Cesium.Math.toRadians(destLat);
    destLng = Cesium.Math.toRadians(destLng);
    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    const brng = Math.atan2(y, x);
    const brngDgr = Cesium.Math.toDegrees(brng);
    return (brngDgr + 360) % 360;
  }

  public stop(){
    // console.log('重置前',this.viewer.camera.position)
    // console.log('重置前',this.viewer.camera.direction)
    this.state=DroneCruiseState.STOPPING;
    /**
     * 解除相机锁定
     * **/
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    this.viewer.jt?.flyTo.flyToHome();
    const temp=this.viewer.clock.currentTime.clone();
    this.viewer.clock.stopTime=temp;
    this.viewer.entities.remove(this.route);
    // console.log('重置后',this.viewer.camera.position)
    // console.log('重置后',this.viewer.camera.direction)
    // 重置参考系

    this.handleEnd&&this.handleEnd();
    if(this.drone){
      this.drone.show=false;
    }
    // this.viewer.jt?.layerManager.setLayerVisible('crop-layer',true)
  }
  public pause(){
   if(this.state==DroneCruiseState.RUNNING){
     this.state=DroneCruiseState.PASSED
     this.viewer.clock.shouldAnimate=false;
   }else if(this.state==DroneCruiseState.PASSED){
     this.state=DroneCruiseState.RUNNING
     this.viewer.clock.shouldAnimate=true;
   }
  }
  public async start(handleStart:()=>void,handleStop:()=>void) {
   // if(this.isLoading){
   //   ElMessage.error('资源正在加载中...')
   //   return;
   // }
    if(!this.initFinished){
      await this.init();
    }

    if(this.state!==DroneCruiseState.STOPPING)return;
    // 检查路径数据的完整性
    const drone = this.drone;
    this.state=DroneCruiseState.RUNNING;

    !this.handleStart&&(this.handleStart=handleStart);
    !this.handleEnd&&(this.handleEnd=handleStop);

    const startTime = JulianDate.fromDate(
      new Date(
        this.path[0].properties.timestamp
      )
    );
    const endTime = JulianDate.fromDate(
      new Date(
        this.path[this.path.length - 1].properties.timestamp)
    );
    if(!this.drone) return;
    //显示无人机
    this.drone.show=true;
    // 巡航路径
    this.initRoute(startTime,endTime);
    // 隐藏作物识别图层
    this.viewer.jt?.layerManager.setLayerVisible('crop-layer',false)

    this.viewer.clock.startTime = startTime.clone();
    this.viewer.clock.stopTime = endTime.clone();
    this.viewer.clock.currentTime = startTime.clone();
    this.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    this.viewer.clock.shouldAnimate = true;
    this.viewer.clock.multiplier = this.speed;

    this.handleStart&&this.handleStart();
    this.viewer.clock.onTick.addEventListener(() => {
      if(this.state!==DroneCruiseState.RUNNING) return;
      const currentTime = this.viewer.clock.currentTime;
      // 获取当前时间和位置
      const currentPosition = this.pos.getValue(currentTime);
      const currentOrientation = this.orientationProp.getValue(currentTime);

      if (Cesium.defined(currentPosition) && Cesium.defined(currentOrientation)&&drone) {
        drone.modelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
          currentPosition,
          currentOrientation,
          new Cesium.Cartesian3(this.scale, this.scale, this.scale) // 初始加载时的 scale 值
        );
        this.cameraTrack(currentPosition);
      }
    })
    this.viewer.clock.onStop.addEventListener(()=>{
      if(this.state!==DroneCruiseState.STOPPING){
        this.stop();
      }
    })
  }


  get initFinished(){
   return this.modelReady&&this.pathReady
  }
  get isLoading(){
   return this.modelLoaing||this.pathLoading
  }


}
export default DroneCruise
