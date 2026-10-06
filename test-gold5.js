const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const filePath = path.resolve('C:\\Users\\joaov\\Documents\\Meus projetos\\WorkspaceVisualStudio\\Meus Projetos\\TAPeira\\www\\Caverna.html');
  await page.goto(`file://${filePath}`);
  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });
  
  // Close the COMO JOGAR modal if open
  const hasModal = await page.$('#infoModal');
  if (hasModal) {
    await page.evaluate(() => UI.toggleInfoModal());
    await page.waitForTimeout(300);
    console.log('modal closed');
  }
  
  const outDir = 'C:\\Users\\joaov\\Documents\\Projeto Padrão';
  const viewports = [
    { width: 1920, height: 1080, name: 'v3-desktop' },
    { width: 768, height: 1024, name: 'v3-tablet' },
    { width: 375, height: 667, name: 'v3-mobile375' },
    { width: 320, height: 568, name: 'v3-mobile320' },
  ];
  
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(600);
    
    const info = await page.evaluate(() => {
      const cont = document.getElementById('container-GoldEsmeraldas');
      const r = cont.getBoundingClientRect();
      const lbl = cont.querySelector('.contGoldlbl');
      const lb = lbl.getBoundingClientRect();
      return {
        cont: { x: +r.x.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) },
        goldLabel: { x: +lb.x.toFixed(1), right: +lb.right.toFixed(1), fs: getComputedStyle(lbl).fontSize },
        modalOpen: !!document.getElementById('infoModal'),
        fits: lb.x >= r.x - 1 && lb.right <= r.right + 1
      };
    });
    console.log(`${vp.name}: ${JSON.stringify(info)}`);
    
    const el = await page.$('#container-GoldEsmeraldas');
    await el.screenshot({ path: `${outDir}\\${vp.name}-gold.png` });
    await page.screenshot({ path: `${outDir}\\${vp.name}-full.png` });
  }
  
  await browser.close();
  console.log('done');
})();