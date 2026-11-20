// 十一期：工人端 APK 装配脚本。
// 1) 以 --base=./ 二次构建（Capacitor WebView 按相对路径加载，避免 /three.js-demo 前缀 404）
// 2) 剥离 cesium 注入标签（工人端用不到地图 SDK，省几十 MB 体积）
// 3) 将 worker.html（改名 index.html）+ assets/ 装配到 worker-app/www/
// API 地址通过构建期 VITE_API_BASE 烘进产物，例如：VITE_API_BASE=http://192.168.1.10:3100 node scripts/pack-worker.mjs
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const apiBase = process.env.VITE_API_BASE || 'http://localhost:3100'
const distDir = path.join(root, 'dist-worker')
const wwwDir = path.join(root, 'worker-app', 'www')

console.log(`[pack-worker] 构建工人端（base=./，VITE_API_BASE=${apiBase}）`)
execSync('npx vite build --base=./ --outDir=dist-worker --emptyOutDir', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, VITE_API_BASE: apiBase }
})

console.log('[pack-worker] 装配 worker-app/www')
fs.mkdirSync(wwwDir, { recursive: true })
// www 目录本身可能被工作区文件监视持有句柄（Windows 下 rm/rmdir 报 EBUSY），
// 因此只清空目录内容、不删除目录本身
for (const entry of fs.readdirSync(wwwDir)) {
  fs.rmSync(path.join(wwwDir, entry), { recursive: true, force: true })
}

let html = fs.readFileSync(path.join(distDir, 'worker.html'), 'utf8')
html = html
  .replace(/<link[^>]*cesium[^>]*>/gi, '')
  .replace(/<script[^>]*cesium[^>]*>\s*<\/script>/gi, '')
fs.writeFileSync(path.join(wwwDir, 'index.html'), html)

fs.cpSync(path.join(distDir, 'assets'), path.join(wwwDir, 'assets'), { recursive: true })
console.log(`[pack-worker] 完成 → ${wwwDir}`)
