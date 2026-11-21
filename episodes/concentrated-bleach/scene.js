const shots = [
  ['00–03s', 'The glass', 'Medium close. The lead lifts the tumbler into the kitchen light.', 'THAT GLASS OF', 'WATER?'],
  ['03–07s', 'The sip', 'Tight profile. Rim meets lips. Hold a beat for the swallow.', 'ONE', 'SIP.'],
  ['07–15s', 'The recoil', 'The lead jerks back, sets the glass down hard, and grabs their throat.', 'YOUR THROAT', 'STARTS TO BURN.'],
  ['15–23s', 'The airway narrows', 'A profile cutaway shows swelling near the throat narrowing the airway.', 'THE AIRWAY', 'NARROWS.'],
  ['23–36s', 'Fighting for a breath', 'The lead folds over the counter, mouth open and shoulders raised, struggling to inhale.', 'THEN BREATHING', 'GETS HARDER.'],
  ['36–46s', 'The same glass', 'The tumbler catches the same light as the lead reaches for the phone behind it.', 'GET MEDICAL HELP', 'IMMEDIATELY.'],
];

const ease = (value) => {
  const x = Math.max(0, Math.min(1,value));
  return x * x * (3 - 2 * x);
};
let grain;

function draw(canvas, shot, index, time, pages = [], revisionTime, motionRevision = false) {
  const c = canvas.getContext('2d');
  c.setTransform(canvas.width / 240,0,0,canvas.height / 426,0,0);
  const animated = time !== undefined;
  const beat = (start, end) => animated ? ease((time-start)/(end-start)) : 1;
  const ink = '#16201f';
  const skin = '#d2a460';
  function poly(points, fill, stroke = ink, width = 2) {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(points, color, width = 2) {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.lineJoin = c.lineCap = 'round';
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  }
  function ellipse(x, y, rx, ry, fill, stroke) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    c.fillStyle = fill;
    c.fill();
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
  }
  function glass(x, y, scale, tilt) {
    c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(tilt);
    poly([[-17,0],[17,0],[13,49],[-12,49]], '#a9c5b831', '#abc3b6', 1.5);
    poly([[-15,24],[15,24],[12,47],[-11,47]], '#d6bd7977', null);
    ellipse(0,24,15,3,'#d2c08b8c');
    ellipse(0,0,17,4,'#304541','#d4dbbd');
    ellipse(0,48,12,2,'#6d795b');
    line([[-12,6],[-9,38]], '#dbe7cc', 1.7);
    line([[13,8],[11,27]], '#e7cf91', 1);
    c.restore();
  }
  function kitchen() {
    const wall = c.createLinearGradient(0,0,224,345);
    wall.addColorStop(0,'#111e22'); wall.addColorStop(.58,'#405453'); wall.addColorStop(1,'#233430');
    c.fillStyle = wall; c.fillRect(0,0,240,426);
    poly([[0,10],[154,19],[153,61],[0,55]], '#263837', '#152323', 4);
    line([[48,13],[48,56]], '#1b2b2b', 2);
    line([[104,17],[104,59]], '#1b2b2b', 2);
    poly([[166,15],[224,19],[224,120],[165,119]], '#314647', '#172627', 5);
    line([[195,19],[195,113]], '#243738', 3);
    for (let y = 136; y < 295; y += 25) {
      line([[0,y],[240,y+5]], '#9aafa82f', 1);
      for (let x = y % 2 ? 15 : 35; x < 240; x += 45) line([[x,y+3],[x,y+25]], '#9aafa82f', 1);
    }
    line([[109,62],[153,64]], '#e1b96b', 3);
    const light = c.createRadialGradient(135,72,2,135,111,134);
    light.addColorStop(0,'#ffd18849'); light.addColorStop(1,'#ffd18800');
    c.fillStyle = light; c.fillRect(0,57,240,220);
  }
  function counter(phoneReach = 0) {
    poly([[0,294],[240,278],[240,426],[0,426]], '#55483c', '#262723', 3);
    poly([[0,294],[240,278],[240,308],[0,322]], '#83705a', '#2d3028');
    line([[0,319],[240,306]], '#b19972', 2);
    c.save(); c.translate(-5*phoneReach, 2*phoneReach);
    poly([[185,289],[206,285],[220,292],[199,298]], '#243233', '#151d1e');
    poly([[189,290],[205,287],[215,292],[199,295]], phoneReach > .1 ? '#b0ccc0' : '#506564', null);
    c.restore();
  }
  function lead(x, y, scale, pose, floorPose) {
    const recoil = pose === 'recoil';
    const gasp = pose === 'gasp' || pose === 'struggle';
    const early = pose === 'struggle';
    const effort = floorPose?.effort ?? (animated ? Math.max(
      .55*(beat(15.6,16.8)-beat(16.8,18.3)),
      .78*(beat(24.9,26.27)-beat(26.27,27.20)),
      beat(29.08,30.38)-beat(30.38,31.27),
      .82*(beat(33.06,34.37)-beat(34.37,35.65)),
      .65*(beat(36,36.8)-beat(36.8,38.2)),
      .48*(beat(40.24,41.25)-beat(41.25,42.5)),
    ) : 1);
    const reachPhone = pose === 'hurt' ? beat(37.24,39.06) : 0;
    const hurt = recoil || gasp || pose === 'hurt';
    const sip = pose === 'sip';
    const pullback = sip && animated ? beat(4.78,5.16) : 0;
    c.save(); c.translate(x,y); c.scale(scale,scale);
    if (floorPose) {
      c.rotate(floorPose.lean);
      c.translate(0,-145);
    } else if (gasp || pose === 'hurt') c.rotate(.035 + .055*effort);
    else if (motionRevision && sip) c.rotate(-.065*(beat(4.92,5.35)-beat(5.35,5.73)));
    const shoulder = gasp || pose === 'hurt' ? 4+14*effort : 0;
    const hem = floorPose ? 145 : 164;
    poly([[-34,65-shoulder],[-18,51-shoulder],[25,49-shoulder],[48,70-shoulder],[50,floorPose ? 141 : hem],[-48,hem]], '#ca913f', ink, 3);
    poly([[-34,65],[-16,55],[-21,119],[-38,hem-4],[-47,hem-4]], '#87512e', null);
    poly([[5,57],[13,56],[21,hem-2],[12,hem-1]], '#594031', null);
    poly([[26,90],[42,88],[43,106],[29,108]], '#e5ac56', '#895b36', 1);
    poly([[-6,39],[17,36],[18,55],[9,65],[-6,55]], '#a66e48');
    c.save(); c.translate(recoil ? -5 : gasp ? 6+5*effort : 0, gasp ? (early ? 34 : 44)-6*effort : 34);
    const swallow = sip && animated ? beat(4.25,4.45) - beat(4.45,4.68) : 0;
    const tilt = floorPose ? .36-.58*floorPose.lean-.42*floorPose.look : gasp ? (early ? .24 : .44)-.17*effort : .36-.14*effort;
    c.rotate(recoil ? -.36+.27*beat(7.35,8.4)+.13*beat(10,13.4) : hurt ? tilt : sip ? -.14-.31*pullback+.07*swallow : .05);
    poly([[-24,-31],[3,-41],[28,-29],[33,-13],[43,0],[33,6],[35,14],[20,26],[1,27],[-20,12]], skin, ink, 3);
    poly([[-23,-16],[-10,-29],[-9,9],[4,24],[-5,23],[-19,12]], '#a57950', null);
    poly([[-29,-23],[-26,-40],[-12,-51],[14,-53],[31,-43],[38,-26],[-9,-23]], '#344640', ink, 3);
    poly([[-23,-37],[-10,-47],[12,-49],[28,-41],[-16,-30]], '#52605a', null);
    poly([[-14,-27],[34,-29],[51,-22],[31,-19],[-10,-21]], '#1d2b29');
    ellipse(-12,0,5,7,'#c2915a',ink);
    if ((hurt && !(floorPose?.look > .45)) || sip) line([[19,-10],[25,-7],[31,-10]], '#493529', 2.5);
    else { ellipse(25,-8,6,6,'#f1ddb0',ink); ellipse(27,-8,2.5,3.5,ink); }
    line([[19,-16],[26,hurt ? -20 : -17],[32,-15]], '#523c2e', 2);
    if (gasp || pose === 'hurt' || pullback > .4) {
      const jaw = gasp || pose === 'hurt' ? 5+8*effort+4*beat(26.75,28.45) : 10;
      poly([[21,9],[36,7],[37,9+jaw*.65],[27,10+jaw],[21,11+jaw*.5]], '#492923', ink, 2);
      line([[24,11],[34,10]], '#e6c89e', 1.5);
    } else if (recoil) ellipse(29,13,7,4,'#69372d',ink);
    else line([[27,12],[35,11]], hurt ? '#814332' : '#644636', 2.5);
    c.restore();
    if (hurt) {
      const reachThroat = recoil ? beat(7.28,7.83) : 1;
      const wrist = [8-35*(1-reachThroat),63+58*(1-reachThroat)-shoulder*.5];
      line([[-25,77-shoulder],[-33,112],[-9,99],wrist], '#66442f', 21);
      line([[-25,77-shoulder],[-33,112],[-9,99],wrist], '#b67b3b', 15);
      c.save(); c.translate(wrist[0]-8,wrist[1]-63);
      poly([[1,68],[0,57],[8,50],[19,50],[23,55],[15,58],[10,67]], skin, ink, 1.5);
      c.restore();
      const hand = floorPose?.hand ?? (gasp ? [72,107] : pose === 'hurt' ? [57+58*reachPhone,114+3*reachPhone] : [75,129]);
      const elbow = floorPose ? [(36+hand[0])/2-9,(78-shoulder+hand[1])/2+15-10*floorPose.look] : [49,100];
      line([[36,78-shoulder],elbow,hand], '#8f5d36', 16);
      line([[37,76-shoulder],elbow,hand], '#cb8f46', 11);
      ellipse(...hand,8,4,skin,ink);
      if (gasp || reachPhone > .6) line([[hand[0]+2,hand[1]-3],[hand[0]+11,hand[1]-1],[hand[0]+13,hand[1]+2]], '#e7bc7e', 1.25);
    } else {
      const lift = sip ? beat(3.03,3.88) : beat(.42,2.63);
      const cupX = sip ? 65 - 26*lift + 22*pullback : 65;
      const cupY = sip ? 76 - 38*lift + 40*pullback : 98 - 46*lift;
      const tilt = sip ? .1 - 1.05*lift + .91*pullback : .1;
      const hand = [cupX-24*Math.sin(tilt),cupY+28*Math.cos(tilt)];
      line([[29,78],[42,112],hand], '#815433', 18);
      line([[30,80],[43,109],hand], '#d29a4b', 12);
      glass(cupX,cupY,.75,tilt);
      ellipse(...hand,7,6,skin,ink);
    }
    c.restore();
  }
  function cutaway() {
    const swell = revisionTime === undefined ? beat(19.42,21.78) : beat(25.16,28.86);
    c.fillStyle = '#25292a'; c.fillRect(0,0,240,426);
    const halo = c.createRadialGradient(113,170,9,113,170,147);
    halo.addColorStop(0,'#903f344d'); halo.addColorStop(1,'#903f3400');
    c.fillStyle = halo; c.fillRect(0,0,240,340);
    poly([[53,104],[68,71],[111,57],[145,70],[159,107],[181,133],[165,145],[169,167],[146,190],[143,227],[185,263],[207,312],[37,317],[51,269],[84,229],[81,186],[58,159]], '#604740', '#a17562', 2);
    line([[169,150],[141,147],[117,152],[107,169],[104,222],[111,274]], '#bd785f', 8);
    line([[163,130],[140,122],[123,135],[122,167],[138,193],[146,221],[148,276]], '#88a69c', 13);
    poly([[110,165],[119+8*swell,169],[121+9*swell,180],[128+12*swell,196],[126+7*swell,201],[116+7*swell,188],[114,189],[110,181]], '#cd6752', '#f29170', 1.5);
    poly([[137-5*swell,167],[145,174],[148,189],[150,203],[146-6*swell,199],[141-8*swell,187],[137-9*swell,177]], '#c55f4b', '#ed8a6c', 1.5);
    line([[127+2*swell,169],[132,181],[138,193],[143,207]], '#f9d6aa', 6-4*swell);
    line([[71,197],[98,197],[118,183]], '#ffc492', 1.5);
    line([[176,225],[163,225],[148,228]], '#a4c4b5', 1.4);
    c.font = 'bold 10px Arial';
    c.textAlign = 'left';
    c.fillStyle = '#ffc492'; c.fillText('SWELLING',16,201);
    c.fillStyle = '#c4ded0'; c.fillText('AIRWAY',178,229);
    c.fillStyle = '#e3a185'; c.fillText('ESOPHAGUS',37,272);
    line([[99,268],[109,262]], '#e3a185', 1.3);
  }
  function phone(x,y,scale,angle,active) {
    c.save(); c.translate(x,y); c.rotate(angle); c.scale(scale,scale);
    poly([[-10,-16],[10,-16],[11,15],[7,18],[-10,17],[-12,13]], '#162125', '#0b1214', 2);
    poly([[-8,-13],[8,-13],[8,14],[-9,14]], active ? '#bed5c5' : '#63847d', null);
    if (active) {
      ellipse(0,7,4.5,4.5,'#a83a36',null);
      line([[-2,7],[0,6],[2,7]], '#fff2dc', 1);
    }
    c.restore();
  }
  function fall() {
    const fold = beat(38.8,41.2);
    const slide = beat(41.35,42.50);
    const frontDrop = .23*beat(42.52,43.34)+.77*beat(43.31,43.89);
    const backDrop = .25*beat(45.65,46.25)+.75*beat(46.23,46.68);
    const look = beat(47.6,48.6) - beat(51.9,53);
    const reach = beat(48.14,50.15);
    const slidePhone = beat(50.40,51.26);
    const catchPhone = beat(51.26,52.1);
    const mix = (a,b,amount) => a + (b-a)*amount;
    const pulse = (start,peak,end) => beat(start,peak)-beat(peak,end);
    const effort = Math.max(pulse(37,37.9,39), pulse(40.4,41.4,42.4),
      pulse(43.9,44.6,45.6), pulse(46.8,47.4,48.2), pulse(53.9,54.7,55.4),
      pulse(55.7,56.5,57.5), pulse(57.9,58.7,59.8));
    const settle = motionRevision ? 8*pulse(43.89,44.04,44.39) + 6*pulse(46.68,46.84,47.16) : 0;
    const hip = [78-12*frontDrop-4*backDrop, 249+10*fold+47*frontDrop+16*backDrop+settle];
    const lean = .35 + .40*fold + .24*frontDrop - .15*backDrop - .28*look + .038*effort + .012*settle;
    const scale = .90;
    const frontSlide = motionRevision ? beat(43.79,44.3) : frontDrop;
    const rearSlide = motionRevision ? beat(46.60,47.14) : backDrop;
    const footNear = [100-8*frontSlide-14*rearSlide, 354];
    const footFar = [49-8*rearSlide,341];
    const kneeNear = [96+36*frontDrop-8*backDrop, 303+48*frontDrop+5*backDrop];
    const kneeFar = [59+26*frontDrop+25*backDrop, 286+8*frontDrop+46*backDrop];
    const phoneX = 185-35*slidePhone-1*catchPhone;
    const phoneY = 203+66*catchPhone;
    const gripX = phoneX-5;
    const gripY = phoneY+4;
    const handRelease = motionRevision ? beat(42.89,43.68) : frontDrop;
    const handSlide = motionRevision ? beat(42.3,42.87) : slide;
    const braceX = 162-19*handSlide+17*handRelease-10*rearSlide;
    const braceY = 204+38*handSlide+75*handRelease+35*rearSlide;
    const dx = mix(braceX,gripX,reach)-hip[0];
    const dy = mix(braceY,gripY,reach)-hip[1];
    const hand = [(dx*Math.cos(lean)+dy*Math.sin(lean))/scale,
      145+(-dx*Math.sin(lean)+dy*Math.cos(lean))/scale];

    if (time >= 52.20 && time < 54.38) {
      const press = pulse(52.72,53.09,53.68);
      c.fillStyle = '#334442'; c.fillRect(0,0,240,426);
      poly([[0,86],[240,41],[240,127],[0,190]], '#4d5d54', null);
      poly([[0,304],[67,241],[116,262],[95,326],[0,381]], '#97703e', '#282520', 4);
      poly([[65,261],[84,225],[106,203],[139,218],[155,270],[91,304]], skin, ink, 3);
      phone(133,210,4.15,-.20,true);
      poly([[158,264],[180,250],[184-35*press,235-6*press],[176-34*press,225-6*press],
        [184-24*press,214-4*press],[211,230],[205,271],[180,298]], skin, ink, 3);
      if (time >= 53.09) {
        c.textAlign = 'center'; c.font = 'bold 11px Arial';
        c.fillStyle = '#1f403c'; c.fillText('CALLING',129,186);
      }
      return;
    }

    const jolt = pulse(43.87,43.94,44.12)+.65*pulse(46.66,46.74,46.92);
    const camera = 1+.105*beat(47.75,49.6)-.075*beat(54.38,55.6);
    c.translate(132,244); c.scale(camera,camera); c.translate(-132,-244);
    c.translate(0, 1.8*jolt);
    poly([[0,311],[240,298],[240,426],[0,426]], '#514d42', null);
    poly([[0,327],[118,320],[180,426],[0,426]], '#62584a', null);
    for (const y of [327,349,376,412]) line([[0,y],[240,y-12]], '#332e2a', 1.3);
    for (const x of [-75,0,75,150,225,300]) line([[121+(x-121)*.51,302],[x,426]], '#372f29', 1.5);
    poly([[160,204],[240,178],[240,316],[160,337]], '#493d32', '#2f2a25', 2.6);
    poly([[170,222],[233,203],[233,306],[170,323]], '#56473a', '#2d2924');
    line([[183,230],[207,223]], '#90765b', 2.5);
    poly([[147,196],[240,174],[240,194],[162,217],[147,209]], '#8a7256', '#40362d', 2.7);
    line([[149,204],[239,181]], '#b69a71', 1.3);
    glass(214,142,1.04,0);
    if (catchPhone < .04) phone(phoneX,phoneY,.63,-1.91,false);
    ellipse(94,353,63,12,'#2423218c',null);
    const upperFar = [hip[0]-15,hip[1]-4];
    const upperNear = [hip[0]+14,hip[1]-5];
    line([upperFar,kneeFar,footFar], '#262d2b', 24);
    line([upperFar,kneeFar,footFar], '#3b4540', 17);
    line([[kneeFar[0]-6,kneeFar[1]-6],[kneeFar[0],kneeFar[1]-5],[kneeFar[0]+5,kneeFar[1]-2]], '#657168', 2.2);
    line([footFar,[footFar[0]+18-17*backDrop,footFar[1]+1]], '#1e2726', 10);
    line([upperNear,kneeNear,footNear], '#26302e', 27);
    line([upperNear,kneeNear,footNear], '#566057', 19);
    line([[upperNear[0]+4,upperNear[1]+2],[kneeNear[0]+4,kneeNear[1]-3],
      [footNear[0]+2,footNear[1]-2]], '#707568', 2.2);
    line([footNear,[footNear[0]+19-23*frontDrop,footNear[1]+1]], '#1f2827', 10);
    lead(...hip,scale,'gasp',{lean,hand,effort,look});
    if (catchPhone >= .04) phone(phoneX,phoneY,.69,-1.91+1.52*catchPhone,time >= 53.09);
    const hit = pulse(43.85,43.94,44.18);
    if (hit > 0) {
      line([[135,353],[141+9*hit,347-2*hit]], '#dbc29883', 1.1);
      line([[128,359],[133+11*hit,360]], '#dbc29883', 1.1);
    }
    const secondHit = pulse(46.64,46.74,47);
    if (secondHit > 0) line([[109,342],[111+10*secondHit,338-2*secondHit]], '#dbc29883', 1.1);
  }
  c.save();
  if (index === 2 && animated) {
    const jolt = Math.exp(-15*Math.abs(time-7.22));
    c.translate(1.3*jolt*Math.sin(time*68),2.2*jolt);
  }
  kitchen();
  if (index === 0) { lead(89,143-2*beat(.42,2.63),1.12,'lift'); counter(); }
  if (index === 1) {
    const pullback = beat(4.78,5.16);
    const shoulderLag = motionRevision ? beat(4.94,5.44) : pullback;
    lead(56-10*shoulderLag,141+2*shoulderLag,1.94,'sip');
  }
  if (index === 2) {
    const drop = beat(7.04,7.22);
    const flinch = beat(7.04,7.25) - beat(7.25,8.3);
    const sick = time >= 15;
    const push = beat(10.85,14.9);
    lead(80+8*(1-drop)-7*flinch-12*push,141+7*beat(7.8,9.5)-5*flinch-18*push,1.14+.28*push,sick ? 'struggle' : 'recoil');
    counter(); glass(172,238-17*(1-drop),1,.16*(1-drop)+.12*flinch);
  }
  if (index === 3) cutaway();
  if (index === 4) {
    const fold = beat(23.2,24.8);
    lead(65+8*fold,96+13*fold,1.57,'gasp'); counter();
    glass(revisionTime === undefined ? 42 : 171,242,1,0);
  }
  if (index === 5 && revisionTime !== undefined) fall();
  if (index === 5 && revisionTime === undefined) {
    const reach = beat(38.93,39.65);
    lead(91,166,.98,'hurt');
    c.fillStyle = '#131b192b'; c.fillRect(0,0,240,426);
    counter(reach); ellipse(66,294,50,9,'#3a332a91'); glass(65,178,2.4,0);
  }

  c.restore();
  // The same seeded grain holds steady across alternate poses and crops.
  if (!grain) {
    grain = document.createElement('canvas');
    grain.width = 240; grain.height = 426;
    const texture = grain.getContext('2d');
    let seed = 509;
    for (let i = 0; i < 7400; i++) {
      seed = (Math.imul(1664525,seed) + 1013904223) >>> 0;
      texture.fillStyle = seed & 8 ? '#f4d0a01b' : '#06121622';
      texture.fillRect(seed % 240,(seed >>> 9) % 426,1+(seed & 1),1);
    }
  }
  c.drawImage(grain,0,0);
  const captionsAbove = revisionTime !== undefined && index === 5;
  const shade = captionsAbove ? c.createLinearGradient(0,24,0,139) : c.createLinearGradient(0,294,0,426);
  shade.addColorStop(0,captionsAbove ? '#0e1616b8' : '#0e161600');
  shade.addColorStop(1,captionsAbove ? '#0e161600' : '#0e1616f0');
  c.fillStyle = shade;
  c.fillRect(0,captionsAbove ? 0 : 294,240,captionsAbove ? 139 : 132);
  c.textAlign = 'center'; c.font = '900 20px Arial';
  c.lineWidth = 4; c.strokeStyle = '#101615';
  if (animated) {
    const cueTime = revisionTime ?? time;
    const page = pages.find(({start,end}) => start <= cueTime && cueTime < end);
    if (!page) return;
    const rows = [''];
    for (const word of page.text.split(' ')) {
      const row = rows.length - 1;
      const joined = rows[row] ? `${rows[row]} ${word}` : word;
      if (rows[row] && c.measureText(joined).width > 195) rows.push(word);
      else rows[row] = joined;
    }
    c.textAlign = 'left';
    rows.forEach((row,index) => {
      let x = 111 - Math.min(199,c.measureText(row).width)/2;
      const y = (captionsAbove ? 84 : 335) + 22*(index - Math.max(0, rows.length - 2));
      for (const word of row.split(' ')) {
        c.fillStyle = page.emphasis.includes(word.replace(/[^A-Z]/g,'')) ? '#ffcf5f' : '#fff7e5';
        c.strokeText(word,x,y,199); c.fillText(word,x,y,199);
        x += c.measureText(`${word} `).width;
      }
    });
  } else {
    [shot[3],shot[4]].forEach((word,i) => {
      const y = 356 + i * 23;
      c.fillStyle = i ? '#ffcf5f' : '#fff7e5';
      c.strokeText(word,120,y); c.fillText(word,120,y);
    });
  }
}

