import { useState } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getTranslated } from '@/lib/getTranslated';

export default function QcFotoGalerij({ qcItems = [], photos = [], label, language = 'nl' }) {
  const [lightbox, setLightbox] = useState(null); // { url, title }
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Support new qcItems format AND legacy photos/label format
  const hasNewItems = qcItems && qcItems.length > 0;
  const hasLegacy = !hasNewItems && photos && photos.length > 0;

  if (!hasNewItems && !hasLegacy) return null;

  const openLightbox = (list, index) => {
    setLightboxList(list);
    setLightboxIndex(index);
    setLightbox(true);
  };

  const prev = () => setLightboxIndex(i => (i > 0 ? i - 1 : lightboxList.length - 1));
  const next = () => setLightboxIndex(i => (i < lightboxList.length - 1 ? i + 1 : 0));

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">
          {language === 'nl' ? 'QC Controlepunten' : language === 'fr' ? 'Points de contrôle QC' : 'QC Control Points'}
        </h3>
      </div>

      {hasNewItems ? (
        <div className="space-y-2">
          {qcItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-900 flex-1 font-medium">{getTranslated(item, 'label', language) || (language === 'nl' ? `Punt ${i + 1}` : language === 'fr' ? `Point ${i + 1}` : `Point ${i + 1}`)}</span>
              {item.photo_url && (
                <button
                  onClick={() => {
                    const urls = qcItems.filter(q => q.photo_url).map(q => ({ url: q.photo_url, title: q.label }));
                    const idx = urls.findIndex(u => u.url === item.photo_url);
                    openLightbox(urls, idx >= 0 ? idx : 0);
                  }}
                  className="w-12 h-12 rounded-lg overflow-hidden border border-green-300 flex-shrink-0 hover:opacity-80 transition-opacity active:scale-95"
                >
                  <img src={item.photo_url} alt={item.label} className="w-full h-full object-cover" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Legacy: grid of photos
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => openLightbox(photos.map(u => ({ url: u, title: label })), i)}
              className="aspect-square rounded-xl overflow-hidden border border-border bg-muted hover:opacity-90 transition-opacity active:scale-95"
            >
              <img src={url} alt={language === 'nl' ? `QC foto ${i + 1}` : language === 'fr' ? `Photo QC ${i + 1}` : `QC photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && lightboxList.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>

          {lightboxList.length > 1 && (
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
            src={lightboxList[lightboxIndex]?.url}
            alt={lightboxList[lightboxIndex]?.title}
            className="max-w-full max-h-[80vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {lightboxList[lightboxIndex]?.title && (
            <p className="text-white/80 text-sm mt-3 font-medium">{lightboxList[lightboxIndex].title}</p>
          )}
          {lightboxList.length > 1 && (
            <p className="text-white/50 text-xs mt-1">{lightboxIndex + 1} / {lightboxList.length}</p>
          )}
        </div>
      )}
    </div>
  );
}