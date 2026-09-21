mat2 Rotation(float a)
{
    float s = sin(a);
    float c = cos(a);
    return mat2(c,-s,s,c);
}

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

float Sphere(vec3 p,float r)
{
    return length(p)-r;
}

float Capsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p-a;
    vec3 ba = b-a;
    float h = clamp(dot(pa,ba)/dot(ba,ba),0.,1.);
    return length(pa-ba*h)-r;
}

float Terrain(vec2 xz)
{
    float h = Fbm(xz*.12)*3.0;
    h += sin(xz.x*.15)*0.8;
    h += cos(xz.y*.12)*0.8;
    return h;
}

float Smin(float a, float b, float k)
{
    float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
    return mix(b,a,h) - k*h*(1.0-h);
}

float Creature(vec3 p)
{
    p.xz *= Rotation(3.14159);
    float t = 0.0;
    p.y-=2.6;
    p.z += p.y*0.08;
    vec3 tp = p;
    tp.y -= 2.2;
    float chest = Sphere(tp * vec3(1.2,1.0,0.8),0.9);
    float stomach = Sphere((tp-vec3(0,-0.9,0))*vec3(1.0,1.2,0.7),0.7);
    float torso = Smin(chest, stomach, 0.4);
    float spine = Capsule(p,vec3(0,1.0,-0.25),vec3(0,3.2,-0.2),0.08);
    torso = Smin(torso, spine, 0.25);
    vec3 hp = p - vec3(0,3.8,0.15);
    float skull = Sphere(hp * vec3(0.8,1.3,1.0),0.42);
    float jaw = Capsule(hp,vec3(0,-0.15,0.0),vec3(0,-0.55,0.25),0.12);
    float face = Capsule(hp,vec3(0,0.0,0.1),vec3(0,-0.1,0.45),0.16);
    float head = Smin(skull, jaw, 0.18);
    head = Smin(head, face, 0.2);
    float shoulderL = Sphere(p - vec3(-0.55,2.7,0), 0.28);
    float shoulderR = Sphere(p - vec3(0.55,2.7,0),0.28);
    float armL1 = Capsule(p,vec3(-0.45,2.6,0),vec3(-1.0,1.8,0.15),0.12);
    float armL2 = Capsule(p,vec3(-1.0,1.8,0.15),vec3(-1.15,0.8,0.3),0.09);
    float armR1 = Capsule(p,vec3(0.45,2.6,0),vec3(1.0,1.8,0.15),0.12);
    float armR2 = Capsule(p,vec3(1.0,1.8,0.15),vec3(1.15,0.8,0.3),0.09);
    float clawL = Capsule(p,vec3(-1.15,0.8,0.3),vec3(-1.35,0.55,0.65),0.035);
    float clawR = Capsule(p,vec3(1.15,0.8,0.3),vec3(1.35,0.55,0.65),0.035);
    float hips = Sphere((p-vec3(0,1.0,0))*vec3(1.0,0.8,0.8),0.45);
    float legL1 = Capsule(p,vec3(-0.22,0.9,0),vec3(-0.28,-0.3,0.05),0.14);
    float legL2 = Capsule(p,vec3(-0.28,-0.3,0.05),vec3(-0.22,-1.5,0.2),0.1);
    float legR1 = Capsule(p,vec3(0.22,0.9,0),vec3(0.28,-0.3,0.05),0.14);
    float legR2 = Capsule(p,vec3(0.28,-0.3,0.05),vec3(0.22,-1.5,0.2),0.1);
    float footL = Capsule(p,vec3(-0.22,-1.5,0.2),vec3(-0.22,-1.55,0.6),0.08);
    float footR = Capsule(p,vec3(0.22,-1.5,0.2),vec3(0.22,-1.55,0.6),0.08);
    float d = torso;
    d = Smin(d, head, 0.3);
    d = Smin(d, shoulderL, 0.2);
    d = Smin(d, shoulderR, 0.2);
    d = Smin(d, armL1, 0.2);
    d = Smin(d, armL2, 0.2);
    d = Smin(d, armR1, 0.2);
    d = Smin(d, armR2, 0.2);
    d = Smin(d, clawL, 0.08);
    d = Smin(d, clawR, 0.08);
    d = Smin(d, hips, 0.3);
    d = Smin(d, legL1, 0.2);
    d = Smin(d, legL2, 0.2);
    d = Smin(d, legR1, 0.2);
    d = Smin(d, legR2, 0.2);
    d = Smin(d, footL, 0.12);
    d = Smin(d, footR, 0.12);
    return d;
}

float sdSeg(vec3 p, vec3 a, vec3 b)
{
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba)/dot(ba, ba), 0.0, 1.0);
    return length(pa - ba*h);
}

