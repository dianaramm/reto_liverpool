/**
 * Escucha las respuestas de red durante una acción (ej. una búsqueda) y
 * devuelve aquellas que parecen contener una lista de productos.
 *
 * NOTA DE DISEÑO: Liverpool no documenta públicamente su endpoint de búsqueda,
 * y la URL exacta puede cambiar por A/B testing, CDN o versión de API. En vez
 * de hardcodear una ruta específica (frágil), usamos una heurística sobre la
 * FORMA del JSON: buscamos arreglos de objetos que tengan campos de nombre y
 * de precio. Esto es más resiliente a cambios de URL, pero debe revalidarse
 * si la estructura de datos de Liverpool cambia radicalmente.
 *
 * Antes de confiar en esto en producción, se recomienda inspeccionar una vez
 * el tráfico real en DevTools > Network para confirmar el endpoint y, si es
 * estable, restringir la búsqueda con response.url().includes('<endpoint>')
 * para mayor precisión y menor costo de parseo.
 */
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
      // Ignorar respuestas que no se puedan leer/parsear como JSON.
    }
  };

  page.on('response', listener);
  await action();
  page.off('response', listener);

  return candidates;
}

/**
 * Busca recursivamente, dentro de una estructura JSON arbitraria, el primer
 * arreglo de objetos que "parezca" una lista de productos.
 */
function extractProductArray(node, depth = 0) {
  if (depth > 6 || node == null) return null;

  if (Array.isArray(node)) {
    const looksLikeProducts = node.length > 0 && node.every(
      item => item && typeof item === 'object' && hasNameAndPriceFields(item)
    );
    if (looksLikeProducts) return node;

    for (const item of node) {
      const found = extractProductArray(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const found = extractProductArray(node[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function hasNameAndPriceFields(obj) {
  const keys = Object.keys(obj).map(k => k.toLowerCase());
  const hasName = keys.some(k => ['name', 'title', 'productname', 'displayname'].includes(k));
  const hasPrice = keys.some(k => k.includes('price'));
  return hasName && hasPrice;
}

/**
 * Compara un producto extraído de la UI contra un producto de la respuesta
 * de red interceptada. Usa coincidencia parcial de nombre porque el texto
 * de la tarjeta de UI a veces trunca o formatea distinto al campo del API.
 */
function productsMatch(uiProduct, networkProduct) {
  const networkName = (
    networkProduct.name ||
    networkProduct.title ||
    networkProduct.displayName ||
    networkProduct.productName ||
    ''
  ).toLowerCase();

  const uiName = uiProduct.name.toLowerCase();
  if (!networkName || !uiName) return false;

  return networkName.includes(uiName.slice(0, 15)) || uiName.includes(networkName.slice(0, 15));
}

module.exports = { captureProductResponses, productsMatch };
