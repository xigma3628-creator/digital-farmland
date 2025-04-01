import EquipmentMonitor from '@/domain/equment-monitor.domian'

/**
 * 农田监测数据
 */
class FarmlandMonitoringData {
  /**
   * 土壤温度，单位通常为摄氏度（℃），用于衡量土壤的冷热程度，对农作物的生长和发育有重要影响。
   */
  soilTemperature: number;
  /**
   * 土壤湿度，以百分比（%）表示，反映了土壤中所含水分的比例，合适的土壤湿度是农作物健康生长的关键因素之一。
   */
  soilMoisture: number;
  /**
   * 土壤酸碱度，数值范围一般在 0 - 14 之间，体现了土壤的酸性或碱性程度，不同农作物对土壤酸碱度有不同的适应范围。
   */
  soilPH: number;
  /**
   * 空间环境温度，单位为摄氏度（℃），指的是农田周围空气的温度，会影响农作物的光合作用、呼吸作用等生理过程。
   */
  ambientTemperature: number;
  /**
   * 空间环境湿度，以百分比（%）表示，代表了空气中水汽的含量，对农作物的蒸腾作用和病虫害的发生有一定影响。
   */
  ambientHumidity: number;
  /**
   * 监测器电量，以百分比（%）表示，反映了用于监测农田数据的设备的剩余电量，确保设备正常运行。
   */
  monitorBattery: number;
  /**
   * 光照强度，单位通常为勒克斯（lux），衡量了农田所接受的光照程度，是农作物进行光合作用的重要能量来源。
   */
  lightIntensity: number;

  /**
   * 监测设备名称
   * */
  equipmentName:string;
  equipment: EquipmentMonitor;


  constructor(
    options: Partial<FarmlandMonitoringData> = {}
  ) {
    this.soilTemperature = options.soilTemperature||0;
    this.soilMoisture = options.soilMoisture||0;
    this.soilPH = options.soilPH||0;
    this.ambientTemperature = options.ambientTemperature||0;
    this.ambientHumidity = options.ambientHumidity||0;
    this.monitorBattery = options.monitorBattery||0;
    this.lightIntensity = options.lightIntensity||0;
    this.equipmentName=options.equipmentName||'';
    this.equipment = options.equipment||new EquipmentMonitor();
  }
}

export default FarmlandMonitoringData;
