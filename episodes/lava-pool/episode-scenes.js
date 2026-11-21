const headProfile = new Path2D('M130 590 C176 577 187 542 183 514 C125 496 108 470 113 413 L80 386 Q73 378 88 360 L110 334 C113 278 148 238 203 234 C283 226 344 271 351 342 C361 410 325 445 304 487 C286 522 289 565 332 600 Z');
const bodyOutline = new Path2D('M220 327 L220 301 Q203 286 201 260 C191 200 224 174 266 175 C311 175 337 205 331 254 Q329 288 311 302 L312 327 C354 333 397 344 419 388 L458 550 L425 568 L380 448 L354 432 L362 664 L297 681 L268 612 L236 681 L173 664 L179 432 L154 448 L113 568 L80 550 L118 388 C140 348 177 331 220 327 Z');
const heartShape = new Path2D('M271 420 C241 410 233 363 259 355 Q277 349 286 371 Q304 351 322 363 C351 384 322 424 300 445 Z');

function anatomyBackdrop(title, subtitle, hue) {
  ctx.fillStyle = '#142528';
  ctx.fillRect(0, 0, 540, 960);
  glow(275, 469, 448, hue, 'rgba(20,31,35,0)');
  for (let i = 38; i < 530; i += 32) line([[i,163],[i,680]], '#83b2b01c', 1);
  for (let i = 165; i < 700; i += 32) line([[38,i],[501,i]], '#83b2b01c', 1);
  diagramText(title, 51, 188, '#fff0df', 37, 900);
  diagramText(subtitle, 53, 218, '#f6ad81', 17, 700);
}

