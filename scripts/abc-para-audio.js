// Renderiza os temas em ABC (musicas/*.abc) pra áudio (WAV), SEM dependência
// externa: parser próprio + Web Audio (OfflineAudioContext) num Chromium
// headless. Cada voz vira um instrumento simples (triângulo pra melodia, seno
// pro baixo) com envelope + eco.
//
// Uso: node scripts/abc-para-audio.js
// Saída: musicas/<nome>.wav + musicas/tocar.html (página pra ouvir)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR = path.join(RAIZ, "musicas");
const SR = 44100;

// ---------- parser ABC (subconjunto suficiente pros nossos temas) ----------
const SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

function leDur(s, i) {
    let num = "", j = i;
    while (j < s.length && /[0-9]/.test(s[j])) { num += s[j]; j++; }
    let div = 0;
    if (s[j] === "/") {
        j++;
        let d = "";
        while (j < s.length && /[0-9]/.test(s[j])) { d += s[j]; j++; }
        div = d ? parseInt(d, 10) : 2;
    }
    let mult = num ? parseInt(num, 10) : 1;
    if (div) mult /= div;
    return { mult, fim: j };
}

function parseAbc(texto) {
    const cab = {};
    const musica = [];
    let emMusica = false, voz = "1";
    for (const bruta of texto.split(/\r?\n/)) {
        const l = bruta.replace(/%.*$/, "").trim();
        if (!l) continue;
        const m = /^([A-Za-z]):(.*)$/.exec(l);
        if (!emMusica && m) {
            const k = m[1].toUpperCase();
            if (k === "V") { voz = m[2].trim().split(/\s+/)[0]; emMusica = true; }
            else cab[k] = m[2].trim();
            continue;
        }
        musica.push(l);
    }
    const textoMusica = musica.join(" ");

    const bpm = (() => {
        const q = /Q:\s*([0-9]+)\s*\/\s*([0-9]+)\s*=\s*([0-9.]+)/.exec("Q:" + (cab.Q || ""));
        if (q) return { num: +q[1], den: +q[2], bpm: +q[3] };
        const simples = /([0-9.]+)/.exec(cab.Q || "");
        return simples ? { num: 1, den: 4, bpm: +simples[1] } : { num: 1, den: 4, bpm: 100 };
    })();
    const lSeg = (() => {
        const m = /([0-9]+)\s*\/\s*([0-9]+)/.exec(cab.L || "1/8");
        return m ? (+m[1] / +m[2]) : 1 / 8;
    })();
    const compasso = (() => {
        const m = /([0-9]+)\s*\/\s*([0-9]+)/.exec(cab.M || "4/4");
        return m ? (+m[1] / +m[2]) : 1;
    })();
    const segPorL = (60 / bpm.bpm) * (lSeg / (bpm.num / bpm.den));
    const segPorCompasso = (compasso / lSeg) * segPorL;

    const vozes = {};
    const estado = {};
    const est = v => estado[v] || (estado[v] = { barra: 0, offset: 0 });
    const por = (v, nota) => { (vozes[v] = vozes[v] || []).push(nota); };

    let i = 0;
    while (i < textoMusica.length) {
        const c = textoMusica[i];
        if (/\s/.test(c)) { i++; continue; }
        if (c === "[") {
            const j = textoMusica.indexOf("]", i);
            const dentro = textoMusica.slice(i + 1, j < 0 ? textoMusica.length : j);
            const mv = /^V:\s*(\S+)/.exec(dentro);
            if (mv) voz = mv[1];
            i = (j < 0) ? textoMusica.length : j + 1;
            continue;
        }
        if (c === "|" || c === "]" || c === "\\") {
            if (c === "|") { const e = est(voz); e.barra++; e.offset = 0; }
            i++; continue;
        }
        if (c === ":" ) { i++; continue; }
        if (c === "z" || c === "Z" || c === "x") {
            const { mult, fim } = leDur(textoMusica, i + 1);
            est(voz).offset += mult * segPorL;
            i = fim; continue;
        }
        let j = i, acidente = 0;
        while (textoMusica[j] === "^" || textoMusica[j] === "_" || textoMusica[j] === "=") {
            if (textoMusica[j] === "^") acidente++;
            else if (textoMusica[j] === "_") acidente--;
            j++;
        }
        const letra = textoMusica[j];
        if (!letra || !/[A-Ga-g]/.test(letra)) { i++; continue; }
        j++;
        let midi = (letra === letra.toLowerCase() ? 60 : 48) + SEMI[letra.toLowerCase()] + acidente;
        while (textoMusica[j] === "," || textoMusica[j] === "'") { midi += (textoMusica[j] === "," ? -12 : 12); j++; }
        const { mult, fim } = leDur(textoMusica, j);
        const dur = mult * segPorL;
        const e = est(voz);
        por(voz, { midi, t: e.barra * segPorCompasso + e.offset, d: dur });
        e.offset += dur;
        i = fim;
    }

    const maxFim = Math.max(...Object.values(vozes).flat().map(n => n.t + n.d), 0);
    return { titulo: cab.T || "Sem título", bpm: bpm.bpm, compasso: cab.M || "4/4", vozes, duracao: maxFim };
}

