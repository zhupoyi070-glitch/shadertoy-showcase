
uniform float R1;   // 蛛网节点间距(v2 滑杆,原 0.02)

vec2 HukeLaw(in vec2 localP,in vec2 otherP,float k,float r){
	vec2 AB = otherP - localP;
	float dis_AB = max(length(AB), 1e-6);   // 稳健性修复:防止两节点重合时 0/0=NaN 污染整个状态
    vec2 dir_AB = AB / dis_AB;
    return (dis_AB - r)*k * dir_AB;
}

vec4 GetP(in ivec2 iU){
	return texelFetch(iChannel0,iU,0);
}
vec2 GetOtherP(in ivec2 iU,in ivec2 offset){
	return texelFetch(iChannel0,iU+offset,0).xy;
}

vec2 Simulation(vec2 localP,ivec2 iU,ivec2 offset,float k,float r){
	vec2 otherP = GetOtherP(iU,offset);	    	
	return HukeLaw(localP,otherP,K,r);
}
vec2 Simulation1(vec2 localP,ivec2 iU0,ivec2 iU1,float k,float r){
	vec4 otherP = GetP(iU1);	    	
	return HukeLaw(localP,otherP.xy,K,r);
}

vec2 Constraint(in ivec2 iU,in vec2 localP){
    
    float r1 = R1*(float(iU.y)*0.8+1.);
    float r2 = R1*(float(iU.y)*0.1+1.);
    //spider node force  蛛网上下左右
    //径向拉力
    if(iU.x >0)
    {
        localP += Simulation(localP,iU,ivec2(-1, 0),K,r1);
    }
    if(iU.x < GridSize.x -1)
    {
    	localP += Simulation(localP,iU,ivec2( 1, 0),K,r1);
    }
    //横向拉力
    if(iU.y > 0)
    {
        localP += Simulation(localP,iU,ivec2( 0,-1),K,r1);
    }
    
    if(iU.y < GridSize.y - 1)
    {
    	localP += Simulation(localP,iU,ivec2( 0, 1),K,r2);
    }
    //Suture 缝合
    if(iU.x == 0)
    {
        localP += Simulation(localP,iU,ivec2( GridSize.x - 1, 0),K,r1);
    }
    if(iU.x == GridSize.x-1)
    {
        localP += Simulation(localP,iU,ivec2( 1-GridSize.x, 0),K,r1);
    }
    //center force 中心拉力
	if(iU.y == 0)
    {
        int halfroot = (GridSize.x)/2;
        int offset = 1;
        offset = iU.x>=halfroot?-halfroot:halfroot;
        localP += Simulation(localP,iU,ivec2(offset,0),K,r1);
    }
    
    return localP;
}

vec2 Spider(in ivec2 iU,in vec2 localP, ivec2 foot[8])
{
    vec2 spiderP = vec2(0.,0.);
    float r = 0.15+sin(iTime*0.5)/60.;
    for(int i =0;i<8;i++)
    {
     spiderP +=GetP(foot[i]).xy;
    }
    spiderP/=8.;
    if(iMouse.z!=0.){
    spiderP+=MouseForce;
    }
    if(iU ==foot[0])
    {
        
        localP += HukeLaw(localP,spiderP,K,r);
    }
    
    if(iU ==foot[1])
    {
        
        localP += HukeLaw(localP,spiderP,K,r);
    }
    if(iU ==foot[2])
    {
        
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    if(iU ==foot[3])
    {
       
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    if(iU ==foot[7])
    {
       
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    if(iU ==foot[6])
    {
        
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    if(iU ==foot[5])
    {
       
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    if(iU ==foot[4])
    {
       
        localP += HukeLaw(localP,spiderP,K,r);
        
    }
    
     return localP;
}

//Verlet Intergral

vec4 VerletIntegral(in ivec2 iU){
	vec4 P = GetP(iU);
    ivec2 spiderfoot[8] = spiderf ;
    if(iU.y == GridSize.y-1 ){
   
        float j = float(iU.x)/float(GridSize.x+1)*PI*2.;
        vec2 sphere = vec2(sin(j)/.9+1.1,cos(j)/.9+0.5);
        sphere = clamp(sphere,vec2(0.5,-0.15),vec2(1.75,0.95));
    	P.xy = vec2(iU.x,iU.y)*R1+sphere;
    }
    
    vec2 PreviousP = P.zw;
    vec2 CurrentP = Constraint(iU,P.xy);
    CurrentP = Spider(iU,CurrentP.xy,spiderfoot);
    vec2 NextP = CurrentP + (CurrentP - PreviousP)*(1.-Friction) + Gravity*iTimeDelta*iTimeDelta/2.;
    
    PreviousP = CurrentP;

    // 稳健性修复:位置钳制,防止拖拽激振后 Verlet 发散到 Inf/NaN
    NextP = clamp(NextP, vec2(-5.0), vec2(5.0));

    return vec4(NextP,PreviousP);
}

void mainImage( out vec4 C, in vec2 U )
{
    ivec2 iU = ivec2(U);
    if(any(greaterThanEqual(iU,GridSize)))
        return ;
    
    if(iFrame == 0)
    {
        float j = float(iU.x)/float(GridSize.x+1)*PI*2.;
        vec2 sphere = vec2(sin(j)/.8+0.8,cos(j)/.8+0.9);
        sphere = clamp(sphere,vec2(0.5,-0.13),vec2(1.75,0.9));
        C = vec4((vec2(iU.x,iU.y)*R1+sphere).xyxy);
        //C= vec4(0.5);
        }
    else
    	C = VerletIntegral(iU);
    
	//C.r = 1.;
}