import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Film, ShieldCheck, CheckCircle2, AlertTriangle, Clock, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';
import VideoPlayer from '@/components/VideoPlayer';

export default function KijkModus() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const touchStartX = useRef(null);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then(r => r[0]),
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps', productId],
    queryFn: () => base44.entities.ProductionStep.filter({ product_id: productId }, 'order_index'),
  });

  const allQcItems = steps.flatMap(step =>
    (step.qc_items || []).map(item => ({ ...item, stepTitle: getTranslated(step, 'title', language) }))
  );
  const hasQc = allQcItems.length > 0;

  // Slides: stappen + optioneel QC slide
  const QC_SLIDE = '__qc__';
  const totalSlides = steps.length + (hasQc ? 1 : 0);
  const isQcSlide = hasQc && currentIndex === steps.length;
  const step = !isQcSlide ? steps[currentIndex] : null;

  const goTo = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };
  const goPrev = () => { if (currentIndex > 0) goTo(currentIndex - 1); };
  const goNext = () => { if (currentIndex < totalSlides - 1) goTo(currentIndex + 1); };

  // Swipe support
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) goNext();
    else if (dx > 50) goPrev();
    touchStartX.current = null;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
        <button
          onClick={() => navigate(`/product/${productId}`)}
          className="flex items-center gap-1 text-muted-foreground active:opacity-60 p-1"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{language === 'nl' ? 'Terug' : language === 'fr' ? 'Retour' : 'Back'}</span>
        </button>
        <div className="text-center min-w-0 flex-1 mx-3">
          <p className="text-xs text-muted-foreground truncate">{getTranslated(product, 'name', language)}</p>
          <p className="text-sm font-bold text-foreground">
            {isQcSlide
              ? 'QC'
              : `${language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'} ${currentIndex + 1} / ${steps.length}`}
          </p>
        </div>
        <button
          onClick={() => navigate(`/product/${productId}`)}
          className="flex items-center gap-1 text-muted-foreground active:opacity-60 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0 px-4 overflow-x-auto">
        {Array.from({ length: totalSlides }).map((_, i) => {
          const isQc = hasQc && i === steps.length;
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all flex-shrink-0 ${
                i === currentIndex
                  ? isQc ? 'w-6 h-3 bg-green-500' : 'w-6 h-3 bg-primary'
                  : isQc ? 'w-3 h-3 bg-green-200' : 'w-3 h-3 bg-border'
              }`}
            />
          );
        })}
      </div>

      {/* Main content — swipeable */}
      <div
        className="flex-1 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="absolute inset-0 overflow-y-auto"
          >
            {isQcSlide ? (
              /* QC Slide */
              <div className="px-4 py-4 space-y-3 pb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-foreground">
                      {language === 'nl' ? 'Kwaliteitscontrole' : language === 'fr' ? 'Contrôle qualité' : 'Quality Control'}
                    </h2>
                    <p className="text-sm text-muted-foreground">{allQcItems.length} {language === 'nl' ? 'controlepunten' : language === 'fr' ? 'points de contrôle' : 'check points'}</p>
                  </div>
                </div>
                {allQcItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => item.photo_url && setLightboxPhoto(item)}
                    className={`w-full text-left flex items-center gap-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl active:scale-[0.98] transition-transform ${item.photo_url ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-green-900">{getTranslated(item, 'label', language) || `Punt ${i + 1}`}</p>
                      <p className="text-xs text-green-700 mt-0.5">{item.stepTitle}</p>
                    </div>
                    {item.photo_url && (
                      <div className="relative flex-shrink-0">
                        <img src={item.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-green-300" />
                        <div className="absolute bottom-1 right-1 bg-black/40 rounded-full p-0.5">
                          <ZoomIn className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : step ? (
              /* Stap slide */
              <div className="px-4 py-4 space-y-4 pb-8">
                {/* Step header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xl flex-shrink-0">
                    {currentIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-extrabold text-foreground leading-tight">{getTranslated(step, 'title', language)}</h2>
                    {step.duration_seconds && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{Math.floor(step.duration_seconds / 60)}:{String(step.duration_seconds % 60).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips */}
                {getTranslated(step, 'tips', language) && (
                  <div className="flex gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed font-medium">{getTranslated(step, 'tips', language)}</p>
                  </div>
                )}

                {/* Video */}
                <div className="md:max-w-[50%]">
                  <VideoPlayer videoUrl={step.video_url} language={language} />
                </div>

                {/* Description */}
                {getTranslated(step, 'description', language) && (
                  <p className="text-base text-foreground leading-relaxed">{getTranslated(step, 'description', language)}</p>
                )}

                {/* QC foto's van deze stap */}
                {(step.qc_items || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {language === 'nl' ? 'Kwaliteitscontrole' : language === 'fr' ? 'Contrôle qualité' : 'Quality control'}
                    </p>
                    {step.qc_items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => item.photo_url && setLightboxPhoto({ ...item, stepTitle: getTranslated(step, 'title', language) })}
                        className={`w-full text-left flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl active:scale-[0.98] transition-transform ${item.photo_url ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="flex-1 text-sm font-medium text-green-900">{getTranslated(item, 'label', language) || `Punt ${i + 1}`}</p>
                        {item.photo_url && (
                          <img src={item.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover border border-green-300 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-t border-border flex-shrink-0">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-border text-foreground font-semibold text-base disabled:opacity-30 active:scale-95 transition-transform bg-secondary"
        >
          <ChevronLeft className="w-6 h-6" />
          {language === 'nl' ? 'Vorige' : language === 'fr' ? 'Précédent' : 'Previous'}
        </button>
        {currentIndex === totalSlides - 1 ? (
          <button
            onClick={() => navigate(`/product/${productId}`)}
            className="flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl font-semibold text-base active:scale-95 transition-transform bg-green-600 text-white"
          >
            <X className="w-6 h-6" />
            {language === 'nl' ? 'Afsluiten' : language === 'fr' ? 'Fermer' : 'Exit'}
          </button>
        ) : (
          <button
            onClick={goNext}
            className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl font-semibold text-base active:scale-95 transition-transform ${
              hasQc && currentIndex === steps.length - 1
                ? 'bg-green-600 text-white'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {language === 'nl' ? 'Volgende' : language === 'fr' ? 'Suivant' : 'Next'}
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button className="absolute top-5 right-5 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20">
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxPhoto.photo_url}
            alt={lightboxPhoto.label}
            className="max-w-full max-h-[75vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          {lightboxPhoto.label && <p className="text-white/90 text-base font-semibold mt-4">{getTranslated(lightboxPhoto, 'label', language)}</p>}
          {lightboxPhoto.stepTitle && <p className="text-white/50 text-sm mt-1">{lightboxPhoto.stepTitle}</p>}
        </div>
      )}
    </div>
  );
}