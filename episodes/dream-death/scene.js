const scene = document.querySelector('#scene');
const c = scene.getContext('2d', {alpha: false});
const ink = '#10141d';
const skin = '#bd8f6e';
const lightSkin = '#e1ba8a';
const jacket = '#c39055';
const shadow = '#765741';
const cap = '#354b50';
const mix = (a,b,p) => a+(b-a)*p;
const clamp = n => Math.min(1,Math.max(0,n));
const ease = n => { const p = clamp(n); return p*p*(3-2*p); };
const ramp = (t,a,b) => ease((t-a)/(b-a));
const pulse = (t,a,b,d) => ramp(t,a,b)-ramp(t,b,d);

function poly(points,fill,stroke,width=1.5) {
  c.beginPath();
  for (const [i,p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
  c.closePath();
  c.fillStyle=fill; c.fill();
  if (stroke) { c.strokeStyle=stroke; c.lineWidth=width; c.stroke(); }
}
function line(points,color,width=1) {
  c.beginPath();
  for (const [i,p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p);
  c.strokeStyle=color; c.lineWidth=width; c.lineJoin='round'; c.lineCap='round'; c.stroke();
}
function box(x,y,w,h,color) { c.fillStyle=color; c.fillRect(x,y,w,h); }
function oval(x,y,rx,ry,color) {
  c.beginPath(); c.ellipse(x,y,rx,ry,0,0,2*Math.PI); c.fillStyle=color; c.fill();
}
function wash(x,y,rx,ry,color) {
  c.save(); c.translate(x,y); c.scale(rx,ry);
  const lamp = c.createRadialGradient(0,0,0,0,0,1);
  lamp.addColorStop(0,color); lamp.addColorStop(1,'transparent');
  box(-1,-1,2,2,lamp); c.restore();
}
function vertical(top,bottom) {
  const g = c.createLinearGradient(0,0,0,480);
  g.addColorStop(0,top); g.addColorStop(1,bottom); box(0,0,270,480,g);
}
function text(text,x,y,size,color,align='left') {
  c.textAlign=align; c.font=`bold ${size}px Arial`; c.fillStyle=color; c.fillText(text,x,y);
}

// The same brim, jacket seam, and scar distinguish both versions of the lead.
function face(x,y,s,{eyes=0,blink=0,turn=1,mouth=0,double=false,hat=true,hair='#493742'}={}) {
  c.save(); c.translate(x,y); c.scale(s*turn,s);
  const tone = double ? '#ce9b79' : skin;
  poly([[-19,-19],[-8,-33],[15,-31],[24,-19],[24,-3],[32,5],[24,10],[23,22],[8,29],[-12,20],[-19,6]],tone,ink,2.6);
  poly([[-17,-16],[-11,-18],[-8,9],[5,26],[-9,21],[-18,8]],'#78584f');
  if (hat) {
    poly([[-22,-20],[-26,-33],[-15,-46],[9,-50],[29,-39],[33,-24],[-8,-21]],cap,ink,2.7);
    poly([[-24,-34],[-14,-43],[9,-47],[25,-40],[-13,-31]],'#52666b');
    poly([[-14,-22],[23,-27],[44,-22],[43,-18],[5,-15],[-19,-18]],'#202c34',ink,1.6);
  } else {
    poly([[-19,-2],[-24,-17],[-18,-33],[-5,-42],[14,-40],[24,-32],[26,-22],[14,-23],[1,-31],[-8,-21],[-9,-7]],hair,ink,2.3);
    line([[-18,-27],[-6,-37],[9,-36]],'#876364',1.5);
  }
  oval(-12,-1,5,7,'#a67560'); line([[-12,-4],[-14,-2],[-11,2]],'#593e3b',1.3);
  line([[6,-14],[15,-16],[22,-12]],'#56403e',2);
  if (blink>.6) line([[9,-8],[16,-7],[21,-8]],ink,2);
  else {
    oval(15,-8,7,4.9,'#eee0be');
    oval(15+3.8*eyes,-7.7,2.9,3.6,double?'#55332b':'#293539');
    oval(14.6+3.8*eyes,-9,1,.85,'#fff1c9');
  }
  line([[19,15],[26,14],[25,17+5*mouth],[18,17+5*mouth]],'#4f3033',2+mouth);
  c.restore();
}
function person(x,y,s,{direction=1,tilt=0,stride=0,arm=0,mouth=0,blink=0,eyes=0,double=false,alpha=1}={}) {
  c.save(); c.translate(x,y); c.scale(s*direction,s); c.rotate(tilt); c.globalAlpha=alpha;
  line([[-12,-55],[-17+stride,-27],[-23+stride,0],[stride-9,0]],ink,19);
  line([[-12,-55],[-17+stride,-27],[-23+stride,0]],'#354349',13);
  line([[9,-55],[13-stride,-27],[6-stride,1],[20-stride,1]],ink,19);
  line([[9,-55],[13-stride,-27],[6-stride,1]],'#526064',13);
  poly([[-23,-103],[-13,-116],[14,-116],[25,-106],[28,-51],[4,-46],[-23,-50]],jacket,ink,2.8);
  poly([[-23,-103],[-13,-110],[-8,-56],[-19,-51]],shadow);
  line([[7,-110],[11,-49]],'#684b3e',4);
  poly([[15,-82],[25,-83],[26,-68],[17,-68]],'#d0a164','#805e42');
  line([[-13,-99],[-28,-77],[-21-4*arm,-60-12*arm]],'#825b43',12);
  line([[19,-104],[29+7*arm,-80-23*arm],[30+20*arm,-62-33*arm]],ink,14);
  line([[19,-104],[29+7*arm,-80-23*arm],[30+20*arm,-62-33*arm]],'#b18050',10);
  oval(30+20*arm,-62-33*arm,5,6,lightSkin);
  face(0,-132,1,{mouth,blink,eyes,double});
  c.restore();
}
function hand(x,y,s,angle=0,spread=0,reverse=false,double=false) {
  c.save(); c.translate(x,y); c.rotate(angle); c.scale(reverse?-s:s,s);
  poly([[-15,15],[13,14],[27,106],[-22,106]],jacket,ink,2.4);
  poly([[-16,23],[-5,20],[-4,105],[-21,105]],shadow);
  poly([[-13,18],[-15,-2],[-9,-16],[7,-17],[16,-8],[15,12],[10,20]],double?'#d9a887':skin,ink,2);
  for (let i=0;i<4;i++) {
    const px=-9+i*6;
    const py=-24+(i===0?4:0)+spread*(i+1)*4;
    line([[px,4],[px+spread*6,py+7],[px+2+spread*5,py]],ink,7);
    line([[px,4],[px+spread*6,py+7],[px+2+spread*5,py]],lightSkin,4.5);
  }
  line([[9,7],[19,1],[19,-4]],ink,7);
  line([[9,7],[19,1],[19,-4]],skin,4.5);
  line([[-12,10],[-7,11],[-4,9]],'#66424a',1.4);
  c.restore();
}
function building(x,y,w,h,front,right=false) {
  box(x,y,w,h,front);
  box(right?x:x+w-6,y,6,h,'#121a27');
  for (let j=0;j<Math.ceil(h/27);j++) for (let i=0;i<Math.floor(w/23);i++) {
    const px=x+8+i*23, py=y+10+j*27;
    if (py+13>y+h) continue;
    const lit=(i*17+j*7+Math.round(x))%8===0;
    box(px-2,py-1,14,16,'#142030');
    box(px,py,10,12,lit?'#b2855d':'#344858');
    if (lit) box(px,py,4,12,'#d8a976');
    line([[px,py+12],[px+10,py+12]],'#182331');
  }
}
function night(t) {
  vertical('#10192a','#304554');
  oval(209,61,27,27,'#a9b5bb');
  oval(218,55,27,27,'#3d5060');
  wash(208,68,80,73,'#9abdc22d');
  building(4,156,47,233,'#253342');
  building(46,188,38,202,'#263b48');
  building(86,125,49,267,'#243342');
  building(135,181,39,210,'#303d4b');
  building(172,144,49,244,'#263a48');
  building(220,112,49,275,'#2d3b49',true);
  box(0,374,270,106,'#18282f');
  for (let i=0;i<14;i++) line([[i*27-50,447],[i*22-25,441]],i%2?'#344954':'#624b43',1);
}
function ledgePOV(t,callback=false) {
  const strain = callback ? ramp(t,50.5,55.2) : ramp(t,1.65,2.66);
  const release = callback ? ramp(t,51.61,52.55) : ramp(t,2.35,2.78);
  const finalRelease = callback ? ramp(t,54.31,56.20) : 0;
  vertical('#122a36','#26323e');
  poly([[103,0],[172,0],[169,480],[104,480]],'#18232d');
  poly([[0,0],[89,0],[132,480],[0,480]],'#354652','#101b25',3);
  poly([[184,0],[270,0],[270,480],[157,480]],'#283948','#101b25',3);
  for (let i=0;i<9;i++) {
    const y=26+i*i*5.8, h=7+i*2.8;
    poly([[15,y],[75+i*4,y+4],[76+i*4,y+4+h],[15,y+h]],i%3===1?'#ae7248':'#192735','#3f5260',1.4);
    poly([[194-i*3,y+5],[256,y],[256,y+h],[191-i*3,y+h+5]],i%4===2?'#b58455':'#192735','#3d4d57',1.3);
  }
  line([[137,10],[139,198]],'#847466',1.2);
  wash(137,160,52,105,'#a0683d32');
  const wobble = 1.6*Math.sin(t*18)*(.35+strain);
  c.save(); c.translate(wobble,6*strain);
  poly([[0,317],[270,301],[270,369],[0,407]],'#39464c',ink,3);
  poly([[0,315],[270,300],[270,324],[0,353]],'#777777');
  line([[0,344],[120,335],[270,319]],'#a0a09a',1.5);
  line([[26,322],[48,330],[61,328],[75,340]],'#555956',1.8);
  line([[198,307],[203,317],[214,318],[218,329]],'#484e50',1.3);
  hand(73-10*strain-19*finalRelease,333+14*strain+125*finalRelease,1.21,-.19,strain*.3+finalRelease*.55);
  hand(196+13*release,321+143*release,1.22,.32,release,true);
  if (callback && t>50.12) {
    const grip = pulse(t,50.12,51.25,52.72)+pulse(t,52.85,54.10,55.91);
    const crossing=ramp(t,52.42,53.40);
    hand(mix(204,76,crossing),248+62*grip,.92,Math.PI-.28+.60*crossing,.31-.25*grip,false,true);
  }
  c.restore();
}
function falling(t,callback=false) {
  const p=clamp(callback?(t-56.2)/2.7:(t-2.78)/1.25);
  vertical('#18283a','#313c4b');
  const shift=p*p*170;
  poly([[0,0],[216,0],[195,480],[0,480]],'#2e3e50',ink,2.5);
  box(214,0,56,480,'#162331');
  for (let j=-1;j<9;j++) {
    const y=j*79-shift;
    for (let i=0;i<3;i++) {
      box(12+i*69,y+10,49,56,'#182633');
      box(16+i*69,y+14,41,47,(i+j)%4===0?'#b78a5e':'#405468');
      line([[36+i*69,y+14],[36+i*69,y+60]],'#233646',2.3);
    }
  }
  for (let i=0;i<8;i++) line([[223+i*4,((i*83-shift*2+1600)%480)],[215+i*5,((i*83-shift*2+1600)%480)+22]],'#7b929843',1.2);
  const y=112+260*p*p;
  if (!callback) person(122+19*p,y,.77,{tilt:-.6+2.6*p,arm:1,stride:14,blink:1,mouth:1});
  else {
    c.save(); c.translate(135,225); c.rotate(p*.74); c.translate(-135,-225);
    hand(46-60*p,362+150*p,1.33,-.29,.8);
    hand(216+64*p,349+150*p,1.34,.45,.9,true);
    c.restore();
  }
  box(0,0,270,480,`rgba(6,9,16,${Math.pow(p,8)*.73})`);
}
function street(t) {
  night(t);
  poly([[0,284],[270,302],[270,480],[0,480]],'#313b3e');
  for(let i=0;i<9;i++) line([[0,301+i*i*3],[270,318+i*i*3]],'#141f29',2);
  line([[212,269],[212,122],[182,122]],'#111e28',4);
  poly([[169,120],[185,119],[191,127],[165,127]],'#c9a77c',ink);
  wash(176,188,86,108,'#edab575d');
  poly([[176,129],[113,329],[244,329]],'#d4a25d15');
  oval(139,322,104,28,'#996f5137');
  for (let i=0;i<8;i++) line([[110-i*11,335+i*8],[196+i*7,334+i*8]],i%2?'#a5805c50':'#89918b33',1.4);
  c.save();
  const rise=ramp(t,4.35,6.02), approach=ramp(t,6.2,8.28);
  c.translate(135,265+26*(1-rise)); c.scale(.85+.72*approach,.85+.72*approach); c.translate(-135,-265);
  poly([[99,147],[168,134],[171,314],[96,317]],'#473d42','#141820',4);
  poly([[106,156],[162,146],[164,304],[103,308]],'#705044','#b08064',2);
  poly([[113,165],[151,161],[151,220],[111,224]],'#826050','#4e4244',2);
  poly([[111,235],[150,231],[150,292],[110,296]],'#5c4947','#44383d',2);
  line([[162,148],[165,305]],'#f0ad6c',2.2);
  oval(152,232,3,3,'#e2b47e');
  c.restore();
  hand(69,419+63*rise,.92,-.17,.68);
  const blink=1-ramp(t,4.12,4.57);
  if (blink>0) { box(0,0,270,245*blink,'#080a12'); box(0,480-245*blink,270,245*blink,'#080a12'); }
}
function doorway(t) {
  vertical('#141421','#241a25');
  poly([[49,85],[226,68],[235,435],[45,422]],'#a87e63','#31262c',4);
  const p=ramp(t,8.0,8.85);
  poly([[61,96],[221,79],[224,418],[54,411]],'#372c48');
  box(165,142,50,119,'#506477');
  line([[189,142],[189,260]],'#2d364a',3);
  wash(208,216,101,149,'#7c98c552');
  if (p<.99) {
    poly([[60,98],[mix(218,70,p),mix(82,113,p)],[mix(221,80,p),mix(415,385,p)],[55,414]],'#65493f',ink,3);
    line([[74,115],[70,394]],'#9e745b',2.8);
    oval(mix(197,73,p),259,5,5,'#d5a26d');
  }
  hand(mix(199,66,p),280+30*p,1.14,-.36-1.10*p,.45);
}
function clock(x,y,r=1,on=true) {
  c.save(); c.translate(x,y); c.scale(r,r);
  poly([[-22,-13],[17,-13],[23,-8],[22,8],[-23,8]],'#1b2430',ink,2.3);
  box(-19,-9,37,13,'#312c38');
  text('3:17',0,1,11,on?'#ff816e':'#b36967','center');
  if (on) wash(0,-3,31,21,'#ec634c30');
  c.restore();
}
function bedroom(t) {
  vertical('#25273d','#413448');
  box(144,51,104,155,'#29384b');
  box(152,60,88,138,'#3b5570');
  oval(221,89,17,17,'#aebcc0');
  poly([[144,49],[167,49],[160,202],[141,218]],'#2e2740',ink);
  poly([[237,48],[257,50],[253,220],[232,206]],'#29243c',ink);
  line([[194,59],[194,199]],'#283549',4); line([[150,118],[241,118]],'#293748',3);
  poly([[190,202],[241,202],[270,348],[67,388]],'#7595b62e');
  poly([[0,341],[270,325],[270,480],[0,480]],'#302b36');
  for(let i=0;i<7;i++) line([[0,346+i*24],[270,332+i*26]],'#201d2b',1.7);
  box(12,114,49,246,'#252332'); line([[60,115],[60,353]],'#91624c',2.2);
  poly([[161,219],[236,218],[240,327],[138,344]],'#433645',ink,2.5);
  poly([[123,267],[229,264],[255,351],[88,371]],'#817185',ink,3);
  poly([[91,342],[255,327],[250,389],[85,400]],'#524763',ink,3);
  poly([[146,258],[193,252],[212,268],[157,285]],'#d1bcb0','#6c6571',2);
  box(230,298,35,76,'#53404a');
  clock(241,289,.79,t<10.35);
  oval(52,380,30,8,'#15192777');
  person(53,376,.89,{arm:.88-.60*ramp(t,9.25,11),tilt:.04,eyes:1,mouth:.38});
  const sit=ramp(t,10.55,12.18), reach=pulse(t,9.12,10.34,10.69);
  const hx=mix(174,172,sit), hy=mix(270,213,sit);
  poly([[hx-22,hy+14],[hx+16,hy+10],[201,313],[148,319]],'#b88b60',ink,2.6);
  line([[hx+9,hy+25],[197+14*reach,282-6*reach],[207+18*reach,294-6*reach]],'#483742',12);
  line([[hx+9,hy+25],[197+14*reach,282-6*reach],[207+18*reach,294-6*reach]],jacket,9);
  oval(207+18*reach,294-6*reach,5,4,lightSkin);
  c.save(); c.translate(hx,hy); c.rotate(-1.0*(1-sit));
  face(0,0,.89,{turn:sit>.35?-1:1,double:true,blink:t<10.51?1:0,eyes:.86});
  c.restore();
  poly([[140,296],[206,283],[246,330],[93,350]],'#70617e',ink,2.6);
  line([[148,312],[216,304],[235,321]],'#97849a',1.7);
  wash(176,244,121,97,'#a1afcf12');
}
function clockInsert(t) {
  vertical('#191c2f','#452d36');
  poly([[0,278],[270,239],[270,363],[0,400]],'#604852',ink,3);
  poly([[0,290],[270,250],[270,270],[0,313]],'#896160');
  clock(139,253,2.30,t<10.35);
  const press=pulse(t,9.78,10.32,10.55);
  hand(107+36*press,176+48*press,1.02,2.64,.37-.25*press,false,true);
}
function frontFace(x,y,s,{look=0,blink=0,mouth=0}={}) {
  c.save(); c.translate(x,y); c.scale(s,s);
  poly([[-28,-19],[-14,-39],[14,-39],[29,-19],[27,15],[17,33],[0,39],[-20,30],[-29,8]],'#bb896f',ink,2.8);
  poly([[0,-29],[18,-23],[25,-14],[26,13],[17,34],[0,39],[4,19]],'#ce9678');
  poly([[-29,-21],[-32,-33],[-21,-50],[3,-58],[25,-48],[32,-33],[34,-21]],cap,ink,3.1);
  poly([[-30,-31],[-20,-46],[3,-53],[24,-45],[10,-41]],'#58696b');
  poly([[-33,-21],[-12,-31],[17,-31],[37,-21],[32,-14],[-29,-14]],'#233039',ink,2.1);
  for (const side of [-1,1]) {
    const ex=side*13;
    line([[ex-7,-9],[ex,-12],[ex+7,-9]],'#59403d',2);
    oval(ex,-4,8,5.2*(1-blink)+.8,'#e5d1af');
    if (blink<.61) {
      oval(ex+3.1*look,-3.9,3.6,4.2,'#4c282d');
      oval(ex+3.3*look,-4.9,1.12,1.12,'#e6b89d');
    }
  }
  poly([[-2,-2],[5,13],[1,16],[-4,14]],'#946858');
  line([[-8,23],[0,22],[9,23],[5,26+7*mouth],[-4,26+7*mouth],[-8,23]],'#3d242c',1.9+mouth);
  c.restore();
}
function hallway() {
  vertical('#323248','#251d30');
  poly([[0,0],[112,109],[113,320],[0,430]],'#52424f',ink,2);
  poly([[270,0],[161,109],[160,320],[270,431]],'#473746',ink,2);
  poly([[0,429],[113,320],[160,320],[270,431],[270,480],[0,480]],'#493845',ink,2);
  poly([[113,114],[161,114],[161,321],[111,321]],'#66515c','#322936',2);
  poly([[119,159],[153,160],[153,320],[119,321]],'#342b42','#b08263',2.1);
  line([[5,111],[113,165]],'#937069',2);
  line([[161,165],[270,110]],'#81636d',2);
  for(const x of [0,49,96,161,217,266]) line([[137+(x-137)*.33,320],[x,480]],'#231f2e',2.4);
  for(const y of [342,370,407,449]) line([[0,y],[270,y]],'#2c2632',1.5);
  poly([[16,125],[61,149],[61,279],[14,311]],'#302638','#725864',3);
  poly([[24,142],[51,156],[51,266],[22,280]],'#2b2a3e','#473c4b');
  poly([[198,140],[247,108],[251,324],[200,294]],'#372938','#725564',3);
  poly([[206,149],[237,130],[239,278],[207,266]],'#4d3846','#312635');
  oval(217,251,3.6,2.5,'#b78870');
  poly([[111,72],[160,72],[171,86],[99,86]],'#c1997d','#4a3640');
  wash(138,106,115,144,'#d49e623d');
  box(78,197,17,31,'#965f56'); box(81,202,11,21,'#4d3e50');
}
function passer(x,y,s,stride,greeting) {
  c.save(); c.translate(x,y); c.scale(s,s);
  line([[-12,-53],[-16-stride,-26],[-20-stride,0],[-7-stride,0]],ink,16);
  line([[-12,-53],[-16-stride,-26],[-20-stride,0]],'#463c4e',10);
  line([[10,-53],[17+stride,-25],[15+stride,0],[29+stride,0]],ink,17);
  line([[10,-53],[17+stride,-25],[15+stride,0]],'#675b67',11);
  poly([[-22,-101],[-10,-114],[13,-112],[26,-103],[30,-56],[-22,-54]],'#87919a',ink,2.6);
  line([[14,-101],[19,-82],[38,-93-4*greeting]],'#b4aeb0',10);
  oval(36,-93-4*greeting,4,4,'#936756');
  box(38,-106-4*greeting,13,15,'#b9a6ae');
  line([[51,-103-4*greeting],[56,-102-4*greeting],[55,-94-4*greeting],[50,-94-4*greeting]],'#b4a2b3',2);
  poly([[-15,-128],[-15,-150],[0,-169],[18,-163],[26,-147],[30,-135],[23,-131],[19,-116],[3,-113],[-12,-120]],'#977867',ink,2.1);
  poly([[-18,-129],[-26,-147],[-19,-170],[2,-176],[20,-167],[25,-151],[12,-153],[2,-159],[-7,-145],[-7,-129]],'#463443',ink,2.3);
  oval(14,-142,5,3,'#d4baad'); oval(16,-142,2.1,2.5,'#462f3e');
  line([[13,-127],[22,-125+3*greeting]],'#543746',1.8);
  c.restore();
}
function hallScene(t) {
  hallway();
  if (t<15.52) {
    const p=ramp(t,13,15.52);
    oval(181+29*p,361-10*p,27,7,'#251c29');
    person(171+36*p,361-10*p,.96,{stride:12*Math.sin(t*7),eyes:.36,double:true});
    person(75+29*p,415-43*p,1.10-.19*p,{stride:10*Math.sin(t*8),arm:.3,eyes:.68});
    return;
  }
  const approach=ramp(t,15.60,21.10), surprise=pulse(t,18.65,19.46,20.14);
  const overlap=pulse(t,18.49,19.26,20.09);
  const leadX=110+12*ramp(t,16.4,17.85)-8*surprise;
  const visitorX=16+177*approach;
  const visitorY=352+38*approach;
  const doubleX=205+19*ramp(t,21.8,23);
  oval(visitorX,visitorY+2,23,6,'#1d1828');
  oval(doubleX,366,24,6,'#221a28');
  person(doubleX,366,.90,{direction:-1,eyes:.61,double:true,mouth:pulse(t,21.11,21.38,22)*.6});
  person(leadX,384,.99,{arm:pulse(t,17.05,18.27,19.55),mouth:pulse(t,17.3,18.06,18.96),tilt:-.17*surprise,
    blink:surprise,alpha:1-overlap*(.57+.26*Math.sin(48*t)**2)});
  passer(visitorX,visitorY,.87+.12*approach,12*Math.sin(t*8.6)*(1-ramp(t,20.32,21.11)),
    pulse(t,20.91,21.44,22.42));
  if (overlap>.08) {
    const y=264+72*overlap;
    line([[leadX-22,y],[leadX+21,y-4]],`rgba(168,175,200,${overlap*.47})`,2.4);
    line([[leadX-26,y+17],[leadX+15,y+12]],`rgba(124,142,175,${overlap*.59})`,1.7);
  }
}
function bath(t) {
  vertical('#284042','#385154');
  const peer=ramp(t,27.25,31.18);
  c.save();
  c.translate(134-3*peer,232);
  c.scale(1+.075*peer,1+.075*peer);
  c.translate(-134,-232);
  for(let y=0;y<450;y+=36) {
    line([[0,y],[270,y]],'#172f34',1.6);
    for(let x=(y%72===0?8:24);x<270;x+=38) line([[x,y],[x,y+36]],'#294449',1.35);
  }
  poly([[19,70],[248,67],[252,296],[15,294]],'#18292e','#809794',3.1);
  poly([[27,79],[240,77],[243,286],[24,284]],'#5c7778','#a9b0a4',1.7);
  c.save();
  c.beginPath(); c.rect(28,80,212,203); c.clip();
  poly([[29,81],[242,80],[240,283],[27,283]],'#557173');
  poly([[40,267],[95,200],[255,233],[255,285]],'#6c8582');
  poly([[42,123],[114,112],[113,252],[41,272]],'#2d484f','#9da8a1',2.8);
  poly([[51,131],[106,123],[104,247],[50,264]],'#263c45','#6a8584',2.1);
  line([[65,140],[65,247]],'#435a61',2.0);
  const lean=pulse(t,23.0,24.9,27.45);
  const stare=1-ramp(t,30.06,30.85);
  const fx=181-11*lean,fy=177+38*lean;
  poly([[fx-36,fy+39],[fx-16,fy+22],[fx+20,fy+22],[fx+39,fy+48],[230,296],[132,296]],'#a77d54','#334247',2);
  frontFace(fx,fy,1.04,{look:.91*stare,blink:pulse(t,24.32,24.50,24.83)*.95,mouth:.12});
  if(lean>.04) {
    line([[fx-19,fy+53],[fx-27,fy+18],[fx-18,fy+8]],skin,8*lean+1);
    line([[fx+27,fy+61],[fx+26,fy+18],[fx+19,fy+13]],skin,8*lean+1);
  }
  poly([[31,83],[79,83],[39,284],[27,284]],'#d6dfcb13');
  line([[34,109],[39,90],[71,88]],'#cdd8c665',1.3);
  c.restore();
  box(73,59,119,11,'#aca897');
  wash(132,89,116,110,'#d8deaa3b');
  poly([[248,262],[267,246],[270,373],[241,369]],'#966c4d',ink,2.8);
  poly([[5,321],[263,310],[270,377],[0,383]],'#708486',ink,2.8);
  oval(134,344,93,24,'#4f666d'); oval(134,343,72,17,'#3b575c');
  oval(134,348,12,4,'#203940');
  line([[147,321],[147,303],[139,297],[130,303],[130,315]],'#263e45',9);
  line([[148,304],[139,299],[134,306]],'#a7b9b4',3);
  const drip=[23.65,25.21,28.35,31.29].find(hit=>hit-.19<=t && t<hit);
  if (drip!==undefined) oval(130,315+31*(1-(drip-t)/.19)**2,1.5,2.9,'#a7bcb9');
  const grasp=ramp(t,23.22,25.44), recoil=pulse(t,30.16,30.72,31.56);
  hand(51-5*recoil,353+91*(1-grasp)+9*recoil,1.17,-.26,.34);
  hand(213+9*recoil,352+93*(1-grasp)+13*recoil,1.18,.24,.33,true);
  c.restore();
}
function frontDoor(t) {
  vertical('#352b40','#4c313f');
  poly([[0,331],[270,326],[270,480],[0,480]],'#463444',ink,2);
  for(let i=0;i<8;i++) line([[142+(i-3)*18,327],[i*59-61,480]],'#302434',1.7);
  poly([[170,45],[253,75],[255,352],[167,374]],'#292939','#a57262',3);
  poly([[179,57],[244,82],[246,346],[176,362]],'#4c3b49','#292733',2.8);
  for(const y of [101,192,274]) poly([[187,y],[235,y+17],[235,y+67],[187,y+56]],'#583c48','#3a2d3c',2);
  oval(189,247,4,4,'#e0ab79');
  box(37,87,71,100,'#302a40'); box(44,96,56,79,'#775460');
  poly([[48,151],[70,133],[102,156],[102,175],[46,175]],'#4d4055');
  wash(73,109,94,107,'#ac736c43');
  const block=ramp(t,34,36.30), reach=ramp(t,36.62,37.11);
  person(48+51*block,401,1.03,{arm:.96*block,tilt:.16*block,eyes:.72,mouth:.36});
  person(190-14*reach,386,1.06,{direction:-1,arm:reach*.98,double:true,eyes:.83,tilt:.062*reach});
}
function wrist(t) {
  vertical('#392b3e','#563b4c');
  poly([[155,0],[270,13],[270,480],[174,448]],'#593b48',ink,2.5);
  line([[176,37],[201,427]],'#a16e65',2.4);
  wash(129,235,146,170,'#c587693c');
  const grip=ramp(t,37.60,38.29), jolt=pulse(t,37.63,37.90,38.2);
  hand(138-16*jolt,226+18*jolt,1.49,1.03,.53);
  hand(179-31*grip,221+21*grip,1.33,-2.32,.36-.33*grip,true,true);
  for(let i=0;i<4;i++) {
    const x=101+i*12, y=261-i*7;
    line([[x,y-10],[x-5*grip,y],[x+3,y+8]],'#694348',7.5);
    line([[x,y-9],[x-5*grip,y],[x+3,y+6]],'#c38f70',5.5);
  }
}
function whisper(t) {
  vertical('#272438','#3c2634');
  line([[234,0],[243,480]],'#633e4c',6);
  wash(113,213,124,163,'#b56b5c31');
  const p=ramp(t,40.52,43.62);
  const fx=143-8*p,fy=228+9*p,s=2.32+.58*p;
  poly([[0,381],[44,332],[95,298],[169,296],[228,323],[270,391],[270,480],[0,480]],'#75534e',ink,3.2);
  frontFace(fx,fy,s,{mouth:pulse(t,43.52,43.77,44.28)*.91,blink:pulse(t,40.9,41.10,41.30)*.98});
  if(t>=44.43) box(0,0,270,480,`rgba(10,10,17,${.76*ramp(t,44.43,45)})`);
}
function roofSide(t) {
  night(t);
  const lurch=pulse(t,48.58,49.21,49.83);
  poly([[134,260],[270,220],[270,480],[145,480]],'#333e4c',ink,3);
  poly([[134,253],[270,218],[270,242],[140,282]],'#6c7278',ink,2.9);
  for(let i=0;i<5;i++) line([[143,305+i*38],[270,280+i*42]],'#232e3b',2);
  person(96+8*lurch,424,.79,{tilt:.13-.21*lurch,arm:.56,eyes:1,mouth:.66});
  line([[111,343],[111,312],[131,277]],ink,15);
  line([[111,343],[111,312],[131,277]],jacket,10);
  oval(134,275,7,5,lightSkin);
  poly([[172,204],[191,202],[234,225],[242,258],[203,270],[177,244]],'#a6774f',ink,2.7);
  line([[220,231],[231,245],[212,252]],'#3b464b',16);
  line([[180,220],[156,245],[138,271]],ink,15);
  line([[180,220],[156,245],[138,271]],'#aa7653',10);
  oval(137,271,8,4,'#cf9e7e');
  c.save(); c.translate(164,208); c.rotate(.26);
  face(0,0,.84,{turn:-1,double:true,eyes:1});
  c.restore();
}

const grain=document.createElement('canvas');
grain.width=270; grain.height=480;
{
  const g=grain.getContext('2d');
  let seed=65;
  for(let i=0;i<13800;i++) {
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    g.fillStyle=seed&8?'#c0b1a925':'#05061039';
    g.fillRect(seed%270,(seed>>>9)%480,1+!!(seed&64),1);
  }
}
function captionAt(t,pages) {
  const cue=pages.find(({start,end})=>start<=t && t<end);
  if(!cue) return;
  const lift = t>36.8 && t<40.5;
  const base=lift?87:382;
  const shade=c.createLinearGradient(0,base-61,0,base+53);
  shade.addColorStop(0,'#080b1300'); shade.addColorStop(.55,'#080b13a0'); shade.addColorStop(1,'#080b133b');
  box(0,base-61,270,114,shade);
  c.font='900 20px Arial'; c.textAlign='left';
  c.strokeStyle='#0a0d14'; c.lineWidth=3.9;
  const rows=[''];
  for (const word of cue.text.split(' ')) {
    const prior=rows.length-1;
    const line=rows[prior] ? rows[prior]+' '+word : word;
    if (rows[prior] && c.measureText(line).width>207) rows.push(word);
    else rows[prior]=line;
  }
  rows.forEach((row,index)=>{
    let x=127-c.measureText(row).width/2;
    const y=base+22*(index-Math.max(0,rows.length-2));
    for (const word of row.split(' ')) {
      c.fillStyle=cue.emphasis.includes(word.replace(/[^A-Z]/g,''))?'#ffce64':'#fff8ee';
      c.strokeText(word,x,y); c.fillText(word,x,y);
      x+=c.measureText(word+' ').width;
    }
  });
}
window.renderFrame = (t,pages=[]) => {
  c.setTransform(4,0,0,4,0,0);
  c.save();
  if(t<2.78) ledgePOV(t);
  else if(t<3.96) falling(t);
  else if(t<4.18) box(0,0,270,480,'#070910');
  else if(t<8.02) street(t);
  else if(t<8.88) doorway(t);
  else if(t>=9.78 && t<10.55) clockInsert(t);
  else if(t<13) bedroom(t);
  else if(t<23) hallScene(t);
  else if(t<34) bath(t);
  else if(t<37.60) frontDoor(t);
  else if(t<40.52) wrist(t);
  else if(t<45) whisper(t);
  else if(t<47.8) ledgePOV(t,true);
  else if(t<50.31) roofSide(t);
  else if(t<56.20) ledgePOV(t,true);
  else if(t<59.14) falling(t,true);
  else box(0,0,270,480,'#070910');
  c.restore();
  c.drawImage(grain,0,0);
  const vignette=c.createRadialGradient(135,223,98,135,237,270);
  vignette.addColorStop(0,'#03050a00'); vignette.addColorStop(1,'#03050a8d');
  box(0,0,270,480,vignette);
  captionAt(t,pages);
};
window.renderFrame(1);
