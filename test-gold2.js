const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const filePath = path.resolve('C:\\Users\\joaov\\Documents\\Meus projetos\\WorkspaceVisualStudio\\Meus Projetos\\TAPeira\\www\\Caverna.html');
  await page.goto(`file://${filePath}`);
  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });
  
  const viewports = [
    { width: 375, height: 667, name: 'mobile-375' },
    { width: 320, height: 568, name: 'mobile-320' },
    { width: 768, height: 1024, name: 'tablet-768' },
  ];
  
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(500);
    
    const info = await page.evaluate(() => {
      const q = s => document.querySelector(s);
      const rect = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
          scrollW: el.scrollWidth, clientW: el.clientWidth,
          fontSize: cs.fontSize, overflow: cs.overflow, flexDirection: cs.flexDirection,
          padding: cs.padding, margin: cs.margin, gap: cs.gap, minWidth: cs.minWidth
        };
      };
      return {
        container: rect(q('#container-GoldEsmeraldas')),
        goldBox: rect(q('#container-Gold')),
        goldLbl: rect(q('.contGoldlbl')),
        goldVal: rect(q('#contGold')),
        emBox: rect(q('#container-Esmeraldas')),
        emLbl: rect(q('.contEmeraldaslbl')),
        emVal: rect(q('#contEmeraldas')),
        goldText: q('#contGold')?.textContent,
        windowWidth: window.innerWidth
      };
    });
    
    console.log(`\n=== ${vp.name} ===`);
    console.log(JSON.stringify(info, null, 2));
  }
  
  await browser.close();
})();