// ---------- render ----------
const TIPOS = {
    "1": { tipo: "triangle", vol: 0.42, eco: true },
    "2": { tipo: "sine", vol: 0.55, eco: false }
};

(async () => {
    const arquivos = fs.readdirSync(DIR).filter(n => n.toLowerCase().endsWith(".abc")).sort();
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const temas = [];

    for (const arq of arquivos) {
        const nome = arq.replace(/\.abc$/i, "");
        const abc = fs.readFileSync(path.join(DIR, arq), "utf8");
        const t = parseAbc(abc);
        const vozes = Object.entries(t.vozes).map(([id, notas]) => ({
            id, notas, ...(TIPOS[id] || { tipo: "triangle", vol: 0.4, eco: true })
        }));
        const total = t.duracao + 0.6;   // cauda do eco

        const wavB64 = await page.evaluate(async ({ vozes, total, sr }) => {
            const ctx = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
            const master = ctx.createGain(); master.gain.value = 0.5;
            const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5200; lp.Q.value = 0.4;
            lp.connect(master); master.connect(ctx.destination);
            const delay = ctx.createDelay(1); delay.delayTime.value = 0.27;
            const fb = ctx.createGain(); fb.gain.value = 0.26;
            const wet = ctx.createGain(); wet.gain.value = 0.2;
            delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(lp);

            for (const v of vozes) {
                for (const n of v.notas) {
                    const f = 440 * Math.pow(2, (n.midi - 69) / 12);
                    const osc = ctx.createOscillator();
                    osc.type = v.tipo;
                    osc.frequency.value = f;
                    const g = ctx.createGain();
                    const t0 = n.t, t1 = n.t + n.d;
                    const atk = Math.min(0.012, n.d * 0.2), rel = 0.16;
                    g.gain.setValueAtTime(0, t0);
                    g.gain.linearRampToValueAtTime(v.vol, t0 + atk);
                    g.gain.linearRampToValueAtTime(v.vol * 0.6, t0 + Math.min(n.d, atk + 0.1));
                    g.gain.setValueAtTime(v.vol * 0.6, Math.max(t0 + atk, t1 - 0.04));
                    g.gain.linearRampToValueAtTime(0, t1 + rel);
                    osc.connect(g); g.connect(lp);
                    if (v.eco) g.connect(delay);
                    osc.start(t0); osc.stop(t1 + rel + 0.02);
                }
            }
            const buf = await ctx.startRendering();
            const dados = buf.getChannelData(0);
            const n = dados.length;
            const ab = new ArrayBuffer(44 + n * 2);
            const dv = new DataView(ab);
            const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
            str(0, "RIFF"); dv.setUint32(4, 36 + n * 2, true); str(8, "WAVE");
            str(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
            dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
            str(36, "data"); dv.setUint32(40, n * 2, true);
            let o = 44;
            for (let i = 0; i < n; i++) {
                const s = Math.max(-1, Math.min(1, dados[i]));
                dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
            }
            const bytes = new Uint8Array(ab);
            let bin = "";
            for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
            return btoa(bin);
        }, { vozes, total, sr: SR });

        const saida = path.join(DIR, nome + ".wav");
        fs.writeFileSync(saida, Buffer.from(wavB64, "base64"));
        const kb = Math.round(fs.statSync(saida).size / 1024);
        temas.push({ nome, titulo: t.titulo, bpm: t.bpm, compasso: t.compasso, duracao: t.duracao, kb, arquivo: nome + ".wav" });
        console.log("  " + nome.padEnd(10) + " \"" + t.titulo + "\"  " + t.bpm + " bpm  " + t.compasso
            + "  " + t.duracao.toFixed(1) + "s  " + kb + " KB  (" + vozes.map(v => v.id + ":" + v.notas.length).join(", ") + " notas)");
    }

    // página pra ouvir
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>TAPeira — temas (ABC)</title>
<style>
 body{background:#0d1117;color:#e6edf3;font:16px/1.5 system-ui,sans-serif;margin:0;padding:28px}
 h1{font-size:20px;color:#ffd66f;margin:0 0 4px} p.sub{color:#9aa7bd;margin:0 0 22px;font-size:14px}
 .t{background:#161b25;border:1px solid #2b3341;border-radius:10px;padding:14px 16px;margin-bottom:14px;max-width:560px}
 .t h2{margin:0 0 2px;font-size:17px} .t small{color:#9aa7bd;display:block;margin-bottom:10px}
 audio{width:100%}
</style></head><body>
<h1>TAPeira — temas em ABC</h1>
<p class="sub">Protótipo: escritos em notação ABC e renderizados por <code>scripts/abc-para-audio.js</code>. Dá play pra ouvir.</p>
${temas.map(t => `<div class="t"><h2>${t.titulo}</h2><small>${t.nome}.abc · ${t.bpm} bpm · ${t.compasso} · ${t.duracao.toFixed(1)}s · ${t.kb} KB</small><audio controls loop src="${t.arquivo}"></audio></div>`).join("\n")}
</body></html>`;
    fs.writeFileSync(path.join(DIR, "tocar.html"), html);
    console.log("\npágina pra ouvir: " + path.join(DIR, "tocar.html"));
    await browser.close();
})();
