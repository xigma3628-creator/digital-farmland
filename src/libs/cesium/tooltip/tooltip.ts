import { Cartesian2, Cartesian3 } from 'cesium'
import { inject } from 'vue'
import { CESIUM_REF_KEY, CesiumRef } from '@/libs/cesium/cesium-vue'

class Tooltip {
  private container:any;
  private readonly tooltip:any;

  constructor(container:any) {
    this.container = container
    this.tooltip = document.createElement('div')
    // this.tooltip.className = tooltipClassName
    this.container.appendChild(this.tooltip)
  }

  show(position:Cartesian2,content:any) {
    this.tooltip.style.display = 'block';
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.left = `${position.x}px`
    this.tooltip.style.top = `${position.y + 20}px` // 20px offset to position above the cursor
    this.tooltip.innerHTML = content
  }

  hide() {
    this.tooltip.style.display = 'none'
  }
}

export default Tooltip
