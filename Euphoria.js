/* =====================================================================
   BIRTHDAYFILM — euphoria.js
   Put this file in the project ROOT, next to music.js and drumroll.js.

   The shared "peak" look and feel used by Chapters V and VI:
   the sunrise sky, rays of light, glow, sparkles, bokeh, bursts,
   confetti, rising hearts, fireworks, and the little climbing bells.

   Load it in <head>:   <script src="../euphoria.js"></script>
   Then, in the page:   BFX.start(canvasElement);
   ===================================================================== */

(function () {
    "use strict";

    /* ---------------------------------------------------------
       LOOK
    --------------------------------------------------------- */

    var css = document.createElement("style");
    css.textContent = [

        "*{margin:0;padding:0;box-sizing:border-box}",
        "html,body{background:#000}",
        "body{width:100%;height:100vh;height:100dvh;overflow:hidden;color:#fff6ea;font-family:Georgia,'Times New Roman',serif}",

        ".film{--cx:75%;--cy:50%;position:relative;width:100%;height:100vh;height:100dvh;overflow:hidden;background:#1b0c33}",
        ".film.leaving{pointer-events:none}",

        ".sky{position:absolute;inset:-4%;z-index:0;animation:bfDrift 16s ease-in-out infinite alternate;",
        "background:radial-gradient(ellipse at 72% 45%,#ffb067 0%,#ff6f6f 26%,#e8478a 46%,#8a3aa8 72%,#2a1250 100%)}",
        "@keyframes bfDrift{from{filter:hue-rotate(-16deg) saturate(1.05);transform:scale(1)}to{filter:hue-rotate(14deg) saturate(1.25);transform:scale(1.06)}}",

        ".dim{position:absolute;inset:0;z-index:1;pointer-events:none;background:rgba(22,6,44,.42);opacity:0;transition:opacity 2.4s ease}",
        ".film.calm .dim{opacity:1}",

        ".rays{position:absolute;z-index:2;left:var(--cx);top:var(--cy);width:240vmax;height:240vmax;margin:-120vmax 0 0 -120vmax;",
        "pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity 2.4s ease;",
        "background:repeating-conic-gradient(from 0deg,rgba(255,238,190,.2) 0deg 5deg,transparent 5deg 16deg);",
        "-webkit-mask-image:radial-gradient(circle,#000 0%,transparent 42%);mask-image:radial-gradient(circle,#000 0%,transparent 42%);",
        "animation:bfSpin 80s linear infinite}",
        ".film.lit .rays{opacity:1}",
        "@keyframes bfSpin{to{transform:rotate(360deg)}}",

        ".glow{position:absolute;z-index:2;left:var(--cx);top:var(--cy);width:90vmin;height:90vmin;margin:-45vmin 0 0 -45vmin;",
        "pointer-events:none;mix-blend-mode:screen;opacity:0;transition:opacity 1.6s ease;animation:bfPulse 3.2s ease-in-out infinite;",
        "background:radial-gradient(circle,rgba(255,214,140,.75) 0%,rgba(255,150,120,.3) 40%,transparent 70%)}",
        ".film.lit .glow{opacity:1}",
        "@keyframes bfPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}",

        ".shade{position:absolute;inset:0;z-index:3;pointer-events:none;",
        "background:linear-gradient(90deg,rgba(28,6,52,.62) 0%,rgba(28,6,52,.22) 45%,transparent 70%),radial-gradient(ellipse at center,transparent 55%,rgba(30,0,40,.4) 100%)}",

        "#fx{position:absolute;inset:0;width:100%;height:100%;z-index:6;pointer-events:none}",

        ".flash{position:fixed;inset:0;z-index:100001;background:#fff;opacity:0;pointer-events:none}",
        ".flash.go{animation:bfFlash 1.1s ease-out forwards}",
        ".flash.soft{animation:bfFlashSoft .7s ease-out forwards}",
        ".flash.leave{opacity:1;transition:opacity .9s ease-in}",
        "@keyframes bfFlash{0%{opacity:.95}100%{opacity:0}}",
        "@keyframes bfFlashSoft{0%{opacity:.4}100%{opacity:0}}",

        ".content{position:relative;z-index:7;width:100%;height:100%;display:flex;align-items:center;padding:0 7%;pointer-events:none}",
        ".chapter-number{position:absolute;top:48px;left:7%;font-family:Arial,sans-serif;font-size:10px;letter-spacing:6px;color:rgba(255,246,234,.8)}",
        ".text{width:48%;padding-bottom:11vh}",

        ".pop{opacity:0;transform:translateY(26px) scale(.96);transition:opacity .8s ease,transform .9s cubic-bezier(.34,1.56,.64,1)}",
        ".pop.in{opacity:1;transform:none}",

        ".eyebrow{font-family:Arial,sans-serif;font-size:10px;letter-spacing:6px;color:#ffe6b8;margin-bottom:26px;text-transform:uppercase}",

        "h1,h2{font-weight:400;line-height:1.03;letter-spacing:-1.5px;text-shadow:0 0 34px rgba(255,196,120,.55),0 4px 30px rgba(70,0,60,.45)}",
        "h1{font-size:clamp(42px,5.6vw,74px);max-width:680px}",

        ".w{display:inline-block;opacity:0;transform:translateY(.7em) scale(.88);filter:blur(6px);",
        "transition:opacity .6s ease calc(var(--i)*.08s),transform .8s cubic-bezier(.34,1.56,.64,1) calc(var(--i)*.08s),filter .6s ease calc(var(--i)*.08s)}",
        ".words.in .w{opacity:1;transform:none;filter:none}",

        ".description{margin-top:26px;max-width:520px;font-family:Arial,sans-serif;font-size:14px;line-height:1.85;color:rgba(255,246,234,.9);text-shadow:0 2px 16px rgba(60,0,60,.5)}",
        ".description.second{margin-top:14px;color:rgba(255,246,234,.74)}",

        ".continue-wrap{position:absolute;right:7%;bottom:6%;pointer-events:none;z-index:8}",
        ".next-chapter{padding:16px 34px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#fff6ea;cursor:pointer;",
        "background:rgba(255,255,255,.14);border:1px solid rgba(255,246,234,.7);border-radius:40px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);",
        "box-shadow:0 0 30px rgba(255,196,120,.35);opacity:0;visibility:hidden;transform:translateY(14px) scale(.94);",
        "transition:opacity .9s ease,transform .9s cubic-bezier(.34,1.56,.64,1),visibility 0s linear .9s,background .3s ease}",
        ".next-chapter.in{opacity:1;visibility:visible;pointer-events:auto;transform:none;transition-delay:0s;animation:bfBeat 2.4s ease-in-out 1s infinite}",
        "@keyframes bfBeat{0%,100%{box-shadow:0 0 26px rgba(255,196,120,.3)}50%{box-shadow:0 0 46px rgba(255,196,120,.75)}}",
        ".next-chapter:hover,.next-chapter:focus-visible{background:rgba(255,255,255,.26);outline:none}",
        ".next-chapter span{display:inline-block;transition:transform .4s ease}",
        ".next-chapter:hover span{transform:translateX(6px)}",

        "@media (max-width:800px){",
        ".film{--cx:50%;--cy:33%}",
        ".content{padding:0 8%}.chapter-number{top:28px}",
        ".text{width:100%;align-self:flex-end;padding-bottom:14%}",
        "h1{font-size:clamp(34px,9.5vw,54px)}",
        ".description{font-size:13px;margin-top:16px}.description.second{margin-top:10px}",
        ".continue-wrap{right:8%;bottom:3%}.next-chapter{padding:13px 24px;font-size:9px}}",

        "@media (prefers-reduced-motion:reduce){.sky,.rays,.glow{animation:none}}"

    ].join("\n");

    document.head.appendChild(css);


    /* ---------------------------------------------------------
       LIGHT: sparkles, bokeh, bursts, confetti, hearts, fireworks
    --------------------------------------------------------- */

    var rnd = Math.random;
    function pick(a) { return a[(rnd() * a.length) | 0]; }

    var HUES = [38, 46, 330, 18, 52];
    var cv = null, cx = null, W = 0, H = 0;
    var P = [];
    var particlesOn = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    function size() {
        var d = Math.min(window.devicePixelRatio || 1, 2);
        W = cv.clientWidth;
        H = cv.clientHeight;
        cv.width = W * d;
        cv.height = H * d;
        cx.setTransform(d, 0, 0, d, 0, 0);
    }

    function bokeh(init) {
        return { k: "b", x: rnd() * W, y: init ? rnd() * H : H + 90, r: 18 + rnd() * 70,
                 vx: (rnd() - 0.5) * 8, vy: -(10 + rnd() * 24), a: 0.05 + rnd() * 0.13, h: pick(HUES) };
    }

    function spark(init) {
        return { k: "s", x: rnd() * W, y: init ? rnd() * H : H + 10, r: 1 + rnd() * 2.2,
                 vx: (rnd() - 0.5) * 14, vy: -(24 + rnd() * 70), ph: rnd() * 6.3, s: 2 + rnd() * 4 };
    }

    function burst(x, y, n, power) {
        if (!particlesOn) return;
        for (var i = 0; i < n; i++) {
            var a = rnd() * 6.2832, v = power * (0.25 + rnd() * 0.95);
            P.push({ k: "p", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20,
                     r: 1.4 + rnd() * 3.2, life: 1, d: 0.3 + rnd() * 0.5, h: pick(HUES), w: rnd() < 0.3 });
        }
    }

    function confetti(n) {
        if (!particlesOn) return;
        for (var i = 0; i < n; i++) {
            P.push({ k: "c", x: rnd() * W, y: -20 - rnd() * H * 0.4, vx: (rnd() - 0.5) * 70, vy: 90 + rnd() * 160,
                     rot: rnd() * 6.28, vr: (rnd() - 0.5) * 9, w: 6 + rnd() * 7, h: 10 + rnd() * 9,
                     c: pick(["#ffd27a", "#ff8fb8", "#fff3d6", "#ffb067", "#c9a4ff", "#ffffff"]), ph: rnd() * 6 });
        }
    }

    function hearts(n) {
        if (!particlesOn) return;
        for (var i = 0; i < n; i++) {
            P.push({ k: "h", x: rnd() * W, y: H + 20 + rnd() * H * 0.5, s: 7 + rnd() * 13,
                     vy: -(60 + rnd() * 90), ph: rnd() * 6.3, sw: 14 + rnd() * 26,
                     c: pick(["255,120,160", "255,170,190", "255,255,255", "255,90,130", "255,200,120"]), a: 0.55 + rnd() * 0.4 });
        }
    }

    // a firework: a soft flash, a big ring, then a smaller ring
    function firework(x, y) {
        if (!particlesOn) return;
        var hue = pick([38, 330, 18, 52, 290, 200]);
        P.push({ k: "f", x: x, y: y, r: 0, life: 1, h: hue });

        function ring(n, power, lag) {
            setTimeout(function () {
                for (var i = 0; i < n; i++) {
                    var a = (i / n) * 6.2832 + rnd() * 0.1, v = power * (0.85 + rnd() * 0.3);
                    P.push({ k: "p", x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 70,
                             r: 1.8 + rnd() * 1.8, life: 1, d: 0.45 + rnd() * 0.3,
                             h: hue + (rnd() - 0.5) * 24, w: rnd() < 0.2 });
                }
            }, lag);
        }

        ring(64, 300, 0);
        ring(34, 150, 130);
    }

    var last = 0;

    function frame(now) {

        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        cx.clearRect(0, 0, W, H);

        for (var i = P.length - 1; i >= 0; i--) {
            var p = P[i];

            if (p.k === "b") {
                p.x += p.vx * dt; p.y += p.vy * dt;
                if (p.y < -p.r) { P[i] = bokeh(false); continue; }
                cx.globalCompositeOperation = "lighter";
                var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                g.addColorStop(0, "hsla(" + p.h + ",100%,75%," + p.a + ")");
                g.addColorStop(1, "hsla(" + p.h + ",100%,60%,0)");
                cx.fillStyle = g;
                cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832); cx.fill();
            }

            else if (p.k === "s") {
                p.x += p.vx * dt; p.y += p.vy * dt;
                if (p.y < -10) { P[i] = spark(false); continue; }
                var tw = 0.5 + 0.5 * Math.sin(now / 1000 * p.s + p.ph);
                cx.globalCompositeOperation = "lighter";
                cx.fillStyle = "rgba(255,236,190," + (0.25 + 0.65 * tw) + ")";
                cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.7 + tw * 0.6), 0, 6.2832); cx.fill();
            }

            else if (p.k === "p") {
                p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.9 * dt;
                p.vy += (p.g === undefined ? -26 : p.g) * dt;          // bursts drift UP; fireworks fall
                p.x += p.vx * dt; p.y += p.vy * dt;
                p.life -= p.d * dt;
                if (p.life <= 0) { P.splice(i, 1); continue; }
                cx.globalCompositeOperation = "lighter";
                cx.fillStyle = p.w ? "rgba(255,255,255," + p.life + ")" : "hsla(" + p.h + ",100%,68%," + p.life + ")";
                cx.beginPath(); cx.arc(p.x, p.y, p.r * (0.5 + p.life), 0, 6.2832); cx.fill();
            }

            else if (p.k === "f") {
                p.life -= 2.2 * dt; p.r += 520 * dt;
                if (p.life <= 0) { P.splice(i, 1); continue; }
                cx.globalCompositeOperation = "lighter";
                var fg = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                fg.addColorStop(0, "hsla(" + p.h + ",100%,85%," + (p.life * 0.5) + ")");
                fg.addColorStop(1, "hsla(" + p.h + ",100%,60%,0)");
                cx.fillStyle = fg;
                cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.2832); cx.fill();
            }

            else if (p.k === "h") {
                p.y += p.vy * dt;
                if (p.y < -30) { P.splice(i, 1); continue; }
                var hx = p.x + Math.sin(now / 700 + p.ph) * p.sw;
                cx.globalCompositeOperation = "source-over";
                cx.fillStyle = "rgba(" + p.c + "," + p.a + ")";
                cx.beginPath();
                cx.moveTo(hx, p.y + p.s * 0.9);
                cx.bezierCurveTo(hx - p.s * 1.5, p.y - p.s * 0.1, hx - p.s * 0.6, p.y - p.s * 1.2, hx, p.y - p.s * 0.4);
                cx.bezierCurveTo(hx + p.s * 0.6, p.y - p.s * 1.2, hx + p.s * 1.5, p.y - p.s * 0.1, hx, p.y + p.s * 0.9);
                cx.fill();
            }

            else {
                p.x += (p.vx + Math.sin(now / 600 + p.ph) * 30) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
                if (p.y > H + 30) { P.splice(i, 1); continue; }
                cx.globalCompositeOperation = "source-over";
                cx.save();
                cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(1, Math.abs(Math.sin(p.rot * 1.3)) * 0.8 + 0.2);
                cx.fillStyle = p.c;
                cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                cx.restore();
            }
        }

        requestAnimationFrame(frame);
    }

    function start(canvas, opts) {
        opts = opts || {};
        cv = canvas;
        cx = cv.getContext("2d");
        size();
        window.addEventListener("resize", size);

        if (particlesOn) {
            var nb = W < 700 ? 10 : 22, ns = W < 700 ? 34 : 70;
            for (var i = 0; i < nb; i++) P.push(bokeh(true));
            for (var j = 0; j < ns; j++) P.push(spark(true));
        }

        last = performance.now();
        requestAnimationFrame(frame);
    }


    /* ---------------------------------------------------------
       SOUND: little bells that climb, and soft fireworks pops
    --------------------------------------------------------- */

    var AC = null;
    var UP = [1, 1.25, 1.5, 2, 2.5, 3, 4];

    function muted() {
        try {
            var st = JSON.parse(sessionStorage.getItem("bf_music_v1"));
            return !!(st && st.muted);
        } catch (e) { return false; }
    }

    // runs fn(ctx) only if the browser lets audio play. If it doesn't, we ask
    // ONCE (one quiet console note at most), then wait for her first tap.
    var tried = false;

    function arm() {
        var evs = ["pointerdown", "keydown", "touchstart"];
        var f = function () {
            evs.forEach(function (e) { window.removeEventListener(e, f, true); });
            try { if (AC) AC.resume(); } catch (e) {}
        };
        evs.forEach(function (e) { window.addEventListener(e, f, true); });
    }

    function audio(fn) {
        if (muted()) return;
        try {
            if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();

            if (AC.state === "running") { fn(AC); return; }
            if (tried) return;
            tried = true;

            arm();   // if the browser says no, her first tap will turn the sound on
            AC.resume().then(function () {
                if (AC.state === "running") fn(AC);
            }).catch(function () {});
        } catch (e) {}
    }

    function bell(c, f, t, vol) {
        [[1, 0.09], [2.003, 0.035], [3.01, 0.015]].forEach(function (pr) {
            var o = c.createOscillator(), g = c.createGain();
            o.type = "sine";
            o.frequency.value = f * pr[0];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(pr[1] * (vol || 1), t + 0.006);
            g.gain.exponentialRampToValueAtTime(0.0004, t + 1.5);
            o.connect(g); g.connect(c.destination);
            o.start(t); o.stop(t + 1.6);
        });
    }

    function chime(base, ratios, vol) {
        audio(function (c) {
            var t = c.currentTime + 0.03;
            (ratios || UP).forEach(function (r, i) { bell(c, base * r, t + i * 0.075, vol); });
        });
    }

    // a soft firework pop: low thump + a little crackle
    function pop() {
        audio(function (c) {
            var t = c.currentTime + 0.02;

            var o = c.createOscillator(), g = c.createGain();
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(45, t + 0.3);
            g.gain.setValueAtTime(0.28, t);
            g.gain.exponentialRampToValueAtTime(0.0005, t + 0.4);
            o.connect(g); g.connect(c.destination);
            o.start(t); o.stop(t + 0.45);

            var len = Math.floor(c.sampleRate * 0.5);
            var nb = c.createBuffer(1, len, c.sampleRate), d = nb.getChannelData(0);
            for (var i = 0; i < len; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / len, 2);
            var s = c.createBufferSource(), f = c.createBiquadFilter(), g2 = c.createGain();
            s.buffer = nb; f.type = "highpass"; f.frequency.value = 3500;
            g2.gain.value = 0.12;
            s.connect(f); f.connect(g2); g2.connect(c.destination);
            s.start(t);
        });
    }


    /* ---------------------------------------------------------
       WORDS: make a headline pop in word by word
    --------------------------------------------------------- */

    function words(el, text) {
        el.classList.add("words");
        el.innerHTML = text.split(" ").map(function (w, i) {
            return '<span class="w" style="--i:' + i + '">' + w + "</span>";
        }).join(" ");
    }

    function flash(el, kind) {
        el.classList.remove("go", "soft", "leave");
        void el.offsetWidth;
        el.classList.add(kind);
    }

    window.BFX = {
        start: start, burst: burst, confetti: confetti, hearts: hearts, firework: firework,
        chime: chime, pop: pop, words: words, flash: flash, UP: UP,
        size: function () { return { w: W, h: H }; }
    };

})();