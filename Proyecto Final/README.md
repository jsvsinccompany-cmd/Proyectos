# Proyecto Final — Landing Page

Plantilla de landing page premium creada con HTML, CSS y JavaScript.

Características:
- Responsive para escritorio, tablet y móvil
- Animaciones suaves con GSAP (CDN incluido)
- Lightbox para el portafolio
- CSS variables en `:root` para paleta global
- Modular y fácil de escalar (HTML/CSS/JS)

Instrucciones:
1. Añade tus imágenes dentro de la carpeta `img/` y genera/edita el archivo `img/portfolio-manifest.json` para controlar títulos, descripciones y categorías (Platillos, Postres, Dulces, Centros de Mesa). El sitio usa este manifiesto para poblar el menú filtrable.
2. Abre `index.html` en el navegador para ver la página; puedes regenerar el manifiesto ejecutando `python scripts/generate_manifest.py`.
3. Para personalizar colores, modifica las variables en `css/estilos.css` dentro de `:root` o usa `css/brand-vars.css`.

Extra:
- Si prefieres que extraiga la paleta de colores directamente desde tus imágenes, pásame los archivos que quieras usar y los muestro en variables CSS para que coincidan con tu branding.
  
**IMPORTANTE**: este diseño está pensado para usar exclusivamente los colores del logo.
Para aplicar la paleta del logo a TODO el sitio (fondos, botones, textos, sombras y overlays), ejecuta el extractor de paleta a continuación — esto sobrescribirá `css/brand-vars.css` con los valores reales del logo y forzará la paleta a ser la del logo, evitando blancos o grises distintos a los de la identidad.

Paleta oficial del proyecto:
- Rosa/Rojo principal: #D86F83
- Blanco: #FFFFFF
- Negro: #000000

El sitio está configurado para forzar esta paleta en tiempo de ejecución y en `css/brand-vars.css`.
 
Notas sobre móviles: el diseño ya incluye estilos responsive y una versión optimizada del hero, menú y rejilla para móviles. Para probar en un teléfono real, sirve la carpeta con Python y abre tu IP local o usa Live Server en VSCode.

Fondo de pantalla (background):
- El fondo del sitio usa `--bg-image` en `css/estilos.css`. El código JS intentará seleccionar una imagen del manifiesto, prefiriendo la primera imagen que no sea el logo. Si tienes un archivo `img/portfolio-bg.jpg`, el CSS lo usará como fallback. Puedes sobrescribir `--bg-image` en `:root` si quieres forzar una imagen específica.
- En móviles, el background se renderiza con un overlay ligero y la hero se ajusta para mejorar la legibilidad. Además hay una barra CTA sticky inferior para facilitar pedidos por WhatsApp.

Generar manifiesto (opcional):
1. En el terminal en el root del proyecto ejecuta:

```powershell
python scripts/generate_manifest.py
```

2. Esto creará `img/portfolio-manifest.json` con todos los archivos dentro de `img/`, excepto los que tengan 'logo' en el nombre.
3. El archivo `index.js` detectará el manifiesto automáticamente y lo usará para rellenar la galería.

Generar paleta desde el logo (opcional):
1. Asegúrate de tener Python y Pillow instalados. Desde el root del proyecto:

```powershell
pip install -r requirements.txt
python scripts/extract_palette.py --file "img/Virucha Salomón-Logo.jpg"
```

2. El script generará: `css/brand-vars.css` con variables CSS basadas en los colores del logo.
3. Recarga `index.html`; si el archivo existe, se cargará automáticamente y sobreescribirá los `:root` por defecto en `estilos.css`.
4. El sitio ya incluye extracción en tiempo real en el navegador: si abres la página en un navegador con JS habilitado, el script leerá el logo (alt="Virucha Salomón") y aplicará la paleta derivada del logo a las variables CSS.

Contacto/WhatsApp y formularios:
- El número principal está añadido: +52 1 477 701 0587.
- El sitio incluye un CTA directo a WhatsApp, botón flotante y un formulario de contacto que genera un email cuando se envía.
- Los enlaces 'Política de privacidad' y 'Términos' abren modales con contenido que puedes editar en `index.html`.

Desarrollo local:
- Simplemente abre `index.html` en el navegador. Para probar en localhost con Live Server u otro servidor:

```powershell
# instala Live Server si usas vscode o lanza un server simple con python:
python -m http.server 3000
# luego abre: http://localhost:3000
```

---

Si quieres, implemento:
- Paleta automática basada en tus imágenes
- Migración a Next.js o React
- Diseño personalizado con tus copy y fotos en la carpeta `img/`

Dime si quieres que haga la extracción de paleta y acepte las imágenes. Gracias!

---

Resumen del diseño (premium actualizado):
- Hero editorial con logo central y textura/pattern de marca.
- Menú con platos destacados, 'Especialidades de la casa' y llamadas a la acción para ordenar.
- Menú dinámico y filtrable alimentado por `portfolio-manifest.json`.
- Timeline animado (Nuestra Cocina) para la historia/tradición.
- Testimonios con carousel GSAP y micro-interacciones en botones y tarjetas.
- CTA final con fondo acentuado y botón fuerte.
- Paleta principal basada en el logo: #D86F83, #FFFFFF y #000000.

Mejoras (animaciones y micro-interacciones):
- Modal animado con GSAP (apertura/cierre) y atributos ARIA para accesibilidad.
- Parallax del hero optimizado con requestAnimationFrame para mejor rendimiento en scroll.
- Efecto tilt en tarjetas y elementos de la galería (respetando 'prefers-reduced-motion').
- Pulso sutil en el CTA principal del hero y una deriva flotante en el artwork del hero para una sensación premium.
