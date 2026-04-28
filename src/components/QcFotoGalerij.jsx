import { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function QcFotoGalerij({ photos = [], label }) {
  const [lightbox, setLightbox] = useState(null); // index of open photo

  if (!photos || photos.length === 0) return null;

  const prev = () => setLightbox(i => (i > 0 ? i - 1 : photos.length - 1));
  const next = () => setLightbox(i => (i < photos.length - 1 ? i + 1 : 0));

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">
          {label || 'QC Controle foto\'s'}
        </h3>
        <span className="text-xs text-muted-foreground">({photos.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="aspect-square rounded-xl overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity active:scale-95"
          >
            <img src={url} alt={`QC foto ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                className="absolute left-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                onClick={e => { e.stopPropagation(); prev(); }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="absolute right-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
                onClick={e => { e.stopPropagation(); next(); }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <img
            src={photos[lightbox]}
            alt={`QC foto ${lightbox + 1}`}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">{lightbox + 1} / {photos.length}</p>
        </div>
      )}
    </div>
  );
}