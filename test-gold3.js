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
    { width: 1920, height: 1080, name: 'desktop-1920' },
    { width: 1366, height: 768, name: 'laptop-1366' },
    { width: 768, height: 1024, name: 'tablet-768' },
    { width: 375, height: 667, name: 'mobile-375' },
    { width: 320, height: 568, name: 'mobile-320' },
  ];
  
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(700);
    
    // Set a large realistic gold value to test overflow
    await page.evaluate(() => {
      const gold = document.getElementById('contGold');
      const em = document.getElementById('contEmeraldas');
      if (gold) gold.textContent = '12.34 T';
      if (em) em.textContent = '4.5 K';
    });
    await page.waitForTimeout(300);
    
    const info = await page.evaluate(() => {
      const cont = document.getElementById('container-GoldEsmeraldas');
      const r = cont.getBoundingClientRect();
      const children = [...cont.querySelectorAll('*')].map(el => {
        const b = el.getBoundingClientRect();
        return { cls: el.className || el.id, x: +b.x.toFixed(1), right: +b.right.toFixed(1), w: +b.width.toFixed(1), fs: getComputedStyle(el).fontSize };
      });
      return {
        container: { x: +r.x.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1) },
        windowW: window.innerWidth,
        outsideLeft: r.x < 0,
        outsideRight: r.right > window.innerWidth,
        children
      };
    });
    
    console.log(`\n=== ${vp.name} ===`);
    console.log(JSON.stringify(info, null, 2));
    
    await page.screenshot({ path: `C:\\Users\\joaov\\Documents\\Projeto Padrão\\gold2-${vp.name}.png`, clip: { x: Math.max(0, info.container.x - 10), y: 0, width: Math.min(vp.width - Math.max(0, info.container.x - 10), info.container.w + 20), height: 90 } });
  }
  
  await browser.close();
  console.log('done');
})();