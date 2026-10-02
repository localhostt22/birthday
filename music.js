/* =====================================================================
   BIRTHDAYFILM — music.js
   Put this file in the project ROOT, next to index.html.

   TWO MODES, picked automatically:

   1. YOUR OWN SONG (best, strongly recommended)
      Put an mp3 here:   assets/music/theme.mp3
      It will loop under the whole film and carry on from page to page.

   2. BUILT-IN SCORE (fallback, no file needed)
      If theme.mp3 isn't there, a soft piano + strings score is
      generated live in the browser.

   Every page that should have music needs ONE line before </body>:
      index.html            <script src="music.js"></script>
      chapters/chapterN.html <script src="../music.js"></script>
   ===================================================================== */

(function () {
    "use strict";

    var scriptSrc = document.currentScript && document.currentScript.src;
    var baseDir = scriptSrc ? new URL(".", scriptSrc) : new URL("./", window.location.href);
    var MP3_URL = new URL("assets/music/theme.mp3", baseDir).href;

    var KEY = "bf_music_v1";
    var BAR = 3.9;                       // seconds per bar (slow, ~62 bpm)
    var STEP = BAR / 8;                  // eighth note

    var state = loadState();
    var mode = null;                     // "mp3" | "synth"
    var audio = null;                    // mp3 element
    var ctx = null;                      // synth context
    var bus = {};                        // synth buses
    var barIdx = 0, nextBarTime = 0, timer = null;
    var level = state.level;             // 0 sparse, 1 gentle, 2 full
    var uiBuilt = false, hintEl = null, muteEl = null;


    /* ---------------------------------------------------------
       STATE (survives page changes within the same tab)
    --------------------------------------------------------- */

    function loadState() {
        try {
            var s = JSON.parse(sessionStorage.getItem(KEY));
            if (s && typeof s === "object") return s;
        } catch (e) {}
        return { on: false, muted: false, mode: null, level: 1, t0: 0, mp3t: 0, savedAt: 0 };
    }

    function saveState() {
        try {
            if (mode === "mp3" && audio) {
                state.mp3t = audio.currentTime || 0;
                state.savedAt = Date.now();
            }
            state.level = level;
            sessionStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {}
    }


    /* ---------------------------------------------------------
       SMALL HELPERS
    --------------------------------------------------------- */

    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

    function rng(seed) {                 // seeded random: same bar = same music
        var a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }


    /* ---------------------------------------------------------
       THE SCORE  (D major:  I  V  vi  IV  I  V  IV  V)
    --------------------------------------------------------- */

    var CHORDS = [
        { bass: 38, pad: [50, 57, 62, 66],     arp: [62, 66, 69, 73, 74] },   // D
        { bass: 33, pad: [49, 52, 57, 64],     arp: [64, 69, 73, 76, 69] },   // A/C#
        { bass: 35, pad: [47, 54, 59, 62],     arp: [62, 66, 71, 74, 78] },   // Bm
        { bass: 31, pad: [43, 50, 55, 59, 62], arp: [62, 67, 71, 74, 79] },   // G
        { bass: 38, pad: [50, 57, 62, 66],     arp: [62, 66, 69, 73, 74] },   // D
        { bass: 33, pad: [49, 52, 57, 64],     arp: [64, 69, 73, 76, 69] },   // A/C#
        { bass: 31, pad: [43, 50, 55, 59, 62], arp: [62, 67, 71, 74, 79] },   // G
        { bass: 33, pad: [45, 52, 57, 61],     arp: [64, 69, 73, 76, 81] }    // A
    ];

    var MELODY = [78, 76, 74, 71, 81, 76, 71, 73];

    // which chord tone to play on each eighth-note step
    var PATTERN = [0, 2, 1, 3, 2, 4, 3, 1];


    /* ---------------------------------------------------------
       SYNTH: building the sound
    --------------------------------------------------------- */

    function makeImpulse(seconds, decay) {
        var len = Math.floor(ctx.sampleRate * seconds);
        var buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var d = buf.getChannelData(ch);
            for (var i = 0; i < len; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
            }
        }
        return buf;
    }

    function buildGraph() {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();

        bus.master = ctx.createGain();
        bus.master.gain.value = 0;

        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 3;

        bus.master.connect(comp);
        comp.connect(ctx.destination);

        // reverb: a big, soft room
        var conv = ctx.createConvolver();
        conv.buffer = makeImpulse(4.4, 2.6);
        var wetLP = ctx.createBiquadFilter();
        wetLP.type = "lowpass";
        wetLP.frequency.value = 3600;
        var wet = ctx.createGain();
        wet.gain.value = 0.55;
        bus.reverb = ctx.createGain();
        bus.reverb.connect(conv);
        conv.connect(wetLP);
        wetLP.connect(wet);
        wet.connect(bus.master);

        function makeBus(dry, send) {
            var g = ctx.createGain();
            g.gain.value = 1;
            var d = ctx.createGain(); d.gain.value = dry;
            var s = ctx.createGain(); s.gain.value = send;
            g.connect(d); d.connect(bus.master);
            g.connect(s); s.connect(bus.reverb);
            return g;
        }

        bus.piano = makeBus(0.55, 0.55);
        bus.pad   = makeBus(0.8, 0.5);
        bus.bass  = makeBus(1.0, 0.1);
        bus.lead  = makeBus(0.4, 0.8);
        bus.fx    = makeBus(0.7, 0.5);

        applyLevel(true);
    }

    function applyLevel(instant) {
        if (!ctx) return;
        var t = ctx.currentTime;
        var k = instant ? 0.01 : 1.6;
        var pad  = level >= 1 ? (level >= 2 ? 1.0 : 0.65) : 0.0;
        var bass = level >= 2 ? 0.9 : 0.0;
        var lead = level >= 2 ? 1.0 : 0.0;
        bus.pad.gain.setTargetAtTime(pad, t, k);
        bus.bass.gain.setTargetAtTime(bass, t, k);
        bus.lead.gain.setTargetAtTime(lead, t, k);
    }

    function masterTarget() {
        return state.muted ? 0 : 0.85;
    }

    function fadeMaster(seconds) {
        if (!ctx) return;
        bus.master.gain.cancelScheduledValues(ctx.currentTime);
        bus.master.gain.setTargetAtTime(masterTarget(), ctx.currentTime, seconds / 3);
    }


    /* ---------------------------------------------------------
       SYNTH: the instruments
    --------------------------------------------------------- */

    function piano(f, t, vel) {
        var o1 = ctx.createOscillator(); o1.type = "triangle"; o1.frequency.value = f;
        o1.detune.value = (Math.random() - 0.5) * 6;
        var o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2;
        var o3 = ctx.createOscillator(); o3.type = "sine"; o3.frequency.value = f * 3.005;

        var g2 = ctx.createGain(); g2.gain.value = 0.35;
        var g3 = ctx.createGain(); g3.gain.value = 0.12;

        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(vel, t + 0.006);
        env.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.35);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(3200, t);
        lp.frequency.exponentialRampToValueAtTime(700, t + 1.5);

        o1.connect(env);
        o2.connect(g2); g2.connect(env);
        o3.connect(g3); g3.connect(env);
        env.connect(lp);
        lp.connect(bus.piano);

        [o1, o2, o3].forEach(function (o) { o.start(t); o.stop(t + 3.3); });
    }

    function padVoice(f, t, dur) {
        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 850;
        lp.Q.value = 0.4;

        var env = ctx.createGain();
        var peak = 0.05;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(peak, t + 1.5);
        env.gain.setValueAtTime(peak, t + dur);
        env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);

        [-7, 7].forEach(function (c) {
            var o = ctx.createOscillator();
            o.type = "sawtooth";
            o.frequency.value = f;
            o.detune.value = c;
            o.connect(lp);
            o.start(t);
            o.stop(t + dur + 1.9);
        });

        lp.connect(env);
        env.connect(bus.pad);
    }

    function bassNote(m, t, dur) {
        var o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = mtof(m);

        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.16, t + 0.08);
        env.gain.exponentialRampToValueAtTime(0.09, t + 1.2);
        env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);

        o.connect(env);
        env.connect(bus.bass);
        o.start(t);
        o.stop(t + dur + 0.7);
    }

    function leadNote(m, t, dur) {
        var f = mtof(m);
        var o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
        var o2 = ctx.createOscillator(); o2.type = "triangle"; o2.frequency.value = f * 2;
        var g2 = ctx.createGain(); g2.gain.value = 0.15;

        var lfo = ctx.createOscillator(); lfo.frequency.value = 5;
        var lfoG = ctx.createGain(); lfoG.gain.value = 3;
        lfo.connect(lfoG); lfoG.connect(o.detune);

        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.085, t + 0.35);
        env.gain.setValueAtTime(0.07, t + dur);
        env.gain.linearRampToValueAtTime(0.0001, t + dur + 1.6);

        o.connect(env);
        o2.connect(g2); g2.connect(env);
        env.connect(bus.lead);

        [o, o2, lfo].forEach(function (x) { x.start(t); x.stop(t + dur + 1.7); });
    }


    /* ---------------------------------------------------------
       SYNTH: one bar of music
    --------------------------------------------------------- */

    function scheduleBar(i, t0) {
        var chord = CHORDS[i % CHORDS.length];
        var r = rng(i * 7919 + 13);

        // pad swells under the bar
        if (level >= 1) {
            chord.pad.forEach(function (m) { padVoice(mtof(m), t0 - 0.25, BAR + 0.25); });
        }

        if (level >= 2) {
            // bass root
            bassNote(chord.bass, t0, BAR - 0.3);

            // soft lead melody, one long note per bar
            leadNote(MELODY[i % MELODY.length], t0 + 0.05, BAR * 0.8);
        }

        // piano arpeggio
        var steps = level >= 2 ? [0, 1, 2, 3, 4, 5, 6, 7]
                  : level >= 1 ? [0, 2, 4, 6]
                  :              [0, 4];

        steps.forEach(function (s) {
            if (s !== 0 && r() < 0.14) return;                 // let some notes breathe
            var idx = PATTERN[s % PATTERN.length];
            var m = chord.arp[idx % chord.arp.length];
            if (s === 0) m = chord.arp[0] - 12;                // anchor note, an octave lower
            var jitter = (r() - 0.5) * 0.02;
            var vel = (level >= 2 ? 0.10 : 0.12) * (0.75 + r() * 0.5);
            piano(mtof(m), t0 + s * STEP + jitter, vel);
        });

        // a little sparkle on top at full level
        if (level >= 2 && r() < 0.6) {
            piano(mtof(chord.arp[4] + 12), t0 + 6 * STEP, 0.05);
        }
    }

    function startScheduler(offsetSec) {
        var elapsed = offsetSec || 0;
        barIdx = Math.floor(elapsed / BAR) + (elapsed > 0 ? 1 : 0);
        nextBarTime = ctx.currentTime + (elapsed > 0 ? (BAR - (elapsed % BAR)) : 0.15);

        clearInterval(timer);
        timer = setInterval(function () {
            while (nextBarTime < ctx.currentTime + 1.2) {
                scheduleBar(barIdx, nextBarTime);
                barIdx++;
                nextBarTime += BAR;
            }
        }, 250);
    }


    /* ---------------------------------------------------------
       SYNTH: cinematic hits
    --------------------------------------------------------- */

    function noiseBuffer(seconds) {
        var len = Math.floor(ctx.sampleRate * seconds);
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    function riser(dur) {
        var t = ctx.currentTime + 0.05;
        var src = ctx.createBufferSource();
        src.buffer = noiseBuffer(dur + 0.5);

        var bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 1.2;
        bp.frequency.setValueAtTime(250, t);
        bp.frequency.exponentialRampToValueAtTime(3200, t + dur);

        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.14, t + dur);
        env.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4);

        src.connect(bp); bp.connect(env); env.connect(bus.fx);
        src.start(t); src.stop(t + dur + 0.5);
    }

    function boom() {
        var t = ctx.currentTime + 0.02;

        var o = ctx.createOscillator();
        o.type = "sine";
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(36, t + 2.6);

        var env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.5, t + 0.03);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

        o.connect(env); env.connect(bus.fx);
        o.start(t); o.stop(t + 3.3);

        // a warm D major chord struck with it
        [50, 57, 62, 66, 69, 74].forEach(function (m, k) {
            piano(mtof(m), t + k * 0.045, 0.16);
        });
    }


    /* ---------------------------------------------------------
       MP3 MODE
    --------------------------------------------------------- */

    function mp3Volume() {
        if (state.muted) return 0;
        return level >= 2 ? 1.0 : level >= 1 ? 0.78 : 0.55;
    }

    var volTimer = null;
    function fadeAudio(target, ms) {
        clearInterval(volTimer);
        if (!audio) return;
        var from = audio.volume;
        var t0 = Date.now();
        volTimer = setInterval(function () {
            var p = Math.min(1, (Date.now() - t0) / ms);
            audio.volume = Math.max(0, Math.min(1, from + (target - from) * p));
            if (p >= 1) clearInterval(volTimer);
        }, 50);
    }

    function startMp3(resumeSeconds) {
        return new Promise(function (resolve, reject) {
            audio = new Audio();
            audio.loop = true;
            audio.preload = "auto";
            audio.volume = 0;
            audio.src = MP3_URL;

            if (resumeSeconds > 0) {
                audio.addEventListener("loadedmetadata", function () {
                    var d = audio.duration;
                    audio.currentTime = isFinite(d) && d > 0 ? resumeSeconds % d : 0;
                }, { once: true });
            }

            var p = audio.play();
            if (p && p.then) {
                p.then(function () { resolve(); }).catch(function (err) { reject(err); });
            } else {
                resolve();
            }
        });
    }


    /* ---------------------------------------------------------
       STARTING, RESUMING
    --------------------------------------------------------- */

    function buildUI() {
        if (uiBuilt) return;
        uiBuilt = true;

        var css = document.createElement("style");
        css.textContent =
            ".bfm{position:fixed;z-index:60;font-family:Arial,Helvetica,sans-serif;font-size:9px;" +
            "letter-spacing:3px;text-transform:uppercase;color:rgba(243,238,230,.42);background:none;" +
            "border:none;cursor:pointer;padding:6px 2px;transition:color .4s ease,opacity 1.2s ease;opacity:0;pointer-events:none}" +
            ".bfm:hover,.bfm:focus-visible{color:rgba(243,238,230,.9);outline:none}" +
            ".bfm.show{opacity:1;pointer-events:auto}" +
            "#bfmMute{top:12px;right:16px}" +
            "#bfmHint{bottom:14px;left:50%;transform:translateX(-50%);color:rgba(243,238,230,.7)}";
        document.head.appendChild(css);

        muteEl = document.createElement("button");
        muteEl.id = "bfmMute";
        muteEl.className = "bfm";
        muteEl.type = "button";
        muteEl.addEventListener("click", toggleMute);
        document.body.appendChild(muteEl);
        refreshMuteLabel();

        hintEl = document.createElement("button");
        hintEl.id = "bfmHint";
        hintEl.className = "bfm";
        hintEl.type = "button";
        hintEl.textContent = "\u266A tap for sound";
        hintEl.addEventListener("click", unlock);
        document.body.appendChild(hintEl);
    }

    function refreshMuteLabel() {
        if (!muteEl) return;
        muteEl.textContent = state.muted ? "\u266A sound off" : "\u266A sound on";
    }

    function showMute() {
        buildUI();
        setTimeout(function () { muteEl.classList.add("show"); }, 50);
    }

    function toggleMute() {
        state.muted = !state.muted;
        refreshMuteLabel();
        if (mode === "synth") fadeMaster(0.5);
        if (mode === "mp3") fadeAudio(mp3Volume(), 500);
        saveState();
    }

    var blocked = false;
    function showHint() {
        blocked = true;
        buildUI();
        showMute();
        setTimeout(function () { hintEl.classList.add("show"); }, 50);

        ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
            window.addEventListener(ev, unlock, { once: true, passive: true });
        });
    }

    function unlock() {
        if (!blocked) return;
        blocked = false;
        if (hintEl) hintEl.classList.remove("show");

        if (mode === "synth" && ctx) {
            ctx.resume().then(function () { fadeMaster(3); });
        } else if (mode === "mp3" && audio) {
            audio.play().then(function () { fadeAudio(mp3Volume(), 2500); }).catch(function () {});
        }
    }

    function begin(resuming) {
        var offset = 0;

        if (resuming && state.mode === "mp3") {
            offset = state.mp3t + (Date.now() - state.savedAt) / 1000;
        } else if (resuming && state.mode === "synth") {
            offset = (Date.now() - state.t0) / 1000;
        } else {
            state.t0 = Date.now();
        }

        function goSynth() {
            mode = "synth";
            state.mode = "synth";
            if (!ctx) buildGraph();
            startScheduler(resuming && offset > 0 ? offset : 0);

            var done = function () {
                if (ctx.state === "running") {
                    fadeMaster(resuming ? 1.5 : 4);
                    showMute();
                } else {
                    showHint();
                }
            };
            ctx.resume().then(done).catch(showHint);
            saveState();
        }

        function goMp3() {
            return startMp3(offset).then(function () {
                mode = "mp3";
                state.mode = "mp3";
                fadeAudio(mp3Volume(), resuming ? 1500 : 4000);
                showMute();
                saveState();
            });
        }

        // a resumed session keeps whichever mode it started in
        if (resuming && state.mode === "synth") { goSynth(); return; }

        goMp3().catch(function (err) {
            if (err && err.name === "NotAllowedError") {
                mode = "mp3";
                state.mode = "mp3";
                showHint();
            } else {
                // no theme.mp3 found: use the built-in score
                audio = null;
                goSynth();
            }
        });
    }


    /* ---------------------------------------------------------
       PUBLIC API
    --------------------------------------------------------- */

    function stopAll() {
        clearInterval(timer);
        clearInterval(volTimer);
        if (audio) { try { audio.pause(); } catch (e) {} audio = null; }
        if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; bus = {}; }
        mode = null;
        blocked = false;
    }

    var api = {

        // call from a click / tap
        start: function () {
            stopAll();
            state.on = true;
            state.level = 0;
            level = 0;
            begin(false);
        },

        // 0 = sparse, 1 = gentle, 2 = full
        level: function (n) {
            level = n;
            state.level = n;
            if (mode === "synth") applyLevel(false);
            if (mode === "mp3") fadeAudio(mp3Volume(), 2500);
            saveState();
        },

        // build to a big moment
        swell: function (seconds) {
            if (mode === "synth" && ctx && ctx.state === "running") riser(seconds || 4);
        },

        // the hit
        hit: function () {
            if (mode === "synth" && ctx && ctx.state === "running") boom();
        },

        fadeOut: function (seconds) {
            var s = seconds || 4;
            if (mode === "synth" && ctx) {
                bus.master.gain.cancelScheduledValues(ctx.currentTime);
                bus.master.gain.setTargetAtTime(0, ctx.currentTime, s / 3);
            }
            if (mode === "mp3") fadeAudio(0, s * 1000);
        },

        isPlaying: function () { return !!mode && !blocked; }
    };

    window.BirthdayMusic = api;


    /* ---------------------------------------------------------
       AUTO-RESUME on every page after the first
    --------------------------------------------------------- */

    window.addEventListener("pagehide", saveState);
    setInterval(function () { if (mode === "mp3") saveState(); }, 1000);

    // index.html sets window.BF_NO_RESUME = true so the opening always
    // starts fresh; every other page picks the music up where it left off
    if (window.BF_NO_RESUME) {
        try { sessionStorage.removeItem(KEY); } catch (e) {}
        state = { on: false, muted: state.muted, mode: null, level: 1, t0: 0, mp3t: 0, savedAt: 0 };
    } else if (state.on) {
        begin(true);
    }

})();