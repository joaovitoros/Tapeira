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
    await page.waitForTimeout(500);
    
    // Get gold container info
    const info = await page.evaluate(() => {
      const cont = document.getElementById('container-GoldEsmeraldas');
      const gold = document.getElementById('contGold');
      const emerald = document.getElementById('contEmeraldas');
      const goldBox = cont?.getBoundingClientRect();
      const goldText = gold?.getBoundingClientRect();
      const emText = emerald?.getBoundingClientRect();
      return {
        container: goldBox ? { x: goldBox.x, y: goldBox.y, w: goldBox.width, h: goldBox.height, scrollW: cont.scrollWidth, clientW: cont.clientWidth, overflow: cont.scrollWidth > cont.clientWidth } : null,
        goldText: goldText ? { x: goldText.x, w: goldText.width, scrollW: gold.scrollWidth, clientW: gold.clientWidth } : null,
        emText: emText ? { x: emText.x, w: emText.width, scrollW: emerald.scrollWidth, clientW: emerald.clientWidth } : null,
        goldValue: gold?.textContent,
        emValue: emerald?.textContent,
        windowWidth: window.innerWidth
      };
    });
    
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    console.log(JSON.stringify(info, null, 2));
    
    // Screenshot just the gold container area
    const goldEl = await page.$('#container-GoldEsmeraldas');
    if (goldEl) {
      await goldEl.screenshot({ path: `C:\\Users\\joaov\\Documents\\Projeto Padrão\\gold-${vp.name}.png` });
    }
    // Full page screenshot
    await page.screenshot({ path: `C:\\Users\\joaov\\Documents\\Projeto Padrão\\full-${vp.name}.png` });
  }
  
  console.log('\nScreenshots saved.');
  await browser.close();
})();