import { Cartesian2 } from 'cesium'

export interface ModelParams {
  pos:Cartesian2,
  show:boolean,
  data?:any
}
export interface FarmlandMonitoringData {
  // 土壤温度，单位可以根据实际情况而定，这里假设为摄氏度
  soilTemperature: number;
  // 土壤湿度，通常以百分比表示
  soilMoisture: number;
  // 土壤酸碱度，范围一般在 0 - 14 之间
  soilPH: number;
  // 空间环境温度，单位假设为摄氏度
  ambientTemperature: number;
  // 空间环境湿度，以百分比表示
  ambientHumidity: number;
  // 监测器电量，以百分比表示
  monitorBattery: number;
  // 光照强度，单位可以根据实际情况而定，例如勒克斯（lux）
  lightIntensity: number;
}
