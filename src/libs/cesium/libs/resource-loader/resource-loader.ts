// utils/resource-loader.js
export class ResourceLoader {
  private resources:any[];
  private loadedCount:number;
  private loadedCallbacks:any[];
  constructor() {
    this.resources = [];
    this.loadedCount = 0;
    this.loadedCallbacks= [];

  }
  add(loadedCallback:any) {
    this.loadedCallbacks.push(loadedCallback);
  }
  async loadResource() {

    // 1. 创建 async 函数数组
    const promises = this.loadedCallbacks.map(async cb => {
      const response = await cb();
      return true;
    });
     return Promise.all(promises)
    // for
  }
}
