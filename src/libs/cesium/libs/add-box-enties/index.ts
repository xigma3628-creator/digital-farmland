
import { Cartesian3, Color, Viewer } from 'cesium'

export class AddBoxEntities {
  private viewer: Viewer
  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.init();
  }
  private init(){
  const box=this.viewer.entities.add({
      name:'测试实体1',
      position:Cartesian3.fromDegrees(104.065861,30.657401,50),
      box:{
        material:Color.RED.withAlpha(0.5),
        dimensions:new Cartesian3(50,50,50)
      }
    })
    this.viewer.zoomTo(box);
  }
}
