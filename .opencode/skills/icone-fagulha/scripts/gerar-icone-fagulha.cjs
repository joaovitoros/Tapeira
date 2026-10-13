#!/usr/bin/env node
'use strict';
// Gerador de ícone de habilidade no estilo "Fagulha" (TAPeira).
// Emblema circular + motivo central + UM enfeite temático (combina com a skill).
// Ver .opencode/skills/estilo-fagulha/ para as regras do estilo.
//
// Uso:
//   node gerar-icone-fagulha.cjs --motivo raio --esquema fogo --enfeite faisca --saida x.svg
//   node gerar-icone-fagulha.cjs --motivo moeda --esquema dourado --enfeite moeda --saida y.svg
//   node gerar-icone-fagulha.cjs --listar-motivos | --listar-esquemas | --listar-enfeites

const fs = require('fs');

const ESQUEMAS = {
  fogo:    { aro: '#ff9d15', bisel: '#ea7609', campo: '#6f1a04', brilhoAro: '#ffe6ad', motivo: '#ffd400', brilho: '#fffef0', enfeite: '#fff05a' },
  gelo:    { aro: '#2ec4ff', bisel: '#1f86d6', campo: '#062b4a', brilhoAro: '#d7f2ff', motivo: '#7ef0ff', brilho: '#ffffff', enfeite: '#c9f6ff' },
  veneno:  { aro: '#7ed321', bisel: '#4a9e12', campo: '#153604', brilhoAro: '#eaffc2', motivo: '#c6ff3d', brilho: '#f7ffe0', enfeite: '#d9ff7a' },
  sangue:  { aro: '#e8283c', bisel: '#b01224', campo: '#42040a', brilhoAro: '#ffc2c6', motivo: '#ff5a6a', brilho: '#fff0f0', enfeite: '#ff9aa4' },
  sombra:  { aro: '#9b5cff', bisel: '#6f2fd6', campo: '#22093f', brilhoAro: '#e6d5ff', motivo: '#c9a4ff', brilho: '#ffffff', enfeite: '#d9c2ff' },
  dourado: { aro: '#ffb300', bisel: '#d98a00', campo: '#301800', brilhoAro: '#ffe9a8', motivo: '#ffd24a', brilho: '#fffdf0', enfeite: '#fff0a0' }
};

