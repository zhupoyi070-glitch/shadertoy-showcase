// The Quiet Presence — 绘画 Pass（Image）
// 极细极锐的铅笔圈线：以人形为唯一中心，一圈圈包裹并向全画发散；
// 圈线不规整、不闭合于方框，随角度自由起伏、断续、互相交错。
// 人形是交叉排线画实的核，形外一圈斜排线包裹层，头肩渐渐消散；
// 脚下圈状笔影；胸口一枚小红点。
// 所有线条随时间极缓慢地游移、断续、重描：一张永远画不完、静而不安的画。

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
    float b = Hash(i+vec2(1.0,0.0));
    float c = Hash(i+vec2(0.0,1.0));
    float d = Hash(i+vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}

float Fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;
    for(int i=0; i<4; i++)
    {
        v += Noise(p)*a;
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

vec2 Fbm2(vec2 p)
{
    return vec2(Fbm(p), Fbm(p + vec2(19.7, 7.3)));
}

// 线节：两幅脊状噪声的峰值相交处形成孤立的小疙瘩
float Knots(vec2 p)
{
    float n1 = 1.0 - abs(2.0*Noise(p) - 1.0);
    float n2 = 1.0 - abs(2.0*Noise(p + vec2(41.3, 17.9)) - 1.0);
    float k = n1*n2;
    k *= 0.6 + 0.4*sin(p.x*2.3 + p.y*1.7);
    return smoothstep(0.78, 0.95, k);
}

// 与场景 Pass 相同的相机，把场景参考点反投影回画面坐标
vec2 Project(vec3 p)
{
    vec3 ro = vec3(0.0, 4.8, -19.0);
    vec3 ta = vec3(0.0, 3.4, 0.0);
    vec3 f = normalize(ta-ro);
    vec3 r = normalize(cross(vec3(0,1,0),f));
    vec3 u = cross(f,r);
    vec3 d = normalize(p-ro);
    float pz = max(dot(d,f), 0.001);
    return vec2(dot(d,r), dot(d,u))/pz*iResolution.y + 0.5*iResolution.xy;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float t = iTime*0.05*uDrift;   // 缓慢的游移（速度可调）
    vec2 fc = fragCoord;
    float diag = max(iResolution.x, iResolution.y);

    // ---- 模糊采样场景遮罩（人形/地面/投影） ----
    vec3 s = vec3(0.0);
    for(int i=0; i<9; i++)
    {
        float a = 6.2832*float(i)/9.0 + Hash(fc*0.11)*6.2832;
        float rr = 0.5 + 2.4*Hash(fc + float(i)*11.7);
        vec2 px = fc + vec2(cos(a), sin(a))*rr;
        s += texture(iChannel0, px/iResolution.xy).rgb;
    }
    s /= 9.0;
    float fig = s.r;
    float gnd = s.g;
    float shd = s.b;
    float hgt = texture(iChannel0, fc/iResolution.xy).a;

    // 大半径再糊一层：得到形体周围的连续场
    float figBig = 0.0;
    for(int i=0; i<9; i++)
    {
        float a = 6.2832*float(i)/9.0 + Hash(fc*0.07)*6.2832;
        float rr = 4.0 + 26.0*Hash(fc + float(i)*5.3);
        vec2 px = fc + vec2(cos(a), sin(a))*rr;
        figBig += texture(iChannel0, px/iResolution.xy).r;
    }
    figBig /= 9.0;

    // ---- 纸面 ----
    vec3 col = vec3(0.962, 0.945, 0.900);
    col *= 1.0 + (Hash(fc) - 0.5)*0.05;                 // 纸粒
    col *= 1.0 + (Noise(fc*0.7) - 0.5)*0.025;           // 纸纤维
    float rC = length((fc - 0.5*iResolution.xy)/iResolution.y);
    col *= 1.0 - 0.05*smoothstep(0.55, 1.05, rC);       // 四角微微沉下去

    // 纸面上缓慢漂移的扰动：让每根线都在被不知不觉重画
    vec2 warp = (Fbm2(fc*0.006 + vec2(t*0.6, 0.0)) - 0.5)*12.0*uWarp;
    float stroke = 0.30 + 0.70*smoothstep(0.26, 0.64, Fbm(fc*0.06 + warp*0.12 + vec2(7.7, 2.2)));

    vec3 graphite = vec3(0.23, 0.215, 0.20);
    vec3 inkGrey  = vec3(0.30, 0.27, 0.26);

    // 人形参考点
    vec2 C1 = Project(vec3(0.0, 3.3, 0.0));

    // ---- 围绕人形发散的自由圈线场：单一中心，细而锐的铅笔圈线 ----
    {
        vec2 d = fc - C1;
        float r = length(d);
        float ang = atan(d.y, d.x);
        vec2 cir = vec2(cos(ang), sin(ang));            // 无接缝的角度域

        // 圈距：近密远疏（包裹人形，向外发散）
        float spacing = (4.5 + r*0.022)/uDensity;
        // 自由抖动：随角度起伏（低频）+ 高频干涩抖动，幅度按圈距自适应，不粘连
        float wobble = (Fbm(cir*2.3 + warp*0.25 + vec2(0.0, t*0.5)) - 0.5)*spacing*0.85*uWobble
                     + (Noise(cir*7.0 + vec2(t*0.3, 0.0)) - 0.5)*spacing*0.35*uWobble
                     + (Noise(fc*0.45) - 0.5)*1.5*uWobble;
        float re = max(r + wobble, 0.0);

        // 相位随角度微偏 + 每条圈各自的错位：圈不完全是同心圆
        float phase = (Noise(cir*3.1 + vec2(11.0, t*0.25)) - 0.5)*spacing*0.9;
        float ringIdx = floor((re + phase)/spacing);
        phase += (Noise(vec2(ringIdx*0.83, 7.7)) - 0.5)*spacing*0.5;
        float perRing = (Noise(cir*11.0 + vec2(0.0, ringIdx*2.3)) - 0.5)*spacing*0.20;

        float f = mod(re + phase + perRing, spacing) - spacing*0.5;   // 到最近圈线的像素距离

        // 细而锐的铅笔线：半宽约半像素到一像素（粗细可调）
        float lw = (0.50 + 0.45*Fbm(fc*0.05 + 5.0))*uWidth;  // 笔压
        float l1 = 1.0 - smoothstep(lw, lw + 0.85*max(uWidth, 0.4), abs(f));
        // 断笔：沿圈起落
        float dash = smoothstep(0.30, 0.62, Noise(cir*6.5 + vec2(0.0, ringIdx*3.7)) + 0.12);
        l1 *= stroke*mix(1.0, dash, uDash);
        l1 *= 0.45 + 0.55*Noise(fc*1.3);                    // 铅笔颗粒
        col = mix(col, graphite, l1*0.55*uInk);

        // 一层更淡的交错细线：同中心、异圈距，增加杂乱
        float re2 = re*1.312 + 2.3;
        float f2 = mod(re2 + phase*0.7, spacing*1.24) - spacing*0.62;
        float lw2v = 0.45 + 0.4*Fbm(fc*0.052 + 19.0);
        float l2 = 1.0 - smoothstep(lw2v, lw2v + 0.85, abs(f2));
        l2 *= stroke*0.75*dash;
        l2 *= 0.40 + 0.60*Noise(fc*1.5 + 7.0);
        col = mix(col, graphite, l2*0.28*uInk*uCross);
    }

    // ---- 人形：交叉排线画实的核 + 形外包裹层，头肩渐渐消散 ----
    {
        float mIn = smoothstep(0.08, 0.25, fig);
        float wob = Fbm(fc*0.05 + warp*0.15 + vec2(0.0, t*2.0));
        float dis = smoothstep(0.50, 0.92, hgt + (wob - 0.5)*0.6);

        // 两层斜向排线的坐标
        float ha = 0.62;
        vec2 hp = vec2(fc.x*cos(ha) - fc.y*sin(ha), fc.x*sin(ha) + fc.y*cos(ha));
        float hb = 0.62 + 1.25;
        vec2 hq = vec2(fc.x*cos(hb) - fc.y*sin(hb), fc.x*sin(hb) + fc.y*cos(hb));

        // 形外一圈包裹层：斜排线
        float wrapBand = smoothstep(0.10, 0.28, figBig)*(1.0 - smoothstep(0.40, 0.80, figBig));
        float w1 = fract(hp.y*0.11 + Fbm(fc*0.045 + warp*0.2)*2.4 + t*0.5);
        float g1 = 1.0 - smoothstep(0.10, 0.24, abs(w1 - 0.5));
        float w2 = fract(hq.y*0.13 + Fbm(fc*0.05 + 11.0)*2.4 - t*0.4);
        float g2 = 1.0 - smoothstep(0.10, 0.24, abs(w2 - 0.5));
        float wrap = (g1 + g2)*wrapBand*stroke;
        col = mix(col, graphite, clamp(wrap, 0.0, 1.0)*0.42*uWrap);

        // 形内：交叉排线核，越往头肩越疏
        float lum = 0.35 + 0.65*(1.0 - hgt);
        float n1 = fract(hp.y*0.075*uBody + Fbm(fc*0.06 + 3.0)*2.0);
        float i1 = 1.0 - smoothstep(0.08, 0.20, abs(n1 - 0.5));
        float n2 = fract(hq.y*0.09*uBody + Fbm(fc*0.06 + 17.0)*2.0);
        float i2 = 1.0 - smoothstep(0.08, 0.20, abs(n2 - 0.5));
        float body = (i1 + i2)*mIn*stroke*(1.0 - 0.6*dis)*lum;
        col = mix(col, graphite*0.9, clamp(body, 0.0, 1.0)*0.50);

        // 杂乱的深色边缘
        float edge = smoothstep(0.10, 0.30, fig)*(1.0 - smoothstep(0.30, 0.60, fig));
        col = mix(col, graphite*0.75, edge*stroke*(1.0 - 0.7*dis)*0.40);
    }

    // ---- 脚下圈状笔影 ----
    {
        float sk = Knots(fc*0.2 + vec2(53.1, 7.7) + warp*0.25);
        float shd2 = smoothstep(0.12, 0.55, shd);
        col = mix(col, inkGrey*0.85, clamp(shd2*(0.10 + 0.75*sk), 0.0, 1.0)*gnd*0.45);
    }

    // ---- 胸口的实心小红点 ----
    {
        vec2 Cp = Project(vec3(0.0, 4.6, 0.15));
        float dC = length(fc - Cp);
        float dt2 = 1.0 - smoothstep(3.5, 6.0, dC);
        col = mix(col, vec3(0.549, 0.055, 0.102), dt2*0.75);
    }

    fragColor = vec4(col, 1.0);
}
