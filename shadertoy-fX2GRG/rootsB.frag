// 不安爬行 · 丛生根须 —— 炭笔排线 Pass（Image）
// 密度场 -> 斜向短排线：形体全部由长短凌乱交错的排线构成，无填色块。
// 三套交叉排线按墨量分层显现（重叠处自动加密加深），
// 拖痕单独一层稀疏短划；所有排线随 uJitterSpeed 持续抖动，永远不会静止。
// 纸面持续微弱颗粒；无彩色、无发光、无平滑边缘。
// （uWidth/uJitter/uJitterSpeed/uInk/uDensity 由页面 prelude 声明）

float Hash(vec2 p)
{
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float Noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = Hash(i);
    float b = Hash(i + vec2(1.0, 0.0));
    float c = Hash(i + vec2(0.0, 1.0));
    float d = Hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 一层斜向短排线：vis 为该层的墨量门槛（0..1），越高排线越密越实
float hatchLayer(vec2 fc, float ang, float spacing, float vis, float t, float phase, float seed)
{
    if (vis <= 0.004) return 0.0;
    vec2 p = vec2(fc.x*cos(ang) - fc.y*sin(ang), fc.x*sin(ang) + fc.y*cos(ang));
    float w1 = (Noise(p*0.03 + vec2(t*0.35, -t*0.28) + seed) - 0.5) * spacing * 0.85;
    float coord = (p.y + w1) / spacing + phase;
    float d = abs(fract(coord) - 0.5) * spacing;
    float lw = (0.45 + 0.5*Noise(p*0.045 + seed)) * uWidth;
    float line = 1.0 - smoothstep(lw, lw + 0.9, d);
    // 断笔：长短凌乱的短划
    float along = p.x*0.6 + p.y*0.2;
    float dash = smoothstep(0.28, 0.6, Noise(vec2(along*0.085, coord*1.7) + vec2(t*0.4, seed)));
    line *= mix(1.0, dash, 0.85);
    // 铅笔颗粒
    line *= 0.4 + 0.6*Noise(fc*1.25 + vec2(t*0.7, seed));
    return line * vis;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 fc = fragCoord;
    float t = iTime * uJitterSpeed;
    vec4 F = texture(iChannel0, fc/iResolution.xy);
    float D = F.r;
    float G = F.g;
    float T = F.b;
    float total = clamp(D*1.25 + G*0.6 + T*0.8, 0.0, 1.5);

    // 纸面
    vec3 col = vec3(0.958, 0.947, 0.915);
    col *= 1.0 + (Hash(fc + floor(iTime*uJitterSpeed*0.5)*11.0) - 0.5)*0.05;   // 持续颗粒闪动
    col *= 1.0 + (Noise(fc*0.8) - 0.5)*0.02;
    float rC = length((fc - 0.5*iResolution.xy)/iResolution.y);
    col *= 1.0 - 0.05*smoothstep(0.55, 1.05, rC);

    // 斜向排线：墨量越高层数越多（密集加深）
    float groundMask = F.a;
    float ink = 0.0;
    // 地表基础淡排线（整片地面都用炭笔绘制）
    ink += hatchLayer(fc, 0.62, 13.0/uDensity, groundMask*0.5,                 t*0.7,  0.2,  5.0) * 0.22;
    ink += hatchLayer(fc, 0.62, 7.5/uDensity,  smoothstep(0.07, 0.30, total),  t,      0.0,  1.0) * 0.60;
    ink += hatchLayer(fc, -0.38, 9.5/uDensity, smoothstep(0.26, 0.58, total),  t*0.85, 0.37, 2.0) * 0.45;
    ink += hatchLayer(fc, 1.18, 12.5/uDensity, smoothstep(0.50, 0.95, total),  t*1.15, 0.71, 3.0) * 0.32;
    // 拖痕：稀疏短划
    ink += hatchLayer(fc, 0.25, 11.0/uDensity, smoothstep(0.08, 0.30, T),      t*1.30, 0.50, 4.0) * 0.50;

    col = mix(col, vec3(0.16, 0.15, 0.14), clamp(ink, 0.0, 1.0)*uInk);

    fragColor = vec4(col, 1.0);
}