function diagramText(text, x, y, color, size, weight = 700) {
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px Arial, sans-serif`;
  ctx.fillText(text, x, y);
}

function airwayScene(time, cue) {
  const swelling = ease((time - cue('AS IT SWELLS')) / 2.25);
  const throat = ease((time - cue('YOUR THROAT')) / .7);
  const smoke = ease((time - cue('OR SMOKE')) / .55);
  const age = time - cue('IF YOU BREATHE IN');
  const inhale = ease(age / .9);
  const travel = .46 - .29 * swelling;
  anatomyBackdrop('THE AIRWAY', 'HEAT AND SMOKE', '#31505a');
  ctx.save();
  ctx.translate(27 + 8 * swelling, 59 - 15 * swelling);
  ctx.scale(1.1 + .11 * swelling, 1.1 + .11 * swelling);
  ctx.fillStyle = '#223e46';
  ctx.strokeStyle = '#668992';
  ctx.lineWidth = 2.5;
  ctx.fill(headProfile);
  ctx.stroke(headProfile);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3c5d65';
  ctx.lineWidth = 2;
  ctx.stroke(new Path2D('M99 380 Q153 368 201 388 M109 405 Q147 416 174 418 M195 522 Q213 543 199 570'));

  const channel = new Path2D('M111 402 C159 404 198 386 221 414 C236 432 222 465 226 498 Q232 537 226 580');
  ctx.strokeStyle = '#153339';
  ctx.lineWidth = 42;
  ctx.stroke(channel);
  ctx.strokeStyle = throat > 0 ? '#a76262' : '#617f79';
  ctx.lineWidth = 31 + 12 * swelling;
  ctx.stroke(channel);
  ctx.strokeStyle = '#8ed4d1';
  ctx.lineWidth = 20 - 14 * swelling;
  ctx.stroke(channel);
  if (throat) {
    glow(226, 451, 84, `rgba(255,110,80,${.24 * throat + .18 * swelling})`, 'rgba(255,110,80,0)');
    ellipse(226,451,26+swelling*3,43+swelling*15,null,'#ffb081',1.5);
  }
  for (let i = 0; i < 13; i++) {
    const phase = (age * travel + i / 13) % 1;
    const x = phase < .55 ? lerp(55,224,phase/.55) : 225 + 4 * Math.sin(phase*13);
    const y = phase < .55 ? 403 - 8 * Math.sin(phase*5) : lerp(406,573,(phase-.55)/.45);
    ctx.globalAlpha = inhale * (.38 + .55 * Math.sin(Math.PI * phase));
    ellipse(x,y + 2 * Math.sin(time*4+i),2.7 + noise(i) * (2 + 2 * smoke),2 + noise(i+1) * 2,
      smoke > .5 && i % 3 !== 0 ? '#e49a65' : '#c9fbef');
  }
  ctx.restore();
  if (throat > 0) {
    line([[311,548],[390,524],[485,524]], '#ffb081', 2);
    ellipse(311,548,4,4,'#ffb081');
    diagramText(swelling > .55 ? 'NARROWED' : 'THROAT', 390, 511, '#ffd8b1', 17);
  }
}

function vesselScene(time, cue) {
  const leak = ease((time - cue('LEAK FROM')) / .9);
  const age = time - cue('EVEN IF YOU WERE PULLED OUT');
  const setup = ease(age / .5);
  anatomyBackdrop('BURN SHOCK', 'FLUID LEAKS FROM VESSELS', '#563946');
  ctx.save();
  ctx.translate(269, 447);
  ctx.scale(.88 + .12 * setup, .88 + .12 * setup);
  ctx.translate(-269, -447);
  const vessel = new Path2D('M55 374 Q159 351 241 368 Q349 390 477 361 L477 508 Q345 533 240 511 Q148 494 55 523 Z');
  ctx.fillStyle = '#592939';
  ctx.strokeStyle = '#a05460';
  ctx.lineWidth = 6;
  ctx.fill(vessel);
  ctx.stroke(vessel);
  ctx.save();
  ctx.clip(vessel);
  glow(279,443,197,'rgba(241,112,106,.36)','rgba(241,112,106,0)');
  for (let i = 0; i < 34; i++) {
    const x = 45 + ((age * (82 - 23 * leak) + i * 41) % 441);
    const y = 389 + noise(i + 45) * 105 + Math.sin(x*.016+i) * 6;
    ellipse(x,y,7+noise(i+2)*9,4+noise(i+2)*3,i%3 ? '#ca6563' : '#f2a18c', '#893d50', 1.5);
  }
  ctx.restore();
  if (leak) {
    for (let i = 0; i < 18; i++) {
      const phase = ((time - cue('LEAK FROM')) * (.46 + noise(i) * .16) + noise(i+6)) % 1;
      const side = i % 2 ? 1 : -1;
      const x = 184 + i * 12 + Math.sin(phase * 2.2 + i) * phase * 15;
      const y = (side > 0 ? 501 : 383) + side * phase * (78 + noise(i+11)*40);
      ctx.globalAlpha = leak * (1 - phase*.75);
      polygon([[x,y-6],[x+4,y-1],[x+4,y+4],[x,y+7],[x-4,y+4],[x-4,y-1]], '#ffe0a4');
    }
    ctx.globalAlpha = 1;
    line([[324,560],[365,611],[468,611]], '#ffd391', 2);
    ellipse(324,560,4,4,'#ffd391');
    diagramText('FLUID', 397, 599, '#ffdfa6', 17);
  }
  ctx.restore();
}

function circulationScene(time, cue) {
  const weakened = ease((time - cue('YOUR BLOOD PRESSURE')) / 3.2);
  const lowOxygen = ease((time - cue('TOO LITTLE OXYGEN')) / .67);
  const shock = ease((time - cue("THAT'S BURN SHOCK")) / .5);
  const beat = (time * lerp(1.8, 1.22, weakened)) % 1;
  anatomyBackdrop(shock > .15 ? 'BURN SHOCK' : 'LESS BLOOD FLOW', 'CIRCULATION', '#493542');
  ctx.save();
  ctx.translate(44, 100);
  ctx.scale(.84, .84);
  ctx.fillStyle = '#263f46';
  ctx.strokeStyle = '#639199';
  ctx.lineWidth = 3;
  ctx.fill(bodyOutline);
  ctx.stroke(bodyOutline);
  const branches = [
    [[286,393],[272,345],[269,276],[267,225]],
    [[284,402],[237,394],[174,420],[128,522]],
    [[288,412],[329,391],[369,425],[414,526]],
    [[284,419],[281,493],[244,555],[207,641]],
    [[284,419],[281,493],[305,560],[337,634]],
  ];
  for (const branch of branches) {
    line(branch, '#9d5862', 4);
    for (let i = 0; i < branch.length - 1; i++) {
      const phase = clamp(beat * (branch.length - 1) - i);
      if (phase <= 0 || phase >= 1) continue;
      const a = branch[i];
      const b = branch[i+1];
      const x = lerp(a[0],b[0],phase);
      const y = lerp(a[1],b[1],phase);
      ctx.globalAlpha = 1 - .74 * weakened - .14 * lowOxygen;
      ellipse(x,y,5.5,5.5,'#ffc19a');
    }
  }
  ctx.globalAlpha = 1;
  ellipse(265,233,28,20,lowOxygen ? '#765e68' : '#bb9294','#d1a09d',1);
  ellipse(236,504,20,25,'#77717c','#b18088',1);
  ellipse(318,503,20,25,'#77717c','#b18088',1);
  ctx.save();
  const pulse = 1 + (1 - .72 * weakened) * .085 * Math.exp(-beat * 8);
  ctx.translate(288,399);
  ctx.scale(pulse,pulse);
  ctx.translate(-288,-399);
  glow(287,400,71,`rgba(246,98,88,${.43 - .29 * weakened})`,'rgba(246,98,88,0)');
  ctx.fillStyle = '#b46066';
  ctx.strokeStyle = '#f2a19a';
  ctx.lineWidth = 2;
  ctx.fill(heartShape);
  ctx.stroke(heartShape);
  ctx.restore();
  ctx.restore();
  if (lowOxygen) {
    line([[277,300],[339,267],[466,267]], '#e9ae92', 2);
    ellipse(277,300,4,4,'#e9ae92');
    diagramText('LESS OXYGEN', 339, 255, '#ffe2b9', 17);
  }
}

function emptyBoardScene(time, cue) {
  const age = time - cue('THE LAVA WOULD DO');
  const pullback = ease(age / 6.4);
  ctx.save();
  ctx.translate(269,470);
  ctx.scale(lerp(1.53,1.12,pullback),lerp(1.53,1.12,pullback));
  ctx.translate(-254,-529);
  chamber(time);
  lava(time);
  divingBoard(3.8 * Math.sin(age*11) * Math.exp(-age*1.7));
  glow(317,625,265,'rgba(244,97,25,.34)','rgba(244,97,25,0)');
  for (let i = 0; i < 27; i++) {
    const phase = (age * (.1 + noise(i*3)*.2)+noise(i+31)) % 1;
    const x = 21 + noise(i+7)*511 + Math.sin(phase*6+i)*12;
    ctx.globalAlpha = .67 * Math.sin(phase*Math.PI);
    ellipse(x,771-phase*(120+240*noise(i+21)),1.7+noise(i+9)*2,1.5,'#ffb263');
  }
  ctx.restore();
  const flash = 1 - ease(age / .42);
  glow(282,557,427,`rgba(255,141,78,${.65 * flash})`,'rgba(255,114,55,0)');
  ctx.fillStyle = `rgba(11,16,15,${.86 * ease((age - 6.6) / .74)})`;
  ctx.fillRect(0,0,540,960);
}

function smokePlume(x, y, time, intensity, drift) {
  for (let i = 11; i >= 0; i--) {
    const life = (time * (.44 + noise(i+52)*.14) + i / 12) % 1;
    const px = x + drift * life * 37 + Math.sin(life*7+i) * 15 * life;
    const py = y - life * 115;
    const size = 5 + 33 * life;
    const opacity = intensity * .39 * Math.sin(Math.PI * life);
    glow(px, py, size, `rgba(166,132,113,${opacity})`, 'rgba(95,73,67,0)');
  }
}

function contactFlames(x, y, time, intensity) {
  glow(x, y - 9, 101, `rgba(255,95,16,${.41 * intensity})`, 'rgba(255,122,26,0)');
  for (let i = 0; i < 9; i++) {
    const phase = (time * (1.45 + noise(i+12)*.94) + i * .29) % 1;
    const px = x - 34 + i * 8.5 + Math.sin(time*12+i)*4;
    const height = (11 + (33 + 24 * noise(i+25)) * Math.sin(phase*Math.PI)) * intensity;
    const tip = Math.sin(time*14+i)*10;
    ctx.globalAlpha = intensity * (.54 + .46 * Math.sin(phase*Math.PI));
    polygon([[px-8,y],[px-7,y-height*.46],[px-3,y-height*.35],[px+tip,y-height],
      [px+7,y-height*.55],[px+9,y-height*.33],[px+8,y]], '#f9591d', '#883321', 1.3);
    polygon([[px-3,y],[px-1,y-height*.31],[px+tip*.45,y-height*.67],[px+4,y-height*.32],[px+5,y]], '#ffce55');
    ctx.globalAlpha = 1;
    if (i % 2) ellipse(px+tip, y-21-64*phase, 1.8, 2.3, '#ffab4e');
  }
}

function diverInLava(time, cue, start) {
  const airway = cue('IF YOU BREATHE IN');
  const afterCut = time > cue('AND REACH');
  const coughing = ease((time - airway) / .9);
  const breath = (.5 + .5 * Math.sin((time - start) * (coughing ? 6.6 : 4.1))) ** 5;
  const cough = coughing * (.14 + .78 * breath);
  const clutch = .95 * ease((time - airway - .85) / 1.45);
  const burn = .55 + .45 * ease((time - start) / 5);
  const panic = (.56 + .18 * Math.sin(time * 8.5) + .14 * Math.sin(time * 13)) * (1 - .43 * clutch);
  const x = 351 + 4 * Math.sin(time * 6) * (1 - clutch);
  const y = 671 + 7 * cough + 7 * Math.sin(time * 4) * (1 - clutch);
  const push = ease((time - airway) / 2.9);
  const scale = (afterCut ? 2.28 : 2.07) + .79 * push;

  ctx.save();
  ctx.translate(271, 474);
  ctx.scale(scale, scale);
  ctx.translate(-350, -552 + 34 * push);
  chamber(time);
  lava(time);
  divingBoard(0);
  glow(x+6,636,159,'rgba(247,98,25,.38)','rgba(247,98,25,0)');
  smokePlume(x - 23, 615, time, .82, -.8);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-140,0,930,644);
  ctx.clip();
  diver(x,y,time,0,panic*.52,1,panic,0,{ burn, clutch, cough, slump: clutch*.48 });
  ctx.restore();
  ellipse(x+7,644,33 + 5*Math.sin(time*4),7,null,'#ffac48',2);
  line([[x-49,647],[x-22,643],[x+8,646],[x+37,642]], '#ffad4a', 2.5);
  contactFlames(x-7, 646, time, 1 - .39 * clutch);
  contactFlames(x+19, 605, time+.34, (.49 + .18 * breath) * (1 - .25 * clutch));
  smokePlume(x+21, 609, time+.8, 1, .65);
  if (coughing > 0) {
    smokePlume(x+28, 520 + cough * 7, time+1.3, .79 + .21 * breath, 1.2);
  }
  ctx.restore();
}

function diverOnLedge(time, cue) {
  const rescueAt = cue('EVEN IF YOU WERE PULLED OUT');
  const age = time - rescueAt;
  const pull = ease(age / 1.83);
  const fade = ease((time - cue('YOUR BLOOD PRESSURE')) / 3.5);
  const drop = ease((time - cue("THAT'S BURN SHOCK") - .13) / 1.2);
  const slump = .24 + .55 * fade + 1.06 * drop;
  const tighten = ease((time - cue("THAT'S BURN SHOCK")) / 1.6);
  ctx.save();
  ctx.translate(226, 453);
  const scale = 1.32 + .38 * tighten;
  ctx.scale(scale, scale);
  ctx.translate(-lerp(293, 387, pull), -489 - 14 * drop);
  chamber(time);
  lava(time);
  polygon([[203,600],[329,511],[639,495],[678,902],[163,911]], '#333637', '#222824', 5);
  polygon([[203,600],[329,511],[639,495],[639,509],[341,525],[220,608]], '#6f4a39', '#47312a', 2);
  line([[235,630],[361,550],[631,533]], '#574239', 2);
  line([[177,730],[434,624],[647,606]], '#242d2a', 3);
  glow(253,638,218,'rgba(244,101,37,.26)','rgba(244,101,37,0)');

  const feetX = lerp(281, 369, pull) + fade*10 - 21*drop;
  const feetY = lerp(627, 580, pull) + 24*fade + 22*drop;
  const torsoX = feetX - 8 + 36*slump;
  const torsoY = feetY - 99 + 6*fade;
  ellipse(feetX,feetY+5,58,14,'#201a18');
  smokePlume(feetX, feetY - 22, time, .63, -.65);
  smokePlume(feetX+28, feetY - 67, time+.6, .67, .55);
  if (age < 3.2) {
    const withdraw = ease((age - 2.15) / .95);
    const wrist = torsoX + 21 + 214 * withdraw;
    const height = torsoY - 17 - 64 * withdraw;
    polygon([[655,346],[wrist+11,height-20],[wrist-9,height+4],[660,413]], '#4e605a', '#18201e', 5);
    polygon([[wrist-15,height-14],[wrist+14,height-19],[wrist+21,height-4],[wrist+3,height+13],[wrist-13,height+11]],
      '#bc9b67','#211b18',3);
  }
  const breath = (1 - fade * .8) * (.5 + .5 * Math.sin(age * 8)) ** 4;
  diver(feetX,feetY,time,0,.55+.28*fade,0,.25*(1-fade),0,{ burn: 1, clutch: .52*(1-fade), cough: breath*.59, slump });
  if (age < 2.3) {
    ctx.globalAlpha = 1 - ease((age - 1.9) / .4);
    polygon([[torsoX+7,torsoY-9],[torsoX+21,torsoY-11],[torsoX+27,torsoY+3],[torsoX+11,torsoY+9]],
      '#c1a573','#312822',2);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (age < 2.8) diagramText('IF PULLED OUT', 55, 191, '#ffe3bb', 29, 900);
}

function episodeScene(time, cue, start, damageAt) {
  // Enter diagrams on the mechanism, then return to the diver on the same timeline.
  if (time >= cue('THE LAVA WOULD DO')) {
    emptyBoardScene(time, cue);
  } else if (time >= cue('EVEN IF YOU WERE PULLED OUT')) {
    if (time >= cue('LEAK FROM') && time < cue('LEAK FROM') + 2.55) vesselScene(time, cue);
    else if (time >= cue('TOO LITTLE OXYGEN') && time < cue("THAT'S BURN SHOCK")) circulationScene(time, cue);
    else diverOnLedge(time, cue);
  } else if (time >= cue('AS IT SWELLS') && time < cue('IT GETS HARDER') + 1.08) {
    airwayScene(time, cue);
  } else if (time >= cue('THE ENTIRE THICKNESS') && time < cue('AND REACH') + 1.18) {
    skinCutaway(time, start, damageAt, cue('THE ENTIRE THICKNESS'), cue('AND REACH'));
  } else {
    diverInLava(time, cue, start);
  }
}
