import { useEffect, useRef, useState } from 'react';

/**
 * Affiche une photo produit recadrée sur son contenu réel.
 *
 * Les visuels fournisseur sont composés sur un très large fond neutre
 * (gabarit de catalogue papier), avec un triangle décoratif toujours placé
 * en bas-gauche. Un simple `object-fit: contain` laisse alors le produit
 * minuscule au milieu d'un cadre presque vide. On détecte ici la zone utile
 * de l'image par différence de couleur avec le fond (échantillonné en
 * haut-droite, jamais couvert par le triangle) et on zoome dessus — sans
 * jamais recadrer le produit lui-même (marge de sécurité conservée).
 *
 * Si l'analyse échoue (image cross-origin non autorisée, décodage impossible,
 * aucune zone détectée) : repli silencieux sur l'image entière via `className`.
 */
const ProductImageFrame = ({ src, alt, className = '' }) => {
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [bbox, setBbox] = useState(null); // {x,y,w,h} en pixels naturels, 'full', ou null (pas encore calculé)
  const [natural, setNatural] = useState(null);
  const [transform, setTransform] = useState(null);

  useEffect(() => {
    setBbox(null);
    setNatural(null);
    setTransform(null);
  }, [src]);

  const handleLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });

    if (!w || !h) { setBbox('full'); return; }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, w, h);

      const at = (x, y) => {
        const i = (y * w + x) * 4;
        return [data[i], data[i + 1], data[i + 2]];
      };
      const bg = at(w - 1, 0);
      const threshold = 26;
      const step = Math.max(1, Math.floor(Math.max(w, h) / 300));

      let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const [r, g, b] = at(x, y);
          if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) > threshold) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (!found || maxX - minX < w * 0.05 || maxY - minY < h * 0.05) {
        setBbox('full');
        return;
      }

      const padX = (maxX - minX) * 0.12;
      const padY = (maxY - minY) * 0.12;
      const bx = Math.max(0, minX - padX);
      const by = Math.max(0, minY - padY);
      const bxEnd = Math.min(w, maxX + padX);
      const byEnd = Math.min(h, maxY + padY);
      setBbox({ x: bx, y: by, w: bxEnd - bx, h: byEnd - by });
    } catch {
      setBbox('full');
    }
  };

  useEffect(() => {
    if (!bbox || bbox === 'full' || !natural) { setTransform(null); return undefined; }
    const container = containerRef.current;
    if (!container) return undefined;

    const recompute = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scale = Math.min(rect.width / bbox.w, rect.height / bbox.h);
      setTransform({
        width: natural.w * scale,
        height: natural.h * scale,
        x: (rect.width - bbox.w * scale) / 2 - bbox.x * scale,
        y: (rect.height - bbox.h * scale) / 2 - bbox.y * scale,
      });
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [bbox, natural]);

  if (!src) return null;

  const cropped = Boolean(transform) && bbox !== 'full';

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={handleLoad}
        onError={() => setBbox('full')}
        className={cropped ? 'absolute max-w-none' : className}
        style={cropped ? { width: transform.width, height: transform.height, left: transform.x, top: transform.y } : undefined}
      />
    </div>
  );
};

export default ProductImageFrame;
