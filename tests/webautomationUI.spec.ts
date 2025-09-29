import { test, expect, Page } from '@playwright/test';

const keywords = ['earliest', 'first', 'began', 'origin', 'initially']; // Keywords that might indicate first instances
const datePattern = /\b(\d{1,4})\s*(BC)\b/gi;  //we are looking for BC dates only
const firstYearAutomation = '270BC'; // Expected earliest year for automation

test('searches Google for "automation"', async ({ page }) => {

  // Go to google (without country redirect)
  await page.goto('https://www.google.com/ncr?hl=en');

  // Accept cookies if the prompt appears
    const accept = page.getByRole('button', { name: /Accept all|I agree/i });
    if (await accept.isVisible()) {
    await accept.click();
     }

// Find the search box, fill it, and press Enter
  const box = page.locator('textarea[name="q"]');
  await box.waitFor();
  await box.fill('automation');
  await box.press('Enter');

  //playwright native asyncronous wait helps us with capcha resolution
  //clicking on the first result that contains wikipedia
  await page.locator('a[href*="wikipedia.org"] h3').click();

  // Make sure the page is fully loaded
  await page.waitForLoadState('load');
  //wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Check that we are on a Wikipedia page
  await expect(page).toHaveURL(/wikipedia.org/);
  
  // Find the first paragraph that follows the "Early History" section.
  const parasAfterHistory = page.locator('div:has(> h3:has-text("Early history")) ~ p').first();
 
  // Get the visible text.
  const paraText = await parasAfterHistory.innerText();

//check for keywords in the paragraph
for (const keyword of keywords) {
    const keywordFound = paraText.toLowerCase().indexOf(keyword);
    if (keywordFound !== -1) {
      // Get text around the keyword (200 chars before and after)
      const contextStart = Math.max(0, keywordFound - 200);
      const contextEnd = Math.min(paraText.length, keywordFound + 200);
      const context = paraText.substring(contextStart, contextEnd);
      
      //We print out the context
      console.log(`Found "${keyword}" mention. Context:`, context);

      // Check for date patterns in the context (we are looking for BC dates)
      const dateMatches = context.match(datePattern);

      // If we found any date matches, we log them and assert against the expected year
      const actualFinalYear = dateMatches ? dateMatches[0] : 'No year found';
      console.log(`Date matches found near "${keyword}":`, actualFinalYear);

      // Assert that the found date (without the spaces) matches our expected earliest year for automation
      expect(actualFinalYear.replace(/\s+/g, '')).toBe(firstYearAutomation);
      
    }
}

  // Take a screenshot of the Wikipedia page
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'wikipedia-automation.png', fullPage: true });

});