// 丛生根须：参考真实根系形态——地表处纠结粗壮的根冠，
// 数条弯扭主根呈不对称扇形向外伸展，中段分出细侧根，逐级变细，
// 部分根拱起地表形成剪影；整体由 iTime 驱动持续细微蠕动。
float RootCluster(vec3 p)
{
    // 转体：身体朝向随方向键转动（配合迈步完成转身）
    float ca = cos(uTurn), sa = sin(uTurn);
    vec2 rot = mat2(ca, sa, -sa, ca) * p.xz;
    p = vec3(rot.x, p.y, rot.y);

    float d = 1e9;

    // ---- 分节躯干：高于地面，爬行时沿体轴传递起伏波（非纯圆柱） ----
    vec3 prev = vec3(0.0, 0.14, -0.80);
    float prevR = 0.09;
    for (int s = 0; s < 6; s++)
    {
        float fs = float(s);
        float wave = sin(uGaitT*1.8 + fs*1.15);
        vec3 c = vec3(sin(fs*2.3 + uGaitT*0.4)*0.035*(0.4 + uCrawl),
                      0.34 + wave*(0.02 + 0.035*uCurl),
                      -0.62 + fs*0.30);
        float rr = 0.11 + 0.07*sin(fs/5.0*3.1416);
        d = min(d, sdSeg(p, prev, c) - (prevR + rr)*0.5);
        d = min(d, length(p - c) - rr);
        // ---- 每节两侧的腿：相位交错，轮流抬起前摆（足部动作明显） ----
        if (s >= 1)
        {
            float phL = uGaitT*1.7 + fs*1.5;
            float phR = phL + 3.1416;
            float liftL = max(0.0, sin(phL));
            float liftR = max(0.0, sin(phR));
            vec3 hipL = vec3(-rr*0.7, c.y - rr*0.4, c.z);
            vec3 hipR = vec3( rr*0.7, c.y - rr*0.4, c.z);
            vec3 footL = vec3(-(rr + 0.30), liftL*0.13, c.z + 0.10 + (liftL - 0.3)*0.16*(0.4 + uCrawl));
            vec3 footR = vec3( rr + 0.30, liftR*0.13, c.z + 0.06 + (liftR - 0.3)*0.16*(0.4 + uCrawl));
            vec3 kneeL = mix(hipL, footL, 0.5) + vec3(-0.07, 0.10 + liftL*0.08, 0.0);
            vec3 kneeR = mix(hipR, footR, 0.5) + vec3( 0.07, 0.10 + liftR*0.08, 0.0);
            float r = 0.042 - fs*0.002;
            d = min(d, sdSeg(p, hipL, kneeL) - r);
            d = min(d, sdSeg(p, kneeL, footL) - r*0.7);
            d = min(d, sdSeg(p, hipR, kneeR) - r);
            d = min(d, sdSeg(p, kneeR, footR) - r*0.7);
        }
        prev = c; prevR = rr;
    }

    // 揉弯：噪声轻微侵蚀距离（轮廓破碎毛躁）
    float wig = Noise(p.xz*6.5 + vec2(0.0, iTime*0.25)) - 0.5;
    d -= wig*0.045;
    return d;
}

vec2 Map(vec3 p)
{
    float g = p.y - Terrain(p.xz);
    float c = RootCluster((p - uCreaturePos)/uFigSize)*uFigSize;
    if(c < g) return vec2(c,1.);
    return vec2(g,2.);
}

#define ZERO (min(iFrame,0))
vec3 Normal( in vec3 pos )
{
    vec3 n = vec3(0.0);
    for( int i=ZERO; i<4; i++ )
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*Map(pos+0.0005*e).x;
    }
    return normalize(n);
}

vec2 Raymarching(vec3 ro, vec3 rd)
{
    float d = 0.;
    float m = -1.;
    for(int i=0;i<128;i++)
    {
        vec3 p = ro + rd*d;
        vec2 h = Map(p);
        d += h.x;
        m = h.y;
        if(abs(h.x)<0.001 || d>120.)
            break;
    }
    return vec2(d,m);
}

float Shadow(vec3 ro, vec3 rd)
{
    float res = 1.;
    float t = .02;
    for(int i=0;i<48;i++)
    {
        float h = Map(ro+rd*t).x;
        res = min(res,10.*h/t);
        t += clamp(h,.02,.25);
        if(h<.001 || t>20.) break;
    }
    return clamp(res,0.,1.);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 ro = vec3(0.0,5.0,-8.);
    vec3 ta = vec3(0,4.0,0);
    vec3 f = normalize(ta-ro);
    vec3 r = normalize(cross(vec3(0,1,0),f));
    vec3 u = cross(f,r);
    vec3 rd = normalize(f + uv.x*r + uv.y*u);
    vec3 col = mix(vec3(0.02,0.03,0.08),vec3(0.4,0.05,0.08),uv.y*0.5+0.5);
    vec2 muv = uv - vec2(0.45,0.25);
    vec2 hit = Raymarching(ro,rd);
    if(hit.x < 120.)
    {
        vec3 p = ro + rd*hit.x;
        vec3 n = Normal(p);
        vec3 lightPos = vec3(5,8,-4);
        vec3 l = normalize(lightPos-p);
        float diff = max(dot(n,l),0.);
        float sh = Shadow(p+n*.01,l);
        diff *= sh;
        float rim = pow(1.-max(dot(n,-rd),0.),3.);
        if(hit.y < 1.5)
        {
            vec3 base = vec3(0.03,0.03,0.04);
            base += vec3(0.4,0.0,0.0)*rim;
            vec3 lp = p;
            lp.y -= Terrain(vec2(0.));
            base += diff*0.25;
            col = base;
        }
        else
        {
            vec3 ground = mix(vec3(0.8,0.2,0.3), vec3(0.1,0.8,1.0), Fbm(p.xz*.1));
            ground *= 0.25 + diff*.75;
            col = ground;
        }
        float fog = exp(-hit.x*.03);
        vec3 fogCol = mix(vec3(0.6,0.2,0.3), vec3(0.1,0.6,1.0), uv.y + 0.3);
    }
    col = pow(col,vec3(.75));
    fragColor = vec4(col,1);
}
