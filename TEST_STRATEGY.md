# Test Strategy

## ¿Qué no automatizaría y por qué?
No automatizaría validaciones puramente visuales o subjetivas (por ejemplo, "¿se ve bien el banner promocional de Back to School?"), ya que cambian con frecuencia por campañas de marketing y no reflejan un defecto funcional real; una prueba de regresión visual ahí generaría ruido constante. Tampoco automatizaría el flujo de pago con tarjetas reales (riesgo financiero/legal y dependencia de un proveedor de pagos en producción); eso se prueba mejor contra un sandbox del proveedor o con mocks. El contenido editorial se cubre mejor con pruebas exploratorias, no con aserciones automatizadas.

## Si Liverpool agregara CAPTCHA al proceso de búsqueda
No intentaría evadirlo: es frágil y viola los términos de servicio del proveedor de CAPTCHA. En su lugar: 
(1) aislaría el flujo detrás de un feature flag/variable de entorno para saltar ese paso en CI si el CAPTCHA aparece  (2) usaría un ambiente de staging sin CAPTCHA si el equipo cuenta con uno 
(3) mockearía la respuesta del endpoint de búsqueda para las pruebas de UI que no dependen de datos reales, dejando un pequeño subconjunto de pruebas smoke manuales contra producción.

## Riesgos de inestabilidad detectados y cómo los mitigué
- **Renderizado dinámico por viewport (DOM Detached):** Detecté que los selectores del modal de filtros cambian o se ocultan dinámicamente mediante CSS/React dependiendo de si es vista móvil o de escritorio. Para mitigar fallos de timeout o elementos ocultos, eliminé la dependencia del botón de filtros móvil en entornos de escritorio y apunté directamente a los componentes del panel lateral nativo.
- **Selectores basados en texto:** Usé selectores robustos y solo caí a coincidencia de texto cuando fue inevitable (filtros de color/orden), usando coincidencia exacta o por prefijo estricto para evitar falsos positivos entre etiquetas parecidas.
- **Tiempos de carga de red:** Aumenté el timeout general de la prueba y utilicé esperas dinámicas (`waitFor({ state: 'visible' })`) para asegurar que las listas de productos se rendericen completamente antes de la extracción, evitando esperas estáticas (hardcoded timeouts).

## Cambios para un pipeline con más de 50 suites de pruebas
Etiquetaría las pruebas por tipo (`@smoke`, `@regression`) para no correr todo en cada push, sino subconjuntos según el evento. Paralelizaría usando `--shard` de Playwright entre múltiples runners en vez de un solo job secuencial. Centralizaría los reportes en un dashboard agregador (ej. Allure TestOps) en vez de artefactos sueltos por repositorio, para tener visibilidad histórica de flakiness. Finalmente, aislaría los datos de prueba por ambiente para que las suites ejecutándose en paralelo no interfieran entre sí.