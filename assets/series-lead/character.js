// Original series lead. Used by the browser preview and the OpenToonz cutout rig.
(() => {
  const mix = (a, b, x) => a + (b - a) * x;
  const ink = '#172026';
  const expressions = {
    body3: { alarm: .5, skin: '#df8966', shade: '#a45445', strain: true },
    body4: { alarm: .5, skin: '#dc6959', shade: '#9d433b', strain: true },
    body5: { alarm: 0, sip: true },
  };

  function createSeriesLeadArt(canvas) {
    const ctx = canvas.getContext('2d');

    function polygon(points, fill, stroke, width = 2) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
    }

    function line(points, color, width) {
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    function ellipse(x, y, rx, ry, fill) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    }

    function limb(a, b, c, color, seam, width) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      line([a,b,c], ink, width + 5);
      line([a,b,c], color, width);
      line([[a[0]-3,a[1]], [b[0]-3,b[1]], [c[0]-3,c[1]]], seam, 2);
    }

    function lead(p, t, shadow = false, torsoOnly = false, face = {}) {
      const { x, stride, hip, drop, lean, spread, alarm, lift, fall } = p;
      ctx.save();
      ctx.translate(x, 680);
      if (fall) {
        ctx.translate(0, 42 * fall);
        ctx.rotate(-fall);
      }
      const foot = [stride * .5, -2 - Math.max(0, lift)], toe = [-stride * .5 - 8, 5 + Math.min(0, lift)];
      const waist = [hip, -97 + drop], chest = [hip - lean * 100, -171 + drop];
      const backKnee = [mix(waist[0], foot[0], .54) + drop * .12, mix(waist[1], foot[1], .54)];
      const frontKnee = [mix(waist[0], toe[0], .50) - drop * .26, mix(waist[1], toe[1], .50)];
      const color = (value) => shadow || value;
      const stroke = shadow ? null : ink;
      const drawLeg = (knee, end, back) => {
        if (shadow) { ctx.lineCap = 'round'; line([waist, knee, end], shadow, 20); }
        else limb(waist, knee, end, back ? '#2d454d' : '#405c62', back ? '#42545d' : '#77918c', 17);
        polygon([[end[0]+9,end[1]-12],[end[0]+11,end[1]+5],[end[0]-20,end[1]+7],[end[0]-24,end[1]+2],[end[0]-13,end[1]-5],[end[0]-8,end[1]-11]], color(back ? '#344b53' : '#4e666a'), stroke, 3);
        if (!shadow) line([[end[0]-20,end[1]+4],[end[0]+7,end[1]+3]], '#9a9c82', 2);
      };
      if (!torsoOnly) {
        drawLeg(backKnee, foot, true);
        drawLeg(frontKnee, toe, false);
      }
      ctx.translate(...chest);
      ctx.rotate(-lean * .25);
      const rearElbow = [26+22*spread,31-15*spread];
      const rearWrist = [27+35*spread,52-53*spread];
      const nearElbow = [-20-16*spread,31-23*spread];
      const nearWrist = [-16-60*spread,58-73*spread];
      if (shadow) {
        line([[17,5],rearElbow,rearWrist], shadow, 15);
        line([[-16,7],nearElbow,nearWrist], shadow, 17);
      } else if (!torsoOnly) {
        limb([17,5],rearElbow,rearWrist,'#9a6734','#b78345',13);
        ellipse(rearWrist[0]+4,rearWrist[1],8,7,'#cb935a');
      }
      polygon([[-21,-8],[13,-12],[27,3],[30,53],[16,77],[-19,73],[-30,55],[-28,10]], color('#d29b4a'), stroke, 4);
      if (!shadow) {
        polygon([[-24,0],[-6,4],[-2,70],[-18,71],[-28,52]], '#9b642e');
        line([[3,-6],[8,34],[8,73]], '#604731', 3);
        polygon([[12,13],[23,12],[24,28],[15,30]], '#e3af58', '#926631');
        if (!torsoOnly) {
          limb([-16,7],nearElbow,nearWrist,'#b97f3d','#f0b862',16);
          polygon([[nearWrist[0]-8,nearWrist[1]-5],[nearWrist[0]-12,nearWrist[1]+2],[nearWrist[0]-6,nearWrist[1]+8],[nearWrist[0]+4,nearWrist[1]+5],[nearWrist[0]+6,nearWrist[1]-4]], '#db9e63', ink, 2);
        }
      }
      polygon([[-9,-26],[10,-25],[12,-7],[-6,1],[-12,-9]], color('#a77149'), stroke, 3);
      ctx.translate(-3, -40);
      ctx.rotate(mix(-.05, -.28, alarm) + Math.sin(t * 2.6) * .018 + (face.sip ? .30 : 0));
      polygon([[-32,-12],[-27,-30],[-6,-41],[17,-37],[29,-23],[28,6],[17,21],[-7,23],[-25,12]], color(face.skin ?? '#d2a060'), stroke, 4);
      if (!shadow) polygon([[15,-14],[27,-16],[27,4],[17,19],[5,21],[15,8]], face.shade ?? '#a7734b');
      polygon([[-32,-13],[-31,-36],[-16,-49],[7,-51],[26,-40],[34,-22],[19,-18],[-18,-17],[-45,-11],[-46,-17]], color('#354a43'), stroke, 3);
      if (!shadow && face.strain) {
        line([[-26,-10],[-19,-7],[-14,-4]], '#66352e', 2.8);
        line([[-10,-4],[-5,-8],[3,-11]], '#66352e', 2.8);
        line([[-25,-1],[-18,2],[-14,0]], ink, 2.4);
        line([[-10,0],[-5,3],[2,-1]], ink, 2.7);
        polygon([[-16,15],[-9,10],[2,11],[7,16],[1,20],[-10,20]], '#552927', ink, 1.5);
        polygon([[-13,14],[-8,12],[1,13],[4,16],[-10,16]], '#f4dfbb');
      } else if (!shadow && face.sip) {
        line([[-23,-4],[-18,-1],[-13,-3]], ink, 2.2);
        line([[-10,-4],[-4,0],[2,-3]], ink, 2.4);
        line([[-15,2],[-21,8],[-15,11]], '#865b37', 2);
        ellipse(-8,15,4.5,2.4,'#52352a');
      } else if (!shadow) {
        polygon([[-29,-33],[-15,-45],[7,-48],[23,-37],[1,-32],[-20,-26]], '#58675a');
        line([[-32,-19],[-4,-25],[31,-24]], '#20342f', 3);
        const blink = Math.abs(t % 4.7 - 1.1) < .08;
        ellipse(-19,-2,6,blink ? 1 : 5+alarm*3,'#f5dbaf');
        ellipse(-5,-2,8,blink ? 1 : 5+alarm*4,'#f5dbaf');
        ellipse(-21+alarm*3,-1,2.5,blink ? 1 : 3,'#182529');
        ellipse(-7+alarm*3,-1,2.8,blink ? 1 : 3.4,'#182529');
        line([[-24,-10-alarm*3],[-14,-9-alarm*6]], '#443126', 2.3);
        line([[-10,-11-alarm*5],[1,-10-alarm*2]], '#443126', 2.3);
        line([[-15,2],[-21,8],[-15,11]], '#865b37', 2);
        ellipse(-8,15,4+5*alarm,1.4+4*alarm,'#52352a');
      }
      ctx.restore();
    }

    function makeCutout(part, face = expressions[part]) {
      ctx.save();
      ctx.setTransform(2, 0, 0, 2, 180, 372);
      ctx.clearRect(-90, -186, 540, 960);
      if (part.startsWith('body')) {
        ctx.translate(0, -583);
        lead({x:0, stride:0, hip:0, drop:0, lean:0, spread:0, alarm:face?.alarm ?? Number(part.slice(4)) / 2, lift:0, fall:0}, 0, false, true, face);
      } else if (part.startsWith('shoe')) {
        const near = part.includes('Near');
        polygon([[9,-12],[11,5],[-20,7],[-24,2],[-13,-5],[-8,-11]], near ? '#4e666a' : '#344b53', ink, 3);
        line([[-20,4],[7,3]], '#9a9c82', 2);
      } else {
        const near = part.includes('Near');
        const leg = part.startsWith('leg');
        const lower = part.includes('Lower');
        const length = leg ? (lower ? 53 : 55) : (lower ? 31 : 34);
        const skin = part.endsWith('Alt');
        const fill = skin ? (near ? '#c79663' : '#9c704c') : leg ? (near ? '#405c62' : '#2d454d') : (near ? '#b97f3d' : '#9a6734');
        const seam = skin ? (near ? '#dfaf7d' : '#b58a61') : leg ? (near ? '#77918c' : '#42545d') : (near ? '#f0b862' : '#b78345');
        limb([0,0], [0,length / 2], [0,length], fill, seam, leg ? 17 : near ? 16 : 13);
        if (!leg && lower) ellipse(0, length + 2, 8, 7, near ? '#db9e63' : '#cb935a');
      }
      ctx.restore();
      return canvas.toDataURL().split(',')[1];
    }

    return { lead, limb, makeCutout };
  }

  // Keep exported artwork independent of the active scene and camera.
  const art = document.createElement('canvas');
  art.width = 360;
  art.height = 744;
  window.createSeriesLeadArt = createSeriesLeadArt;
  window.makeCutout = createSeriesLeadArt(art).makeCutout;
})();
