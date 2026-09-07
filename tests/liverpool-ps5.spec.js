const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { SearchResultsPage } = require('../pages/SearchResultsPage');
const { captureProductResponses, productsMatch } = require('../utils/networkCapture');

test.describe('Liverpool - Búsqueda de PlayStation 5', () => {

  test('Flujo E2E: buscar, filtrar, ordenar, extraer y validar contra la red', async ({ page }) => {
    test.setTimeout(120000);

    const home = new HomePage(page);
    const results = new SearchResultsPage(page);

    await home.goto();

    await home.search('playstation 5');
    await results.waitForResults();

    await results.filterByColor('Blanco');

    const networkResponses = await captureProductResponses(page, async () => {
      await results.sortByPriceAscending();
    });

    const uiProducts = await results.getTopProducts(5);

    console.log('\nProductos extraídos de la UI (top 5, ordenados por precio ascendente):');
    console.table(uiProducts);

    expect(uiProducts.length).toBeGreaterThan(0);

    const networkProducts = networkResponses.flatMap(r => r.products);

    console.log(`\nRespuestas de red candidatas encontradas: ${networkResponses.length}`);
    console.log(`Total de productos en red: ${networkProducts.length}`);

    const matches = uiProducts.filter(uiProduct =>
      networkProducts.some(networkProduct => productsMatch(uiProduct, networkProduct))
    );

    const mismatches = uiProducts.filter(uiProduct => !matches.includes(uiProduct));

    console.log(`\nCoincidencias UI vs red: ${matches.length} de ${uiProducts.length}`);
    if (mismatches.length > 0) {
      console.warn('Discrepancias detectadas (presentes en UI, no confirmadas en red):');
      console.table(mismatches);
    }

    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

});