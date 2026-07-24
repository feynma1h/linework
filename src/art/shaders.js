/* ============================================================
   In Motion — GPU shader pieces.

   Each is a fragment shader: a tiny program your graphics card
   runs for every pixel, sixty times a second. Same ideas as the
   plotted work (fields, level sets, line screens) but alive and
   never repeating. These export as PNG snapshots rather than SVG.

   To add one: append an object with `params` (two sliders → u_p0,
   u_p1) and `frag` (GLSL). The uniforms below are always in scope.
   ============================================================ */

/* Uniforms available to every fragment shader. */
export const GL_HEADER =
  'precision highp float;\n' +
  'uniform vec2 u_res;uniform float u_time;\n' +
  'uniform float u_p0;uniform float u_p1;\n' +
  'uniform vec3 u_ink;uniform vec3 u_crimson;uniform vec3 u_blue;\n';

export const SHADERS = [
{
  title: "Standing Field",
  equation: "f(p,t) = Σ sin(kᵢ·p + ωᵢt) → level sets",
  params: [
    { label: "frequency", min: 1, max: 6, step: 0.1, value: 3 },
    { label: "contours",  min: 2, max: 10, step: 0.5, value: 5 },
  ],
  frag:
  'void main(){\n' +
  '  vec2 p=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);\n' +
  '  float t=u_time*.25;\n' +
  '  float f=0.;\n' +
  '  f+=sin((p.x*cos(t*.7)+p.y*sin(t*.7))*u_p0*6.28318+t);\n' +
  '  f+=sin((p.x*cos(t*.5+2.1)+p.y*sin(t*.5+2.1))*u_p0*5.1-t*1.3);\n' +
  '  f+=sin(length(p-vec2(.32*cos(t*.9),.32*sin(t*1.2)))*u_p0*8.+t*.7);\n' +
  '  f/=3.;\n' +
  '  float v=f*u_p1;\n' +
  '  float d=abs(fract(v)-.5);\n' +
  '  float a=smoothstep(.40,.46,d)*.85;\n' +
  '  float idx=floor(v+.5);\n' +
  '  vec3 col=mix(u_ink,u_crimson,step(mod(idx,5.),.5)*.9);\n' +
  '  gl_FragColor=vec4(col*a,a);\n' +
  '}'
},
{
  title: "Ink Marble",
  equation: "v = fbm(p + β·fbm(p + t)) → level sets",
  params: [
    { label: "scale", min: 1, max: 6, step: 0.1, value: 2.4 },
    { label: "warp β", min: 0, max: 4, step: 0.1, value: 1.8 },
  ],
  frag:
  'float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}\n' +
  'float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);\n' +
  '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}\n' +
  'float fbm(vec2 q){float s=0.;float amp=.5;\n' +
  '  for(int i=0;i<5;i++){s+=amp*noise(q);q*=2.02;amp*=.5;}return s;}\n' +
  'void main(){\n' +
  '  vec2 p=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);\n' +
  '  float t=u_time*.05;\n' +
  '  vec2 q=p*u_p0+vec2(7.3,2.1);\n' +
  '  vec2 warp=vec2(fbm(q+vec2(t,-t*.7)),fbm(q+vec2(5.2+t*.6,1.3-t)));\n' +
  '  float v=fbm(q+u_p1*warp)*14.;\n' +
  '  float d=abs(fract(v)-.5);\n' +
  '  float a=smoothstep(.36,.45,d)*.8;\n' +
  '  float m=fbm(q*.5+warp);\n' +
  '  vec3 col=mix(u_ink,u_blue,smoothstep(.35,.75,m));\n' +
  '  col=mix(col,u_crimson,smoothstep(.78,.95,m)*.8);\n' +
  '  gl_FragColor=vec4(col*a,a);\n' +
  '}'
},
{
  title: "Turning Gratings",
  equation: "I = L(θ₀) · L(θ₀+δ(t)) — two line screens, one turning",
  params: [
    { label: "density", min: 0.5, max: 3, step: 0.05, value: 1.4 },
    { label: "speed",   min: 0,   max: 4, step: 0.1,  value: 1 },
  ],
  frag:
  'float grat(vec2 p,float ang,float f){\n' +
  '  float s=sin((cos(ang)*p.x+sin(ang)*p.y)*f);\n' +
  '  return smoothstep(.45,.8,s);\n' +
  '}\n' +
  'void main(){\n' +
  '  vec2 p=(gl_FragCoord.xy-.5*u_res)/min(u_res.x,u_res.y);\n' +
  '  float t=u_time*u_p1*.05;\n' +
  '  float l1=grat(p,t*.3,u_p0*40.);\n' +
  '  float l2=grat(p,.6+t,u_p0*40.*1.02);\n' +
  '  float mask=smoothstep(.72,.66,length(p));\n' +
  '  float a=clamp(l1*.55+l2*.45,0.,1.)*mask;\n' +
  '  vec3 rgb=(u_blue*l1*.55+u_crimson*l2*.45)*mask;\n' +
  '  gl_FragColor=vec4(rgb,a);\n' +
  '}'
},
];
