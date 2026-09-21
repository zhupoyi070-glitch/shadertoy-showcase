# -*- coding: utf-8 -*-
# 重写关卡模式代码块:提示栏两行制(可见=悬念形容,提示按钮=具体标准+实时数值)、
# 实装 L3~L6、L2 通关改为完全离场、关卡按钮加大靠中
s = open("index.template.html", encoding="utf-8").read()

A = "/* ================= 关卡模式 ================= */"
B = "/* ================= 控制 ================= */"
a = s.index(A)
b = s.index(B)

NEW = r'''/* ================= 关卡模式 ================= */
const FEET = [20,19,17,21,25,14,12,26];   // 8 只脚的纹理坐标(y*10+x)
const game = { on:false, idx:0, phase:"idle", t:0, clicks:0, anx:0,
               crawl:false, crawlPos:0, crawlFrom:null, crawlDirV:null,
               base:null, clicked:false, avgDisp:0, spider:null, spiderScr:null,
               lastPos:null, l3t:0, l4t:0, l4armed:false, sw:0, gOK:false };

const LEVELS = [
  { name:"第一次触碰", locked:false,
    flavor:"这张网,好像在等你触碰…",
    hint:"点击蛛网任意处,再按住拖动。节点平均位移 ≥ 0.030 即通关。",
    brief:"蛛网是「质点-弹簧」系统:70 个质点由胡克定律弹簧 F=-k·Δx 相连。拖动鼠标 = 对附近质点施加外力,位移沿弹簧链像涟漪一样传遍整张网。" },
  { name:"不安的蜘蛛", locked:false,
    flavor:"蜘蛛好像有点不安…",
    hint:"连续点击蜘蛛 15 次(点中蜘蛛本体),把它吓跑!焦虑越高,它抖得越猛。Clicks 0/15。",
    brief:"每次点击都会抬高蜘蛛的焦虑值:腿部抖动的振幅 A 与频率 ω 都正比于焦虑——点得越快,抖得越猛。15 次后它受惊逃离:鼠标力把质心持续拉向屏幕外,位移沿弹簧节点依次传递,看起来就是沿蛛网爬行;且弹簧越拉越长,回弹力 k·Δx 越大,爬行速度先慢后快。" },
  { name:"太空失重", locked:false,
    flavor:"这张网,是不是太沉重了?",
    hint:"把「重力强度」调到 0.5 以下,并保持 5 秒。原理:重力是每步加进速度的恒定加速度 G·dt²/2,归零后只剩弹簧回弹力。",
    brief:"重力是每步加进速度里的恒定加速度 G·dt²/2。归零后只剩弹簧回弹力,蛛网回到无重力时的形状,并因阻尼极小而长时间轻轻荡漾——蜘蛛会漂到网的上方。" },
  { name:"软网实验室", locked:false,
    flavor:"布料的手感,取决于弹簧的软硬…",
    hint:"把「弹簧刚度 K」调到 ≤ 0.015、「摩擦阻尼」调到 ≤ 0.01,保持 1 秒后按住拖动蛛网(位移 ≥ 0.030)。k 小 = 回复力弱 = 软网。",
    brief:"胡克定律里的 k 决定回复力强弱:k 小,弹簧「懒」,位移传得慢、回弹慢;摩擦(速度×(1-f))决定能量耗散:f 小,几乎无损耗,网会以固有频率长时间振荡。" },
  { name:"呼吸的网", locked:false,
    flavor:"蛛网好像在轻轻起伏…",
    hint:"10 秒内让「蛛网间距 R1」往复 ≥ 6 次(单次幅度 ≥ 0.02)。R1 是弹簧的自然长度,改它 = 瞬间改变所有弹簧的平衡态。",
    brief:"R1 是弹簧的「自然长度」。胡克力正比于(实际长度-自然长度):改 R1 = 瞬间改变全部弹簧的平衡态,整张网会收缩/扩张去追赶新平衡——往复调节,网就像在呼吸。" },
  { name:"毕业:失重蹦迪", locked:false,
    flavor:"最后的考验:失重中的共振…",
    hint:"让重力 ≤ 0.5,并在 10 秒内让「拉网力度」往复 ≥ 6 次(幅度 ≥ 0.25)。周期性外力 + 失重 = 共振,蜘蛛振幅会越荡越大。",
    brief:"失重消除了恒定下拉力,拉网力度成为唯一周期性外力——相当于对弹簧系统做共振驱动,蜘蛛振幅越荡越大。这是「共振」的直观演示。" },
];

const tb = $("taskbar"), tbTitle = $("tbTitle"), tbGoal = $("tbGoal"), tbProg = $("tbProg");
let liveEl = null;
function tbArm(i){
  const L = LEVELS[i];
  tbTitle.textContent = "🕷️ 关卡 " + (i+1) + "/6 · " + L.name;
  tbProg.textContent = L.flavor;                       // 可见行:只给悬念形容
  tbGoal.innerHTML = L.hint + '<br><span id="tbLive"></span>';   // 提示行:具体标准+实时数值
  liveEl = $("tbLive");
  tbGoal.style.display = "none";
  $("tbHint").textContent = "💡 查看通关提示";
  $("tbHint").style.display = "inline-block";
}
function tbHintLive(txt){ if (liveEl) liveEl.textContent = txt; }
$("tbHint").addEventListener("click", () => {
  const show = tbGoal.style.display !== "block";
  tbGoal.style.display = show ? "block" : "none";
  $("tbHint").textContent = show ? "🙈 收起提示" : "💡 查看通关提示";
});

function readNodes(){
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texPair[readIdx], 0);
  const h = new Float32Array(10 * 7 * 4);
  gl.readPixels(0, 0, 10, 7, gl.RGBA, gl.FLOAT, h);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return h;
}
function applyDefaults(){
  setSl("sK", "vK", 0.05); setSl("sFriction", "vFriction", 0.03);
  setSl("sGravity", "vGravity", 3); setSl("sR1", "vR1", 0.02);
  setSl("sMouseK", "vMouseK", 0.4);
}
function setSl(id, outId, v){
  const el = $(id); el.value = v;
  $(outId).textContent = typeof v === "number" ? v.toFixed(Math.abs(v) < 1 ? 3 : 1) : v;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

const fx = $("fx"), fxc = fx.getContext("2d");
let fxActive = false, fxT = 0, fxP = [], fxW2 = false;
function fxWave(n){
  const cols = ["#ffe066","#7ae0ff","#ff8ad8","#b3ff8a"];
  for (let b = 0; b < n; b++){
    const bx = 14 + Math.random()*68, by = 8 + Math.random()*26;
    for (let i = 0; i < 38; i++){
      const a = Math.random()*6.283, s = 4 + Math.random()*16;
      fxP.push({ x:bx, y:by, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 5,
        c: Math.random() < 0.55 ? "#ffffff" : cols[(Math.random()*cols.length)|0],
        life: .9 + Math.random()*.5 });
    }
  }
}
function celebrate(){
  fx.style.display = "block"; fxActive = true; fxT = 0; fxW2 = false; fxP = [];
  fxWave(4);
}
function fxUpdate(dt){
  fxT += dt;
  if (fxT > 1.05 && !fxW2){ fxW2 = true; fxWave(5); }   // 第二波,更热闹
  fxc.clearRect(0, 0, 96, 54);
  for (const p of fxP){
    p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 14*dt; p.life -= dt*.6;
    if (p.life > 0){
      fxc.globalAlpha = Math.min(1, p.life);
      fxc.fillStyle = p.c;
      fxc.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
  }
  fxc.globalAlpha = 1;
  if (fxT > 2.8){ fxActive = false; fx.style.display = "none"; }
}

const hist = { R1: [], MouseK: [] };
function pushHist(k, v){
  hist[k].push({ t: game.t, v });
  while (hist[k].length && game.t - hist[k][0].t > 12) hist[k].shift();
}
function swingCount(k, amp, win){
  const arr = hist[k].filter(p => game.t - p.t <= win);
  if (arr.length < 2) return 0;
  let count = 0, dir = 0, ext = arr[0].v;
  for (let i = 1; i < arr.length; i++){
    const v = arr[i].v;
    if (dir === 0){
      if (v > ext + amp){ dir = 1; ext = v; }
      else if (v < ext - amp){ dir = -1; ext = v; }
    } else if (dir > 0){
      if (v > ext) ext = v;
      else if (ext - v >= amp){ count++; dir = -1; ext = v; }
    } else {
      if (v < ext) ext = v;
      else if (v - ext >= amp){ count++; dir = 1; ext = v; }
    }
  }
  return count;
}

function armLevel(i){
  game.idx = i; game.phase = "play"; game.t = 0;
  game.base = null; game.clicked = false; game.avgDisp = 0;
  game.clicks = 0; game.crawl = false; game.crawlPos = 0;
  game.crawlFrom = null; game.crawlDirV = null; game.anx = 0;
  game.l3t = 0; game.l4t = 0; game.l4armed = false; game.sw = 0; game.gOK = false;
  hist.R1.length = 0; hist.MouseK.length = 0;
  applyDefaults(); reset();
  tbArm(i);
}
function completeLevel(){
  game.phase = "done";
  const L = LEVELS[game.idx];
  tbShow("🎉 通关!· " + L.name, "烟花庆祝中…");
  celebrate();
  $("dlgTitle").textContent = "🎓 教学时间 · " + L.name;
  $("dlgBody").textContent = L.brief;
  $("btnDone").textContent = (game.idx < LEVELS.length - 1) ? "完成,进入下一关 →" : "完成,自由把玩蛛网 →";
  $("dlg").style.display = "flex";
}
$("btnDone").addEventListener("click", () => {
  $("dlg").style.display = "none";
  if (game.phase !== "done") return;
  if (game.idx < LEVELS.length - 1){ armLevel(game.idx + 1); }
  else {
    game.phase = "alldone";
    tbShow("🎓 全部通关!", "你已掌握蜘蛛网的全部物理秘密,自由把玩蛛网吧");
  }
});

function gameUpdate(dt){
  const H = readNodes();
  let sx = 0, sy = 0;
  for (const fi of FEET){ sx += H[fi*4]; sy += H[fi*4+1]; }
  sx /= 8; sy /= 8;
  game.spider = [sx, sy];
  game.spiderScr = [sx*bufH, bufH - sy*bufH];
  let disp = 0;
  for (let i = 0; i < 70; i++){
    if (game.base) disp += Math.hypot(H[i*4] - game.base[i*2], H[i*4+1] - game.base[i*2+1]);
  }
  game.avgDisp = disp / 70;
  const lp = new Float32Array(140);
  for (let i = 0; i < 70; i++){ lp[i*2] = H[i*4]; lp[i*2+1] = H[i*4+1]; }
  game.lastPos = lp;

  const L = LEVELS[game.idx];
  if (game.idx === 0){                                  // L1 第一次触碰
    if (game.clicked && !game.base) game.base = lp;     // 点击瞬间捕获基线
    tbShow("🕷️ 关卡 1/6 · " + L.name, L.flavor);
    tbHintLive(game.base ? ("位移 " + game.avgDisp.toFixed(3) + " / 0.030") : "点击蛛网任意处");
    if (game.clicked && game.base && game.avgDisp > 0.03) completeLevel();
  }
  else if (game.idx === 1){                             // L2 不安的蜘蛛
    game.anx *= Math.exp(-dt/1.5);
    if (game.clicks < 15){
      tbShow("🕷️ 关卡 2/6 · " + L.name, L.flavor);
      tbHintLive("已点击 " + game.clicks + " / 15 次 · 焦虑 " + Math.round(game.anx*100) + "%");
    } else {
      if (!game.crawl){
        game.crawl = true; game.crawlT = 0; game.crawlPos = 0;
        game.crawlFrom = [game.spider[0], game.spider[1]];
        const corners = [[-0.3,-0.3],[2.08,-0.3],[-0.3,1.3],[2.08,1.3]];
        let best = 0, bd = 1e9;
        corners.forEach((c,i)=>{ const d=Math.hypot(c[0]-game.spider[0], c[1]-game.spider[1]);
                                 if(d<bd){bd=d;best=i;} });
        const dx = corners[best][0]-game.spider[0], dy = corners[best][1]-game.spider[1];
        const dl = Math.hypot(dx,dy);
        game.crawlDirV = [dx/dl, dy/dl];
        mouse[2] = 0; mouse[3] = 0;                    // 松开:物理蛛网保持静止
        game.anx = Math.max(game.anx, 0.8);            // 逃离途中保持不安
      }
      game.crawlT += dt;
      game.crawlPos = Math.min(1, game.crawlT/4.5);
      tbShow("🕷️ 关卡 2/6 · " + L.name, "蜘蛛正沿蛛丝向屏幕外爬行,蛛网保持静止…");
      tbHintLive("爬行进度 " + Math.round(game.crawlPos*100) + "%");
      // 完全离场判定:质心越过边缘 150px(腿展约 110px,此时完全不可见)
      const px = (game.crawlFrom[0] + game.crawlDirV[0]*(game.crawlPos*2.2)) * bufH;
      const py = bufH - (game.crawlFrom[1] + game.crawlDirV[1]*(game.crawlPos*2.2)) * bufH;
      game.spiderScr = [Math.round(px), Math.round(py)];
      if (px < -150 || px > bufW+150 || py < -150 || py > bufH+150 || game.crawlPos >= 1) completeLevel();
    }
  }
  else if (game.idx === 2){                             // L3 太空失重
    if (params.Gravity <= 0.5) game.l3t += dt; else game.l3t = 0;
    tbShow("🕷️ 关卡 3/6 · " + L.name, L.flavor);
    tbHintLive("失重保持 " + game.l3t.toFixed(1) + " / 5.0 秒(重力 " + params.Gravity.toFixed(1) + ")");
    if (game.l3t >= 5) completeLevel();
  }
  else if (game.idx === 3){                             // L4 软网实验室
    const soft = params.K <= 0.015 && params.Friction <= 0.01;
    if (soft) game.l4t += dt;
    else { game.l4t = 0; game.base = null; }
    const armed = game.l4t >= 1.0;
    if (armed && !game.base) game.base = lp;
    tbShow("🕷️ 关卡 4/6 · " + L.name, L.flavor);
    tbHintLive((soft ? "参数 ✓ · " : "参数未达标 · ") +
               (armed ? "位移 " + game.avgDisp.toFixed(3) + " / 0.030" : "保持软网参数 1 秒…"));
    if (armed && game.base && game.avgDisp > 0.03) completeLevel();
  }
  else if (game.idx === 4){                             // L5 呼吸的网
    pushHist("R1", params.R1);
    game.sw = swingCount("R1", 0.02, 10);
    tbShow("🕷️ 关卡 5/6 · " + L.name, L.flavor);
    tbHintLive("往复 " + game.sw + " / 6(10 秒内)");
    if (game.sw >= 6) completeLevel();
  }
  else if (game.idx === 5){                             // L6 毕业:失重蹦迪
    pushHist("MouseK", params.MouseK);
    game.sw = swingCount("MouseK", 0.25, 10);
    game.gOK = params.Gravity <= 0.5;
    tbShow("🕷️ 关卡 6/6 · " + L.name, L.flavor);
    tbHintLive(game.gOK ? "往复 " + game.sw + " / 6(10 秒内)"
                        : "先失重:重力 " + params.Gravity.toFixed(1));
    if (game.gOK && game.sw >= 6) completeLevel();
  }
}
$("btnGame").addEventListener("click", () => {
  game.on = !game.on;
  $("btnGame").textContent = "🕷️ 关卡模式:" + (game.on ? "开" : "关");
  $("btnGame").classList.toggle("on", game.on);
  if (game.on){
    armLevel(0);
    tb.style.display = "block";
  } else {
    tb.style.display = "none";
    fx.style.display = "none"; fxActive = false;
  }
});

'''
s = s[:a] + NEW + s[b:]
open("index.template.html", "w", encoding="utf-8", newline="").write(s)
print("game block rewritten")