const frames = document.querySelector('#frames');
if (frames) for (const [index, shot] of shots.entries()) {
  const figure = document.createElement('figure');
  figure.innerHTML = `<canvas width="480" height="852" role="img" aria-label="${shot[1]}"></canvas><figcaption><p class="time">${shot[0]}</p><h2>${shot[1]}</h2><p>${shot[2]}</p></figcaption>`;
  frames.append(figure);
  draw(figure.querySelector('canvas'), shot, index);
}
if (frames && frames.querySelectorAll('canvas').length !== 6) throw new Error('Expected six storyboard frames');
const scene = document.querySelector('#scene');
if (scene) {
  window.renderFrame = (time, pages = [], revision = false, motionRevision = false) => {
    if (revision) {
      const index = [3.5,5.88,24,30,37].filter((cut) => time >= cut).length;
      const shotTime = index === 0 ? time * 3.04/3.5
        : index === 1 ? 3.04 + (time-3.5)*4/2.38
        : index === 2 ? (time < 18 ? 7.04 + (time-5.88)*7.96/12.12 : 15+(time-18)*.63)
        : index === 4 ? 23.2 + (time-30)*1.50
        : time;
      draw(scene, shots[index], index, shotTime, pages, time, motionRevision);
      return;
    }
    const index = [3.04,7.04,19.16,23.2,36].filter((cut) => time >= cut).length;
    draw(scene,shots[index],index,time,pages);
  };
  window.renderFrame(0.9);
}
