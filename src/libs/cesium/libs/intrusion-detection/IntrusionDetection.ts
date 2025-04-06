import {
  BillboardCollection,
  Cartesian3,
  JulianDate,
  SampledPositionProperty,
  TimeInterval,
  TimeIntervalCollection,
  Viewer
} from 'cesium'
import * as Cesium from 'cesium'


/**
 * 入侵检测
 * */
class IntrusionDetection {
  private viewer: Viewer
  //农场边界geoJson
  private border:any[]
  private geoJson:any;
  // 人员入侵农场，路径geoJson，每个要素中带有timestamp
  private pathList:any[];
  private isStarted:boolean;
  private isInside: boolean; // 新增：标记人员是否在农场内
  private currentEntity: Cesium.Entity | null; // 新增：当前跟踪的实体
  public isInsideCallback:any
  public noInsideCallback:any


  constructor(viewer: Viewer) {
    this.viewer = viewer
    const border=this.viewer.jt?.layerManager.getLayer('border-layer')
    this.border = border?border.ex:[];
    this.pathList = [];
    this.isStarted=false
    this.isInside = false;
    this.currentEntity = null;
    this.getPersonPosition();
  }

  public start(){

  }
  private async getPersonPosition(){
    const response = await fetch('https://coderfmc.github.io/three.js-demo/入侵路径_ESPG_4326_WGS84.geojson')
    this.geoJson = await response.json();
    const obj:any={}
    this.geoJson.features.forEach((feature:any,index:number) => {
      const group=feature.properties.group;
      if(!obj[group]){
        obj[group]=[];
      }
      obj[group].push(feature);
    })
    for(const key of Object.keys(obj)){
      obj[key]=obj[key].sort((a:any,b:any)=>a.properties.vertex_index-b.properties.vertex_index)
      this.pathList.push(obj[key])
    }
  }

  public startPersonTrack() {
    if (!this.geoJson || this.isStarted) return;
    this.isStarted = true;

    const pos = new SampledPositionProperty();
    const path = this.pathList[0];

    // 检查路径数据的完整性
    path.forEach((feature: any, index: number) => {
      if (!feature.geometry || !feature.geometry.coordinates || !feature.properties || !feature.properties.timestamp) {
        console.error("Invalid feature:", feature);
        return;
      }
      const coordinates = feature.geometry.coordinates;
      const timestamp = feature.properties.timestamp;


      // 添加位置样本
      pos.addSample(
        JulianDate.fromDate(new Date(timestamp)),
        Cartesian3.fromDegrees(coordinates[0], coordinates[1])
      );
    });

    const startTime = JulianDate.fromDate(new Date(path[0].properties.timestamp));
    const endTime = JulianDate.fromDate(new Date(path[path.length-1].properties.timestamp));

    // 检查时间范围是否合法
    if (JulianDate.compare(startTime, endTime) >= 0) {
      console.error("Invalid time range: startTime must be earlier than endTime");
      return;
    }

    // 添加实体
    const entity = this.viewer.entities.add({
      availability: new TimeIntervalCollection([new TimeInterval({
        start: startTime,
        stop: endTime
      })]),
      position: pos,
      billboard: {
        image:(window as any).resourceBaseUrl+ "/static/imgs/人员分配、人员定位.png",
        scale: 0.25,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      path: {
        leadTime: 0,
        resolution: 1,
        material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED),
        width: 10
      }
    });
    this.currentEntity=entity;
    // 设置时钟
    this.viewer.clock.startTime = startTime.clone();
    this.viewer.clock.stopTime = endTime.clone();
    this.viewer.clock.currentTime = startTime.clone();
    this.viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    this.viewer.clock.shouldAnimate = true;
    this.viewer.clock.onStop.addEventListener(() => {
      this.isStarted = false;
      if(this.currentEntity){
        this.viewer.entities.remove(this.currentEntity);
        this.currentEntity=null;
      }
    });
    this.viewer.clock.multiplier = 30;
    this.trackPosition();
  }


  // 新增方法：判断点是否在多边形内
  private isPointInPolygon(point: Cesium.Cartographic, polygon: Cesium.Cartographic[]): boolean {
    // 使用射线法实现点与多边形的包含性检测
    let intersections = 0;
    const [lon, lat] = [point.longitude, point.latitude];

    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];

      // 忽略垂直射线的情况
      if (p1.longitude === p2.longitude) continue;

      // 检查线段是否与射线相交
      if (
        (p1.latitude > lat) !== (p2.latitude > lat) &&
        lon < ((p2.longitude - p1.longitude) * (lat - p1.latitude)) / (p2.latitude - p1.latitude) + p1.longitude
      ) {
        intersections++;
      }
    }

    return intersections % 2 === 1;
  }

  // 新增方法：监听位置变化
  private trackPosition() {
    // 监听时钟时间变化
    this.viewer.clock.onTick.addEventListener(() => {
      if (!this.currentEntity||!this.isStarted) return;

      // 获取当前时间和位置
      const time = this.viewer.clock.currentTime;
      const position = this.currentEntity.position?.getValue(time);

      if (!position) return;

      // 将位置转换为经纬度
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const point = new Cesium.Cartographic(
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      );

      // 将农场边界转换为 Cartographic 数组
      const polygon = this.border.map((coord: number[]) => {
        return new Cesium.Cartographic(coord[0], coord[1]);
      });

      // 判断是否在农场内
      const isInside = this.isPointInPolygon(point, polygon);

      // 状态变化时触发日志
      if (isInside && !this.isInside) {
        if(this.isInsideCallback&&typeof this.isInsideCallback=='function'){
          this.isInsideCallback();
        }
        console.log("有人员入侵");
      } else if (!isInside && this.isInside) {
        console.log("入侵人员离开农场");
        if(this.noInsideCallback&&typeof this.noInsideCallback=='function'){
          this.noInsideCallback();
        }
      }

      this.isInside = isInside;
    });
  }


}

export default IntrusionDetection

