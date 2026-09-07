async function captureProductResponses(page, action) {
  const candidates = [];

  const listener = async (response) => {
    try {
      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('application/json')) return;
      if (!response.ok()) return;

      const body = await response.json().catch(() => null);
      if (!body) return;

      const products = extractProductArray(body);
      if (products && products.length > 0) {
        candidates.push({ url: response.url(), products });
      }
    } catch {
    }
  };

  page.on('response', listener);
  await action();
  page.off('response', listener);

  return candidates;
}

function collectProductArrays(node, depth, acc) {
  if (depth > 6 || node == null) return;

  if (Array.isArray(node)) {
    const looksLikeProducts = node.length > 0 && node.every(
      item => item && typeof item === 'object' && hasNameAndPriceFields(item)
    );

    if (looksLikeProducts) {
      acc.push(node);
      return;
    }

    for (const item of node) {
      collectProductArrays(item, depth + 1, acc);
    }
    return;
  }

  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      collectProductArrays(node[key], depth + 1, acc);
    }
  }
}

function extractProductArray(node) {
  const candidates = [];
  collectProductArrays(node, 0, candidates);

  if (candidates.length === 0) return null;

  return candidates.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}

function hasNameAndPriceFields(obj) {
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  const hasName = keys.some(k => ['name', 'title', 'productname', 'displayname'].includes(k));
  const hasPrice = keys.some(k => k.includes('price'));
  return hasName && hasPrice;
}

function getNetworkPriceRaw(networkProduct) {
  if (networkProduct.priceInfo && typeof networkProduct.priceInfo === 'object') {
    const info = networkProduct.priceInfo;
    if (typeof info.salePrice === 'number') return info.salePrice;
    if (info.promoPrice && typeof info.promoPrice.price === 'number') return info.promoPrice.price;
    if (info.listPrice && typeof info.listPrice.price === 'number') return info.listPrice.price;
  }

  const keys = Object.keys(networkProduct);
  const priceKeys = keys.filter(k => k.toLowerCase().includes('price'));

  for (const key of priceKeys) {
    const value = networkProduct[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
  }

  return null;
}

function normalizeNetworkPrice(networkProduct) {
  const raw = getNetworkPriceRaw(networkProduct);
  if (raw === null || raw === undefined) return null;

  if (typeof raw === 'number') return raw;

  const cleaned = String(raw).replace(/,/g, '').replace(/\$/g, '').replace(/\s/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function normalizeUiPrice(uiPriceString) {
  const cleaned = String(uiPriceString).replace(/\$/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function compareProducts(uiProduct, networkProduct, priceTolerance = 1) {
  const networkName = (
    networkProduct.name ||
    networkProduct.title ||
    networkProduct.displayName ||
    networkProduct.productName ||
    ''
  ).toLowerCase();

  const uiName = uiProduct.name.toLowerCase();
  if (!networkName || !uiName) return null;

  const nameMatches =
    networkName.includes(uiName.slice(0, 15)) || uiName.includes(networkName.slice(0, 15));

  if (!nameMatches) return null;

  const uiPrice = normalizeUiPrice(uiProduct.price);
  const networkPrice = normalizeNetworkPrice(networkProduct);

  const priceMatches =
    uiPrice !== null &&
    networkPrice !== null &&
    Math.abs(uiPrice - networkPrice) <= priceTolerance;

  return {
    name: uiProduct.name,
    uiPrice: uiProduct.price,
    networkPrice: networkPrice !== null ? `$${networkPrice.toFixed(2)}` : 'N/A',
    priceMatches,
    diff: uiPrice !== null && networkPrice !== null ? +(uiPrice - networkPrice).toFixed(2) : null,
  };
}

function productsMatch(uiProduct, networkProduct) {
  return compareProducts(uiProduct, networkProduct) !== null;
}

module.exports = {
  captureProductResponses,
  productsMatch,
  compareProducts,
  normalizeNetworkPrice,
  normalizeUiPrice,
};