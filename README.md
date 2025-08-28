# Blue Home – Widget de Buscador (CSV → Web)

Este widget muestra los inmuebles leyendo **automáticamente** la hoja de Google Sheets publicada como CSV. Solo actualizas la hoja y la web se sincroniza sola.

## Columnas esperadas (en minúsculas)
- `codigo`
- `direccion` (opcional)
- `tipo` (casa/apartamento/apartaestudio/local/bodega)
- `valor canon` (o `canon` o `valor`)
- `numero habitaciones`
- `numero banos` (o `baños`)
- `parqueadero`
- `enlace youtube`
- `enlace ficha tecnica` (opcional)
- `estado` (usar `disponible` o `no_disponible`)

> Si cambian los encabezados, puedes ajustar el mapeo en `widget.js` dentro de la función `normalize()`.

## Cambiar la hoja
Edita `index.html` y reemplaza `window.SHEET_CSV_URL` con tu **enlace publicado** de Google Sheets en CSV. (Actualmente apunta a:)
https://docs.google.com/spreadsheets/d/e/2PACX-1vTe5bAfaAIJDsDj6Hgz43yQ7gQ9TSm77Pp-g-3zBby_PuCknOfOta_3KsQX0-ofmG7hY6zDcxU3qBcS/pub?gid=0&single=true&output=csv

## Despliegue rápido
- Puedes subir estos 3 archivos (`index.html`, `styles.css`, `widget.js`) a cualquier hosting estático (Wix, Netlify, Vercel, GitHub Pages, etc.).
- Para **Wix** o sitios existentes, también puedes publicarlo por aparte (Netlify/Vercel) y **embederlo** como iframe.

### Incrustar como iframe
```html
<iframe src="https://TU-DOMINIO/bluehome-widget/index.html" width="100%" height="900" style="border:0;border-radius:12px;overflow:hidden;"></iframe>
```

## ManyChat / WhatsApp (futuro)
- Luego creamos un endpoint (Node/Express en Railway) que lea el **mismo CSV** y devuelva JSON para el bot. Así, todo sale de una sola fuente: la hoja.
- El widget ya está listo para esa transición sin cambiar tu flujo de datos.

## Nota técnica
Este demo usa un parser CSV simple. Si tu hoja incluye comas dentro de celdas con comillas, cambia `parseCSV` por PapaParse (CDN) o agrega un backend mínimo que normalice el CSV.

---
© 2025 Blue Home Inmobiliaria
