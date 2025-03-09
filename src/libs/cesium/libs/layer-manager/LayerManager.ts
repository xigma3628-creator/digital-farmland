import { BillboardCollection, CustomDataSource, EntityCollection, Primitive, PrimitiveCollection, Viewer } from 'cesium'

export interface LayerInterface{
  show:boolean,
  zIndex:number,
  collection:any,
  instance?:any,
  ex?:any
}


class LayerManager {
  private layers: Map<string, LayerInterface>; // 图层注册表
  private viewer: Viewer;
  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.layers = new Map<string, LayerInterface>()
  }

  /***
   注册图层
   */
  registerLayer(id: string, layer: LayerInterface): void{
    if(this.layers.has(id)){
      throw new Error(`图层 ${id} 重复注册！`)
    }
    this.layers.set(id, layer);
    // if(id=='border-layer'){
    //   debugger
    // }
    if(layer.collection instanceof EntityCollection){
      this.viewer.entities.add(layer.collection);
    }else if(layer.collection instanceof PrimitiveCollection){
      this.viewer.scene.primitives.add(layer.collection);
    }else if(layer.collection instanceof  BillboardCollection){
      this.viewer.scene.primitives.add(layer.collection);
    }else if(layer.collection instanceof Primitive){
      this.viewer.scene.primitives.add(layer.collection);
    }else if(layer.collection instanceof CustomDataSource){
      // debugger
      this.viewer.dataSources.add(layer.collection);
    }
  };

  /***
   控制图层显隐藏
   */
  setLayerVisible(id: string, visible: boolean): void{
    if(this.layers.has(id)){
      const layer=this.layers.get(id);
      if(layer){
        layer.show = visible;
        layer.collection.show = visible;
      }
    }
  };

  /**
   * 设置图层index
   * */
  setLayerZIndex(id: string, zIndex: number): void{

  };
  /**
   * 获取图层
   * */
  getLayer(id: string): LayerInterface | undefined{
    if(!this.layers.get(id))return;
    return this.layers.get(id);
  };
}
export default LayerManager
