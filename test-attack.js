// Teste focado (manual) do ATAQUE novo: um risco (faixa) parte do player até o
// inimigo acertado, um splash estoura no impacto e o player dá uma leve
// investida (distorção). Substituiu a animação de sprite do ataque (por hora
// desativada). Abre o navegador VISÍVEL pra inspeção manual.
//
// Rode `npm run prepare:web` antes (usa o www/).
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1366, height: 768 });

  const filePath = path.resolve(__dirname, 'www', 'Caverna.html');
  await page.goto('file://' + filePath);

  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });
  await page.evaluate(() => document.getElementById('infoModal')?.remove());

  const atacar = () => page.evaluate(() => {
    ['inimigo1', 'inimigo2', 'inimigo3', 'inimigo4'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.visibility = 'visible';
    });
    UI.playAttackAnimation(document.getElementById('inimigo1'));
  });

  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 375, height: 667 }
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300);
    await atacar();
    await page.waitForTimeout(90); // meio da animação (260 ms)
    const r = await page.evaluate(() => {
      const caixa = el => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { w: Math.round(b.width), h: Math.round(b.height) };
      };
      const player = document.querySelector('.player');
      return {
        corte: caixa(document.querySelector('.ataque-corte')),
        lua: caixa(document.querySelector('.ataque-corte__lua')),
        splash: caixa(document.querySelector('.ataque-splash')),
        investida: !!player && player.classList.contains('player--atacando'),
        playerVisivel: !!player && getComputedStyle(player).opacity !== '0'
      };
    });
    const ok = !!r.corte && !!r.splash && r.investida && r.playerVisivel;
    console.log(
      viewport.width + 'x' + viewport.height + ': ' + (ok ? 'OK' : 'FALHOU') +
      '  corte=' + JSON.stringify(r.corte) +
      ' tick=' + JSON.stringify(r.tick) +
      ' splash=' + JSON.stringify(r.splash) +
      ' investida=' + r.investida +
      ' player visível=' + r.playerVisivel
    );
  }

  console.log('\nTeste concluído (navegador fica aberto pra inspeção).');
  // await browser.close();
})();
