const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1366, height: 768 });
  
  const filePath = path.resolve('C:\\Users\\joaov\\Documents\\Meus projetos\\WorkspaceVisualStudio\\Meus Projetos\\TAPeira\\www\\Caverna.html');
  await page.goto(`file://${filePath}`);
  
  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  
  console.log('Page loaded, player visible');
  
  // Wait for game to initialize - wait for a global that indicates readiness
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });
  console.log('Game initialized');
  
  // Make enemies visible and stable
  await page.evaluate(() => {
    document.querySelectorAll('.inimigo1, .inimigo2, .inimigo3, .inimigo4').forEach(el => {
      el.style.visibility = 'visible';
      el.style.animation = 'none';
      el.style.transition = 'none';
    });
  });
  
  await page.waitForTimeout(500);
  
  // Get player dimensions
  const player = await page.$('.player');
  const playerBox = await player.boundingBox();
  console.log('Player dimensions:', playerBox);
  
  // Trigger attack via the game's internal function directly
  await page.evaluate(() => {
    if (typeof UI !== 'undefined' && UI.playAttackAnimation) {
      const inimigo = document.getElementById('inimigo1');
      UI.playAttackAnimation(inimigo);
    }
  });
  
  await page.waitForTimeout(200);
  
  // Check for attack animation element
  const attackAnim = await page.$('.attack-sprite-animation');
  if (attackAnim) {
    const attackBox = await attackAnim.boundingBox();
    console.log('Attack animation dimensions:', attackBox);
    
    const attackImg = await attackAnim.$('.attack-sprite-frame');
    if (attackImg) {
      const imgBox = await attackImg.boundingBox();
      console.log('Attack frame image dimensions:', imgBox);
      console.log('Attack frame src:', await attackImg.getAttribute('src'));
      if (attackBox && playerBox) {
        console.log(`Attack/Player width ratio: ${(attackBox.width / playerBox.width * 100).toFixed(1)}%`);
        console.log(`Attack/Player height ratio: ${(attackBox.height / playerBox.height * 100).toFixed(1)}%`);
      }
    }
  } else {
    console.log('No attack animation found!');
  }
  
  // Test at different viewport sizes
  for (const viewport of [
    { width: 1920, height: 1080 },  // Desktop
    { width: 768, height: 1024 },   // Tablet
    { width: 375, height: 667 }     // Mobile
  ]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(300);
    
    // Reset enemies
    await page.evaluate(() => {
      document.querySelectorAll('.inimigo1, .inimigo2, .inimigo3, .inimigo4').forEach(el => {
        el.style.visibility = 'visible';
        el.style.animation = 'none';
        el.style.transition = 'none';
      });
    });
    
    const p = await page.$('.player');
    const pb = await p.boundingBox();
    console.log(`\nViewport ${viewport.width}x${viewport.height}:`);
    console.log('  Player:', pb);
    
    // Trigger attack
    await page.evaluate(() => {
      if (typeof UI !== 'undefined' && UI.playAttackAnimation) {
        const inimigo = document.getElementById('inimigo1');
        UI.playAttackAnimation(inimigo);
      }
    });
    
    await page.waitForTimeout(200);
    
    const aa = await page.$('.attack-sprite-animation');
    if (aa) {
      const ab = await aa.boundingBox();
      console.log('  Attack anim:', ab);
      if (ab && pb) {
        console.log(`  Attack/Player width ratio: ${(ab.width / pb.width * 100).toFixed(1)}%`);
        console.log(`  Attack/Player height ratio: ${(ab.height / pb.height * 100).toFixed(1)}%`);
      }
    } else {
      console.log('  No attack animation found');
    }
  }
  
  console.log('\nTest complete. Browser staying open for manual inspection...');
  // await browser.close();
})();