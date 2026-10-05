/* =====================================================================
   BIRTHDAYFILM — sketch.js
   Put this file in the project ROOT, next to music.js.

   THE SKETCHBOOK LOOK used by Chapters I and II.

   Every photograph is first DRAWN as a pencil sketch (a pencil moves
   across the paper), then COLOUR blooms into it like watercolour, and
   finally the real photograph is revealed, sharp and untouched.
   Photographs are never cropped and never stretched.

   Load it in <head>:   <script src="../sketch.js"></script>
   ===================================================================== */

(function () {
    "use strict";

    var PAPER = [246, 238, 224];
    var INK   = [42, 36, 34];
    var B     = 180;                       // reveal steps for the pencil

    var SPEED = window.location.search.indexOf("fast") !== -1 ? 0.25 : 1;
    var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);


    /* ---------------------------------------------------------
       LOOK (shared by both chapters)
    --------------------------------------------------------- */

    var css = document.createElement("style");
    css.textContent = [

        "*{margin:0;padding:0;box-sizing:border-box}",
        "html,body{background:#000}",
        "body{width:100%;height:100vh;height:100dvh;overflow:hidden;color:#f6ead4;font-family:Georgia,'Times New Roman',serif}",

        ".film{--bar:clamp(36px,9vh,110px);position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;",
        "background:radial-gradient(ellipse at 30% 40%,#4a2a18 0%,#261410 48%,#120907 100%)}",
        ".film.leaving{pointer-events:none}",

        /* the colour of the photograph seeps into the room */
        ".backdrop{position:absolute;inset:0;overflow:hidden;z-index:0}",
        ".bgi{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.2);",
        "filter:blur(44px) brightness(.5) saturate(.9);opacity:0;transition:opacity 2.6s ease}",
        ".film.painting .bgi{opacity:.55}",
        ".film.hiding .bgi{transition-duration:.8s}",

        /* a desk lamp */
        ".lamp{position:absolute;left:var(--lx,50%);top:50%;width:90vmin;height:90vmin;margin:-45vmin 0 0 -45vmin;z-index:1;",
        "pointer-events:none;opacity:0;transition:opacity 3s ease;animation:skLamp 7s ease-in-out infinite;",
        "background:radial-gradient(circle,rgba(255,190,100,.24) 0%,rgba(255,150,80,.08) 45%,transparent 68%)}",
        ".film.running .lamp{opacity:1}",
        "@keyframes skLamp{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}",

        ".dust{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;opacity:0;transition:opacity 4s ease;mix-blend-mode:screen}",
        ".film.running .dust{opacity:1}",

        ".layer{position:absolute;inset:0;z-index:5;pointer-events:none}",

        ".vignette{position:absolute;inset:0;z-index:6;pointer-events:none;",
        "background:radial-gradient(ellipse at center,transparent 38%,rgba(10,4,2,.75) 100%)}",

        /* letterbox */
        ".bar{position:absolute;left:0;width:100%;height:calc(50% + 1px);background:#000;z-index:7;pointer-events:none;",
        "transition:height 3.2s cubic-bezier(.65,0,.35,1)}",
        ".bar.top{top:0}.bar.bottom{bottom:0}",
        ".film.open .bar{height:var(--bar)}",
        ".film.leaving .bar{height:calc(50% + 1px);transition-duration:1.6s}",

        ".grain{position:absolute;width:200%;height:200%;left:-50%;top:-50%;z-index:11;pointer-events:none;opacity:.08;",
        "background-image:url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");",
        "animation:skGrain .25s steps(2) infinite}",
        "@keyframes skGrain{0%{transform:translate(0,0)}25%{transform:translate(-2%,2%)}50%{transform:translate(2%,-2%)}75%{transform:translate(1%,3%)}100%{transform:translate(-2%,-1%)}}",

        /* story layer: chapter title and Continue live inside the bars */
        ".content{position:absolute;inset:0;z-index:8;pointer-events:none;transition:opacity 1s ease}",
        ".film.leaving .content{opacity:0}",
        ".film.leaving .layer{opacity:0;transition:opacity 1s ease}",

        ".chapter-number{position:absolute;top:calc(var(--bar)/2);left:50%;transform:translate(-50%,-50%);white-space:nowrap;",
        "font-family:Arial,Helvetica,sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(246,234,212,.65);",
        "opacity:0;transition:opacity 3s ease,letter-spacing 4s ease}",
        ".film.show-chapter .chapter-number{opacity:1;letter-spacing:9px}",

        ".continue-wrap{position:absolute;left:0;right:0;bottom:0;height:var(--bar);display:flex;align-items:center;justify-content:center;pointer-events:none}",
        ".next-chapter{display:inline-block;padding:0 0 6px;background:transparent;border:none;border-bottom:1px solid rgba(246,234,212,.4);border-radius:0;",
        "color:rgba(246,234,212,.8);font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;cursor:pointer;",
        "opacity:0;visibility:hidden;pointer-events:none;transition:opacity 2s ease,visibility 0s linear 2s,color .4s ease,border-color .4s ease}",
        ".next-chapter span{display:inline-block;transition:transform .4s ease}",
        ".film.show-continue .next-chapter{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 2s ease,visibility 0s,color .4s ease,border-color .4s ease}",
        ".next-chapter:hover,.next-chapter:focus-visible{color:#fff;border-color:rgba(255,255,255,.85);outline:none}",
        ".next-chapter:hover span,.next-chapter:focus-visible span{transform:translateX(6px)}",

        /* text: every line arrives soft -> sharp */
        ".pop{opacity:0;transform:translateY(22px);filter:blur(8px);transition:opacity 2s ease,transform 2s ease,filter 2s ease}",
        ".pop.in{opacity:1;transform:none;filter:blur(0)}",
        ".film.hiding .pop{transition-duration:.7s}",

        ".wd{display:inline-block;opacity:0;transform:translateY(.55em) rotate(2deg);filter:blur(5px);",
        "transition:opacity .7s ease calc(var(--i)*.09s),transform .95s cubic-bezier(.2,.9,.3,1.2) calc(var(--i)*.09s),filter .7s ease calc(var(--i)*.09s)}",
        ".wds.in .wd{opacity:1;transform:none;filter:blur(0)}",
        ".film.hiding .wds .wd{transition-duration:.5s;transition-delay:0s}",

        ".eyebrow{font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#ffc65a;margin-bottom:24px}",
        ".title{font-size:clamp(40px,5.6vw,76px);font-weight:400;line-height:1.02;letter-spacing:-1.5px;color:#fff3dc;",
        "text-shadow:0 0 36px rgba(255,170,90,.35),0 4px 26px rgba(0,0,0,.6)}",
        ".desc{margin-top:26px;max-width:480px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.85;color:rgba(246,234,212,.8)}",
        ".desc2{margin-top:14px;max-width:480px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.85;color:rgba(246,234,212,.55)}",

        /* a hand-drawn underline */
        ".uline{display:block;width:min(72%,380px);height:16px;margin-top:12px;overflow:visible}",
        ".uline path{fill:none;stroke:#ffc65a;stroke-width:3;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.3s ease}",
        ".uline.in path{stroke-dashoffset:0}",

        /* =====================================================
           THE SHEET: a drawing that becomes a photograph
        ===================================================== */

        ".sheet{position:absolute;opacity:0;background:#f6eee0;transform-origin:50% 50%;",
        "transform:translateY(-80px) rotate(calc(var(--rot) + 9deg)) scale(.94);",
        "box-shadow:0 30px 80px rgba(0,0,0,.6),0 6px 18px rgba(0,0,0,.4);",
        "transition:transform 1s cubic-bezier(.34,1.56,.64,1),opacity .5s ease}",
        ".sheet.in{opacity:1;transform:rotate(var(--rot))}",
        ".sheet.out{opacity:0;transform:translateX(calc(var(--ex) * 135%)) rotate(calc(var(--rot) + var(--ex) * 15deg));",
        "transition:transform .95s cubic-bezier(.55,0,.9,.4),opacity .8s ease .15s}",

        ".sheet canvas,.sheet .sk-real{position:absolute;left:0;top:0;width:100%;height:100%;display:block}",
        ".sk-color{opacity:.93;transition:opacity 1s ease}",
        ".sk-real{opacity:0;transition:opacity .9s ease}",
        ".sheet.done .sk-real{opacity:1}",
        ".sheet.flat .sk-lines,.sheet.flat .sk-color{visibility:hidden}",

        ".tape{position:absolute;width:clamp(40px,6vw,74px);height:clamp(15px,2.2vw,24px);z-index:3;",
        "background:rgba(255,236,176,.58);box-shadow:0 1px 4px rgba(0,0,0,.3)}",
        ".tape.t1{left:-3%;top:1%;transform:rotate(-38deg)}",
        ".tape.t2{right:-3%;bottom:1%;transform:rotate(-38deg)}",

        ".pencil{position:absolute;left:0;top:0;width:clamp(100px,16vh,160px);height:auto;z-index:4;pointer-events:none;opacity:0;",
        "transform-origin:0 50%;filter:drop-shadow(3px 9px 6px rgba(0,0,0,.5))}",
        ".sheet.drawing .pencil{opacity:1;transition:opacity .3s ease}",

        ".dd{position:absolute;z-index:5;overflow:visible;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}",
        ".dd path{fill:none;stroke:currentColor;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;",
        "stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.2s ease var(--d,0s)}",
        ".sheet.doodled .dd path{stroke-dashoffset:0}",

        "@media (prefers-reduced-motion:reduce){.grain,.lamp{animation:none}}"

    ].join("\n");

    document.head.appendChild(css);


    /* ---------------------------------------------------------
       IMAGES
    --------------------------------------------------------- */

    var cache = {};

    function getImage(src) {
        if (!cache[src]) {
            cache[src] = new Promise(function (resolve) {
                var im = new Image();
                im.onload  = function () { resolve(im); };
                im.onerror = function () { resolve(null); };
                im.src = src;
            });
        }
        return cache[src];
    }

    function hash(x, y) {
        var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }


    /* ---------------------------------------------------------
       THE PENCIL SKETCH
       Classic pencil-sketch method: each pixel against the
       average of its neighbours. Dark where the picture has
       edges and shadows, paper-white everywhere else.
    --------------------------------------------------------- */

    function blur(inp, w, h, r) {
        var tmp = new Float32Array(w * h);
        var out = new Float32Array(w * h);
        var d = r * 2 + 1;
        var x, y, sum, row;

        for (y = 0; y < h; y++) {
            row = y * w;
            sum = 0;
            for (x = -r; x <= r; x++) sum += inp[row + Math.min(w - 1, Math.max(0, x))];
            for (x = 0; x < w; x++) {
                tmp[row + x] = sum / d;
                sum += inp[row + Math.min(w - 1, x + r + 1)] - inp[row + Math.max(0, x - r)];
            }
        }

        for (x = 0; x < w; x++) {
            sum = 0;
            for (y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
            for (y = 0; y < h; y++) {
                out[y * w + x] = sum / d;
                sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
            }
        }
        return out;
    }

    // returns 0..255 per pixel: how dark the pencil is there
    function computeDark(img, rw, rh) {
        var c = document.createElement("canvas");
        c.width = rw;
        c.height = rh;
        var x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(img, 0, 0, rw, rh);

        var px = x.getImageData(0, 0, rw, rh).data;      // throws if the browser blocks it
        var n = rw * rh;
        var gray = new Float32Array(n);
        var i;

        for (i = 0; i < n; i++) {
            gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
        }

        var r = Math.max(2, Math.round(Math.min(rw, rh) * 0.016));
        var soft = blur(blur(gray, rw, rh, r), rw, rh, r);

        var dark = new Uint8Array(n);

        for (i = 0; i < n; i++) {
            var s = Math.min(255, gray[i] * 255 / (soft[i] + 1));          // colour dodge
            var v = (s - 85) / (255 - 85);
            v = v < 0 ? 0 : v > 1 ? 1 : v;
            v = Math.pow(v, 1.35);

            var line  = 1 - v;
            var shade = (255 - soft[i]) / 255 * 0.34;                      // a little tone in dark areas
            var d = Math.min(1, line + shade * line + shade * 0.35);

            dark[i] = Math.round(d * 255);
        }
        return dark;
    }

    // the order the pencil puts the lines down: strong outlines first,
    // travelling from the top of the sheet to the bottom, then the shading
    function buildOrder(dark, rw, rh) {
        var n = rw * rh;
        var bucket = new Uint8Array(n);
        var counts = new Uint32Array(B + 1);
        var x, y, i, d, s, f, t, b;

        for (y = 0; y < rh; y++) {
            for (x = 0; x < rw; x++) {
                i = y * rw + x;
                d = dark[i];

                if (d < 12) { bucket[i] = 255; continue; }

                s = (y / rh) * 0.72 + 0.10 * Math.sin((x / rw) * 9.4 + 1.1) + 0.06 * hash(x, y);
                f = 1 - Math.pow(d / 255, 0.55);
                t = (0.55 * s + 0.45 * f + 0.05) / 0.92;
                t = t < 0 ? 0 : t > 1 ? 1 : t;

                b = Math.floor(t * (B - 1));
                bucket[i] = b;
                counts[b + 1]++;
            }
        }

        var start = new Uint32Array(B + 1);
        for (b = 0; b < B; b++) start[b + 1] = start[b] + counts[b + 1];

        var fill = new Uint32Array(B);
        var order = new Uint32Array(start[B]);

        for (i = 0; i < n; i++) {
            b = bucket[i];
            if (b === 255) continue;
            order[start[b] + fill[b]++] = i;
        }

        return { order: order, start: start };
    }


    /* ---------------------------------------------------------
       SOUND: a pencil scratching, paper landing, a soft bloom
       (kept very quiet, it sits under the music)
    --------------------------------------------------------- */

    var AC = null, tried = false, noiseBuf = null, scratchTimer = null;

    function muted() {
        try {
            var st = JSON.parse(sessionStorage.getItem("bf_music_v1"));
            return !!(st && st.muted);
        } catch (e) { return false; }
    }

    function arm() {
        var evs = ["pointerdown", "keydown", "touchstart"];
        var f = function () {
            evs.forEach(function (e) { window.removeEventListener(e, f, true); });
            try { if (AC) AC.resume(); } catch (e) {}
        };
        evs.forEach(function (e) { window.addEventListener(e, f, true); });
    }

    function audio(fn) {
        if (muted() || REDUCE) return;
        try {
            if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
            if (AC.state === "running") { fn(AC); return; }
            if (tried) return;
            tried = true;
            arm();
            AC.resume().then(function () { if (AC.state === "running") fn(AC); }).catch(function () {});
        } catch (e) {}
    }

    function noise(c) {
        if (!noiseBuf) {
            noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
            var d = noiseBuf.getChannelData(0);
            for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        return noiseBuf;
    }

    function burst(c, when, type, f0, f1, q, peak, dur) {
        var s = c.createBufferSource();
        s.buffer = noise(c);
        var f = c.createBiquadFilter();
        f.type = type;
        f.frequency.setValueAtTime(f0, when);
        if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, when + dur);
        f.Q.value = q;
        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, when);
        g.gain.linearRampToValueAtTime(peak, when + Math.min(0.012, dur / 3));
        g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
        s.connect(f); f.connect(g); g.connect(c.destination);
        s.start(when, Math.random() * 1.2, dur + 0.05);
    }

    var sfx = {

        // paper dropping onto a table
        land: function () {
            audio(function (c) {
                var t = c.currentTime + 0.01;
                var o = c.createOscillator(), g = c.createGain();
                o.frequency.setValueAtTime(120, t);
                o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22);
                o.connect(g); g.connect(c.destination);
                o.start(t); o.stop(t + 0.25);
                burst(c, t, "highpass", 2400, 2400, 0.7, 0.05, 0.08);
            });
        },

        // paper being thrown aside
        toss: function () {
            audio(function (c) {
                burst(c, c.currentTime + 0.02, "bandpass", 2200, 500, 0.9, 0.09, 0.5);
            });
        },

        // colour arriving
        bloom: function () {
            audio(function (c) {
                var t = c.currentTime + 0.02;
                burst(c, t, "lowpass", 500, 1400, 0.6, 0.05, 1.3);

                [[659.25, 0.0], [987.77, 0.14], [1318.5, 0.28]].forEach(function (p) {
                    var o = c.createOscillator(), g = c.createGain();
                    o.type = "sine";
                    o.frequency.value = p[0];
                    g.gain.setValueAtTime(0.0001, t + p[1]);
                    g.gain.linearRampToValueAtTime(0.028, t + p[1] + 0.25);
                    g.gain.exponentialRampToValueAtTime(0.0004, t + p[1] + 1.9);
                    o.connect(g); g.connect(c.destination);
                    o.start(t + p[1]); o.stop(t + p[1] + 2);
                });
            });
        },

        scratchStart: function () {
            sfx.scratchStop();
            scratchTimer = setInterval(function () {
                audio(function (c) {
                    burst(c, c.currentTime + 0.01, "bandpass", 3000 + Math.random() * 2400, 3000, 1.3,
                          0.025 + Math.random() * 0.03, 0.05 + Math.random() * 0.07);
                });
            }, 85);
        },

        scratchStop: function () {
            if (scratchTimer) clearInterval(scratchTimer);
            scratchTimer = null;
        }
    };


    /* ---------------------------------------------------------
       DOODLES (little drawings that appear around the sheet)
    --------------------------------------------------------- */

    var SHAPES = {
        heart: "M50 86 C 12 58 6 30 26 20 C 40 13 50 24 50 33 C 50 24 62 13 76 21 C 94 31 88 58 50 86 Z",
        star:  "M50 8 L61 37 L92 39 L68 59 L76 90 L50 73 L24 90 L32 59 L8 39 L39 37 Z",
        spark: "M50 6 C 52 34 64 47 94 50 C 64 53 52 66 50 94 C 48 66 36 53 6 50 C 36 47 48 34 50 6 Z",
        loop:  "M10 78 C 18 18 84 14 74 56 C 66 90 28 72 46 46 C 58 28 80 34 92 22 M92 22 L77 20 M92 22 L88 36",
        wave:  "M6 56 C 20 28 34 84 50 54 S 80 28 94 54",
        swirl: "M50 50 C 50 38 66 38 66 52 C 66 70 40 72 36 50 C 32 26 70 18 78 46 C 84 68 62 90 38 84"
    };

    var COLORS = { gold: "#ffc65a", coral: "#ff7a6b", cream: "#fff3d6", pink: "#ff9fb8" };

    function doodleSvg(d, i) {
        var size = d.s || 52;
        return '<svg class="dd" viewBox="0 0 100 100" style="left:' + d.x + '%;top:' + d.y + '%;width:' + size + 'px;height:' + size +
               'px;margin:' + (-size / 2) + 'px 0 0 ' + (-size / 2) + 'px;color:' + (COLORS[d.c] || d.c || COLORS.gold) +
               ';transform:rotate(' + (d.r || 0) + 'deg);--d:' + ((d.d || 0) + i * 0.25) + 's">' +
               '<path pathLength="1" d="' + SHAPES[d.shape] + '"/></svg>';
    }

    var PENCIL =
        '<svg class="pencil" viewBox="0 0 150 22">' +
        '<polygon points="0,11 22,3 22,19" fill="#e8c9a0"/>' +
        '<polygon points="0,11 8,8.4 8,13.6" fill="#2b2622"/>' +
        '<rect x="22" y="3" width="95" height="16" fill="#f2b632"/>' +
        '<rect x="22" y="3" width="95" height="3.2" fill="#f8d36a"/>' +
        '<rect x="22" y="15.8" width="95" height="3.2" fill="#c68a10"/>' +
        '<rect x="117" y="3" width="8" height="16" fill="#b9bcc2"/>' +
        '<rect x="125" y="3" width="18" height="16" rx="3" fill="#e7727d"/>' +
        '</svg>';


    /* ---------------------------------------------------------
       THE SHEET
       layer: where sheets live    zone: the box it must fit in
    --------------------------------------------------------- */

    function createSheet(layer, zone, src, opts) {

        opts = opts || {};

        var el = document.createElement("div");
        el.className = "sheet pre";
        el.style.setProperty("--rot", (opts.rot || 0) + "deg");
        el.style.setProperty("--ex", opts.exit === 1 ? 1 : -1);

        var html = '<canvas class="sk-lines"></canvas><canvas class="sk-color"></canvas>' +
                   '<img class="sk-real" alt="' + (opts.alt || "") + '">' +
                   '<span class="tape t1"></span><span class="tape t2"></span>';

        (opts.doodles || []).forEach(function (d, i) { html += doodleSvg(d, i); });
        html += PENCIL;

        el.innerHTML = html;
        layer.appendChild(el);

        var linesCv = el.querySelector(".sk-lines");
        var colorCv = el.querySelector(".sk-color");
        var real    = el.querySelector(".sk-real");
        var pencil  = el.querySelector(".pencil");

        var img = null, rw = 0, rh = 0;
        var ok = false, dark = null, ord = null, base = null, lctx = null;

        var self = { el: el, src: src };

        function layout() {
            if (!img) return;

            var zr = zone.getBoundingClientRect();
            var lr = layer.getBoundingClientRect();
            var ar = img.naturalWidth / img.naturalHeight;
            var fill = opts.fill || 0.94;

            var w = zr.width * fill;
            var h = w / ar;

            if (h > zr.height * fill) {
                h = zr.height * fill;
                w = h * ar;
            }

            el.style.width  = w + "px";
            el.style.height = h + "px";
            el.style.left   = (zr.left - lr.left + (zr.width  - w) / 2) + "px";
            el.style.top    = (zr.top  - lr.top  + (zr.height - h) / 2) + "px";
        }

        window.addEventListener("resize", layout);

        self.ready = getImage(src).then(function (image) {

            if (!image) { el.style.display = "none"; return self; }

            img = image;

            var long = Math.max(img.naturalWidth, img.naturalHeight);
            var sc = Math.min(1, 1400 / long);
            rw = Math.round(img.naturalWidth * sc);
            rh = Math.round(img.naturalHeight * sc);

            linesCv.width = colorCv.width = rw;
            linesCv.height = colorCv.height = rh;
            lctx = linesCv.getContext("2d");

            real.src = src;
            layout();

            try {
                dark = computeDark(img, rw, rh);
                ord  = buildOrder(dark, rw, rh);

                base = lctx.createImageData(rw, rh);
                var d = base.data;

                for (var i = 0, n = rw * rh; i < n; i++) {
                    var g = (hash(i % rw, (i / rw) | 0) - 0.5) * 9;
                    d[i * 4]     = PAPER[0] + g;
                    d[i * 4 + 1] = PAPER[1] + g;
                    d[i * 4 + 2] = PAPER[2] + g;
                    d[i * 4 + 3] = 255;
                }

                lctx.putImageData(base, 0, 0);
                ok = true;

            } catch (e) {
                // the browser blocked reading the photo (opened as a plain
                // file): skip the pencil, the colour bloom still works
                ok = false;
                lctx.fillStyle = "rgb(" + PAPER.join(",") + ")";
                lctx.fillRect(0, 0, rw, rh);
            }

            return self;
        });

        self.layout = layout;

        self.enter = function () {
            layout();
            el.classList.remove("pre");
            void el.offsetWidth;
            el.classList.add("in");
            setTimeout(sfx.land, 650 * SPEED);
        };

        self.exit = function () {
            sfx.toss();
            el.classList.add("out");
            setTimeout(function () {
                window.removeEventListener("resize", layout);
                el.remove();
            }, 1200 * SPEED + 200);
        };


        /* ---- the pencil draws ---- */

        function movePencil(u, w, h) {
            var x, y;

            if (u < 0.5) {
                var q = u / 0.5;
                x = w * (0.5 + 0.46 * Math.sin(q * 38 + 0.6));
                y = h * (q * 1.04 - 0.02) + Math.sin(q * 90) * h * 0.006;
            } else {
                var r = (u - 0.5) / 0.5;
                x = w * (0.5 + 0.40 * Math.sin(r * 24 + 1.0));
                y = h * (0.5 + 0.38 * Math.sin(r * 14 + 2.3));
            }

            var ph = pencil.getBoundingClientRect().height || 20;
            pencil.style.transform = "translate(" + x.toFixed(1) + "px," + (y - ph / 2).toFixed(1) + "px) rotate(-38deg)";
        }

        self.draw = function (ms, done) {

            ms = ms * SPEED;

            if (!ok) { setTimeout(done || function () {}, 400 * SPEED); return; }

            pencil.style.transition = "none";
            el.classList.add("drawing");
            sfx.scratchStart();

            var t0 = 0, nextBucket = 0;
            var w = el.offsetWidth, h = el.offsetHeight;
            var data = base.data;
            var start = ord.start, order = ord.order;

            function frame(now) {

                if (!t0) t0 = now;
                var u = Math.min(1, (now - t0) / ms);
                var upto = Math.min(B - 1, Math.floor(u * B));

                for (var b = nextBucket; b <= upto; b++) {
                    for (var k = start[b]; k < start[b + 1]; k++) {
                        var i = order[k];
                        var di = dark[i] / 255 * 0.93;
                        var p = i * 4;
                        data[p]     = data[p]     * (1 - di) + INK[0] * di;
                        data[p + 1] = data[p + 1] * (1 - di) + INK[1] * di;
                        data[p + 2] = data[p + 2] * (1 - di) + INK[2] * di;
                    }
                }

                nextBucket = upto + 1;
                lctx.putImageData(base, 0, 0);
                movePencil(u, w, h);

                if (u < 1) {
                    requestAnimationFrame(frame);
                    return;
                }

                // the pencil is lifted away
                sfx.scratchStop();
                pencil.style.transition = "transform .8s ease-in, opacity .5s ease";
                pencil.style.transform = "translate(" + (w * 1.25) + "px," + (-h * 0.12) + "px) rotate(-18deg)";
                el.classList.remove("drawing");

                if (done) done();
            }

            requestAnimationFrame(frame);
        };


        /* ---- colour blooms in, like watercolour ---- */

        self.paint = function (ms, done) {

            ms = ms * SPEED;
            sfx.bloom();

            var cctx = colorCv.getContext("2d");
            var mask = document.createElement("canvas");
            mask.width = rw;
            mask.height = rh;
            var m = mask.getContext("2d");

            var diag = Math.sqrt(rw * rw + rh * rh);
            var seeds = [];

            for (var s = 0; s < 9; s++) {
                seeds.push({
                    x: rw * (0.12 + Math.random() * 0.76),
                    y: rh * (0.10 + Math.random() * 0.80),
                    delay: Math.random() * 0.35,
                    rmax: diag * (0.5 + Math.random() * 0.25)
                });
            }

            var t0 = 0;

            function frame(now) {

                if (!t0) t0 = now;
                var u = Math.min(1, (now - t0) / ms);
                var e = 1 - Math.pow(1 - u, 2);

                for (var s = 0; s < seeds.length; s++) {
                    var sd = seeds[s];
                    var lu = Math.max(0, Math.min(1, (e - sd.delay) / (1 - sd.delay)));
                    if (lu <= 0) continue;

                    var r = lu * sd.rmax;

                    for (var n = 0; n < 7; n++) {
                        var a   = Math.random() * 6.2832;
                        var dd  = r * Math.sqrt(Math.random()) * 0.8;
                        var cx  = sd.x + Math.cos(a) * dd;
                        var cy  = sd.y + Math.sin(a) * dd;
                        var rad = r * (0.18 + Math.random() * 0.22) + 6;

                        var g = m.createRadialGradient(cx, cy, rad * 0.25, cx, cy, rad);
                        g.addColorStop(0, "rgba(0,0,0,1)");
                        g.addColorStop(1, "rgba(0,0,0,0)");
                        m.fillStyle = g;
                        m.beginPath();
                        m.arc(cx, cy, rad, 0, 6.2832);
                        m.fill();
                    }
                }

                // make sure no corner is ever left unpainted
                if (u > 0.78) {
                    m.fillStyle = "rgba(0,0,0," + (0.12 + (u - 0.78) / 0.22 * 0.5) + ")";
                    m.fillRect(0, 0, rw, rh);
                }

                if (u >= 1) {
                    m.fillStyle = "#000";
                    m.fillRect(0, 0, rw, rh);
                }

                cctx.globalCompositeOperation = "source-over";
                cctx.clearRect(0, 0, rw, rh);
                cctx.drawImage(img, 0, 0, rw, rh);
                cctx.globalCompositeOperation = "destination-in";
                cctx.drawImage(mask, 0, 0);

                if (u < 1) {
                    requestAnimationFrame(frame);
                    return;
                }

                // the real, sharp photograph takes over
                el.classList.add("done");
                setTimeout(function () { el.classList.add("flat"); }, 1000 * SPEED + 100);

                if (done) done();
            }

            requestAnimationFrame(frame);
        };

        self.doodles = function () { el.classList.add("doodled"); };

        return self;
    }


    /* ---------------------------------------------------------
       WORDS: a headline that arrives word by word
    --------------------------------------------------------- */

    function words(el, text) {
        el.classList.add("wds");
        el.innerHTML = text.split(" ").map(function (w, i) {
            return '<span class="wd" style="--i:' + i + '">' + w + "</span>";
        }).join(" ");
    }


    /* ---------------------------------------------------------
       DUST: warm specks drifting in the lamp light
    --------------------------------------------------------- */

    function startDust(canvas) {

        if (REDUCE) return;

        var ctx = canvas.getContext("2d");
        var w = 0, h = 0, parts = [];

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = canvas.clientWidth;
            h = canvas.clientHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function make(initial) {
            return {
                x: Math.random() * w,
                y: initial ? Math.random() * h : h + 10,
                r: 0.5 + Math.random() * 1.8,
                vx: (Math.random() - 0.5) * 0.14,
                vy: -(0.04 + Math.random() * 0.18),
                a: 0.12 + Math.random() * 0.4,
                p: Math.random() * 6.28,
                s: 0.4 + Math.random() * 1.2,
                glow: Math.random() < 0.2
            };
        }

        resize();
        window.addEventListener("resize", resize);

        var count = w < 700 ? 32 : 64;
        for (var i = 0; i < count; i++) parts.push(make(true));

        function frame(t) {
            ctx.clearRect(0, 0, w, h);

            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];

                p.x += p.vx + Math.sin(t / 4000 * p.s + p.p) * 0.05;
                p.y += p.vy;
                if (p.y < -10) parts[i] = make(false);

                var alpha = p.a * (0.6 + 0.4 * Math.sin(t / 900 * p.s + p.p));

                ctx.beginPath();
                ctx.fillStyle = "rgba(255, 224, 170, " + alpha + ")";

                if (p.glow) {
                    ctx.shadowBlur = 9;
                    ctx.shadowColor = "rgba(255, 200, 130, .7)";
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                ctx.fill();
            }

            requestAnimationFrame(frame);
        }

        requestAnimationFrame(frame);
    }


    window.BFSketch = {
        speed: SPEED,
        reduce: REDUCE,
        sheet: createSheet,
        words: words,
        dust: startDust,
        sfx: sfx,
        preload: getImage
    };

})();