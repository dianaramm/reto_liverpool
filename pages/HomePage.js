class HomePage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('//input[contains(@placeholder, "Buscar")]').first();
  }

  async goto() {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.page.goto('/tienda/home', { waitUntil: 'domcontentloaded' });

      if (await this._isBlockedByWaf()) {
        if (attempt === maxAttempts) {
          throw new Error(
            'BLOQUEADO POR WAF (Akamai): el sitio devolvió una página "Access Denied" ' +
            '(edgesuite.net) en lugar del home. Esto normalmente indica que la IP del ' +
            'entorno de ejecución (por ejemplo, un runner de GitHub Actions) está siendo ' +
            'bloqueada por el bot-manager del sitio, no un fallo del test. ' +
            'Ver TEST_STRATEGY.md, sección de mitigación de bot-detection.'
          );
        }
       
        await this.page.waitForTimeout(2000 * attempt);
        continue;
      }

      break;
    }

    await this.searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.closeCookieBannerIfPresent();
  }

  async _isBlockedByWaf() {
    try {
      const bodyText = await this.page.locator('body').innerText({ timeout: 3000 });
      return /access denied/i.test(bodyText) || /edgesuite\.net/i.test(bodyText);
    } catch {
      return false;
    }
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