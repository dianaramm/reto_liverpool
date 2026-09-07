class SearchResultsPage {
  constructor(page) {
    this.page = page;
    this.resultsContainer = page.locator('#plp-page-card-product-list');
    this.productCards = page.locator('a[data-testid$="-card-card-link"]');
    this.filterAccordionButtons = page.locator('[data-testid="button-dropdown-filter"]');
    this.sortButton = page.locator('[data-testid="dropdown-sorting-button"]');
  }

  async waitForResults() {
    await this.resultsContainer.waitFor({ state: 'visible', timeout: 20000 });
  }

  async filterByColor(color) {
    const colorLabel = this.page.locator('label', { hasText: color }).first();

    if (!(await colorLabel.isVisible())) {
      const count = await this.filterAccordionButtons.count();
      for (let i = 0; i < count; i++) {
        const text = (await this.filterAccordionButtons.nth(i).innerText()).trim();
        if (text.startsWith('Color')) {
          await this.filterAccordionButtons.nth(i).click();
          break;
        }
      }
    }

    await colorLabel.waitFor({ state: 'visible', timeout: 10000 });
    await colorLabel.click();

    await this.page.waitForTimeout(2000);
    await this.waitForResults();
  }

  async sortByPriceAscending() {
    await this.sortButton.click();
    
    const option = this.page.getByText('Menor precio');
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
    
    await this.page.waitForTimeout(2000);
    await this.waitForResults();
  }

  async getTopProducts(count) {
    await this.waitForResults();
    const total = await this.productCards.count();
    const limit = Math.min(count, total);
    const products = [];

    for (let i = 0; i < limit; i++) {
      const card = this.productCards.nth(i);
      products.push({
        name: await this._extractName(card),
        price: await this._extractPrice(card)
      });
    }

    return products;
  }

  async _extractName(card) {
    const titleLocator = card.locator('h5.card-title');
    if (await titleLocator.count() > 0) {
      return (await titleLocator.first().innerText()).trim();
    }
    
    const text = await card.innerText();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.length > 1 ? lines[1] : lines[0] || '';
  }

  async _extractPrice(card) {
    const priceLocator = card.locator('[data-testid="discounted"]');
    let text = '';
    
    if (await priceLocator.count() > 0) {
      text = await priceLocator.first().innerText();
    } else {
      text = await card.innerText();
    }
    
    text = text.replace(/,/g, '').replace(/\$/g, '').replace(/\s/g, '');
    const match = text.match(/\d+/);
    
    if (match) {
      let numStr = match[0];
      if (numStr.length > 2) {
        numStr = numStr.slice(0, -2) + '.' + numStr.slice(-2);
      } else {
        numStr = numStr + '.00';
      }
      return `$${numStr}`;
    }
    return '';
  }
}

module.exports = { SearchResultsPage };