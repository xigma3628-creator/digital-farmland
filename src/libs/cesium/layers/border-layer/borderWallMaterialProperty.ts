import { JulianDate, MaterialProperty, Property } from 'cesium'
import * as Cesium from 'cesium'

export  default class BorderWallMaterialProperty {
  private MaterialType:string;
  private _definitionChanged:Cesium.Event;
  private _color:any;
  private _colorSubscription:any;
  private duration:number;
  private trailImage:any;
  private _time:number;
  private color:Cesium.ConstantProperty;
  constructor(options) {
    this.MaterialType='wallType' + parseInt(String(Math.random() * 1000));
    this._definitionChanged=new Cesium.Event();
    this._color=undefined;
    this._colorSubscription=undefined;
    this.duration=options.duration||1000;
    this.trailImage=options.trailImage;
    this._time=(new Date()).getTime();
    this.color = options.color ||Cesium.Color.BLUE;

    this.register();
  }

  get definitionChanged(){
    return this._definitionChanged;
  }


  getType(time: JulianDate): string {
    return this.MaterialType;
  }
  getValue(time?: JulianDate, result?: any): any {
    if(!Cesium.defined(result)) {
      result={};
    }
    result.color=this.getValueOrClonedDefault(this._color,time,Cesium.Color.WHITE,result.color);

    return result;
  }
  // Cesium.Property.equals(this._color, other._color)
  equals(other:any): boolean {
    const left=this._color;
    const right=other._color;
    return this === other ||
      (other instanceof BorderWallMaterialProperty
        && (left === right || (Cesium.defined(left) && left.equals(right))))
  }
  private getValueOrClonedDefault (
    property:any,
    time:any,
    valueDefault:any,
    result:any,
  ) {
    let value:any;
    if (Cesium.defined(property)) {
      value = property.getValue(time, result);
    }
    if (!Cesium.defined(value)) {
      value = valueDefault.clone(value);
    }
    return value;
  };


  private _getDirectionWallShader(options) {
    if (options && options.get) {
      var materail = "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
      {\n\
          czm_material material = czm_getDefaultMaterial(materialInput);\n\
          vec2 st = materialInput.st;";
      if (options.freely == "vertical") { //（由下到上）
        materail += "vec4 colorImage = texture2D(image, vec2(fract(st.s), fract(float(" + options.count + ")*st.t" + options.direction + " time)));\n\ ";
      } else { //（逆时针）
        materail += "vec4 colorImage = texture2D(image, vec2(fract(float(" + options.count + ")*st.s " + options.direction + " time), fract(st.t)));\n\ ";
      }
      //泛光
      materail += `vec4 fragColor;
          fragColor.rgb = (colorImage.rgb+color.rgb) / 1.0;
          fragColor = czm_gammaCorrect(fragColor);
          material.diffuse = colorImage.rgb;
          material.alpha = colorImage.a;
          material.emission = fragColor.rgb;
          return material;
      }`;
      return materail
    }
  }

  private register(){
    (Cesium.Material as any)._materialCache.addMaterial(this.MaterialType, {
      fabric: {
        type: this.MaterialType,
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 0.1),
          image: Cesium.Material.DefaultImageId,
          time: -20
        },
        source: this._getDirectionWallShader({
          get: true,
          count: 3.0,
          freely: 'vertical',
          direction: '-'
        })
      },
      translucent: function (material:any) {
        return true;
      }
    });
  }

}
