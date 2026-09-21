const int MAX_STEPS_CAP = 300;   // 姝ユ暟纭笂闄?const int MAX_SPHERES_CAP = 24;   // 鐞冩暟纭笂闄?
float sphere(vec3 pos, float radius, vec3 smpl)
{
    return length(pos - smpl) - radius;
}

float plane(vec3 dir, float offset, vec3 smpl)
{
    return dot(dir, smpl) + offset;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// 浜岀淮鍊煎櫔澹?鏍肩偣闅忔満鍊?+ 骞虫粦鎻掑€?鐢ㄤ簬鏃犲簭澹侀潰璧蜂紡
float vnoise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 绌洪棿鎶樺彔:绠￠亾澹佹尝鍔?+ 鍛ㄦ湡骞抽摵(seg 涓哄綋鍓嶇閬撴缂栧彿)
void foldSpace(inout vec3 smpl, out float seg)
{
    float T1 = uTunnel;
    float T2 = 2.0 * T1;
    float tt = iTime * uWaveSpeed;

    smpl.y += uWaveAmp * ( sin(smpl.z * 0.2 + tt) * sin(tt * 1.33)
             + sin(smpl.x * 0.3 + tt) * sin(tt * 3.22)
             + sin(smpl.x * 0.5 + smpl.z * 0.22 + tt) * sin(tt * 2.22 + smpl.z * 0.1) );
    seg = floor((smpl.z + T1) / T2);
    smpl.x += seg * 7.0;
    smpl.xz = mod(smpl.xz + T1, T2) - T1;
}

// 锠曡櫕(鐞冧綋閾?鐨勮窛绂?float dfWorms(vec3 smpl)
{
    float seg;
    foldSpace(smpl, seg);

    float result = 10000.0;

    for (int i = 0; i < MAX_SPHERES_CAP; i++)
    {
        if (float(i) >= uWormCount) break;
        float t = float(i) / uWormCount;
        float n = t + iTime * uWormSpeed + seg * 0.5;
        vec3 pos = vec3(sin(n * 5.0 * uFreq) * uAmpX,
                        cos(n * 3.0 * uFreq) * uAmpY,
                        cos(n * 2.0 * uFreq) * uAmpZ + 5.0);
        float radius = uWormRadius * (1.0 + uRadiusWave * sin(t * 30.0));
        result = min(result, sphere(pos, radius, smpl));
    }

    return result;
}

// 鍦烘櫙璺濈:铏瓙涓庝笂涓嬬閬撳鍙栬緝杩戣€?// 澹侀潰 = 韫﹀簥寮硅烦(涓嶅绉拌皭娉?蹇帇涓嬨€佹參鍥炲脊)+ 灏戦噺鍣０缁嗚妭;
// 寮硅烦鐩镐綅鐢卞櫔澹板喅瀹?鍚勫尯鍩熼敊寮€銆佹璧峰郊浼?float dfScene(vec3 smpl)
{
    float result = dfWorms(smpl);
    float squeeze = 1.0 + uSqueeze * sin(smpl.z * 0.35 + iTime * 1.5);
    float phase = vnoise(vec2(smpl.z * uRippleFreq * 0.25,
                              smpl.x * uRippleFreq * 0.40)) * 6.2831;
    float x = iTime * uRippleSpeed + phase;
    float bounce = sin(x) + 0.45 * sin(2.0 * x + 1.7) + 0.22 * sin(3.0 * x + 4.2);
    float ripple = uRippleAmp * ( 0.9 * bounce
        + 0.3 * (vnoise(vec2(smpl.z * uRippleFreq * 0.9 - iTime * 0.4,
                             smpl.x * uRippleFreq * 1.3)) - 0.5) );
    result = min(result, plane(vec3(0, -1, 0), 10.0 * squeeze - ripple, smpl));
    result = min(result, plane(vec3(0, 1, 0), 10.0 * squeeze - ripple, smpl));
    return result;
}

vec3 dfNormal(vec3 smpl)
{
    const float E = 0.04;

    float d0 = dfScene(smpl);
    float dX = dfScene(smpl + vec3(E, 0, 0));
    float dY = dfScene(smpl + vec3(0, E, 0));
    float dZ = dfScene(smpl + vec3(0, 0, E));

    return normalize(vec3(dX - d0, dY - d0, dZ - d0));
}

float dfOcclusion(vec3 smpl, vec3 normal)
{
    float N = 1.0;
    return clamp(dfScene(smpl + normal * N) / N, 0.0, 1.0);
}

// 璺濈-閫忔槑搴︽洸绾?杩戣窛绂荤紦鎱㈡秷澶?涓窛(鏈€娓呮櫚璺濈澶?鏈€瀹?杩滆窛娣″叆闆句腑
float distAlpha(float d)
{
    float t = clamp(d / max(uFadeNear, 0.001), 0.0, 1.0);
    float nearA = t * t * (3.0 - 2.0 * t);                       // 0 鈫?1(杩戝缂撴參娣″叆)
    float f = clamp((d - uPeakDist) / max(uFadeFar - uPeakDist, 0.001), 0.0, 1.0);
    float farA = 1.0 - f * f * (3.0 - 2.0 * f);                  // 1 鈫?0(杩滃娣″嚭)
    return nearA * farA;
}

// 鍘熺増閰嶈壊:婕弽灏?+ 鐜鍏?+ 琛ㄩ潰杈夊厜
vec3 shadeSurface(vec3 normal, float occ, float steps)
{
    vec3 diffuse = vec3(0.4, 0.5, 0.6) * dot(normal, normalize(vec3(1.0, 0.3, -1.0)));
    vec3 ambient = vec3(0.4, 0.2, 0.1);
    return (ambient + diffuse) * vec3(1.0 - steps) + pow(1.0 - occ, 1.5) * uGlowColor * uGlow;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec3 opos = vec3(4.5, sin(iTime * 0.4) * uCamBob + 2.0, -7.0 + iTime * uCamSpeed);
    // 鎵嬫寔闀滃ご寮忔檭鍔?澶氶姝ｅ鸡鍙犲姞,閬垮厤鏈烘鎰?
    opos.xy += uJitter * 0.35 * vec2(sin(iTime * 13.7) + sin(iTime * 7.3),
                                     cos(iTime * 11.1) + sin(iTime * 5.9));
    vec3 pos = opos;
    vec3 dir = normalize(vec3((fragCoord.x - iResolution.x * 0.5) / iResolution.y, fragCoord.y / iResolution.y - 0.5, 1.0));
    vec3 normal;

    vec3 acc = vec3(0.0);   // 閫忔槑铏瓙灞傜殑棰滆壊绱
    float trans = 1.0;      // 鍓╀綑閫忚繃鐜?    vec3 bg = uFogColor;    // 涓嶉€忔槑鑳屾櫙(绠￠亾澹佹垨闆?

    for (int i = 0; i < MAX_STEPS_CAP; i++)
    {
        if (i >= uMaxSteps) break;
        float dw = dfWorms(pos);
        float dp = min(plane(vec3(0, -1, 0), 10.0, pos), plane(vec3(0, 1, 0), 10.0, pos));
        float d = min(dw, dp);

        if (d < 0.001)
        {
            float steps = float(i) / float(uMaxSteps);
            if (dw < dp)
            {
                // 鍛戒腑铏瓙:鎸夎窛绂绘洸绾夸笌鍩虹閫忔槑搴︾疮璁￠鑹?鐒跺悗缁х画绌块€?                float a = uWormAlpha * distAlpha(distance(pos, opos));
                if (a > 0.01)
                {
                    normal = dfNormal(pos);
                    float occ = dfOcclusion(pos, normal);
                    float steps = float(i) / float(uMaxSteps);
                    acc += shadeSurface(normal, occ, steps) * a * trans;
                    trans *= 1.0 - a;
                }
                if (trans < 0.02) break;   // 鍚庨潰宸蹭笉鍙
                // 姝ヨ繘绌胯繃褰撳墠鐞冧綋,鐩村埌绂诲紑鍏惰〃闈?                for (int j = 0; j < 160; j++)
                {
                    pos += dir * 0.06;
                    if (dfWorms(pos) > 0.01) break;
                }
            }
            else
            {
                // 鍛戒腑绠￠亾澹?涓嶉€忔槑鑳屾櫙
                normal = dfNormal(pos);
                float occ = dfOcclusion(pos, normal);
                bg = shadeSurface(normal, occ, steps);
                break;
            }
        }
        pos += d * dir * 0.9;   // 鐣ヤ繚瀹堢殑姝ラ暱,闃叉娑熸吉骞呭害澶ф椂绌胯繃澹侀潰
    }

    vec3 color = acc + bg * trans;
    float fogAmt = 1.0 - exp(-distance(opos, pos) * uFogDensity);
    color = mix(color, uFogColor, fogAmt);
    color = (1.0 - exp(-color * 1.5)) * 1.3;
    // 楗卞拰搴?0=鐏板害,1=鍘熷,>1 澧為ケ鍜?    float grey = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(grey), color, uSaturation);
    // 淇″彿骞叉壈:鍣偣 + 鍋跺彂鐨勬暣甯у帇鏆楅棯鐑?    color += (hash(fragCoord + fract(iTime) * 137.0) - 0.5) * uGlitch;
    color *= 1.0 - uGlitch * 0.6 * step(0.72, hash(vec2(floor(iTime * 8.0), 3.0)));
    // 鎵嬬數绛?鐢婚潰鍘嬮粦,浠呴紶鏍囬檮杩戠殑鍏夊湀鍐呭彲瑙併€?    // 杈圭紭鐢卞姩鎬佸櫔澹版壈鍔?涓嶈鍒欍€佺紦鎱㈣爼鍔?,浜績鐣ヨ繃鏇?鍏夌収鍐呭彔棰楃矑闂儊
    float ld = distance(fragCoord, uLightPos) / iResolution.y;
    ld += (vnoise(vec2(fragCoord.x, fragCoord.y) * (4.0 / iResolution.y)
                     + vec2(iTime * 0.35, -iTime * 0.22)) - 0.5)
          * uLightRadius * uLightSoft * 0.9;
    float vis = 1.0 - uDarkness * smoothstep(uLightRadius * (1.0 - uLightSoft), uLightRadius, ld);
    vis *= 1.0 + 0.25 * (1.0 - smoothstep(0.0, max(uLightRadius * 0.5, 0.001), ld)); // 浜績
    float grain = vnoise(fragCoord * (150.0 / iResolution.y)
                         + vec2(fract(iTime * 7.0) * 43.0, fract(iTime * 5.3) * 29.0)) - 0.5;
    color *= vis * (1.0 + uGrain * grain * 2.0);
    fragColor = vec4(color, 1.0);
}