function estrela(cx, cy, R, r, pontas) {
  const pts = [];
  for (let i = 0; i < pontas * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = ((-90 + (i * 180) / pontas) * Math.PI) / 180;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + ' Z';
}

// ---------- motivos centrais (base 512; caibam num raio ~160) ----------
const MOTIVOS = {
  raio: {
    shape: 'M296 130 L176 296 L248 296 L202 408 L344 252 L272 252 L326 130 Z',
    glow: 'M288 148 L192 286', glowW: 14
  },
  estrela: {
    shape: estrela(256, 256, 148, 58, 5),
    glow: 'M234 152 L178 196', glowW: 10
  },
  escudo: {
    shape: 'M170 150 H342 V248 C342 328 300 380 256 404 C212 380 170 328 170 248 Z',
    glow: 'M212 178 L212 300', glowW: 10
  },
  coracao: {
    shape: 'M256 388 C176 320 152 246 190 200 C216 168 252 180 256 210 C260 180 296 168 322 200 C360 246 336 320 256 388 Z',
    glow: 'M210 216 C202 200 210 188 226 185', glowW: 9
  },
  espada: {
    shape: 'M256 100 L284 318 L228 318 Z M192 322 H320 V350 H192 Z M240 350 H272 V398 H240 Z',
    glow: 'M254 140 L246 300', glowW: 8
  },
  moeda: {
    custom: (c) =>
      `<circle cx="256" cy="256" r="140" fill="${c.motivo}" stroke="${c.motivo}" stroke-width="14"/>` +
      `<circle cx="256" cy="256" r="104" fill="none" stroke="${c.brilhoAro}" stroke-width="10"/>` +
      `<path d="M237.9 153.6 A104 104 0 0 0 152.4 246.9" stroke="${c.brilho}" stroke-width="12" stroke-linecap="round" fill="none"/>`
  },
  floco: {
    custom: (c) => {
      const out = [];
      out.push(`<g stroke="${c.motivo}" stroke-width="16" stroke-linecap="round">`);
      for (let i = 0; i < 6; i++) {
        const a = ((-90 + i * 60) * Math.PI) / 180;
        const x2 = 256 + 150 * Math.cos(a), y2 = 256 + 150 * Math.sin(a);
        out.push(`<path d="M256 256 L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`);
        const bx = 256 + 92 * Math.cos(a), by = 256 + 92 * Math.sin(a);
        for (const da of [42, -42]) {
          const aa = a + (da * Math.PI) / 180;
          const ex = bx + 46 * Math.cos(aa), ey = by + 46 * Math.sin(aa);
          out.push(`<path d="M${bx.toFixed(1)} ${by.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}"/>`);
        }
      }
      out.push(`</g>`);
      out.push(`<g stroke="${c.brilho}" stroke-width="9" stroke-linecap="round"><path d="M256 256 L${(256 + 150 * Math.cos((-150 * Math.PI) / 180)).toFixed(1)} ${(256 + 150 * Math.sin((-150 * Math.PI) / 180)).toFixed(1)}"/></g>`);
      return out.join('');
    }
  }
};

// ---------- enfeites (UM só por ícone, mas TEMÁTICO com a habilidade) ----------
const ENFEITES = {
  faisca:      { d: 'M0 -28 L8 -8 L28 0 L8 8 L0 28 L-8 8 L-28 0 L-8 -8 Z' },          // frenesi
  'mini-raio': { d: 'M10 -30 L-14 2 L-2 2 L-10 30 L14 -4 L2 -4 L12 -30 Z' },          // elétrico
  estilhaco:   { d: 'M-4 -28 L14 -8 L4 28 L-16 6 Z' },                                 // dano
  moeda: { // ouro — moedinha PREENCHIDA, miniatura da moeda central
    custom: (c) =>
      `<circle r="21" fill="${c.motivo}" stroke="${c.motivo}" stroke-width="6"/>` +
      `<circle r="12" fill="none" stroke="${c.brilhoAro}" stroke-width="4"/>`
  },
  floco:       { d: estrela(0, 0, 26, 6, 6) }                                          // gelo/fuga
};

// enfeite padrão por motivo (pode ser trocado com --enfeite)
const ENFEITE_PADRAO = {
  raio: 'faisca', estrela: 'faisca', escudo: 'faisca', coracao: 'faisca',
  espada: 'estilhaco', moeda: 'moeda', floco: 'floco'
};

// posições canônicas do enfeite (x, y, escala) — espalhadas, sem formar anel
const SPARKS = [
  [286, 92, 0.80], [168, 380, 0.85], [372, 150, 0.75], [108, 236, 0.55],
  [238, 424, 0.70], [398, 268, 0.90], [150, 130, 0.65], [350, 372, 0.60],
  [198, 172, 0.50], [312, 316, 0.60]
];

// O motivo `moeda` é um disco grande (raio 140); os enfeites-moeda precisam
// ficar no anel escuro ENTRE o motivo e o bisel (raio ~160-185), senão caem
// por cima da moeda central e somem. Aqui não formam um colar: raios e
// tamanhos variam de propósito.
const SPARKS_MOEDA = [
  [320,  92, 0.62], [170, 118, 0.50], [ 96, 318, 0.72], [222, 420, 0.60],
  [410, 200, 0.55], [388, 374, 0.68], [415, 262, 0.42], [150, 400, 0.50],
  [300, 428, 0.52], [128, 148, 0.44]
];
const POSICOES_ENFEITE = { moeda: SPARKS_MOEDA };

function buildIcon({ motivo, esquema, enfeite, n, size }) {
  const c = ESQUEMAS[esquema];
  const m = MOTIVOS[motivo];
  const en = ENFEITES[enfeite];
  const posicoes = POSICOES_ENFEITE[motivo] || SPARKS;
  const k = size / 512;
  const L = [];
  L.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" fill="none">`);
  L.push(`  <!-- Estilo Fagulha — motivo: ${motivo} | esquema: ${esquema} | enfeite: ${enfeite} (${n}) -->`);
  if (!en.custom) {
    L.push(`  <defs>`);
    L.push(`    <path id="enfeite" d="${en.d}"${en.rule ? ` fill-rule="${en.rule}"` : ''}/>`);
    L.push(`  </defs>`);
  }
  L.push(`  <g transform="scale(${k})">`);
  L.push(`    <circle cx="256" cy="256" r="252" fill="${c.aro}" stroke="${c.aro}" stroke-width="8"/>`);
  L.push(`    <circle cx="256" cy="256" r="214" fill="${c.bisel}"/>`);
  L.push(`    <circle cx="256" cy="256" r="204" fill="${c.campo}"/>`);
  L.push(`    <path d="M 215.7 27.5 A 232 232 0 0 0 24.9 235.7" stroke="${c.brilhoAro}" stroke-width="16" stroke-linecap="round"/>`);
  if (m.custom) {
    L.push('    ' + m.custom(c));
  } else {
    L.push(`    <path d="${m.shape}" fill="${c.motivo}" stroke="${c.motivo}" stroke-width="14" stroke-linejoin="round"/>`);
    if (m.glow) L.push(`    <path d="${m.glow}" stroke="${c.brilho}" stroke-width="${m.glowW}" stroke-linecap="round"/>`);
  }
  if (n > 0) {
    if (en.custom) {
      for (let i = 0; i < n; i++) {
        const [x, y, s] = posicoes[i];
        L.push(`    <g transform="translate(${x} ${y}) scale(${s})">${en.custom(c)}</g>`);
      }
    } else {
      L.push(`    <g fill="${c.enfeite}" stroke="${c.enfeite}" stroke-width="3" stroke-linejoin="round">`);
      for (let i = 0; i < n; i++) {
        const [x, y, s] = posicoes[i];
        L.push(`      <use href="#enfeite" xlink:href="#enfeite" transform="translate(${x} ${y}) scale(${s})"/>`);
      }
      L.push(`    </g>`);
    }
  }
  L.push(`  </g>`);
  L.push(`</svg>`);
  return L.join('\n') + '\n';
}

// ---------- CLI ----------
function parse(argv) {
  const o = { motivo: 'raio', esquema: 'fogo', enfeite: null, faiscas: 10, tamanho: 512, saida: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const val = () => argv[++i];
    if (a === '--motivo') o.motivo = val();
    else if (a === '--esquema') o.esquema = val();
    else if (a === '--enfeite') o.enfeite = val();
    else if (a === '--faiscas' || a === '--enfeites') o.faiscas = parseInt(val(), 10);
    else if (a === '--tamanho') o.tamanho = parseInt(val(), 10);
    else if (a === '--saida') o.saida = val();
    else if (a === '--listar-motivos') o.listarMotivos = true;
    else if (a === '--listar-esquemas') o.listarEsquemas = true;
    else if (a === '--listar-enfeites') o.listarEnfeites = true;
    else if (a === '--ajuda' || a === '-h') o.ajuda = true;
  }
  return o;
}

const o = parse(process.argv);

if (o.listarMotivos) { console.log(Object.keys(MOTIVOS).join('\n')); process.exit(0); }
if (o.listarEsquemas) { console.log(Object.keys(ESQUEMAS).join('\n')); process.exit(0); }
if (o.listarEnfeites) { console.log(Object.keys(ENFEITES).join('\n')); process.exit(0); }
if (o.ajuda || !o.saida) {
  console.log('Uso: node gerar-icone-fagulha.cjs --saida <arquivo.svg> --motivo <nome|path> --esquema <nome> --enfeite <nome> --faiscas 0-10 --tamanho 512');
  process.exit(o.ajuda ? 0 : 1);
}

if (!MOTIVOS[o.motivo]) {
  MOTIVOS[o.motivo] = { shape: o.motivo, glow: null };
  console.warn('aviso: --motivo tratado como path cru (sem brilho).');
}
if (!ESQUEMAS[o.esquema]) { console.error(`esquema inválido: ${o.esquema}`); process.exit(1); }

const enfeite = o.enfeite || ENFEITE_PADRAO[o.motivo] || 'faisca';
if (!ENFEITES[enfeite]) { console.error(`enfeite inválido: ${enfeite}`); process.exit(1); }
if (!(o.faiscas >= 0 && o.faiscas <= 10)) { console.error('--faiscas deve ser 0..10'); process.exit(1); }

const svg = buildIcon({ motivo: o.motivo, esquema: o.esquema, enfeite, n: o.faiscas, size: o.tamanho });
fs.writeFileSync(o.saida, svg);
console.log(`ok: ${o.saida} (${svg.length} bytes) — enfeite=${enfeite}`);
