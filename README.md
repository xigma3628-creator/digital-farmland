# 简介

本项目是数字农田项目，这个项目是我检验自己cesium学习成功制作的练习项目。在线预览地址：
[https://coderfmc.github.io/three.js-demo/digital-farmland/](https://vue3-cesium-typescript-start-up-template.vercel.app/)

_可能需要跨过[墙]才能访问_

## 用法说明

_注意：需要先安装[Node.js](https://nodejs.org)环境_

点击上面的 Fork 到把项目拷贝到你自己的仓库，或者直接`git clone`本仓库，然后:

```bash
pnpm install
```

### 开发环境编译和热重载

```bash
pnpm run vite

```

### 生产环境编译和压缩

```bash
pnpm run build
```

## 相关依赖

- [Vue3](https://v3.vuejs.org/)
- [cesium](https://cesium.com/)
- [typescript](https://www.typescriptlang.org/)
- 可选的
  - [Element plus](https://element-plus.org/) 使用了部分组件以方便开发。
  - [tailwindcss](https://tailwindcss.com/) 快速 UI 样式。
  - [ECharts](https://echarts.apache.org/)

## 功能列表

- 天气模拟
- 风险监控热力图
- 无人机循环
- 入侵检测
- 白膜瓦片加载
- echarts大屏
...

## 指南

### Cesium vue

Cesium 实例同时挂载在 vue 实例的全局属性上（vue3 支持多个 vue 实例，你可以自定义选择）和`provide/inject`，以方便 Composition 或者 Options API 语法都可以方便使用，然后就可以在 vue 实例中的任何地方拿到 cesium：

```typescript
import { CesiumRef, CESIUM_REF_KEY} from '@/libs/cesium/cesium-vue'
// global property
const { viewer, viewerContainer } = this.$cesiumRef // type CesiumRef

// provide/inject
// Options API
export default defineComponent({
  inject: [CESIUM_REF_KEY],
  mounted() {
    console.log(this.cesiumRef)
  },
})
// or Composition API
setup() {
  const cesiumRef = inject<CesiumRef>(CESIUM_REF_KEY)
    onMounted(() => {
      console.log(cesiumRef?.viewer)
    })
}
```

如果需要附件一些其他的属性，可以添加到`CesiumRef` _(src/@types/shims-cesium-ref.d.ts)_ 上来扩展。

### 非响应式

为了更好的性能, `cesium instance`cesium 实例是非响应式的！

和 Vue 中的 data 等不同，即使 Vue3 使用 `proxy` 代替 `Object.defineProperty` 获得了很大的性能提升，代理所有的 cesium 属性以实现响应式，还是会极大的丢失性能和降低 FPS。

如何取舍：

- 如果只需要使用 cesium 的基础功能，例如只做一些基础的可视化、简单交互、数据加载展示等等这些比较常规的操作，其实可以使用其他的一些用 vue 对 cesium 进行了封装的库，这样可以很大程度上提升项目的构建速度。唯一需要注意的问题是，所需的功能是否已经实现。

- 但如果你要深层的进入 cesium 内部，例如自定义 shader、高级空间分析、复杂的交互操作等等，把这些功能点和 vue 绑定就是一件不合算，也不合理的事情了。

- 另一种情况，当项目很庞大，需要用到 cesium 各个模块时，随着用 vue 封装 cesium 的组件越来越多以后，你会发现，其本质上又回到了代理整个 cesium 实例来实现响应式的模式，这个时候，性能又是不得不考虑的问题。

## 示例数据

项目中的边界数据，白膜瓦片的等，我都放在了我的github资源仓库中：https://github.com/CoderFMC/three.js-demo/tree/main

**以上数据都是本人通过公开渠道获取或者自己采集后，制作的示例数据。如果用于测试可以直接使用，如果用于商业用途请联系告知。谢谢。**

