(() => {
  const canvas = document.querySelector('#picture');
  const c = canvas.getContext('2d');
  const dark = '#17201d';
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const pulse = (t, a, b, d) => ease((t-a)/(b-a)) - ease((t-b)/(d-b));
  const rnd = (x) => Math.sin(x * 57.47 + 6.2) * 43127.61 % 1 + 1;
  const noise = (x) => rnd(x) % 1;

  function shape(points, fill, stroke, width = 2) {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  function oval(x, y, rx, ry, fill, stroke, width = 2) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }

  function text(value, x, y, size, color, weight = 800) {
    c.font = `${weight} ${size}px Arial`;
    c.fillStyle = color;
    c.fillText(value, x, y);
  }

  function glow(x, y, radius, color) {
    const gradient = c.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#00000000');
    oval(x, y, radius, radius, gradient);
  }

  const grain = document.createElement('canvas');
  grain.width = 360;
  grain.height = 640;
  const g = grain.getContext('2d');
  const pixels = g.createImageData(360, 640);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = noise(i) > .55 ? 228 : 10;
    pixels.data.set([shade, shade, shade, 13 + 38 * noise(i + 10)], i);
  }
  g.putImageData(pixels, 0, 0);

  function sample(track, t) {
    const frame = t * 24;
    const j = track.findIndex((key, index) => index > 0 && key[0] >= frame);
    if (j === -1) return track.at(-1).slice(1);
    const [a, b] = [track[j-1], track[j]];
    const f = clamp((frame-a[0])/(b[0]-a[0]));
    return a.slice(1).map((value, index) => mix(value, b[index+1], f*(.58+f*(1.26-.84*f))));
  }

  function cookie(x, y, radius, turn, broken = false) {
    c.save();
    c.translate(x, y);
    c.rotate(turn);
    const outline = Array.from({ length: 13 }, (_, i) => {
      const a = i / 13 * Math.PI * 2, r = radius * (.88 + .16 * noise(i + 31));
      return [Math.cos(a) * r, Math.sin(a) * r * .56];
    });
    if (broken) outline.splice(6, 2, [-radius*.35, radius*.10], [-radius*.21, -radius*.11]);
    shape(outline.map(([a,b]) => [a,b+3]), '#5e3926', '#231c17', 2);
    shape(outline, '#b18a57', '#483323', 1.8);
    for (let i = 0; i < 25; i++) {
      const a = noise(i+20)*Math.PI*2, r = radius*.76*Math.sqrt(noise(i+60));
      oval(Math.cos(a)*r, Math.sin(a)*r*.46, 1 + radius*.044, .6 + radius*.023,
        i % 3 ? '#785336' : '#d4bc80');
    }
    c.restore();
  }

  function glass(x, y, tilt, water) {
    c.save();
    c.translate(x,y);
    c.rotate(tilt);
    const sides = [[-11,0],[11,0],[7,30],[-7,30]];
    shape(sides, '#68a6a146', '#c1d6bd', 1.15);
    c.save();
    c.clip();
    const slope = 24*Math.tan(tilt);
    shape([[-24,water+slope],[24,water-slope],[24,70],[-24,70]], '#83c2bbac', '#b0e4d8', .8);
    c.restore();
    oval(0,0,11,3.1,'#54716d75','#d4dbbb',1);
    shape([[-7,4],[-5,24]], null, '#d1eee28d', 1.3);
    c.restore();
  }

  function room(t, bathroom) {
    const wall = c.createLinearGradient(0,260,550,710);
    wall.addColorStop(0,bathroom ? '#42605b' : '#514638');
    wall.addColorStop(1,bathroom ? '#283b39' : '#263331');
    c.fillStyle = wall;
    c.fillRect(-180,170,900,600);
    shape([[-180,650],[720,639],[720,930],[-180,930]], bathroom ? '#3e4c48' : '#47403a');
    for (let x = -200; x < 740; x += 80) shape([[x,644],[x+(x-250)*.32,950]],null,'#1e2a2790');
    for (let y=660; y<940; y+=37) shape([[-180,y],[720,y-14]],null,'#20262493');

    if (bathroom) {
      for (let y=340; y<650; y+=35) {
        shape([[-120,y],[670,y]],null,'#232f30',1.2);
        for (let x=-120; x<700; x+=58) shape([[x+(y%2)*29,y-34],[x+(y%2)*29,y]],null,'#263533',1);
      }
      shape([[88,386],[218,375],[219,503],[88,511]],'#354c4c','#96a893',4);
      shape([[98,393],[205,384],[115,457],[99,460]],'#91aa9b50');
      shape([[328,513],[367,508],[369,599],[325,602]],'#aaa998','#26322f',3);
      shape([[326,511],[368,505],[375,514],[327,520]],'#ddd6bd','#474943',2);
      shape([[330,535],[342,534],[342,539],[330,540]],'#e1dfce','#485550',1.5);
      shape([[272,598],[341,598],[331,625],[319,634],[321,654],[290,654],[291,640],[280,629]],'#aaa998','#283431',3);
      oval(304,599,36,11,'#e2d8be','#374b47',2.6);
      oval(302,600,27,6,'#64817a','#777a6b',1.7);
    } else {
      shape([[91,365],[216,343],[217,489],[91,501]],'#263634','#171d1b',5);
      shape([[99,372],[208,353],[209,480],[99,491]],'#5c7774','#514d35',3);
      for (let y=369; y<490; y+=13) shape([[101,y],[209,y-13]],null,'#273b38',1.7);
      shape([[148,362],[150,485]],null,'#a2926b',3);
      shape([[347,378],[564,386],[567,518],[350,512]],'#46534a','#25312a',4);
      shape([[451,386],[454,514]],null,'#292d25',2);
      shape([[433,448],[433,465]],null,'#ae9063',2.3);
      shape([[470,449],[470,466]],null,'#ae9063',2.3);
      shape([[11,421],[70,415],[64,427],[7,433]],'#dec18c','#3a3428',2);
      glow(38,453,112,'#e5a45650');
      const late = ease((t-31)/15);
      if (late) { c.fillStyle = `rgba(14,33,40,${late*.26})`; c.fillRect(-180,170,900,760); }
      glow(226,532,177,'#dcaa6250');
    }
  }

  function table(t, bathroom) {
    if (bathroom) {
      shape([[-40,548],[178,529],[210,534],[210,550],[-40,570]], '#d1c095', '#34433a',3);
      shape([[-25,569],[209,549],[190,587],[-10,610]], '#788e80', '#34433a',2);
      oval(137,546,39,8,'#586e64','#b1b398',2);
      shape([[112,542],[112,530],[129,526],[137,531]],null,'#b2baa5',3);
      return;
    }
    c.save();
    const drag = 10*ease((t-50.88)/.72) + 5*pulse(t,54.04,54.20,54.67);
    const chair = 4*pulse(t,54.04,54.20,54.67);
    c.translate(drag,chair);
    shape([[275,542],[334,535],[337,622],[326,628],[318,553],[273,558]],'#5e4936','#1f2420',3.5);
    shape([[253,611],[333,606],[345,615],[337,625],[253,627]],'#866444','#27291f',3);
    shape([[263,624],[258,667],[269,668],[275,625]],'#584335','#242822',3);
    shape([[326,624],[340,671],[349,670],[338,621]],'#584335','#242822',3);
    c.restore();
    shape([[-30,552],[239,544],[232,672],[221,672],[222,572],[-30,583]],'#554235','#2c2b24',3);
    shape([[-60,550],[185,530],[243,538],[223,558],[-62,576]],'#97765a','#3a3025',3);
    shape([[-62,576],[223,558],[225,568],[-59,587]], '#694e3b','#322c24',2);
    for (let i=0; i<10; i++) shape([[i*20-30,549+i*.3],[i*21+8,554+i*.1]],null,'#ae8c664b',1);
  }

  function props(t) {
    const [handX, handY] = sample(shot.wrists[1],t);
    oval(175,544,47,10,'#30291f60');
    oval(174,540,43,10,'#a8a08b','#514b3c',2);
    oval(174,540,34,6,'#cbc4a5','#80765d',1);
    const stack = t >= 43 ? 4 : t >= 30 ? 1 : 3;
    for(let i=0;i<stack;i++) cookie(173+i*3,537-i*4,19,.065*(i-1),i===0 && t>=30 && t<43);
    for (let i=0;i<20;i++) {
      const x=139+99*noise(i+42), y=536+16*noise(i+78);
      oval(x,y,.45+noise(i+16),.42,'#665039');
    }
    const inHand = (t > .85 && t < 4.8) || (t >= 13.5 && t < 15.7) || (t >= 30 && t < 32.55);
    if (inHand) cookie(handX-5,handY-7, t >= 30 ? 10 : 14, -.44 + .36*ease((t-1.45)/1.0), t>=2.42 && t<13);
    const dayFive = t>=30 && t<43;
    const water = 12 + 14*(dayFive ? ease((t-39.70)/.53) : t<13 ? ease((t-11.83)/.52) : 0);
    const lifting = (t>=11.08 && t<12.88) || (t>=33.50 && t<41.25);
    if (lifting) {
      const tip = dayFive ? ease((t-39.38)/.29)-ease((t-40.29)/.34)
        : ease((t-11.35)/.44)-ease((t-12.38)/.35);
      const shake = dayFive ? .12*pulse(t,38.60,39.17,39.60)*Math.sin(t*29) : 0;
      const tilt = .95*tip + shake;
      glass(handX-8*Math.cos(tilt)+18*Math.sin(tilt),
        handY-8*Math.sin(tilt)-18*Math.cos(tilt),tilt,water);
    } else {
      glass(dayFive ? 212 : t<13 ? 208 : 119,dayFive || t<13 ? 520 : 504,0,water);
    }
    if (t>=57.98) {
      const spit = ease((t-57.98)/.3);
      shape([[212,521],[203,532],[195,538]],null,`rgba(179,139,93,${.65*pulse(t,57.98,58.18,58.55)})`,1.8);
      oval(192,539,13*spit,2*spit,'#68482d');
      oval(193,538,6*spit,1*spit,'#b48962');
    }
  }

  function phone(t) {
    const gripTime = Math.min(60.02, Math.max(59.50, t));
    const [gripX] = sample(shot.wrists[1],gripTime);
    const x = gripX-13;
    shape([[x-15,549],[x+5,541],[x+13,545],[x-7,553]],'#202e2c','#131816',2);
    shape([[x-11,549],[x+5,543],[x+9,545],[x-7,551]],t>=60.17 ? '#aecfa7' : '#648a84');
    if(t>=60.17) oval(x,547,1.5,1,'#d8efc2');
  }

  function anatomyBackdrop(title, subtitle, color) {
    const b = c.createLinearGradient(0,0,420,960);
    b.addColorStop(0,'#121c20');
    b.addColorStop(.54,'#28212a');
    b.addColorStop(1,'#111a1c');
    c.fillStyle = b;
    c.fillRect(0,0,540,960);
    glow(275,457,275,color);
    c.lineWidth = 1;
    c.strokeStyle = '#a88c7855';
    c.strokeRect(59,216,422,444);
    for (let i = 0; i < 8; i++) {
      shape([[67,247+i*51],[78,247+i*51]],null,'#c8a08f65',1);
      shape([[461,247+i*51],[472,247+i*51]],null,'#c8a08f65',1);
    }
    text(title,62,155,40,'#f0ddc7');
    text(subtitle,64,182,16,'#be9787',700);
  }

  function stomach(t) {
    anatomyBackdrop('STOMACH','MIXING THE SWALLOW','#a84f3555');
    c.save();
    c.translate(269,445);
    c.scale(1+.038*Math.sin(t*5),1-.033*Math.sin(t*5));
    c.beginPath();
    c.moveTo(-42,-176); c.lineTo(-12,-176);
    c.bezierCurveTo(-17,-109,3,-101,43,-111);
    c.bezierCurveTo(135,-142,173,-62,152,18);
    c.bezierCurveTo(135,101,65,164,-23,145);
    c.bezierCurveTo(-87,130,-68,106,-120,114);
    c.lineTo(-151,129); c.lineTo(-156,98);
    c.bezierCurveTo(-100,59,-73,82,-43,36);
    c.bezierCurveTo(-15,-9,-57,-73,-42,-176);
    c.closePath();
    const wall = c.createRadialGradient(30,-20,20,0,26,174);
    wall.addColorStop(0,'#a6675d'); wall.addColorStop(1,'#542b35');
    c.fillStyle = wall; c.fill(); c.lineWidth = 6; c.strokeStyle = '#c28172'; c.stroke();
    c.clip();
    c.beginPath(); c.moveTo(-180,19);
    for(let x=-180;x<=180;x+=8) c.lineTo(x,23+14*Math.sin(x*.037+t*6));
    c.lineTo(180,180); c.lineTo(-180,180); c.closePath();
    c.fillStyle = '#8a5031'; c.fill();
    for(let i=0;i<115;i++){
      const x=-144+295*noise(i+20), y=37+95*noise(i+32);
      oval(x+13*Math.sin(t*6+y*.08),y+12*Math.sin(t*4+x*.028),1.6+2.6*noise(i+9),1.1+noise(i+3),
        i%3 ? '#4f3429' : '#d1a167');
    }
    for(let i=0;i<8;i++) {
      c.beginPath(); c.moveTo(66+i*8,-73+i*3); c.bezierCurveTo(115+i*4,-64,122+i*3,-36,120+i*2,-2);
      c.strokeStyle='#cc8d7879'; c.lineWidth=3; c.stroke();
    }
    c.restore();
  }

  function colon(t) {
    anatomyBackdrop('COLON','WATER LEAVES THE STOOL','#98464362');
    c.save(); c.translate(270,438);
    const squeeze = (1+Math.sin(t*4.9))*.5;
    const tube = (width, color) => {
      c.beginPath(); c.moveTo(-166,121);
      c.bezierCurveTo(-120,127,-133,-126,-80,-129);
      c.lineTo(100,-130);
      c.bezierCurveTo(157,-123,161,46,88,65);
      c.bezierCurveTo(44,76,34,84,37,153);
      c.lineCap='round'; c.lineWidth=width; c.strokeStyle=color; c.stroke();
    };
    tube(83,'#69393d');
    tube(70,'#b37363');
    tube(38-9*squeeze,'#513039');
    const lumpX = 12+23*ease(t/4);
    for(let i=0;i<3;i++){
      const x=lumpX+i*23, y=-130+4*Math.sin(i*3);
      oval(x,y,13,11-squeeze*2,'#6c402c','#3c2923',1.5);
      shape([[x-7,y-3],[x-1,y-8],[x+5,y-2],[x+2,y+2]],null,'#ba845d',2);
    }
    for(let i=0;i<10;i++){
      const phase=(t*.7+i*.109)%1;
      oval(-48+i*18,-146-44*phase,2.2,4,'#96cfba');
    }
    c.restore();
  }

  function intestine(t) {
    anatomyBackdrop('SMALL INTESTINE','VERY LITTLE TO ABSORB','#7d4b545c');
    c.save();
    c.beginPath(); c.rect(62,218,416,440); c.clip();
    c.fillStyle='#674130'; c.fillRect(62,254,415,209);
    for(let i=0;i<90;i++) {
      const x=62+((noise(i+12)*411+t*(21+noise(i+96)*24))%414);
      const y=251+160*noise(i+32)+6*Math.sin(i+t*3);
      oval(x,y,2+noise(i+10)*4,2+noise(i+6)*2,i%3?'#372b27':'#ae784b');
    }
    const edge=[[62,462]];
    for(let i=0;i<11;i++){
      const x=65+i*42, y=438+8*Math.sin(t*3+i*.5);
      for(let p=0;p<=12;p++){
        const a=p/12*Math.PI;
        edge.push([x+p*3.5,y-80*Math.sin(a)**1.2]);
      }
    }
    shape([...edge,[525,626],[60,626]],'#ab655d','#d99a80',3);
    for(let i=0;i<10;i++){
      const x=70+i*42;
      shape([[x,522],[x+16,397],[x+25,516]],null,'#773e48',2);
    }
    shape([[60,559],[144,553],[271,568],[384,554],[490,562]],null,'#752c3d',33);
    shape([[60,554],[144,548],[271,563],[384,549],[490,557]],null,'#c57b6d',4);
    for(let i=0;i<4;i++){
      const phase=(t*.43+i*.24)%1;
      oval(137+i*64+phase*10,333+phase*216,3,3,i===0?'#fff2a2':'#d9ae6f');
    }
    c.restore();
  }

  function storedFat(t) {
    anatomyBackdrop('STORED FAT','FUEL ENTERS THE BLOOD','#ae733f63');
    c.save(); c.beginPath(); c.rect(61,218,418,441); c.clip();
    shape([[60,559],[144,544],[232,553],[367,534],[484,540]],null,'#5a2b3c',69);
    shape([[60,545],[144,530],[232,539],[367,520],[484,526]],null,'#ac6370',4);
    for(let i=0;i<8;i++){
      const x=94+i%4*111+(i>=4?21:0), y=321+Math.floor(i/4)*108;
      const r=51-8*ease(t/3.5)*(i%3===1 ? 1 :.65);
      oval(x,y,r,r*.94,'#a46d42','#e9ac6c',3.2);
      oval(x-3,y-4,r*.82,r*.75,'#c19053','#daab70',1.7);
      oval(x+r*.67,y+r*.37,7,5,'#71505a');
    }
    for(let i=0;i<26;i++){
      const phase=(t*.75+i*.127)%1, x=68+(noise(i+94)*410+phase*68)%411;
      const y=477+70*ease(phase)+9*noise(i+41);
      oval(x,y,1.6+noise(i+64)*2.8,1.8,'#ffe295');
    }
    c.restore();
  }

  function bowl(t) {
    room(t,true);
    oval(272,490,202,136,'#707f73','#263b37',12);
    oval(270,475,176,108,'#d6c9a5','#232e28',7);
    oval(270,483,129,81,'#586e65','#aab79e',6);
    oval(271,505,100,43,'#5b8377','#d1e1bb6b',3);
    const fall=clamp((t-27.70)/.37);
    oval(275,407+96*fall*fall,8,6,'#735139','#312d25',2);
    const ripple=ease((t-28.07)/.48);
    if(ripple>0) oval(275,505,8+ripple*42,3+ripple*14,null,`rgba(207,238,208,${1-ripple})`,2);
  }

  function dayCard(t) {
    const [start, day] = t<13 ? [0,1] : t<30 ? [13,3] : t<43 ? [30,5] : [43,7];
    const age=t-start;
    if(age>2.82) return;
    c.globalAlpha=1-ease((age-2.43)/.39);
    c.fillStyle='#152123da'; c.fillRect(54,89,113,39);
    c.fillStyle='#e5b86b'; c.fillRect(54,89,4,39);
    text(`DAY ${day}`,68,117,25,'#f5deab',900);
    if(start===0) text('DRAMATIZED TIMELINE',55,150,13,'#f1dfbc',700);
    c.globalAlpha=1;
  }

  const internals = [[6.88,10.17,stomach],[18.8,22.95,colon],[34.72,38.6,intestine],[46.25,50.42,storedFat]];
  const character = new Image();
  window.mudNeedsCharacter = (t) => !internals.some(([a,b]) => a<=t && t<b)
    && !(t>=27.7 && t<28.75) && !(t>=62.2);
  window.renderMudFrame = async (t, png, caption) => {
    c.setTransform(2,0,0,2,0,0);
    c.fillStyle='#172020'; c.fillRect(0,0,540,960);
    const clip=internals.find(([a,b])=>a<=t && t<b);
    if(clip) clip[2](t-clip[0]);
    else if(t>=27.7 && t<28.75) bowl(t);
    else {
      const toilet=t>=16.8 && t<30;
      const strainClose=t>=24.48 && t<26.92;
      const closeup=t<.83 || t>=62.2;
      const macro=t>=1.7 && t<3.38;
      const handClose=(t>=11.33 && t<12.88) || (t>=38.6 && t<41.15);
      const phoneClose=t>=58.75 && t<62.2;
      const [zoom,x,y] = closeup ? [4.02,180,525] : macro ? [4.25,260,498]
        : strainClose ? [4.1,248,543] : toilet ? [2.58,281,573]
        : handClose ? [3.8,t<13 ? 259 : 237,514]
        : phoneClose ? [4,225,535]
        : t>=43 ? [2.28,233,539] : [2.61,224,522];
      c.save();
      c.translate(270,452);
      c.scale(zoom,zoom);
      c.translate(-x,-y);
      room(t,toilet);
      table(t,toilet);
      if(png) {
        character.src=`data:image/png;base64,${png}`;
        await character.decode();
        c.drawImage(character,...shot.bounds);
      }
      if(toilet) {
        shape([[224,661],[242,655],[259,659],[271,655],[283,661],[278,670],
          [260,674],[243,670],[226,675],[219,669]],'#405c62','#263433',2.6);
        shape([[224,665],[243,662],[252,666],[271,661],[279,664]],null,'#789490',1.8);
      }
      if(!toilet) props(t);
      if(t>=56) phone(t);
      if(macro && t>=2.42) {
        const burst=pulse(t,2.42,2.55,3.03);
        for(let i=0;i<15;i++){
          const age=t-2.42;
          oval(245-30*noise(i)*age,492+80*noise(i+22)*age*age,1.4*burst,.8*burst,'#b28e59');
        }
      }
      c.restore();
    }
    const vignette=c.createRadialGradient(270,455,192,270,480,565);
    vignette.addColorStop(0,'#00000000');
    vignette.addColorStop(1,'#071016b4');
    c.fillStyle=vignette; c.fillRect(0,0,540,960);
    c.globalAlpha=.61; c.drawImage(grain,0,0,540,960); c.globalAlpha=1;
    dayCard(t);
    if (caption) {
      c.font = '900 34px Arial';
      const width = c.measureText(caption.text).width;
      c.save();
      c.translate(260,785);
      c.scale(Math.min(1,425/width),1);
      c.lineJoin = 'round';
      c.lineWidth = 6;
      c.strokeStyle = '#101615';
      let x = -width/2;
      for (const word of caption.text.split(' ')) {
        c.fillStyle = caption.emphasis.includes(word.replace(/[^A-Z]/g,'')) ? '#ffd44d' : '#fff7e5';
        c.strokeText(word,x,0);
        c.fillText(word,x,0);
        x += c.measureText(word+' ').width;
      }
      c.restore();
    }
  };
})();
