#!/usr/bin/env python3
"""
Genera un JSON con la lista de imágenes dentro de img/ para usarse en la galería.
Ejecuta: python scripts/generate_manifest.py
"""
import os
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, 'img')
OUTFILE = os.path.join(IMG_DIR, 'portfolio-manifest.json')

ALLOWED_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}

def main():
    if not os.path.isdir(IMG_DIR):
        print('La carpeta img/ no existe. Asegúrate de estar en el root del proyecto.')
        return
    images = [f for f in os.listdir(IMG_DIR) if os.path.splitext(f)[1].lower() in ALLOWED_EXT]
    # Exclude logo and manifests
    images = [f for f in images if 'logo' not in f.lower() and not f.endswith('portfolio-manifest.json')]
    images.sort()
    manifest = []
    for i,f in enumerate(images, start=1):
        manifest.append({
            'src': f,
            'title': os.path.splitext(f)[0].replace('-', ' ').replace('_', ' ').strip(),
            'alt': f'Plato {i}'
        })
    with open(OUTFILE, 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, indent=2, ensure_ascii=False)
    print(f'Generated {OUTFILE} with {len(manifest)} images')

if __name__ == '__main__':
    main()
