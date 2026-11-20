/**
 * 演示园区数据（智慧园林学习演示用）
 *
 * 全部为合成的演示坐标与占位名称，不对应任何真实园区，也不来自任何地图测绘。
 * 仅用于功能演示（分区着色、设备布点、楼栋轮廓等），不得用于真实测绘与工程实施。
 *
 * 坐标口径与工程内高德影像底图一致（GCJ-02）。
 */

export const CAMPUS_LABEL = '智慧园林示范区'

export const CAMPUS_CENTER = { lon: 114.0, lat: 30.0 }

/** 合成园区闭合边界（顺时针，演示数据） */
export const CAMPUS_BOUNDARY: number[][] = [
  [113.9942, 29.9962],
  [114.0, 29.9956],
  [114.0058, 29.996],
  [114.0062, 30.0],
  [114.0058, 30.004],
  [114.0, 30.0046],
  [113.9944, 30.0042],
  [113.994, 30.0],
  [113.9942, 29.9962]
]

export interface CampusZone {
  name: string
  color: string
  ring: number[][]
}

/** 功能分区：教学区/图书区/景观湖/运动区/生活区/创新区/农田区（合成布局） */
export const CAMPUS_ZONES: CampusZone[] = [
  {
    name: '教学科研区',
    color: '#2e8b57',
    ring: [[114.0003, 29.9962], [114.0053, 29.996], [114.0055, 29.9992], [114.0005, 29.9994]]
  },
  {
    name: '图书信息区',
    color: '#4682b4',
    ring: [[114.003, 29.9998], [114.0056, 29.9996], [114.0058, 30.0018], [114.0032, 30.002]]
  },
  {
    name: '景观湖区',
    color: '#1e90ff',
    ring: [[113.9998, 30.0], [114.0024, 29.9998], [114.0028, 30.0012], [114.0014, 30.0018], [113.9998, 30.001]]
  },
  {
    name: '运动场馆区',
    color: '#d2691e',
    ring: [[113.9946, 29.9964], [113.9998, 29.9962], [114.0, 29.9992], [113.9948, 29.9994]]
  },
  {
    name: '学生生活区',
    color: '#9acd32',
    ring: [[113.9946, 29.9998], [113.9996, 29.9996], [113.9998, 30.0038], [113.9948, 30.004]]
  },
  {
    name: '创新创业区',
    color: '#8fbc8f',
    ring: [[114.0004, 30.0024], [114.0056, 30.0022], [114.0058, 30.0038], [114.0006, 30.004]]
  },
  {
    name: '校外农田区',
    color: '#6b8e23',
    ring: [[113.998, 30.0048], [114.006, 30.0046], [114.0064, 30.0078], [113.9984, 30.008]]
  }
]

export interface CampusDeviceSeed {
  id: string
  name: string
  type: 'soil' | 'weather' | 'irrigation' | 'camera' | 'water' | 'insect'
  lon: number
  lat: number
  status: 'online' | 'offline'
}

