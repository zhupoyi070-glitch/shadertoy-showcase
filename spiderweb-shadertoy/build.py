# -*- coding: utf-8 -*-
# 把 shaders/ 里的源码注入模板,生成单文件 index.html
# 用法: python build.py
t = open("index.template.html", encoding="utf-8").read()
t = t.replace("/*@COMMON@*/",  open("shaders/common.frag",  encoding="utf-8").read())
t = t.replace("/*@BUFFERA@*/", open("shaders/bufferA.frag", encoding="utf-8").read())
t = t.replace("/*@IMAGE@*/",   open("shaders/image.frag",   encoding="utf-8").read())
open("index.html", "w", encoding="utf-8", newline="").write(t)
print("index.html rebuilt:", len(t), "bytes")
