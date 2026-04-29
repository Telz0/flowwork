import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, Film, Clock, AlertTriangle, Play, Pause, Maximize, Volume2, VolumeX, CheckCircle2, Camera, ShieldCheck, X, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import QcFotoGalerij from '@/components/QcFotoGalerij';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';
import { useRef } from 'react';

function StepPlayer({ step, steps }) {
  const { language } = useLanguage();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const requestFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
  };

  const formatDuration = (sec) => {
    if (!sec) return null;
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  return (
    <motion.div key={step.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
          {steps.findIndex(s => s.id === step.id) + 1}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{getTranslated(step, 'title', language)}</h2>
          {step.duration_seconds && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(step.duration_seconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-5 relative">
        {step.video_url ? (
          <>
            <video
              ref={videoRef}
              src={step.video_url}
              className="w-full h-full object-contain"
              playsInline
              webkit-playsinline="true"
              onEnded={() => setPlaying(false)}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={togglePlay} className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105 active:scale-95">
                  <Play className="w-7 h-7 text-primary ml-1" />
                </button>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
              <button onClick={togglePlay} className="text-white hover:opacity-80 transition-opacity p-1">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3">
                <button onClick={toggleMute} className="text-white hover:opacity-80 transition-opacity p-1">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button onClick={requestFullscreen} className="text-white hover:opacity-80 transition-opacity p-1">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 gap-2">
            <Film className="w-12 h-12" />
            <span className="text-sm">{language === 'nl' ? 'Geen video beschikbaar' : language === 'fr' ? 'Aucune vidéo disponible' : 'No video available'}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {getTranslated(step, 'description', language) && (
        <p className="text-foreground leading-relaxed mb-4">{getTranslated(step, 'description', language)}</p>
      )}

      {/* QC Foto's */}
      <QcFotoGalerij qcItems={step.qc_items} photos={step.qc_photo_urls} label={step.qc_label} language={language} />

      {/* Tips */}
      {getTranslated(step, 'tips', language) && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{getTranslated(step, 'tips', language)}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeStepId, setActiveStepId] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then((r) => r[0]),
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps', productId],
    queryFn: () => base44.entities.ProductionStep.filter({ product_id: productId }, 'order_index'),
    onSuccess: (data) => {
      if (data.length > 0 && !activeStepId) setActiveStepId(data[0].id);
    },
  });

  const { data: category } = useQuery({
    queryKey: ['category', product?.category_id],
    queryFn: () => base44.entities.Category.filter({ id: product?.category_id }).then((r) => r[0]),
    enabled: !!product?.category_id,
  });

  const QC_ID = '__qc_summary__';

  // Verzamel alle QC punten over alle stappen
  const allQcItems = steps.flatMap(step =>
    (step.qc_items || []).map(item => ({ ...item, stepTitle: getTranslated(step, 'title', language) }))
  );
  const hasQc = allQcItems.length > 0;

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
  const isQcActive = activeStepId === QC_ID;
  const activeIndex = steps.findIndex(s => s.id === activeStep?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Product header */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
          <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">{language === 'nl' ? 'Categorieën' : language === 'fr' ? 'Catégories' : 'Categories'}</button>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="hover:text-foreground transition-colors">{getTranslated(category, 'name', language) || '...'}</button>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground tracking-tight leading-tight">{getTranslated(product, 'name', language)}</h1>
        {getTranslated(product, 'description', language) && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{getTranslated(product, 'description', language)}</p>
        )}
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <span className="inline-block text-xs font-semibold text-primary bg-accent px-2.5 py-1 rounded-full">
            {steps.length} {language === 'nl' ? `stap${steps.length !== 1 ? 'pen' : ''}` : language === 'fr' ? `étape${steps.length !== 1 ? 's' : ''}` : `step${steps.length !== 1 ? 's' : ''}`}
          </span>
          {steps.length > 0 && (
            <Button onClick={() => navigate(`/product/${productId}/kijk`)} className="gap-2 bg-primary text-primary-foreground">
              <Tablet className="w-4 h-4" />
              {language === 'nl' ? 'Kijk-modus' : language === 'fr' ? 'Mode opérateur' : 'Operator mode'}
            </Button>
          )}
        </div>

        <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
          {language === 'nl' ? 'Terug naar producten' : language === 'fr' ? 'Retour aux produits' : 'Back to products'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3">
          <Film className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">{language === 'nl' ? 'Geen stappen beschikbaar' : language === 'fr' ? 'Aucune étape disponible' : 'No steps available'}</p>
          <p className="text-sm">{language === 'nl' ? 'Vraag een teamleider om stappen en video\'s toe te voegen.' : language === 'fr' ? 'Demandez à un chef d\'équipe d\'ajouter des étapes et des vidéos.' : 'Ask a team leader to add steps and videos.'}</p>
        </div>
      ) : (
        <>
          {/* MOBILE: navigate to detail page */}
          <div className="block lg:hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => navigate(`/product/${productId}/stap/${step.id}`)}
                  className="text-left bg-card border-2 border-border hover:border-primary/50 rounded-2xl p-4 shadow-sm transition-all active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {steps.findIndex(s => s.id === step.id) + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{getTranslated(step, 'title', language)}</p>
                      {step.duration_seconds && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {Math.floor(step.duration_seconds / 60)}:{String(step.duration_seconds % 60).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </div>
                </button>
              ))}
              {/* QC Samenvatting knop */}
              {hasQc && (
                <button
                  onClick={() => navigate(`/product/${productId}/stap/${QC_ID}`)}
                  className="text-left bg-green-50 border-2 border-green-200 hover:border-green-400 rounded-2xl p-4 shadow-sm transition-all active:scale-95 sm:col-span-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-green-900">QC</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {allQcItems.length} {language === 'nl' ? `controlepunt${allQcItems.length !== 1 ? 'en' : ''}` : language === 'fr' ? `point${allQcItems.length !== 1 ? 's' : ''}` : `point${allQcItems.length !== 1 ? 's' : ''}`} {language === 'nl' ? 'over alle stappen' : language === 'fr' ? 'sur toutes les étapes' : 'across all steps'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* DESKTOP: split view */}
          <div className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-6 items-start">
            {/* Left: stap lijst */}
            <div className="space-y-2 sticky top-6">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left rounded-xl px-4 py-3 transition-all border-2 ${
                    !isQcActive && activeStep?.id === step.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/40 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      !isQcActive && activeStep?.id === step.id ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {steps.findIndex(s => s.id === step.id) + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate text-sm">{getTranslated(step, 'title', language)}</p>
                      {step.duration_seconds && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${!isQcActive && activeStep?.id === step.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                          <Clock className="w-3 h-3" />
                          {Math.floor(step.duration_seconds / 60)}:{String(step.duration_seconds % 60).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* QC Samenvatting knop */}
              {hasQc && (
                <button
                  onClick={() => setActiveStepId(QC_ID)}
                  className={`w-full text-left rounded-xl px-4 py-3 transition-all border-2 ${
                    isQcActive
                      ? 'bg-green-600 text-white border-green-600 shadow-md'
                      : 'bg-green-50 border-green-200 hover:border-green-400 text-green-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isQcActive ? 'bg-white/20' : 'bg-green-100'}`}>
                      <ShieldCheck className={`w-4 h-4 ${isQcActive ? 'text-white' : 'text-green-600'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">QC</p>
                      <p className={`text-xs mt-0.5 ${isQcActive ? 'text-white/70' : 'text-green-700'}`}>
                        {allQcItems.length} {language === 'nl' ? `controlepunt${allQcItems.length !== 1 ? 'en' : ''}` : language === 'fr' ? `point${allQcItems.length !== 1 ? 's' : ''}` : `point${allQcItems.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Vorige / Volgende */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={isQcActive ? false : activeIndex <= 0} onClick={() => {
                  if (isQcActive) setActiveStepId(steps[steps.length - 1]?.id);
                  else if (activeIndex > 0) setActiveStepId(steps[activeIndex - 1].id);
                }}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> {language === 'nl' ? 'Vorige' : language === 'fr' ? 'Précédent' : 'Previous'}
                </Button>
                <Button size="sm" className="flex-1" disabled={isQcActive || (!hasQc && activeIndex >= steps.length - 1)} onClick={() => {
                  if (!isQcActive && activeIndex < steps.length - 1) setActiveStepId(steps[activeIndex + 1].id);
                  else if (!isQcActive && hasQc) setActiveStepId(QC_ID);
                }}>
                  {language === 'nl' ? 'Volgende' : language === 'fr' ? 'Suivant' : 'Next'} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {isQcActive ? (language === 'nl' ? 'QC Samenvatting' : language === 'fr' ? 'Résumé QC' : 'QC Summary') : `${language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'} ${activeIndex + 1} ${language === 'nl' ? 'van' : language === 'fr' ? 'sur' : 'of'} ${steps.length}`}
              </p>
            </div>

            {/* Right: stap detail of QC samenvatting */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
              {isQcActive ? (
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-foreground">{language === 'nl' ? 'QC Samenvatting' : language === 'fr' ? 'Résumé QC' : 'QC Summary'}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{language === 'nl' ? 'Alle controlepunten voor' : language === 'fr' ? 'Tous les points de contrôle pour' : 'All check points for'} {getTranslated(product, 'name', language)}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {allQcItems.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => item.photo_url && setLightboxItem(item)}
                        className={`w-full text-left flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl transition-all ${item.photo_url ? 'hover:border-green-400 hover:bg-green-100 active:scale-[0.99] cursor-pointer' : 'cursor-default'}`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-green-900 text-sm">{getTranslated(item, 'label', language) || (language === 'nl' ? `Punt ${i + 1}` : language === 'fr' ? `Point ${i + 1}` : `Point ${i + 1}`)}</p>
                          <p className="text-xs text-green-700 mt-0.5">{language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'}: {item.stepTitle}</p>
                        </div>
                        {item.photo_url && (
                          <img src={item.photo_url} alt={item.label} className="w-14 h-14 rounded-lg object-cover border border-green-300 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                activeStep && <StepPlayer key={activeStep.id} step={activeStep} steps={steps} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setLightboxItem(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20" onClick={() => setLightboxItem(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={lightboxItem.photo_url} alt={lightboxItem.label} className="max-w-full max-h-[80vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          {lightboxItem.label && <p className="text-white/80 text-sm mt-3 font-medium">{getTranslated(lightboxItem, 'label', language)}</p>}
          {lightboxItem.stepTitle && <p className="text-white/50 text-xs mt-1">{language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'}: {lightboxItem.stepTitle}</p>}
        </div>
      )}
    </div>
  );
}