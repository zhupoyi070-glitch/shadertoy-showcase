
float Line(vec2 a, vec2 b, vec2 U)    // --- Distance to a line segment https://www.shadertoy.com/view/llySRh
{   
    U -= a, b -= a;
	float h = dot( U, b ) / dot(b,b),
          c = clamp(h, 0., 1.);
    return h==c ? length( U - b * c ) : 1e5;   // dist to strict segment
  //return        length( U - b * c );         // dist to segment with round ends
}

float sdEgg( in vec2 p, in float ra, in float rb )
{
    const float k = sqrt(3.0);
    p.x = abs(p.x);
    float r = ra - rb;
    return ((p.y<0.0)       ? length(vec2(p.x,  p.y    )) - r :
            (k*(p.x+r)<p.y) ? length(vec2(p.x,  p.y-k*r)) :
                              length(vec2(p.x+r,p.y    )) - 2.0*r) - rb;
}

float dot2( in vec2 v ) { return dot(v,v); }

//form https://www.shadertoy.com/view/MlKcDD
float sdBezier( in vec2 pos, in vec2 A, in vec2 B, in vec2 C )
{    
    vec2 a = B - A;
    vec2 b = A - 2.0*B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0/dot(b,b);
    float kx = kk * dot(a,b);
    float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
    float kz = kk * dot(d,a);      
    float res = 0.0;
    float p = ky - kx*kx;
    float p3 = p*p*p;
    float q = kx*(2.0*kx*kx-3.0*ky) + kz;
    float h = q*q + 4.0*p3;
    if( h >= 0.0) 
    { 
        h = sqrt(h);
        vec2 x = (vec2(h,-h)-q)/2.0;
        vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        float t = clamp( uv.x+uv.y-kx, 0.0, 1.0 );
        res = dot2(d + (c + b*t)*t);
    }
    else
    {
        float z = sqrt(-p);
        float v = acos( q/(p*z*2.0) ) / 3.0;
        float m = cos(v);
        float n = sin(v)*1.732050808;
        vec3  t = clamp(vec3(m+m,-n-m,n-m)*z-kx,0.0,1.0);
        res = min( dot2(d+(c+b*t.x)*t.x),
                   dot2(d+(c+b*t.y)*t.y) );
        // the third root cannot be the closest
        // res = min(res,dot2(d+(c+b*t.z)*t.z));
    }
    return sqrt( res );
}
float DrawSpider(vec2 uv,ivec2 foot[8] ,float image)
{

    vec2 s0 = texelFetch(iChannel0,foot[0],0).xy;
    vec2 s1 = texelFetch(iChannel0,foot[1],0).xy;
    vec2 s2 = texelFetch(iChannel0,foot[2],0).xy;
    vec2 s3 = texelFetch(iChannel0,foot[3],0).xy;
    vec2 s4 = texelFetch(iChannel0,foot[4],0).xy;
    vec2 s5 = texelFetch(iChannel0,foot[5],0).xy;
    vec2 s6 = texelFetch(iChannel0,foot[6],0).xy;
    vec2 s7 = texelFetch(iChannel0,foot[7],0).xy;
    vec2 s8 = s0+s1+s2+s3+s4+s5+s6+s7;
    s8 =s8/vec2(8.);
    if(iMouse.z!=0.){
    s8 += MouseForce;
    }
    // v5:通关爬行离场——蜘蛛脱离蛛网,沿一条蛛丝直线爬向屏幕外
    // (蛛网本体保持静止;腿部一前一后交替摆动 = 步行动作,频率随焦虑升高)
    if (uCrawl > 0.0) {
        vec2 dir = normalize(uCrawlDir);
        vec2 pp  = vec2(-dir.y, dir.x);
        vec2 p   = uCrawlFrom + dir * (uCrawl * uCrawlLen);
        float ph = iTime * (7.0 + 5.0*uSpiderAnx);
        float am = 0.05 + 0.02*uSpiderAnx;
        s0 = p + dir*( 0.055 + am*sin(ph)      ) + pp* 0.032;
        s1 = p + dir*( 0.025 + am*sin(ph+3.14) ) + pp* 0.046;
        s2 = p + dir*(-0.02  + am*sin(ph+1.57) ) + pp* 0.040;
        s3 = p + dir*(-0.05  + am*sin(ph+4.71) ) + pp*-0.030;
        s4 = p + dir*( 0.05  + am*sin(ph+0.9)  ) + pp*-0.034;
        s5 = p + dir*(-0.01  + am*sin(ph+3.6)  ) + pp*-0.046;
        s6 = p + dir*(-0.04  + am*sin(ph+5.2)  ) + pp*-0.020;
        s7 = p + dir*( 0.02  + am*sin(ph+0.6)  ) + pp* 0.020;
        s8 = p + pp*(0.012*sin(ph*0.5));               // 身体轻微起伏
    }
    // v4:蜘蛛焦虑抖动(仅非爬行状态:爬行时只保留腿部步伐,不再叠加颤抖)
    if (uCrawl <= 0.0) {
        float jf = 40.0 + 90.0*uSpiderAnx;
        vec2 J = uSpiderAnx * 0.012 * vec2( sin(iTime*jf), cos(iTime*jf*1.31) );
        s0 += J*1.2; s1 += J*0.8; s2 += J*1.1; s3 += J*0.9;
        s4 += J*1.0; s5 += J*1.3; s6 += J*0.7; s7 += J*1.15;
        s8 += J*1.4;
    }
    
    float spider = sdBezier(uv,s0,s8+vec2(-0.05,0.0),s8);
    spider = min(spider,sdBezier(uv,s7,s8+vec2(-0.05,0.0),s8));
    spider = min(spider,sdBezier(uv,s1,s8+vec2(-0.1,0.0),s8));
    spider = min(spider,sdBezier(uv,s2,s8+vec2(-0.1,0.0),s8));
    spider = min(spider,sdBezier(uv,s3,s8+vec2(0.05,0.0),s8));
    spider = min(spider,sdBezier(uv,s4,s8+vec2(0.05,0.0),s8));
    spider = min(spider,sdBezier(uv,s5,s8+vec2(0.1,0.0),s8));
    spider = min(spider,sdBezier(uv,s6,s8+vec2(0.1,0.0),s8));
    spider = min(spider,length(uv-s8+vec2(0.00,0.02))-0.03);
    spider = min(spider,sdBezier(uv,s8+vec2(0.005*sin(iTime*10.)*clamp(0.,1.,sin(iTime*2.)-0.7)+0.02,-0.07),s8+vec2(0.03,-0.05),s8+vec2(0.02,0.)));
    spider = min(spider,sdBezier(uv,s8-vec2(0.005*sin(iTime*10.)*clamp(0.,1.,sin(iTime*2.)-0.7)+0.02,0.07),s8+vec2(-0.03,-0.05),s8+vec2(-0.02,0.)));
    spider = min(spider,sdEgg(uv-s8+vec2(0.00,-0.05),0.05,0.00));
    
    spider = min(spider,image*3.);
    
    spider += clamp(1.-length(uv-s8+vec2(0.011,0.038)+vec2(sin(iTime*1.)*0.004,cos(iTime*1.)*0.004))*140.,0.0,1.);
    
    spider += clamp(1.-length(uv-s8+vec2(-0.011,0.038)+vec2(sin(iTime*1.)*0.004,cos(iTime*1.)*0.004))*140.,0.0,1.);
    
    spider += clamp(1.-length(uv-s8+vec2(-0.021,0.021))*190.,0.0,1.);
    
    spider += clamp(1.-length(uv-s8+vec2(0.021,0.021))*190.,0.0,1.);
    
    
    return spider;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    
    ivec2 iU = ivec2(fragCoord);
    vec2 uv = fragCoord/iResolution.y;
    vec4 data = texelFetch(iChannel0,iU,0);
    ivec2 spiderfoot[8] = spiderf;
    float d = 200.;
    float line=1e5;
    for(int x=0;x < GridSize.x;x++){
    	for(int y=0;y < GridSize.y;y++){
        /**/
        if(x > 0){
            vec2 p = texelFetch(iChannel0,ivec2(x,y),0).xy;
            vec2 p1 = texelFetch(iChannel0,ivec2(x-1,y),0).xy;
            line = min(line,Line(p,p1,uv));
        }
        if(y > 0){
            vec2 p = texelFetch(iChannel0,ivec2(x,y),0).xy;
            vec2 p1 = texelFetch(iChannel0,ivec2(x,y-1),0).xy;
            line = min(line,Line(p,p1,uv));
        }
        
    	if(x == 0)
        {
            vec2 p = texelFetch(iChannel0,ivec2(x,y),0).xy;
            vec2 p1 = texelFetch(iChannel0,ivec2(GridSize.x-1,y),0).xy;
            line = min(line,Line(p,p1,uv));
        }
    	}
    }
    vec4 web = vec4(line<0.0015);
    float Spider = DrawSpider(uv,spiderfoot,line);
    
    // Output to screen
    //fragColor = vec4(d<0.01);
    //line = Line(vec2(0.1,0.1),vec2(0.9,0.9),fragCoord/R);
    fragColor = vec4(Spider<0.005);
    //fragColor = vec4(Spider);
}