# The Quiet Presence / The Horror of the Moorlands — 本地复刻与绘画改编

- **原作**：Shadertoy <https://www.shadertoy.com/view/fX2GRG>（The Horror of the Moorlands，作者 PrzemyslawZaworski）
- **原版复刻**：`index.html` — 与 Shadertoy 原作一致（荒原 + 生物 + 边缘排线风格化）。
  右上角参数面板可实时调节：线条密度、线条粗细、抖动幅度、抖动速度、
  线条卷曲、线条移动、人形大小、边缘强度、走路速度。
  抖动幅度/速度作用于**所有线条**：边缘轮廓线、排线纹理本体、明暗随机层、
  采样偏移层；抖动速度默认 1（画面轻微颤动），卷曲/移动默认 0（原作静态构图）。
- **原版复刻（参数可调）**：`original-pure.html` — 深色复刻页，原画面中的人形
  生物已替换为**丛生根须生物**（四足匍匐形态：躯干高于地面，四肢前后左右
  交错立于地表，尾根后延伸；参考真实根系与节肢步态）。右上角面板实时调节：
  线条密度、粗细、抖动幅度、抖动速度（0–20，所有线条都响应）、卷曲、移动、
  人形大小、移动速度、边缘强度、**帧数上限（10–120 FPS）**；
  **方向键 / WASD 让根须以节肢步态爬行**（奇偶分组交替迈步、躯干随步耸动、
  转向时通过迈步直接调转身体朝向），按住越久越抗拒、步频越快，R 键复位。
  静态纯原版存档在 `versions\snapshot-20260917-132045\`（着色器与原作逐字一致）。
- **3D 视角版**：`scene3d.html` — 与纯原版同一素描排线场景的 3D 交互版：
  打开时先显示操作提示（点「确认」进入画面）；**鼠标拖拽旋转视角、滚轮缩放**，
  注视点跟随根须生物（相机方位/俯仰/距离
  由 `uCamYaw/uCamPitch/uCamDist/uCamTarget` 传入 Buffer A）；WASD/方向键
  仍可驱动根须爬行，视角自动跟随。
- **绘画版**：`art.html` — 保留原作场景骨架与人形，画面改编为铅笔排线风格的
  "不安静物"（The Quiet Presence）：奶油色纸面上，极细锐的铅笔圈线以人形为
  唯一中心一圈圈包裹、向全画发散；圈线随角度自由起伏、断笔、两套圈距互相
  交错，不规整也不闭合；形内交叉排线画实、头肩渐渐消散，胸口一枚小红点。
  右上角参数面板可实时调节：线条密度、粗细、抖动、深浅、断笔、交错线、
  线条移动速度、纸面扰动、人形大小、人形排线、包裹层。
  所有线条随时间极缓慢地游移、断续、重描——一张永远画不完、静而不安的画。

## 运行方式

- **方式一（推荐）**：目录下启动任意静态服务器后访问，例如
  `python -m http.server 8097`，打开 <http://127.0.0.1:8097/>。
- **方式二**：直接双击 `index.html` / `original.html`（页面内嵌了着色器副本，
  `file://` 下也能运行）。

需要支持 WebGL2 的浏览器。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 入口页：自动跳转到 3D 视角版 `scene3d.html`（默认打开的版本） |
| `original-pure.html` | 纯原版（默认打开的版本）：根须生物 + 参数面板 + WASD 爬行 |
| `original.html` | 原版复刻（人形·参数版）：WebGL2 运行环境 + 内嵌原作着色器副本 + 控制条 |
| `scene3d.html` | 3D 视角版：素描风场景 + 鼠标拖拽旋转视角 / 滚轮缩放 |
| `bufferA-3d.frag` | 3D 视角版 Buffer A：bufferA-pure + 轨道相机 |
| `bufferA-original.frag` / `image-original.frag` | 原作源码（光线步进 / 边缘排线），original.html 优先加载 |
| `art.html` | 绘画版：铅笔圈线改编 + 右上角参数面板 |
| `bufferA.frag` / `image.frag` | 绘画版着色器源码（art.html 优先加载） |
| `passes.json` | 从原页面导出的 Pass/通道连接信息 |

## 渲染管线（两个版本相同）

Buffer A（离屏渲染，乒乓缓冲）→ Image（iChannel0 采样 Buffer A，输出屏幕）。

绘画版中 Buffer A 不再输出颜色而是输出遮罩通道：
`R=人形、G=地面、B=投影、A=人形高度`；Image Pass 据此生成全部线条。
已实现 Shadertoy 环境接口（`iResolution/iTime/iFrame/iMouse/...`）与
Shadertoy 鼠标语义。

## 快捷键 / 控件

`空格` 暂停/继续；`R` 重新开始；底部按钮：全屏、分辨率 50%–100%。

## 版本快照与回溯

项目使用快照机制（无需安装任何软件）：

- **建立快照**：双击 `snapshot.bat` → 当前所有页面/着色器/文档复制到
  `versions\snapshot-日期时间\`
- **回溯**：双击 `restore.bat` 会列出所有快照，然后运行
  `restore.bat snapshot-20260917-132045`（换成你要的快照名）即可整包恢复，
  浏览器里按 F5 刷新生效
- 建议每次大改之前先跑一次 `snapshot.bat`

## 修改着色器

原版：编辑 `bufferA-original.frag` / `image-original.frag` 后刷新 `index.html`；
绘画版：编辑 `bufferA.frag` / `image.frag` 后刷新 `art.html`（http 打开时生效）。
直接双击打开时请修改页面中对应的 `<script>` 内嵌副本（两者需保持同步）。
