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
    f = f * f * (3.0 - 2.0 * f);
    float a = Hash(i);
    float b = Hash(i + vec2(1.0, 0.0));
    float c = Hash(i + vec2(0.0, 1.0));
    float d = Hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x),mix(c, d, f.x),f.y);
}

vec4 Random(vec2 p)
{
    return vec4(vec3(Noise(p)), 1.0);
}

vec4 SampleColor(vec2 pos, vec2 randomOffset, float ramp, float randomScale, float scaleFactor)
{
    vec4 offset = (Random((pos + randomOffset) * 0.05 * randomScale / scaleFactor + vec2(iTime*0.40*uJitterSpeed)) - 0.5) * 10.0 * ramp * uJitter;
    vec2 uv = (pos + offset.xy * scaleFactor + vec2(iTime*9.0, iTime*3.5)*uShift) / iResolution.xy;
    return texture(iChannel0, uv);
}

float Luminance(vec2 pos, vec2 randomOffset, float ramp, float randomScale, float scaleFactor)
{
    vec3 color = SampleColor(pos, randomOffset, ramp, randomScale, scaleFactor).xyz;
    return clamp(dot(color, vec3(0.333)), 0.0, 1.0);
}

vec2 Gradient(vec2 pos, float eps, vec2 randomOffset, float ramp, float randomScale, float scaleFactor)
{
    vec2 d = vec2(eps, 0.0);
    float gx = Luminance(pos + d.xy, randomOffset, ramp, randomScale, scaleFactor);
    gx -= Luminance(pos - d.xy, randomOffset, ramp, randomScale, scaleFactor);
    float gy = Luminance(pos + d.yx, randomOffset, ramp, randomScale, scaleFactor);
    gy -= Luminance(pos - d.yx, randomOffset, ramp, randomScale, scaleFactor);
    return vec2(gx, gy) / (eps * 2.0);
}

float EdgeContribution(vec2 fragCoord, float fi, int layerCount, float scaleFactor)
{
    float threshold = 0.03 + 0.25 * fi;
    float width = threshold * 2.0;
    float brightness = 0.0;
    float ramp = 0.15 * pow(1.3, fi * 5.0) * uJitter;
    float randomScale = 1.7 * pow(1.3, -fi * 5.0);
    float grad = length(Gradient(fragCoord, 0.4 * scaleFactor, vec2(0.0), ramp, randomScale, scaleFactor));
    grad *= scaleFactor;
    brightness += 0.6 * (0.5 + fi) * smoothstep(threshold - width * 0.5,threshold + width * 0.5, grad) * uEdge; 
    ramp = 0.3 * pow(1.3, fi * 5.0) * uJitter;
    randomScale = 10.7 * pow(1.3, -fi * 5.0);
    grad = length(Gradient(fragCoord, 0.4 * scaleFactor, vec2(0.0), ramp, randomScale, scaleFactor));
    grad *= scaleFactor;
    brightness += 0.4 * (0.2 + fi) * smoothstep(threshold - width * 0.5,threshold + width * 0.5, grad) * uEdge;
    return brightness;
}

float HatchLayer(vec2 fragCoord, int layerIndex, float scaleFactor, vec4 randomDelta, out float hatchMax)
{
    vec2 position = fragCoord + 1.5 * scaleFactor * (Random(fragCoord * 0.02 + iTime*0.25*uJitterSpeed).xy - 0.5) * uJitter
                  + vec2(iTime*10.0, iTime*4.0)*uShift;
    float brightness = Luminance(position, vec2(0.0), 0.0, 1.0, scaleFactor) * 1.7;
    float angle = -0.5 - 0.08 * float(layerIndex * layerIndex);
    vec2 basis = cos(angle - vec2(0.0, 1.6));
    mat2 rotation = mat2(basis, basis.yx * vec2(-1.0, 1.0));
    vec2 hatchUv =  rotation * fragCoord / sqrt(scaleFactor) * vec2(0.05 * uDensity, 1.0) * 1.3;
    // 卷曲：把直排线揉弯（幅度与速度可调）
    hatchUv += uCurl * vec2(sin(hatchUv.y * 0.45 + iTime*0.40*uJitterSpeed), cos(hatchUv.x * 0.40 + iTime*0.34*uJitterSpeed)) * 7.0;
    vec4 randomHatch = pow(Random(hatchUv + vec2(sin(hatchUv.y), 0.0) + iTime*0.30*uJitterSpeed), vec4(1.0));
    float wOff = (uWidth - 1.0) * 0.45;
    float hatch = 1.0 - smoothstep(0.5 - wOff, 1.5 - wOff*0.6, randomHatch.x + brightness) - 0.3 * abs(randomDelta.z);
    hatchMax = max(hatchMax, hatch);
    return hatch;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    float scaleFactor = 2.0;
    vec4 randomBase = Random(fragCoord * 1.2 / sqrt(scaleFactor) + iTime*0.30*uJitterSpeed);
    vec4 randomDelta = randomBase - Random(fragCoord * 1.2 / sqrt(scaleFactor) + vec2(1.0, -1.0) * 1.5 + iTime*0.30*uJitterSpeed);
    float edgeBrightness = 0.0;
    int edgeLayers = 3;
    for (int i = 0; i < edgeLayers; i++)
    {
        float fi = float(i) / float(edgeLayers - 1);
        edgeBrightness += EdgeContribution(fragCoord, fi, edgeLayers, scaleFactor);
    }
    vec3 color = vec3(1.0) - 0.7 * edgeBrightness * (0.5 + 0.5 * randomBase.z) * 3.0 / float(edgeLayers);
    color = clamp(color, 0.0, 1.0);
    int hatchLayers = 5;
    float hatchAccum = 0.0;
    float hatchMax = 0.0;
    float hatchCount = 0.0;
    for (int i = 0; i < hatchLayers; i++)
    {
        float hatch = HatchLayer(fragCoord, i, scaleFactor, randomDelta, hatchMax);
        hatchAccum += hatch;
        hatchCount += 1.0;
        float brightness = Luminance(fragCoord, vec2(0.0), 0.0, 1.0, scaleFactor) * 1.7;
        if (float(i) > (1.0 - brightness) * float(hatchLayers) && i >= 2) break;
    }
    float hatchMix = clamp(mix(hatchAccum / hatchCount, hatchMax, 0.5), 0.0, 1.0);
    color *= 1.0 - hatchMix;
    // 小尺寸人形的可读剪影：依据场景 Pass 写在 alpha 通道的人形遮罩，压成墨色
    float figM = 0.0;
    for (int i = 0; i < 9; i++)
    {
        float aa = 6.2832 * float(i) / 9.0;
        float rr = 1.0 + 2.5 * Random(vec2(float(i)*7.3, 1.7)).x;
        vec2 px = fragCoord + vec2(cos(aa), sin(aa)) * rr;
        figM += texture(iChannel0, px / iResolution.xy).a;
    }
    figM /= 9.0;
    color = mix(color, vec3(0.10), smoothstep(0.30, 0.55, figM) * 0.8);
    fragColor = vec4(color, 1.0);
}