/** 监测设备布点（合成演示坐标） */
export const CAMPUS_DEVICES: CampusDeviceSeed[] = [
  { id: 'soil-01', name: '中心绿地土壤传感器', type: 'soil', lon: 114.0002, lat: 30.0002, status: 'online' },
  { id: 'soil-02', name: '教学区土壤传感器', type: 'soil', lon: 114.0028, lat: 29.9978, status: 'online' },
  { id: 'soil-03', name: '生活区绿化土壤传感器', type: 'soil', lon: 113.9972, lat: 30.0018, status: 'online' },
  { id: 'soil-04', name: '综合楼前绿地土壤传感器', type: 'soil', lon: 114.0042, lat: 30.0008, status: 'online' },
  { id: 'weather-01', name: '园区气象站', type: 'weather', lon: 114.002, lat: 29.9972, status: 'online' },
  { id: 'water-01', name: '景观湖水质监测浮标', type: 'water', lon: 114.0014, lat: 30.0008, status: 'online' },
  { id: 'irr-01', name: '中心绿地灌溉阀', type: 'irrigation', lon: 114.0, lat: 29.9996, status: 'online' },
  { id: 'irr-02', name: '综合楼前绿地灌溉阀', type: 'irrigation', lon: 114.004, lat: 30.0014, status: 'online' },
  { id: 'irr-03', name: '运动场绿化灌溉阀', type: 'irrigation', lon: 113.9972, lat: 29.9978, status: 'online' },
  { id: 'cam-01', name: '北门监控', type: 'camera', lon: 114.0, lat: 30.0042, status: 'online' },
  { id: 'cam-02', name: '中心广场监控', type: 'camera', lon: 114.0024, lat: 29.9988, status: 'online' },
  { id: 'cam-03', name: '学生公寓监控', type: 'camera', lon: 113.996, lat: 30.0012, status: 'offline' },
  { id: 'cam-04', name: '综合楼周边监控', type: 'camera', lon: 114.005, lat: 30.001, status: 'online' },
  { id: 'soil-05', name: '农田土壤墒情传感器A', type: 'soil', lon: 114.0004, lat: 30.0058, status: 'online' },
  { id: 'soil-06', name: '农田土壤墒情传感器B', type: 'soil', lon: 114.0048, lat: 30.0066, status: 'online' },
  { id: 'insect-01', name: '农田虫情测报灯', type: 'insect', lon: 114.0026, lat: 30.0062, status: 'online' },
  { id: 'irr-04', name: '农田灌溉阀', type: 'irrigation', lon: 113.999, lat: 30.0056, status: 'online' },
  { id: 'cam-05', name: '农田监控', type: 'camera', lon: 114.0018, lat: 30.005, status: 'online' }
]

export interface CampusBuilding {
  name: string
  /** 楼体高度（米） */
  height: number
  ring: number[][]
}

/** 主要楼栋（合成演示轮廓） */
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  { name: '教学楼A', height: 24, ring: [[114.0012, 29.9966], [114.0022, 29.9966], [114.0022, 29.9972], [114.0012, 29.9972]] },
  { name: '教学楼B', height: 24, ring: [[114.0028, 29.9966], [114.0038, 29.9966], [114.0038, 29.9972], [114.0028, 29.9972]] },
  { name: '教学楼C', height: 20, ring: [[114.0042, 29.9966], [114.005, 29.9966], [114.005, 29.9972], [114.0042, 29.9972]] },
  { name: '学术交流中心', height: 18, ring: [[113.9952, 29.9998], [113.9962, 29.9998], [113.9962, 30.0004], [113.9952, 30.0004]] },
  { name: '教学楼D', height: 20, ring: [[113.9952, 30.0028], [113.9962, 30.0028], [113.9962, 30.0034], [113.9952, 30.0034]] },
  { name: '综合楼', height: 32, ring: [[114.0042, 29.9998], [114.0054, 29.9998], [114.0054, 30.0008], [114.0042, 30.0008]] },
  { name: '教学楼E', height: 22, ring: [[114.0006, 30.0028], [114.0016, 30.0028], [114.0016, 30.0034], [114.0006, 30.0034]] },
  { name: '文化展览馆', height: 16, ring: [[113.997, 30.0028], [113.998, 30.0028], [113.998, 30.0034], [113.997, 30.0034]] },
  { name: '学生公寓（东区）', height: 28, ring: [[114.0044, 30.0028], [114.0054, 30.0028], [114.0054, 30.0034], [114.0044, 30.0034]] },
  { name: '实训楼A', height: 20, ring: [[113.9962, 29.997], [113.997, 29.997], [113.997, 29.9982], [113.9962, 29.9982]] },
  { name: '实训楼B', height: 18, ring: [[113.9976, 29.997], [113.9984, 29.997], [113.9984, 29.9982], [113.9976, 29.9982]] },
  { name: '体育馆', height: 14, ring: [[113.9988, 29.997], [113.9996, 29.997], [113.9996, 29.9982], [113.9988, 29.9982]] },
  { name: '教学楼F', height: 18, ring: [[114.0028, 30.0002], [114.0036, 30.0002], [114.0036, 30.001], [114.0028, 30.001]] },
  { name: '学生公寓（西区）', height: 28, ring: [[113.9948, 29.9998], [113.9956, 29.9998], [113.9956, 30.001], [113.9948, 30.001]] }
]