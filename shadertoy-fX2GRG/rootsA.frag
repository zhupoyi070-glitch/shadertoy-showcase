// 不安爬行 · 丛生根须 —— Field Pass（Buffer A）
// 输出：R = 根须墨量   G = 地面裂纹/凹坑密度   B = 拖痕密度
// 根须 = 从簇心向四周放射的细软根丝（角度域条纹 + 噪声揉弯），
// 朝按键方向探出（reach 随 uProbe 拉长），回缩时整体缩回；
// 焦躁时根须向内蜷缩、排线瞬间加密；边缘永远破碎消散，末梢淡出融入地表。
// （uRootPos/uFacing/uProbe/uAgitate/uDensity/uCurl/uJitterSpeed 由页面 prelude 声明）

float Hash(vec2 p)
{
    p = fract(p*vec2(234.5,435.6));
    p += dot(p,p+34.5);
    return fract(p.x*p.y);
}

float Noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = Hash(i);
    float b = Hash(i+vec2(1,0));
    float c = Hash(i+vec2(0,1));
    float d = Hash(i+vec2(1,1));
    vec2 u = f*f*(3.-2.*f);
    return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}

float Fbm(vec2 p)
{
    float v = 0.;
    float a = .5;
    for(int i=0; i<4; i++)
    {
        v += Noise(p)*a;
        p *= 2.;
        a *= .5;
    }
    return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;
    vec3 ro = vec3(0.0, 4.8, -19.0);
    vec3 ta = vec3(0.0, 3.4, 0.0);
    vec3 f = normalize(ta-ro);
    vec3 r = normalize(cross(vec3(0,1,0),f));
    vec3 u = cross(f,r);
    vec3 rd = normalize(f + uv.x*r + uv.y*u);

    // 地面交点（越过地平线/太远 -> 空白纸面）
    float fog = 0.0;
    vec2 w = vec2(0.0);
    if (rd.y < -0.002)
    {
        float t = -ro.y / rd.y;
        if (t < 70.0)
        {
            vec3 gp = ro + rd*t;
            w = gp.xz;
            fog = exp(-t*0.035);
            // 起伏：把图案域沿视线按高度推移（伪浮雕，让排线跟着地形起伏弯折）
            float h = Fbm(w*0.35)*1.6;
            w -= normalize(rd.xz + vec2(1e-4, 1e-4)) * h * 0.55;
        }
    }

    float D = 0.0;
    float G = 0.0;
    float T = 0.0;

    if (fog > 0.001)
    {
        // ---- 根须丛 ----
        vec2 q = w - uRootPos;
        float rlen = length(q) + 1e-4;
        vec2 dir = q / rlen;
        float ang = atan(q.y, q.x);
        float face = max(dot(dir, uFacing), 0.0);

        // 探出/回缩：朝向方向的根丝伸展更远
        float reach = (3.0 + 0.35*uCurl)
                    + uProbe * (1.0 + 1.7*face*face)
                    - 0.6 * max(-uProbe, 0.0);
        reach *= 0.85 + 0.3*uDensity;

        float wob = 0.5 + 0.55*uCurl + uAgitate*0.4;
        float sw = Fbm(dir*2.8 + vec2(iTime*0.15*uJitterSpeed*0.2, -iTime*0.11*uJitterSpeed*0.2)) - 0.5;

        // 两套角度域根丝（交叉处自然加深）
        float v1 = ang*(9.0/6.2832) + sw*wob*3.2
                 + (Fbm(q*0.5 + iTime*0.10*uJitterSpeed*0.2)-0.5)*1.3*(0.5 + uAgitate*0.5);
        float s1 = 1.0 - smoothstep(0.07, 0.20, abs(fract(v1)-0.5));
        float v2 = ang*(16.0/6.2832) + 0.41 - sw*wob*2.1
                 + (Fbm(q*0.85 - iTime*0.08*uJitterSpeed*0.2)-0.5)*1.0;
        float s2 = 1.0 - smoothstep(0.06, 0.17, abs(fract(v2)-0.5));

        float mask = smoothstep(reach, reach*0.7, rlen);
        mask *= 0.6 + 0.4*Noise(q*1.25 + iTime*0.3*uJitterSpeed*0.2);   // 边缘破碎
        float tipFade = 0.35 + 0.65*smoothstep(reach, reach*0.4, rlen);      // 末梢淡出

        D = (s1*0.8 + s2*0.55 + s1*s2*0.45) * mask * tipFade;

        // 战栗内层：焦躁时细密排线向内加密（蜷缩感）
        float v3 = ang*(27.0/6.2832) + (Fbm(q*1.5 + iTime*0.9*uJitterSpeed*0.15)-0.5)*3.0;
        float s3 = 1.0 - smoothstep(0.035, 0.09, abs(fract(v3)-0.5));
        D += s3 * smoothstep(reach*0.6, 0.0, rlen) * uAgitate * 0.4;

        D += smoothstep(1.4, 0.0, rlen)*0.35;   // 根丝汇聚的暗核
        D *= fog * (0.75 + 0.5*uDensity) * 2.0;

        // ---- 地面：细碎凹坑与裂纹 ----
        float crack = 1.0 - abs(2.0*Noise(w*1.7 + vec2(3.1)) - 1.0);
        crack = smoothstep(0.78, 0.95, crack);
        float pits = smoothstep(0.70, 0.88, Noise(w*2.3 + 7.0));
        G = (crack*0.75 + pits*0.5 + Fbm(w*0.55)*0.3) * fog * 0.85;
    }

    // ---- 拖痕：根须蹭过地表的临时短线（随时间消散） ----
    for (int i = 0; i < 28; i++)
    {
        vec2 mark = uTrailB[i];
        if (mark.y <= 0.0) continue;
        float age = iTime - mark.x;
        if (age < 0.0 || age > 7.0) continue;
        vec2 pa = w - uTrailA[i].xy;
        vec2 ba = uTrailA[i].zw - uTrailA[i].xy;
        float hh = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0.0, 1.0);
        float d2 = length(pa - ba*hh);
        float dash = 0.4 + 0.6*Hash(w*0.8 + float(i)*3.7);
        T += (1.0 - smoothstep(0.0, 0.15, d2)) * exp(-age*0.5) * mark.y * dash;
    }
    T *= fog * 0.6 * uDensity;

    fragColor = vec4(D, G, T, fog);
}
