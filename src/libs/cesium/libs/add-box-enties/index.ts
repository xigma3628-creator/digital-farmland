
import { Cartesian3, Color, Viewer } from 'cesium'

export class AddBoxEntities {
  private viewer: Viewer
  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.init();
  }
  private init(){
  //   农场经纬度
  const box=this.viewer.entities.add({
      name:'测试实体1',
      position:Cartesian3.fromDegrees(113.531905,22.737473,50),
      box:{
        material:Color.RED.withAlpha(0.5),
        dimensions:new Cartesian3(10,10,50)
      }
    })
    this.viewer.zoomTo(box);
  }
}
