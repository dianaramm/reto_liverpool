class HomePage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('//input[contains(@placeholder, "Buscar")]').first();
  }

  async goto() {
    await this.page.goto('/tienda/home');
    await this.searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.closeCookieBannerIfPresent();
  }

  async closeCookieBannerIfPresent() {
    const acceptButton = this.page.getByRole('button', { name: /aceptar|aceptas/i });
    try {
      await acceptButton.click({ timeout: 3000 });
    } catch {
    }
  }

  async search(term) {
    await this.searchInput.click();
    await this.searchInput.fill('');
    await this.searchInput.type(term, { delay: 30 });
    await this.searchInput.press('Enter');
  }
}

module.exports = { HomePage };