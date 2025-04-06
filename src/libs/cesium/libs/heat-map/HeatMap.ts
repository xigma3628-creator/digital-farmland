import { Cartesian3, Viewer } from 'cesium'

// export interface HeatMapOptions{
//   dataPoints: points,
//   radius: 15,
//   baseElevation: 0,
//   primitiveType: 'TRIANGLES',
//   colorGradient: {
//     '.3': 'blue',
//     '.5': 'green',
//     '.7': 'yellow',
//     '.95': 'red'
//   }
// }


import {create3DHeatmap,setVisible} from '@/libs/cesium/libs/heat-map/heatmapjs'
export default class HeatMap {
  private viewer: Viewer
  private heatmapState:any=null;
  constructor(viewer: Viewer) {
    this.viewer = viewer;
    // this.init();
  }
  getData(){

  }

  private  async init() {
    const response = await fetch('https://coderfmc.github.io/three.js-demo/灾害预警_ESPG_4326_WGS84.geojson')
    const geoJson = await response.json();
    const points= geoJson.features.map((feature:any,index:number) => {
      return{
            lnglat: [
              feature.geometry.coordinates[0],
              feature.geometry.coordinates[1]
            ],
            value:feature.properties.risk
      }
    })
    //
    // const points = new Array(50).fill('').map(() => {
    //   return {
    //     lnglat: [
    //       116.46 + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1),
    //       39.92 + Math.random() * 0.1 * (Math.random() > 0.5 ? 1 : -1)
    //     ],
    //
    //     value: 1000 * Math.random()
    //   }
    // })
const opt:any={
  dataPoints: points,
  radius: 5,
  baseElevation: 0,
  primitiveType: 'TRIANGLES',
  colorGradient: {
    '.3': 'blue',
    '.5': 'green',
    '.7': 'yellow',
    '.95': 'red'
  }
}

   const {heatmapState,destroy}=(create3DHeatmap(this.viewer, opt) as any)
    this.heatmapState=heatmapState
    // this.viewer.camera.flyTo({
    //   destination: Cartesian3.fromDegrees(116.46, 39.92, 100000),
    //   orientation: {},
    //   duration: 3
    // }
    return true;
  }
  public async setHeatMapVisible(visible:boolean){
    return new Promise<boolean>((resolve, reject) => {
      if(!this.heatmapState) {
        resolve(false)
      }else{
        setVisible(this.heatmapState,visible);
        resolve(true)
      }
    }).then(res=>{
      if(res){
        return res;
      }else{
        if(visible){
          return this.init()
        }else{
          return false;
        }
      }
    })
  }
}
