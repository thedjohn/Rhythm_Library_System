window.rhythmAudio = (() => {
    let ctx = null;
    const buffers = {};
    const drumFiles = ['snare', 'snare_ghost', 'kick', 'high_tom', 'low_tom', 'cymbal', 'hi_hat', 'click', 'click_accent'];

    async function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        await Promise.all(drumFiles.map(async name => {
            try {
                const resp = await fetch(`data/${name}.wav`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const ab = await resp.arrayBuffer();
                buffers[name] = await ctx.decodeAudioData(ab);
            } catch (e) {
                console.warn(`Could not load ${name}.wav`, e);
            }
        }));
        console.log('rhythmAudio ready. Loaded:', Object.keys(buffers).join(', '));
    }

    function playBuffer(buffer, volume) {
        if (!ctx || !buffer) return;
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = Math.min(volume, 2.0);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
    }

    function playDrum(name, volume) {
        const buf = buffers[name];
        if (!buf) {
            console.warn(`playDrum: no buffer for '${name}' (loaded: ${Object.keys(buffers).join(', ')})`);
            return;
        }
        playBuffer(buf, volume ?? 0.8);
    }

    function playClick(volume, accent) {
        if (buffers['click']) {
            playBuffer(buffers['click'], (volume ?? 0.8) * (accent ? 1.5 : 1.0));
        } else {
            playMetronomeBeep(volume ?? 0.5, accent);
        }
    }

    function playMetronomeBeep(volume, accent) {
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();
        const freq = accent ? 1800 : 1000;
        const dur  = accent ? 0.06 : 0.045;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(Math.min(volume, 1.0), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
    }

    function stop() {
        // Web Audio has no global stop — individual sources finish naturally
    }

    return { init, playDrum, playClick, playMetronomeBeep, stop };
})();
