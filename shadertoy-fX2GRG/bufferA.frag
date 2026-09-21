// The Quiet Presence — 场景 Pass（Buffer A）
// 相机拉远让人形变小，输出绘制遮罩而非颜色：
//   R = 人形遮罩   G = 地面遮罩   B = 投影强度   A = 人形世界高度（归一化，用于顶部消散）

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

float Sphere(vec3 p,float r)
{
    return length(p)-r;
}

float Capsule(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p-a;
    vec3 ba = b-a;
    float h = clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);
    return length(pa-ba*h)-r;
}

float Terrain(vec2 xz)
{
    float h = Fbm(xz*0.12)*3.0;
    h += sin(xz.x*0.15)*0.8;
    h += cos(xz.y*0.12)*0.8;
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
    p.y -= 2.6;
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

vec2 Map(vec3 p)
{
    float g = p.y - Terrain(p.xz);
    float c = Creature(p/uFigSize)*uFigSize;
    if(c < g) return vec2(c,1.0);
    return vec2(g,2.0);
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
    float d = 0.0;
    float m = -1.0;
    for(int i=0;i<96;i++)
    {
        vec3 p = ro + rd*d;
        vec2 h = Map(p);
        d += h.x;
        m = h.y;
        if(abs(h.x)<0.001 || d>60.0)
            break;
    }
    return vec2(d,m);
}

float Shadow(vec3 ro, vec3 rd)
{
    float res = 1.0;
    float t = 0.02;
    for(int i=0;i<40;i++)
    {
        float h = Map(ro+rd*t).x;
        res = min(res,10.0*h/t);
        t += clamp(h,0.02,0.25);
        if(h<0.001 || t>16.0) break;
    }
    return clamp(res,0.0,1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    // 相机远远退开：人形只占画面一小部分，孤在空旷的荒原里
    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;
    vec3 ro = vec3(0.0, 4.8, -19.0);
    vec3 ta = vec3(0.0, 3.4, 0.0);
    vec3 f = normalize(ta-ro);
    vec3 r = normalize(cross(vec3(0,1,0),f));
    vec3 u = cross(f,r);
    vec3 rd = normalize(f + uv.x*r + uv.y*u);

    vec2 hit = Raymarching(ro,rd);
    float fig = 0.0;
    float gnd = 0.0;
    float shd = 0.0;
    float hgt = 0.0;
    if(hit.x < 60.0)
    {
        vec3 p = ro + rd*hit.x;
        if(hit.y < 1.5)
        {
            fig = 1.0;
            hgt = clamp(p.y/7.5, 0.0, 1.0);
        }
        else
        {
            gnd = 1.0;
            vec3 l = normalize(vec3(5.0,9.0,-4.0) - p);
            float sh = Shadow(p + vec3(0.0,0.02,0.0), l);
            shd = clamp(1.0 - sh, 0.0, 1.0);
        }
    }
    fragColor = vec4(fig, gnd, shd, hgt);
}
