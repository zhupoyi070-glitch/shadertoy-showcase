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

vec3 RotX(vec3 p, float a)
{
    float s = sin(a);
    float c = cos(a);
    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
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
    p.xz *= Rotation(3.14159 + uYaw);
    p.y -= 2.6;
    float phase = uCreature.z;
    float walk = uCreature.w;
    // 走动：身体起伏 + 轻微前倾
    p.y += abs(sin(phase)) * 0.10 * walk;
    float ln = 0.10 * walk;
    p.yz = vec2(cos(ln)*p.y - sin(ln)*p.z, sin(ln)*p.y + cos(ln)*p.z);
    p.z += p.y * 0.08;
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
    // 手臂：行走时前后摆动（与对侧腿反相）
    float aArm = sin(phase + 3.14159) * 0.40 * walk;
    vec3 paL = RotX(p - vec3(-0.45,2.6,0), aArm);
    float armL1 = Capsule(paL,vec3(0.0),vec3(-0.55,-0.8,0.15),0.12);
    float armL2 = Capsule(paL,vec3(-0.55,-0.8,0.15),vec3(-0.70,-1.8,0.30),0.09);
    float clawL = Capsule(paL,vec3(-0.70,-1.8,0.30),vec3(-0.90,-2.05,0.65),0.035);
    vec3 paR = RotX(p - vec3(0.45,2.6,0), -aArm);
    float armR1 = Capsule(paR,vec3(0.0),vec3(0.55,-0.8,0.15),0.12);
    float armR2 = Capsule(paR,vec3(0.55,-0.8,0.15),vec3(0.70,-1.8,0.30),0.09);
    float clawR = Capsule(paR,vec3(0.70,-1.8,0.30),vec3(0.90,-2.05,0.65),0.035);
    float hips = Sphere((p-vec3(0,1.0,0))*vec3(1.0,0.8,0.8),0.45);
    // 腿：髋部摆动 + 膝部弯曲（左右反相）
    float aL = sin(phase) * 0.55 * walk;
    float kL = max(sin(phase + 1.3), 0.0) * 0.95 * walk;
    vec3 pl = RotX(p - vec3(-0.22,0.9,0), aL);
    float legL1 = Capsule(pl,vec3(0.0),vec3(-0.06,-1.2,0.05),0.14);
    vec3 pkl = RotX(pl - vec3(-0.06,-1.2,0.05), -kL);
    float legL2 = Capsule(pkl,vec3(0.0),vec3(0.06,-1.2,0.15),0.075);
    float footL = Capsule(pkl,vec3(0.06,-1.2,0.15),vec3(0.06,-1.25,0.55),0.06);
    float aR = sin(phase + 3.14159) * 0.55 * walk;
    float kR = max(sin(phase + 1.3 + 3.14159), 0.0) * 0.95 * walk;
    vec3 pr = RotX(p - vec3(0.22,0.9,0), aR);
    float legR1 = Capsule(pr,vec3(0.0),vec3(0.06,-1.2,0.05),0.10);
    vec3 pkr = RotX(pr - vec3(0.06,-1.2,0.05), -kR);
    float legR2 = Capsule(pkr,vec3(0.0),vec3(-0.06,-1.2,0.15),0.075);
    float footR = Capsule(pkr,vec3(-0.06,-1.2,0.15),vec3(-0.06,-1.25,0.55),0.06);
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
    vec3 cp = vec3(uCreature.x, Terrain(uCreature.xz), uCreature.z);
    float c = Creature((p - cp)/uFigSize)*uFigSize;
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
    float fig = 0.0;
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
            fig = 1.0;
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
    fragColor = vec4(col, fig);
}