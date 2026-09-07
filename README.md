# Liverpool PS5 Search Automation

Automatización E2E del flujo de búsqueda de "PlayStation 5" en [Liverpool.com.mx](https://www.liverpool.com.mx), con validación cruzada entre los datos mostrados en la UI y la respuesta de red interceptada. Construido con [Playwright Test](https://playwright.dev/).

## Flujo cubierto

1. Navegar a Liverpool.
2. Buscar "playstation 5".
3. Filtrar por color "Blanco".
4. Ordenar por precio: menor a mayor.
5. Extraer nombre y precio de los primeros 5 resultados (se imprimen en consola con `console.table`).
6. Interceptar la respuesta de red de la búsqueda, y validar que al menos 3 de los 5 productos de la UI aparezcan también en esa respuesta.

## Instalación

```bash
npm install
npx playwright install --with-deps chromium
```

## Ejecución

**Modo headless (por defecto):**
```bash
npm test
```

**Modo con interfaz gráfica (headed):**
```bash
npm run test:headed
```

## Ver el reporte HTML

Después de correr las pruebas:
```bash
npm run report
```
Esto abre el reporte de Playwright con resultados, capturas de pantalla (en caso de falla), trazas y videos.

## CI/CD

El workflow en `.github/workflows/test.yml` se ejecuta en cada push/PR a `main`, corre las pruebas en modo headless, e independientemente de si pasan o fallan, sube el reporte HTML como artefacto descargable desde la pestaña **Actions** del repositorio.

[![E2E Tests](https://github.com/dianaramm/reto_liverpool/actions/workflows/test.yml/badge.svg)](https://github.com/dianaramm/reto_liverpool/actions/workflows/test.yml)


## Estructura del proyecto

```
├── .github/workflows/test.yml   # Pipeline de CI
├── pages/                       # Page Objects (HomePage, SearchResultsPage)
├── tests/                       # Specs de Playwright
├── utils/networkCapture.js      # Intercepción y validación cruzada de red
├── playwright.config.js         # Config: headless, reportes, trazas, capturas
└── TEST_STRATEGY.md             # Estrategia de pruebas y decisiones de diseño
```

Ver [`TEST_STRATEGY.md`](./TEST_STRATEGY.md) para el análisis de qué no se automatizó, riesgos de inestabilidad y cómo escalar esto a un pipeline más grande.
