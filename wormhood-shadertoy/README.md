# Wormhood — Shadertoy 本地复刻(增强版)

本地复刻 [Shadertoy "Wormhood"](https://www.shadertoy.com/view/MdcSRj)(作者 **finalman**,2016),并在原作基础上扩展了实时参数调节面板与多种氛围效果。纯单文件、零依赖,双击 `index.html` 即可在浏览器中运行(需要 WebGL2)。

> 原始 shader 版权归原作者 **finalman** 所有,本项目仅作学习交流用途。

## 功能

- Shadertoy 兼容运行时:`mainImage` / `iTime` / `iResolution` / `iMouse` 等全套 uniforms
- 可拖动的实时参数面板(30+ 滑块 / 颜色选择器)
- 穿透式虫子透明度 + 距离-透明度曲线(凑近渐隐、中距最清晰、远处溶入雾中)
- 壁面蹦床弹跳(流动噪声相位 + 不对称谐波,各区域此起彼伏)
- 手电筒模式:画面压黑,鼠标位置照明,噪声蠕动光边 + 光照颗粒闪烁
- 管腔蠕动挤压、镜头手持晃动、信号干扰等氛围参数
- 一键预设:**恢复默认**(不安氛围)/ **原版画风**(忠实原作观感)
- 快捷键:空格暂停 · R 重置时间 · F 全屏

## 使用

双击打开 `index.html` 即可,无需服务器、无需联网。

## 文件

- `index.html` — 自包含运行时 + shader 源码 + 参数面板
- `wormhood.frag` — 单独导出的 GLSL 源码(与 index.html 内嵌版本一致)
