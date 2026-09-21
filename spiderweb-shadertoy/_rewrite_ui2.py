# -*- coding: utf-8 -*-
s = open("index.template.html", encoding="utf-8").read()

# 1) 新增两参 tbShow
anchor = '''const tb = $("taskbar"), tbTitle = $("tbTitle"), tbGoal = $("tbGoal"), tbProg = $("tbProg");
let liveEl1 = null, liveEl2 = null, hintShown = 0;'''
assert anchor in s
s = s.replace(anchor, anchor + '''
function tbShow(title, flavor){
  tb.style.display = "block";
  tbTitle.textContent = title;
  tbProg.textContent = flavor;                      // 可见行:悬念式形容,具体内容看提示按钮
}''')

# 2) 任务栏 HTML:两个提示按钮
old_html = '''<div id="taskbar">
  <div id="tbTitle"></div>
  <div id="tbProg"></div>
  <button id="tbHint">💡 查看通关提示</button>
  <div id="tbGoal"></div>
</div>'''
new_html = '''<div id="taskbar">
  <div id="tbTitle"></div>
  <div id="tbProg"></div>
  <div id="tbBtns">
    <button id="tbHint1">💡 提示1</button>
    <button id="tbHint2" disabled>🔒 提示2</button>
  </div>
  <div id="tbGoal"></div>
</div>'''
assert old_html in s, "taskbar html not found"
s = s.replace(old_html, new_html)

# 3) CSS:任务栏点击穿透 + 提示按钮样式 + 目标区左对齐
old_css = '''  #tbTitle { color: #fff; font-size: 17px; letter-spacing: 1px; }
  #tbGoal  { color: #ffe9a8; font-size: 14px; display: none; margin-top: 4px;
             background: rgba(255,255,255,.07); border-radius: 6px; padding: 4px 10px; }
  #tbProg  { color: #fd5; font-size: 14px; }
  #tbHint {
    margin-top: 7px; font: 13px Consolas, monospace; cursor: pointer;
    background: #1c1c1c; color: #fff; border: 1px solid #888;
    border-radius: 6px; padding: 4px 14px;
  }
  #tbHint:hover { background: #333; border-color: #fff; }'''
new_css = '''  #tbTitle { color: #fff; font-size: 17px; letter-spacing: 1px; }
  #tbGoal  { color: #ffe9a8; font-size: 14px; display: none; margin-top: 6px;
             background: rgba(255,255,255,.07); border-radius: 6px; padding: 6px 12px;
             text-align: left; }
  #tbGoal b { color: #fff; }
  #tbProg  { color: #fd5; font-size: 14px; }
  #taskbar { pointer-events: none; }          /* 不挡蜘蛛的点击 */
  #tbBtns  { display: flex; gap: 8px; justify-content: center; margin-top: 8px;
             pointer-events: auto; }
  #tbHint1, #tbHint2 {
    font: 13px Consolas, monospace; cursor: pointer;
    background: #1c1c1c; color: #fff; border: 1px solid #888;
    border-radius: 6px; padding: 4px 14px;
  }
  #tbHint1:hover, #tbHint2:hover:not(:disabled) { background: #333; border-color: #fff; }
  #tbHint2:disabled { color: #777; cursor: not-allowed; }'''
assert old_css in s, "taskbar css not found"
s = s.replace(old_css, new_css)

open("index.template.html", "w", encoding="utf-8", newline="").write(s)
print("template updated")
