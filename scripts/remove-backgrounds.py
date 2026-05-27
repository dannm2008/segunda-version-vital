from __future__ import annotations

from collections import deque
from pathlib import Path
from statistics import median
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "assets" / "imagenes"
OUT_DIR = ROOT / "assets" / "imagenes"

# Archivos esperados actualmente en el proyecto.
INPUT_FILES = [
    "Amoxicilina.png",
    "Atorvastatina.webp",
    "Enalapril.webp",
    "Ibuprofeno.png",
    "Lantus.webp",
    "Losartan.webp",
    "Metamorfina.webp",
    "Omeprazol.webp",
    "Paracetamol.jpg",
    "Salbutamol.webp",
]

# Salida con transparencia. Mantener nombres simples y consistentes.
OUTPUT_FILES = {
    "Amoxicilina.png": "Amoxicilina.png",
    "Atorvastatina.webp": "Atorvastatina.png",
    "Enalapril.webp": "Enalapril.png",
    "Ibuprofeno.png": "Ibuprofeno.png",
    "Lantus.webp": "Lantus.png",
    "Losartan.webp": "Losartan.png",
    "Metamorfina.webp": "Metamorfina.png",
    "Omeprazol.webp": "Omeprazol.png",
    "Paracetamol.jpg": "Paracetamol.png",
    "Salbutamol.webp": "Salbutamol.png",
}


def remove_light_bg(img: Image.Image) -> Image.Image:
    """Quita fondo conectado al borde y reduce halo blanco en contornos.

    Estrategia:
    1) estima color de fondo con pixeles del borde;
    2) hace flood-fill solo desde bordes para no borrar blancos internos del producto;
    3) suaviza y descontamina bordes semitransparentes.
    """
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size

    # 1) Estimar color del fondo con el borde de la imagen.
    border_rgb = []
    for x in range(w):
        border_rgb.append(px[x, 0][:3])
        border_rgb.append(px[x, h - 1][:3])
    for y in range(h):
        border_rgb.append(px[0, y][:3])
        border_rgb.append(px[w - 1, y][:3])

    bg_r = int(median([c[0] for c in border_rgb]))
    bg_g = int(median([c[1] for c in border_rgb]))
    bg_b = int(median([c[2] for c in border_rgb]))

    def is_bg_candidate(r: int, g: int, b: int) -> bool:
        # Distancia Manhattan al color de borde.
        dist = abs(r - bg_r) + abs(g - bg_g) + abs(b - bg_b)
        bright = max(r, g, b)
        low_sat = (max(r, g, b) - min(r, g, b)) <= 42
        near_border_color = dist <= 88
        near_white = bright >= 230 and low_sat
        return near_border_color or near_white

    # 2) Flood-fill del fondo solo desde bordes.
    bg_mask = [[False] * w for _ in range(h)]
    q = deque()

    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        if bg_mask[y][x]:
            continue

        r, g, b, _a = px[x, y]
        if not is_bg_candidate(r, g, b):
            continue

        bg_mask[y][x] = True
        q.append((x + 1, y))
        q.append((x - 1, y))
        q.append((x, y + 1))
        q.append((x, y - 1))

    # Aplicar transparencia completa al fondo detectado.
    for y in range(h):
        for x in range(w):
            if bg_mask[y][x]:
                r, g, b, _a = px[x, y]
                px[x, y] = (r, g, b, 0)

    # 3) Suavizado + decontaminacion de halo blanco en borde del sujeto.
    for y in range(1, h - 1):
        for x in range(1, w - 1):
            r, g, b, a = px[x, y]
            if a == 0:
                continue

            near_transparent = (
                px[x - 1, y][3] == 0
                or px[x + 1, y][3] == 0
                or px[x, y - 1][3] == 0
                or px[x, y + 1][3] == 0
            )

            if not near_transparent:
                continue

            bright = max(r, g, b)
            sat = max(r, g, b) - min(r, g, b)

            # Reducir alpha en blancos/grises pegados al contorno.
            if bright >= 210 and sat <= 65:
                fade = max(0.30, min(1.0, (245 - bright) / 55))
                a = int(a * fade)

            # Decontaminar color para evitar borde blanquecino al mezclar.
            if 0 < a < 255:
                an = a / 255.0
                r = int((r - 255 * (1 - an)) / max(an, 1e-6))
                g = int((g - 255 * (1 - an)) / max(an, 1e-6))
                b = int((b - 255 * (1 - an)) / max(an, 1e-6))
                r = max(0, min(255, r))
                g = max(0, min(255, g))
                b = max(0, min(255, b))

            px[x, y] = (r, g, b, a)

    return rgba


def main() -> None:
    backups = SRC_DIR / "_backup_originales"
    backups.mkdir(exist_ok=True)

    processed = 0
    missing = []

    for file_name in INPUT_FILES:
        src = SRC_DIR / file_name
        if not src.exists():
            missing.append(file_name)
            continue

        out_name = OUTPUT_FILES[file_name]
        out = OUT_DIR / out_name

        # Guardar backup solo una vez.
        backup = backups / file_name
        if not backup.exists():
            backup.write_bytes(src.read_bytes())

        # Reprocesar siempre desde el original cuando exista respaldo.
        source_to_process = backup if backup.exists() else src

        with Image.open(source_to_process) as im:
            nobg = remove_light_bg(im)
            nobg.save(out, format="PNG", optimize=True)

        processed += 1

    print(f"Procesadas: {processed}")
    if missing:
        print("Faltantes:")
        for name in missing:
            print(f" - {name}")


if __name__ == "__main__":
    main()
