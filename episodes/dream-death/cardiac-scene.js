const nightShirt = '#738e91';
const partnerShirt = '#9f777b';
const roofClothes = [jacket, '#4c5b62'];
const sleepClothes = [nightShirt, '#4e626f'];
const partnerClothes = [partnerShirt, '#574857'];
const point = (a,b,p) => [mix(a[0],b[0],p),mix(a[1],b[1],p)];
const offset = (a,x,y) => [a[0]+x,a[1]+y];

function taperedBone(a,b,r1,r2,color,lit=true) {
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]) || 1;
  const nx=(a[1]-b[1])/length, ny=(b[0]-a[0])/length;
  const side=(p,r)=>[p[0]+nx*r,p[1]+ny*r];
  poly([side(a,-r1),side(a,r1),side(b,r2),side(b,-r2)],color,ink,1.9);
  if (lit) line([side(a,r1*.66),side(b,r2*.59)],'#e3c7a53a',1.2);
}
function hinge(a,end,upper,lower,bend) {
  const dx=end[0]-a[0],dy=end[1]-a[1],raw=Math.hypot(dx,dy) || .001;
  const d=Math.max(Math.abs(upper-lower)+.03,Math.min(raw,upper+lower-.03));
  const x=dx/raw,y=dy/raw;
  const along=(upper*upper+d*d-lower*lower)/(2*d);
  const out=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [[a[0]+along*x-out*y,a[1]+along*y+out*x],[a[0]+d*x,a[1]+d*y]];
}
function cuffHand(wrist,angle,curl,size=1) {
  c.save(); c.translate(...wrist); c.rotate(angle); c.scale(size,size);
  poly([[-5,0],[-6,-9],[-2,-16],[6,-15],[8,-7],[6,0]],skin,ink,1.5);
  for (let i=0;i<4;i++) {
    const x=-4+3*i, y=-22+(i-1.5)**2;
    line([[x,-11],[x+1,y+4*curl],[x+3*curl,y-3+10*curl]],'#65413d',3.3);
    line([[x,-11],[x+1,y+4*curl],[x+3*curl,y-3+10*curl]],lightSkin,2.2);
  }
  line([[-4,-6],[-10,-11],[-7,-16]],skin,3.7);
  line([[-4,-7],[-1,-8],[2,-7]],'#795252',1);
  c.restore();
}
function adult(chest,hip,wrists,ankles,{
  outfit=roofClothes, headAngle=0, facing=1, eyes=0, mouth=0, asleep=false, hat=true,
  hair, armBends=[1,-1], kneeBends=[1,-1], handAngles, shoeAngles=[0,0], grip=[.3,.3],
  scale=1, breath=0, reachSide=.86,
}={}) {
  const [shirt, trousers]=outfit;
  const length=Math.hypot(chest[0]-hip[0],chest[1]-hip[1]) || 1;
  const ux=(chest[0]-hip[0])/length,uy=(chest[1]-hip[1])/length;
  const across=(p,x,y=0)=>[p[0]+scale*(-uy*x+ux*y),p[1]+scale*(ux*x+uy*y)];
  const shoulders=[across(chest,-13*reachSide),across(chest,14*reachSide)];
  const hips=[across(hip,-9),across(hip,9)];
  const waist=point(chest,hip,.71);
  function leg(i) {
    const [knee,ankle]=hinge(hips[i],ankles[i],38*scale,37*scale,kneeBends[i]);
    taperedBone(hips[i],knee,10*scale,7.2*scale,trousers,i===1);
    oval(...knee,7.1*scale,7.1*scale,trousers);
    taperedBone(knee,ankle,7.4*scale,5.3*scale,trousers,i===1);
    c.save(); c.translate(...ankle); c.rotate(shoeAngles[i]); c.scale(scale*facing,scale);
    poly([[-6,-5],[6,-4],[9,1],[18,2],[20,7],[-7,8]],'#28353e',ink,1.7);
    line([[-6,6],[18,6]],'#758088',1); c.restore();
  }
  function arm(i) {
    const [elbow,wrist]=hinge(shoulders[i],wrists[i],32*scale,29*scale,armBends[i]);
    taperedBone(shoulders[i],elbow,8*scale,6.2*scale,shirt,i===1);
    oval(...elbow,6.1*scale,6.1*scale,shirt);
    taperedBone(elbow,wrist,6.4*scale,4.8*scale,shirt,i===1);
    const angle=handAngles?.[i] ?? Math.atan2(wrist[0]-elbow[0],elbow[1]-wrist[1]);
    cuffHand(wrist,angle,grip[i],.77*scale);
  }
  leg(0); arm(0); leg(1);
  poly([across(hip,-15,8),across(hip,15,8),across(hip,13,-9),across(hip,-13,-10)],trousers,ink,2);
  poly([across(chest,-16-breath*.9,0),across(chest,-9,7),across(chest,9,7),
    across(chest,17+breath*1.7,-4),across(waist,13),across(hip,16,2),
    across(hip,-15,2),across(waist,-11)],shirt,ink,2.3);
  poly([across(chest,-15,0),across(chest,-9,4),across(waist,-4),across(hip,-9,2),across(waist,-11)],'#3328323d');
  line([across(chest,5,5),across(waist,4),across(hip,7,3)],'#1e243a55',1.4);
  if (hat) poly([across(chest,8,-18),across(chest,14,-19),across(chest,14,-29),across(chest,8,-28)],'#d6a46b','#8c6142',1);
  const neck=across(chest,0,7);
  const skull=across(chest,0,19);
  taperedBone(neck,skull,6*scale,5.5*scale,skin);
  c.save(); c.translate(...skull); c.rotate(headAngle);
  face(0,0,.62*scale,{hat,hair,turn:facing,blink:asleep?1:0,eyes,mouth}); c.restore();
  arm(1);
}
function roofBody(t,wide=false) {
  night(t);
  c.save();
  if (wide) { c.translate(19,12); c.scale(.86,.86); }
  const letGo=ramp(t,1.80,2.49);
  const swing=pulse(t,1.62,3.12,3.77);
  const fall=clamp((t-3.47)/1.70);
  const descent=fall*fall*211;
  const ledge=[147,150];
  for (let y=214;y<520;y+=61) {
    box(204,y,38,42,'#1b2938');
    box(208,y+4,30,33,y%3===1?'#a68157':'#354857');
    line([[220,y+4],[220,y+37]],'#20303e',2);
  }
  poly([[147,151],[270,122],[270,153],[147,180]],'#828985',ink,2.8);
  poly([[148,176],[270,151],[270,481],[155,481]],'#2d3b49',ink,2.7);
  for (let y=201;y<480;y+=42) line([[153,y],[270,y-25]],'#465563',1.5);
  for (let y=225;y<460;y+=61) {
    box(202,y,39,42,'#172936');
    box(206,y+3,30,32,y%4===1?'#a17c53':'#3d5562');
    line([[220,y+4],[220,y+35]],'#293c49',2);
  }
  const drift=fall*31;
  const chest=[117-10*swing-drift,207+8*swing+descent];
  const hip=[108+13*swing-1.9*drift,265+8*swing+descent];
  const hands=[point([146,162],[85-drift,252+descent],letGo),
    fall===0?ledge:point(ledge,[99-drift,183+descent],ramp(t,3.47,3.81))];
  const feet=[[91+17*swing-2*drift,335+14*swing+descent],[127+12*swing-2.1*drift,336+descent]];
  adult(chest,hip,hands,feet,{headAngle:.19-.29*swing+fall*.38,armBends:[1,-1],kneeBends:[-1,1],
    handAngles:[.55+2.1*letGo,.12+1.4*fall],shoeAngles:[.42+fall*.3,.18+fall*.4],
    grip:[1-letGo,1-ramp(t,3.19,3.48)],mouth:.6,eyes:1,scale:.94,reachSide:.59});
  if (t<3.50 && t>2.75) {
    const dust=ramp(t,2.75,3.50);
    for(let i=0;i<6;i++) oval(149-i*3-8*dust,158+i*1.8+36*dust*dust,1,1.2,'#bac0ae80');
  }
  c.restore();
}
function handMatch(t,bed=false,awake=false) {
  vertical(bed?'#293948':'#172939',bed?'#41393d':'#243541');
  if (bed) {
    poly([[0,97],[270,89],[270,286],[0,304]],awake?'#9faeac':'#676c75',ink,3);
    poly([[0,285],[270,269],[270,350],[0,374]],awake?'#5d7880':'#46465b',ink,3);
    line([[0,316],[270,299]],awake?'#8da3a9':'#7a6c79',2);
    wash(168,206,124,150,awake?'#b1cec335':'#b5916c2c');
  } else {
    for (let y=-30;y<480;y+=58) {
      const lift=85*ramp(t,4.93,6);
      line([[0,y-lift],[270,y+21-lift]],'#415563',4.5);
      line([[48,y-lift+17],[123,y-lift+20]],'#796c60',3);
    }
  }
  const close=awake?ramp(t,56.40,58.18):0;
  const wrist=[137,217+4*close];
  taperedBone([-24,31],[74,139],36,31,bed?nightShirt:jacket);
  taperedBone([74,139],[121,189],31,20,bed?nightShirt:jacket);
  taperedBone([121,189],wrist,20,14,skin);
  if (awake) {
    const second=[181-14*close,258-11*close];
    taperedBone([267,304],second,25,16,partnerShirt);
    cuffHand(second,-1.10,.39,2.18);
  }
  cuffHand(wrist,Math.PI-.53,.14+.73*close,2.5);
}
function roomBase(t) {
  vertical('#263444','#424451');
  poly([[0,357],[270,337],[270,480],[0,480]],'#343542',ink,2);
  for(let y=372;y<481;y+=27) line([[0,y],[270,y-16]],'#252c38',1.5);
  box(15,47,100,136,'#202d3b'); box(21,53,88,123,'#354e63');
  line([[65,53],[65,175]],'#26394a',3);
  line([[22,110],[109,110]],'#26394a',3);
  oval(84,73,11,11,'#9faeaf');
  poly([[13,46],[36,43],[34,179],[9,185]],'#423e54',ink);
  poly([[96,44],[118,45],[119,186],[97,180]],'#403c51',ink);
  box(215,169,46,99,'#453b48'); box(211,171,52,7,'#6c5661');
  line([[237,171],[237,128]],'#796463',4);
  poly([[218,107],[251,104],[262,128],[210,132]],'#b08565',ink,1.9);
  wash(237,127,124,129,'#d2996435');
  if (t>36) {
    const p=(.5+.5*Math.sin(t*6.8))**4;
    wash(62,107,140,125,`rgba(221,63,69,${p*.22})`);
  }
}
function bedTop(t) {
  vertical('#35364a','#272e3a');
  poly([[26,34],[245,39],[258,418],[15,426]],'#4b424e',ink,3);
  poly([[39,64],[230,68],[244,400],[27,408]],'#756f82',ink,3);
  poly([[42,74],[119,77],[120,170],[39,167]],'#aa9a97','#5c5668',2);
  poly([[144,77],[226,80],[233,174],[143,170]],'#af9e99','#5c5668',2);
  line([[44,82],[108,85],[113,153]],'#c1aea2',1.5);
  line([[154,86],[219,89],[224,159]],'#c9ae9e',1.5);
  const gasp=pulse(t,7.38,7.76,8.12)+.46*pulse(t,8.28,8.49,8.67);
  const rise=ramp(t,7.83,8.72);
  adult([178,186-4*gasp],[175,245],[[153,223],[220,242]],[[156,311],[195,312]],{
    outfit:sleepClothes,hat:false,asleep:true,headAngle:1.07,handAngles:[2.8,2.74],mouth:gasp*.91,breath:gasp});
  adult([81,179-21*rise],[94,238],[[47,215],[121+18*rise,201-5*rise]],[[70,306],[114,307]],{
    outfit:partnerClothes,hair:'#593d48',hat:false,headAngle:.45-.52*rise,asleep:rise<.3,eyes:.9,scale:.95});
  poly([[36,226],[95,233],[146,231-6*gasp],[229,227-5*gasp],[243,396],[28,404]],'#596279',ink,3);
  poly([[37,227],[98,233],[152,228-5*gasp],[230,227-5*gasp],[232,250],[123,253],[36,249]],'#788092');
  line([[57,258],[70,381],[217,375]],'#454c64',2.2);
  line([[102,266],[116,327],[110,378]],'#89919c55',1.6);
  wash(174,142,113,94,'#c29d732e');
}
function bedside(t) {
  roomBase(t);
  c.save();
  c.translate(128,239); c.scale(1.19,1.19); c.translate(-141,-242);
  poly([[13,297],[163,246],[236,273],[91,333]],'#806f80',ink,3);
  poly([[13,297],[91,332],[235,273],[229,350],[90,411],[12,369]],'#555269',ink,3);
  poly([[140,252],[170,220],[202,236],[181,279]],'#b5a29d','#716471',2);
  const contact=ramp(t,9.15,9.82);
  const shaking=pulse(t,10.12,10.67,11.72);
  const shoulder=2.7*Math.sin((t-10.12)*19)*shaking;
  const lag=2.3*Math.sin((t-10.24)*19)*pulse(t,10.24,10.79,11.84);
  const gasp=.55*pulse(t,9.16,9.47,9.68);
  adult([142+shoulder,258-3*gasp],[99,286],[[124,271],[144+lag,317+1.2*lag]],[[41,293],[45,310]],{
    outfit:sleepClothes,hat:false,asleep:true,headAngle:1.22+.027*lag,
    handAngles:[2.13,2.66],mouth:gasp,armBends:[1,1],shoeAngles:[1.22,1.30],breath:gasp,scale:.94,reachSide:.7});
  poly([[27,290],[104,266],[119,277],[136,313],[63,344],[13,317]],'#687089',ink,2.5);
  line([[45,298],[94,284],[106,294]],'#9299a0',1.3);
  const retreat=ramp(t,12.06,13.38);
  const shoulderCheck=point([188,288],[156+shoulder,263],contact-.32*retreat);
  adult([219-9*contact+5*retreat,240+11*contact],[243,318],[shoulderCheck,[237,284]],[[249,392],[220,388]],{
    outfit:partnerClothes,headAngle:-.43-.2*contact,facing:-1,hat:false,hair:'#593d48',
    eyes:.88,mouth:pulse(t,9.12,9.53,10.02)*.67,armBends:[-1,1],handAngles:[-1.9,2.5],scale:1.02});
  wash(163,228,86,118,'#b994791b');
  c.restore();
}
function heartCutaway(t) {
  vertical('#291c2d','#372b3c');
  wash(143,215,149,143,'#a752553d');
  poly([[50,69],[111,40],[147,41],[218,81],[239,339],[206,365],[62,366],[28,336]],'#352d3e','#655160',2.3);
  for (let i=0;i<5;i++) {
    const y=112+i*28;
    line([[65-i*2,y],[105,y+20],[136,y+21],[170,y+13],[207+i*2,y-3]],'#7a627155',3.5);
  }
  const fibrillation=ramp(t,15.8,17.32);
  const contraction=(1-fibrillation)*Math.max(pulse(t,14.88,14.98,15.43),pulse(t,15.73,15.84,16.29));
  const quiver=fibrillation*(.5+.5*Math.sin(t*35+Math.sin(19*t)*1.9));
  c.save();
  c.translate(137,200); c.scale(1-.085*contraction+.018*quiver,1-.10*contraction-.023*quiver);
  line([[-11,-30],[-12,-89],[0,-107],[21,-109],[33,-93],[29,-71]],'#3d2636',22);
  line([[-11,-30],[-12,-89],[0,-107],[21,-109],[33,-93],[29,-71]],'#9d5158',15);
  line([[10,-45],[-16,-69],[-45,-69],[-63,-56]],'#432937',15);
  line([[10,-45],[-16,-69],[-45,-69],[-63,-56]],'#617b88',10);
  c.beginPath();
  c.moveTo(-11,-45); c.bezierCurveTo(-37,-67,-64,-44,-61,-5);
  c.bezierCurveTo(-59,35,-20,70,19,86);
  c.bezierCurveTo(48,92,60,56,57,17);
  c.bezierCurveTo(53,-22,28,-55,-11,-45);
  c.closePath(); c.fillStyle='#aa535a'; c.fill(); c.lineWidth=3; c.strokeStyle='#402737'; c.stroke();
  poly([[-54,-10],[-42,-33],[-20,-27],[-1,-1],[21,63],[-12,43],[-37,22]],'#6e4659','#cd7773',2);
  poly([[0,-22],[33,-15],[47,14],[44,52],[22,74],[5,43],[-6,5]],'#79384a','#d78d81',3);
  line([[-31,-39],[-17,-17],[-19,4],[-4,21],[5,39]],'#e99385',2.7);
  line([[18,-41],[16,-18],[29,4],[28,29],[34,58]],'#e08a7d',2.7);
  if(fibrillation>.02) {
    for(let i=0;i<6;i++) {
      const a=Math.sin(t*29+i*2.4);
      const x=-24+i*10+3*a, y=12+i*5+5*Math.sin(t*36+i);
      line([[x-3,y],[x+2,y-9],[x+1,y+1],[x+8,y-5]],`rgba(255,184,124,${fibrillation*(.4+.3*a)})`,1.8);
    }
  }
  c.restore();
  line([[30,322],[240,322]],'#62414e',1);
  const trace=[];
  for(let x=30;x<=240;x+=2) {
    const phase=(x+89*t)%67;
    const normal=(phase>24&&phase<36)?Math.sin((phase-24)*Math.PI/6)*17:0;
    const irregular=7*Math.sin(x*.21+9*t)+5*Math.sin(x*.72+22*t)+4*Math.sin(x*.51-13*t);
    trace.push([x,322-mix(normal,irregular,fibrillation)]);
  }
  line(trace,fibrillation>.4?'#e88976':'#93c1b6',1.55);
  text(fibrillation>.48?'VENTRICULAR FIBRILLATION':'COORDINATED BEAT',135,336,10,'#efd2c0','center');
}
function callInsert(t) {
  roomBase(t);
  poly([[0,191],[270,147],[270,331],[0,389]],'#66515b',ink,3);
  line([[0,210],[269,165]],'#957367',2.6);
  const ring=ramp(t,23.54,24.68);
  c.save(); c.translate(139,241); c.rotate(-.14);
  poly([[-46,-71],[39,-73],[51,-62],[51,75],[-42,77],[-52,66],[-53,-62]],'#242a35',ink,3.1);
  poly([[-42,-62],[38,-62],[41,64],[-42,65]],ring>.7?'#b0c7c6':'#809d9e','#3f575c',2);
  box(-15,-67,31,3,'#56616b');
  text('EMERGENCY CALL',0,-35,8.5,'#2d4b53','center');
  text(ring>.7?'Speaker on':'Calling…',0,-10,10,'#3f6266','center');
  oval(0,24,14,14,ring>.7?'#63877f':'#9d605e');
  line([[-6,24],[-2,24],[3,19],[3,29],[-2,25]],'#e7efdc',1.8);
  if (ring>.7) line([[7,21],[9,24],[7,27]],'#e7efdc',1.8);
  c.restore();
  const tap=pulse(t,23.54,24.65,25.96);
  cuffHand([177-24*tap,335-47*tap],-.12,.58-.45*tap,2.05);
  taperedBone([198,426],[177-24*tap,335-47*tap],24,12,partnerShirt);
}
function compression(t,start,end) {
  if (t<start || t>=end) return 0;
  return Math.sin(Math.PI*((t-start)*110/60%1))**2;
}
function defibBox(x,y,t) {
  poly([[x-17,y+1],[x-12,y-13],[x+23,y-17],[x+30,y-5],[x+27,y+21],[x-16,y+22]],'#303942',ink,2.4);
  box(x-8,y-8,26,12,'#223841'); box(x-7,y-7,24,9,'#476364');
  line([[x-7,y-3],[x-2,y-3],[x+1,y-7],[x+3,y],[x+6,y-4],[x+16,y-4]],t<42.48?'#e18d69':'#acca9e',1.2);
  oval(x+12,y+12,2.8,2.8,'#c2906c');
  oval(x+20,y+11,2.8,2.8,'#a39c75');
}
function rescueFloor(t) {
  roomBase(t);
  c.save();
  c.translate(133,280); c.scale(1.10,1.10); c.translate(-133,-294);
  poly([[0,336],[215,287],[270,319],[270,479],[0,479]],'#55505b',ink,2.6);
  for(let x=-75;x<338;x+=43) line([[101+x*.50,318],[x,480]],'#383641',1.55);
  for(let y=341;y<465;y+=27) line([[0,y],[270,y-23]],'#3d3a46',1.7);
  poly([[0,268],[104,245],[113,306],[0,346]],'#5b536b',ink,2.9);
  line([[0,287],[103,262]],'#82738a',2);
  const paramedics=t>=36.0;
  const approach=paramedics?0:1-ramp(t,26.75,28.71);
  const press=paramedics?compression(t,37.12,41.27)+compression(t,42.81,46.96):compression(t,28.75,36);
  const shock=pulse(t,42.45,42.53,42.79);
  const y=336+3.3*press-2.2*shock;
  oval(128,361,105,13,'#2523327d');
  adult([157,y],[106,346],[[129,360],[172,353]],[[36,350],[40,369]],{
    outfit:sleepClothes,hat:false,asleep:true,headAngle:1.38,scale:.94,armBends:[1,-1],
    kneeBends:[1,-1],handAngles:[2.2,2.76],shoeAngles:[1.54,1.53],reachSide:.61});
  if (paramedics) {
    poly([[142,326],[169,321],[172,337],[145,348],[127,349]],'#b98c79',ink,1.65);
    poly([[151,323],[162,321],[167,329],[164,337],[153,336]],'#e3d8c7','#6b747a',1.2);
    poly([[131,338],[143,336],[147,343],[144,351],[131,351]],'#e3d8c7','#6b747a',1.2);
    line([[151,331],[133,315],[187,308],[229,335]],'#1f3742',1.75);
    line([[134,349],[117,385],[190,393],[229,348]],'#263743',1.45);
    defibBox(233,336,t);
  }
  const back=paramedics?(ramp(t,40.76,41.61)-ramp(t,42.58,42.82)):0;
  const elbowHeight=press*4;
  const braceY=327+press*3;
  const chest=[152+28*back+15*approach,264+elbowHeight-9*back-7*approach];
  const palms=[[151+46*back+10*approach,braceY-31*back-26*approach],
    [154+42*back+13*approach,braceY-29*back-23*approach]];
  const helpers=paramedics?['#4d767a','#35505a']:partnerClothes;
  adult(chest,[199+13*back,302],palms,[[241,355],[219,365]],{
    outfit:helpers,hat:false,hair:paramedics?'#392b30':'#593d48',
    headAngle:-.26-.2*back,facing:-1,eyes:.62,scale:1,armBends:[-1,1],
    handAngles:[2.48,2.59],shoeAngles:[.57,.51],reachSide:.24});
  if (paramedics) {
    oval(185,272,5.5,4,'#b5a783');
  } else {
    poly([[220,383],[239,380],[242,390],[222,394]],'#262d36','#121d29',1.4);
    line([[224,386],[236,384]],'#91adad',2);
  }
  c.restore();
}
function padsInsert(t) {
  vertical('#4f434f','#504650');
  const release=ramp(t,40.65,41.67);
  const jolt=2.6*pulse(t,42.45,42.53,42.79);
  c.save(); c.translate(0,-jolt);
  poly([[18,276],[57,206],[90,184],[186,183],[214,209],[251,280],[223,346],[55,346]],nightShirt,ink,3);
  poly([[82,193],[106,165],[144,163],[176,181],[188,226],[176,304],[158,331],[97,318],[77,264]],'#ba8f7d',ink,2);
  line([[134,181],[137,272],[131,305]],'#926463',2.1);
  c.save(); c.translate(129,140); c.rotate(-.14);
  face(0,0,1.04,{hat:false,blink:1}); c.restore();
  poly([[145,201],[177,199],[181,225],[149,232]],'#ede1cf','#868688',2);
  poly([[88,270],[118,267],[121,290],[90,296]],'#ede1cf','#868688',2);
  line([[155,209],[215,228],[248,251]],'#393d49',2.1);
  line([[103,279],[198,310],[251,268]],'#393d49',2.1);
  const rightHand=[203+99*release,177-31*release];
  const leftHand=[54-94*release,270-7*release];
  taperedBone([286,162],rightHand,23,10,'#4d767a');
  taperedBone([-15,271],leftHand,22,10,'#4d767a');
  cuffHand(rightHand,-1.60,.22,1.52);
  cuffHand(leftHand,1.52,.18,1.5);
  defibBox(233,257,t);
  c.restore();
  const light=(.5+.5*Math.sin(t*6.8))**4;
  wash(36,136,151,130,`rgba(221,63,69,${light*.22})`);
}
function recovery(t) {
  vertical('#52676a','#79918f');
  box(21,36,97,155,'#425b61'); box(27,43,85,143,'#91b1b8');
  line([[69,43],[69,186]],'#5c8088',2);
  box(156,97,91,64,'#394f56'); box(163,104,77,47,'#233c44');
  const beat=[];
  for (let x=168;x<236;x+=1.5) {
    const q=(x+31*t)%38;
    beat.push([x,129-(q>15 && q<23 ? 8*Math.sin((q-15)*Math.PI/4) : 0)]);
  }
  line(beat,'#a5d4b1',1.3);
  wash(196,128,76,40,'#8fe7b725');
  line([[208,163],[207,267],[174,293]],'#425c61',2.1);
  poly([[4,303],[176,247],[233,279],[96,352]],'#a4b6b2',ink,3);
  poly([[4,303],[96,350],[233,279],[230,334],[96,406],[4,354]],'#536c77',ink,3);
  poly([[141,254],[164,219],[197,230],[182,278]],'#c4c7b7','#717f7e',1.8);
  const wake=ramp(t,47.2,48.32);
  adult([144,263],[95,293],[[123,281],[147,311]],[[36,314],[42,328]],{
    outfit:['#8babb2','#506674'],hat:false,asleep:wake<.67,headAngle:1.17,eyes:.81,
    armBends:[-1,1],handAngles:[2.08,2.40],shoeAngles:[1.20,1.29],scale:.92});
  poly([[10,308],[99,267],[117,275],[140,314],[65,351],[11,324]],'#77969b',ink,2.2);
  line([[25,314],[95,285],[109,295]],'#aac1bb',1.7);
  const lean=ramp(t,49.05,54.65);
  adult([222-17*lean,245+3*lean],[237,306],[[238,283],[159+11*(1-lean),301]],[[242,365],[213,366]],{
    outfit:partnerClothes,hat:false,hair:'#593d48',facing:-1,headAngle:-.33-.17*lean,eyes:.45,
    scale:.91,armBends:[1,-1],handAngles:[2.74,-1.9]});
  if (t<49.64) text('LATER',26,218,10,'#c6d4cc');
  wash(78,152,139,185,'#c8e4d031');
}

function cardiacOpening(t) {
  if (t<3.53) roofBody(t);
  else if (t<4.91) roofBody(t,true);
  else if (t<6.0) handMatch(t);
  else if (t<6.79) handMatch(t,true);
  else if (t<9.0) bedTop(t);
  else bedside(t);
}
window.renderCardiacFrame=(t,pages=[])=>{
  c.setTransform(4,0,0,4,0,0);
  c.save();
  if(t<14) cardiacOpening(t);
  else if(t<20.45) heartCutaway(t);
  else if(t<23) bedside(t);
  else if(t<26.38) callInsert(t);
  else if(t<39.94) rescueFloor(t);
  else if(t<42.79) padsInsert(t);
  else if(t<47) rescueFloor(t);
  else if(t<55.23) recovery(t);
  else handMatch(t,true,true);
  c.restore();
  c.drawImage(grain,0,0);
  const vignette=c.createRadialGradient(132,227,117,135,237,267);
  vignette.addColorStop(0,'#05091100'); vignette.addColorStop(1,'#07091383');
  box(0,0,270,480,vignette);
  captionAt(t,pages);
};
