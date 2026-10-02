/* =====================================================================
   BIRTHDAYFILM — drumroll.js
   Put this file in the project ROOT, next to music.js.

   THE DRUM ROLL TRANSITION
   Her photographs rush past on a reel, faster and faster, with a snare
   roll building underneath. The reel slows and lands on one photograph.
   A beat of silence. Then BOOM, it zooms to fill the screen, fades to
   black, and the next chapter begins.

   USE (in any chapter):

     <script src="../drumroll.js"></script>

     BirthdayDrumroll.play({
         photos: ["../assets/photos/a.jpg", "../assets/photos/b.jpg"],
         target: "../assets/photos/the-one-that-zooms.jpg",
         onDone: function () { window.location.href = "chapter4.html"; }
     });

   Optional:  BirthdayDrumroll.preload([...])  loads photos early so the
              roll starts instantly.
              speed: 0.25 in play() runs everything 4x faster (testing).
   ===================================================================== */

(function () {
    "use strict";

    var running = false;
    var loaded = {};


    /* ---------------------------------------------------------
       PRELOAD
    --------------------------------------------------------- */

    function load(src) {
        return new Promise(function (resolve) {
            if (loaded[src]) return resolve();
            var im = new Image();
            im.onload = im.onerror = function () { loaded[src] = true; resolve(); };
            im.src = src;
        });
    }

    function preload(list) {
        (list || []).forEach(load);
    }


    /* ---------------------------------------------------------
       STYLE (added once)
    --------------------------------------------------------- */

    function addStyle() {
        if (document.getElementById("bfDrStyle")) return;

        var css = document.createElement("style");
        css.id = "bfDrStyle";
        css.textContent =
            "#bfDr{position:fixed;inset:0;z-index:100000;background:#000;opacity:0;overflow:hidden;" +
            "transition:opacity .6s ease;cursor:default}" +
            "#bfDr .bfdr-reel{position:absolute;left:0;top:50%;width:100%;will-change:filter;" +
            "transition:opacity .4s ease}" +
            "#bfDr .bfdr-card{position:absolute;left:0;top:0;overflow:hidden;background:#111;" +
            "box-shadow:0 14px 50px rgba(0,0,0,.7);will-change:transform}" +
            "#bfDr .bfdr-card img{width:100%;height:100%;object-fit:cover;display:block;" +
            "filter:brightness(.9) contrast(1.04) saturate(.92)}" +
            "#bfDr .bfdr-mark{position:absolute;left:50%;width:1px;height:6vh;background:rgba(243,238,230,.4);" +
            "transition:opacity .4s ease}" +
            "#bfDr .bfdr-mark.top{top:calc(50% - var(--bfh) / 2 - 9vh)}" +
            "#bfDr .bfdr-mark.bot{top:calc(50% + var(--bfh) / 2 + 3vh)}" +
            "#bfDr .bfdr-vig{position:absolute;inset:0;pointer-events:none;" +
            "background:radial-gradient(ellipse at center,transparent 35%,rgba(0,0,0,.85) 100%)}" +
            "#bfDr .bfdr-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}" +
            "#bfDr .bfdr-flash.go{animation:bfdrFlash .7s ease-out}" +
            "@keyframes bfdrFlash{0%{opacity:.7}100%{opacity:0}}" +
            "#bfDr.zooming .bfdr-reel,#bfDr.zooming .bfdr-mark{opacity:0}" +
            "#bfDr .bfdr-zoom{position:absolute;overflow:hidden;transform-origin:50% 50%;" +
            "will-change:transform,opacity;box-shadow:0 0 120px rgba(0,0,0,.9)}" +
            "#bfDr .bfdr-zoom img{width:100%;height:100%;object-fit:cover;display:block}";
        document.head.appendChild(css);
    }


    /* ---------------------------------------------------------
       SOUND (its own little drum kit, works with mp3 or synth)
    --------------------------------------------------------- */

    function makeAudio() {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;

        try {
            var st = JSON.parse(sessionStorage.getItem("bf_music_v1"));
            if (st && st.muted) return null;
        } catch (e) {}

        var ctx;
        try { ctx = new AC(); } catch (e) { return null; }
        if (ctx.state === "suspended") ctx.resume();

        var master = ctx.createGain();
        master.gain.value = 0.9;
        var comp = ctx.createDynamicsCompressor();
        master.connect(comp);
        comp.connect(ctx.destination);

        var nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.5), ctx.sampleRate);
        var d = nb.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

        function noise(when, type, freq, q, peak, decay, dur) {
            var src = ctx.createBufferSource();
            src.buffer = nb;
            var f = ctx.createBiquadFilter();
            f.type = type;
            f.frequency.value = freq;
            f.Q.value = q;
            var g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, when);
            g.gain.linearRampToValueAtTime(peak, when + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0005, when + decay);
            src.connect(f);
            f.connect(g);
            g.connect(master);
            src.start(when, Math.random() * 0.8, dur);
        }

        function tone(when, f0, f1, peak, decay, type) {
            var o = ctx.createOscillator();
            o.type = type || "sine";
            o.frequency.setValueAtTime(f0, when);
            o.frequency.exponentialRampToValueAtTime(f1, when + decay * 0.6);
            var g = ctx.createGain();
            g.gain.setValueAtTime(peak, when);
            g.gain.exponentialRampToValueAtTime(0.0005, when + decay);
            o.connect(g);
            g.connect(master);
            o.start(when);
            o.stop(when + decay + 0.05);
        }

        return {
            ctx: ctx,

            // one stroke of the snare roll
            snare: function (when, amp) {
                noise(when, "bandpass", 2200 + Math.random() * 700, 0.7, amp, 0.08, 0.12);
                tone(when, 230, 140, amp * 0.5, 0.06, "triangle");
            },

            // the big hit when the photograph zooms
            boom: function (when) {
                tone(when, 120, 36, 1.0, 1.8, "sine");
                tone(when, 70, 30, 0.8, 1.4, "sine");
                noise(when, "lowpass", 900, 0.5, 0.75, 0.9, 1.2);
                noise(when, "highpass", 4500, 0.5, 0.3, 2.2, 2.4);
            },

            close: function () {
                setTimeout(function () { try { ctx.close(); } catch (e) {} }, 6000);
            }
        };
    }


    /* ---------------------------------------------------------
       PLAY
    --------------------------------------------------------- */

    function play(opts) {

        if (running) return;
        running = true;

        opts = opts || {};

        var photos = (opts.photos || []).slice();
        var target = opts.target;
        var sp     = opts.speed || 1;
        var done   = typeof opts.onDone === "function" ? opts.onDone : function () {};

        var finished = false;
        function finish() {
            if (finished) return;
            finished = true;
            try { done(); } catch (e) {}
        }

        var reduce = window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        addStyle();

        // created inside the tap, so the browser lets the drums play
        var audio = makeAudio();

        var root = document.createElement("div");
        root.id = "bfDr";
        document.body.appendChild(root);

        // gentle fallback: no photos, or reduced motion
        if (!photos.length || !target || reduce) {
            void root.offsetWidth;
            root.style.opacity = "1";
            setTimeout(finish, 900 * sp);
            return;
        }

        // never wait more than 2.5s for photographs
        Promise.race([
            Promise.all(photos.concat([target]).map(load)),
            new Promise(function (r) { setTimeout(r, 2500); })
        ]).then(start);


        function start() {

            var vw = window.innerWidth;
            var vh = window.innerHeight;

            /* ---- the reel ---- */

            var cardH = Math.min(vh * 0.56, 540);
            var cardW = cardH * 0.75;
            if (cardW > vw * 0.6) { cardW = vw * 0.6; cardH = cardW / 0.75; }

            var pitch = cardW * 1.1;
            var N = Math.max(photos.length + 1, Math.ceil(vw / pitch) + 3);
            var T = N - 1;                       // the target card comes last
            var L = N * pitch;

            root.style.setProperty("--bfh", cardH + "px");
            root.innerHTML =
                '<div class="bfdr-reel"></div>' +
                '<div class="bfdr-mark top"></div>' +
                '<div class="bfdr-mark bot"></div>' +
                '<div class="bfdr-vig"></div>' +
                '<div class="bfdr-flash"></div>';

            var reel  = root.querySelector(".bfdr-reel");
            var flash = root.querySelector(".bfdr-flash");

            reel.style.height    = cardH + "px";
            reel.style.marginTop = (-cardH / 2) + "px";

            var tilt  = [-1.2, 0.8, -0.5, 1.1, -0.9, 0.4];
            var lift  = [-10, 6, -4, 12, -8, 3];
            var cards = [];

            for (var i = 0; i < N; i++) {
                var c = document.createElement("div");
                c.className = "bfdr-card";
                c.style.width  = cardW + "px";
                c.style.height = cardH + "px";

                var im = document.createElement("img");
                im.alt = "";
                im.src = i === T ? target : photos[i % photos.length];
                c.appendChild(im);

                reel.appendChild(c);
                cards.push({
                    el: c,
                    r: i === T ? 0 : tilt[i % tilt.length],
                    y: i === T ? 0 : lift[i % lift.length] * (cardH / 500)
                });
            }

            function mod(a, b) { return ((a % b) + b) % b; }

            // card 0 starts in the middle of the screen
            var s0 = -(vw / 2 - cardW / 2);

            function place(offset) {
                for (var k = 0; k < N; k++) {
                    var x = mod(k * pitch - offset + pitch, L) - pitch;
                    cards[k].el.style.transform =
                        "translate3d(" + x.toFixed(1) + "px," + cards[k].y.toFixed(1) + "px,0) " +
                        "rotate(" + cards[k].r + "deg)";
                }
            }


            /* ---- the speed of the roll ----
               Ta seconds speeding up, Tb seconds settling down.
               The distance is chosen so the target card stops
               exactly in the middle of the screen.            */

            var Ta = 4.3, Tb = 1.15;
            var v0 = pitch * 1.1;

            var Dmin = pitch * 26;
            var D = T * pitch;
            if (D < Dmin) D += Math.ceil((Dmin - D) / L) * L;

            var vmax = (D - (2 / 3) * v0 * Ta) * 3 / (Ta + Tb);

            function dist(u) {
                if (u <= Ta) return v0 * u + (vmax - v0) * u * u * u / (3 * Ta * Ta);
                var A = v0 * Ta + (vmax - v0) * Ta / 3;
                var tau = Math.min(u - Ta, Tb);
                return A + vmax * (Tb / 3) * (1 - Math.pow(1 - tau / Tb, 3));
            }

            function vel(u) {
                if (u <= Ta) { var q = u / Ta; return v0 + (vmax - v0) * q * q; }
                var r = 1 - Math.min(u - Ta, Tb) / Tb;
                return vmax * r * r;
            }

            place(s0);


            /* ---- the drums ---- */

            var lead = 0.1;   // seconds, so sound and picture start together

            if (audio) {
                var base = audio.ctx.currentTime + lead;
                var step = pitch / 3;
                var next = step;

                for (var u = 0; u <= Ta + Tb; u += 0.002) {
                    var sd = dist(u);
                    if (sd >= next) {
                        while (sd >= next) next += step;
                        var f = Math.min(1, vel(u) / vmax);
                        audio.snare(base + u * sp, 0.05 + 0.32 * Math.pow(f, 0.8));
                    }
                }
            }

            var M = window.BirthdayMusic;
            try { if (M) { M.level(2); M.swell((Ta + Tb) * sp); } } catch (e) {}


            /* ---- go ---- */

            void root.offsetWidth;
            root.style.opacity = "1";

            var t0 = performance.now() + lead * 1000;

            function frame(now) {

                var el = (now - t0) / 1000;
                if (el < 0) { requestAnimationFrame(frame); return; }

                var u = el / sp;

                if (u >= Ta + Tb) {
                    place(s0 + D);
                    reel.style.filter = "none";
                    setTimeout(zoom, 600 * sp);      // the held breath
                    return;
                }

                place(s0 + dist(u));

                var fast = Math.min(1, vel(u) / vmax);
                var blur = fast * fast * 2.6;
                reel.style.filter = blur > 0.3 ? "blur(" + blur.toFixed(2) + "px)" : "none";

                requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);


            /* ---- the zoom ---- */

            function zoom() {

                var tc = cards[T].el;
                var r  = tc.getBoundingClientRect();

                var z = document.createElement("div");
                z.className = "bfdr-zoom";
                z.style.left   = r.left + "px";
                z.style.top    = r.top + "px";
                z.style.width  = r.width + "px";
                z.style.height = r.height + "px";

                var zi = document.createElement("img");
                zi.alt = "";
                zi.src = target;
                z.appendChild(zi);

                root.insertBefore(z, root.querySelector(".bfdr-vig"));
                tc.style.visibility = "hidden";
                root.classList.add("zooming");

                if (audio) audio.boom(audio.ctx.currentTime + 0.02);
                try { if (M) M.hit(); } catch (e) {}

                flash.classList.add("go");

                // photograph grows until it fills the height of the screen
                var S = vh / r.height;

                void z.offsetWidth;
                z.style.transition = "transform " + (1.0 * sp) + "s cubic-bezier(.7,0,.12,1)";
                z.style.transform = "scale(" + S + ")";

                // then a slow push in while it holds
                setTimeout(function () {
                    z.style.transition = "transform " + (2.2 * sp) + "s ease-out, opacity " + (0.8 * sp) + "s ease";
                    z.style.transform = "scale(" + (S * 1.07) + ")";
                }, 1000 * sp);

                // and out to black
                setTimeout(function () {
                    z.style.opacity = "0";
                }, 1700 * sp);

                setTimeout(function () {
                    if (audio) audio.close();
                    finish();
                }, 2500 * sp);
            }
        }
    }


    window.BirthdayDrumroll = { play: play, preload: preload };

})();