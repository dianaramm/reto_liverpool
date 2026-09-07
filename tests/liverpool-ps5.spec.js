const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { SearchResultsPage } = require('../pages/SearchResultsPage');
const { captureProductResponses, compareProducts } = require('../utils/networkCapture');

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

    if (networkResponses.length === 0) {
      console.warn('⚠ No se encontró ninguna respuesta de red candidata con forma de lista de productos.');
    }

    const nameMatches = [];
    const priceDiscrepancies = [];
    const notFoundInNetwork = [];

    for (const uiProduct of uiProducts) {
      const comparison = networkProducts
        .map(networkProduct => compareProducts(uiProduct, networkProduct))
        .find(result => result !== null);

      if (!comparison) {
        notFoundInNetwork.push(uiProduct);
        continue;
      }

      nameMatches.push(uiProduct);

      if (!comparison.priceMatches) {
        priceDiscrepancies.push(comparison);
      }
    }

    console.log(`\nCoincidencias de nombre UI vs red: ${nameMatches.length} de ${uiProducts.length}`);

    if (notFoundInNetwork.length > 0) {
      console.warn('Productos de UI no confirmados en la red (por nombre):');
      console.table(notFoundInNetwork);
    }

    if (priceDiscrepancies.length > 0) {
      console.warn('Discrepancias de PRECIO detectadas (mismo producto, precio distinto):');
      console.table(priceDiscrepancies);
    }

    expect(nameMatches.length).toBeGreaterThanOrEqual(3);
  });

});