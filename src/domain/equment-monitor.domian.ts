import { Cartesian3 } from 'cesium'

/**
 * 农田监测设备
 */
class EquipmentMonitor {
  id: string;
  name: string
  pos: Cartesian3;
  state: string;



  constructor(
    options: Partial<EquipmentMonitor> = {}
  ) {
    this.name = options.name||'';
    this.pos = options.pos||new Cartesian3();
    this.id = options.id||'';
    this.state = options.state||'';
  }
}

export default EquipmentMonitor;
