import { JulianDate, MaterialProperty, Property } from 'cesium'

export  default class BorderWallMaterialProperty extends MaterialProperty{
  constructor() {
    super()
  }
  getType(time: JulianDate): string {
    return super.getType(time)
  }
  getValue(time?: JulianDate, result?: any): any {
    return super.getValue(time, result)
  }
  equals(other?: Property): boolean {
    return super.equals(other)
  }

}
