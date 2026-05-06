import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Film, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import QcFotoGalerij from '@/components/QcFotoGalerij';
import VideoPlayer from '@/components/VideoPlayer';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';

export default function StepDetail() {
  const { productId, stepId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then((r) => r[0]),
  });

  const { data: category } = useQuery({
    queryKey: ['category', product?.category_id],
    queryFn: () => base44.entities.Category.filter({ id: product?.category_id }).then((r) => r[0]),
    enabled: !!product?.category_id,
  });

  const { data: steps = [] } = useQuery({
    queryKey: ['steps', productId],
    queryFn: () => base44.entities.ProductionStep.filter({ product_id: productId }, 'order_index'),
  });

  const QC_ID = '__qc_summary__';
  const isQcPage = stepId === QC_ID;

  const allQcItems = steps.flatMap(step =>
    (step.qc_items || []).map(item => ({ ...item, stepTitle: getTranslated(step, 'title', language) }))
  );

  const currentIndex = steps.findIndex((s) => s.id === stepId);
  const step = steps[currentIndex];
  const prevStep = steps[currentIndex - 1];
  const nextStep = steps[currentIndex + 1];
  const hasQc = allQcItems.length > 0;

  const goToStep = (s) => navigate(`/product/${productId}/stap/${s.id}`);

  const formatDuration = (sec) => {
    if (!sec) return null;
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const [lightboxItem, setLightboxItem] = useState(null);

  if (isQcPage) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">{language === 'nl' ? 'Categorieën' : language === 'fr' ? 'Catégories' : 'Categories'}</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="hover:text-foreground transition-colors">{getTranslated(category, 'name', language) || '...'}</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/product/${productId}`)} className="hover:text-foreground transition-colors">{getTranslated(product, 'name', language) || '...'}</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">QC</span>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/product/${productId}`)} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" /> {language === 'nl' ? 'Terug naar stappen' : language === 'fr' ? 'Retour aux étapes' : 'Back to steps'}
        </Button>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">{language === 'nl' ? 'QC Samenvatting' : language === 'fr' ? 'Résumé QC' : 'QC Summary'}</h1>
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
          <Button variant="outline" onClick={() => navigate(`/product/${productId}`)} className="mt-6 w-full">
            <ChevronLeft className="w-4 h-4 mr-1" /> {language === 'nl' ? 'Terug naar stappen' : language === 'fr' ? 'Retour aux étapes' : 'Back to steps'}
          </Button>
        </motion.div>

        {/* Lightbox */}
        {lightboxItem && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setLightboxItem(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 text-white bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20" onClick={() => setLightboxItem(null)}>
              <X className="w-5 h-5" />
            </button>
            <img src={lightboxItem.photo_url} alt={lightboxItem.label} className="max-w-full max-h-[80vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
            {lightboxItem.label && <p className="text-white/80 text-sm mt-3 font-medium">{lightboxItem.label}</p>}
            {lightboxItem.stepTitle && <p className="text-white/50 text-xs mt-1">Stap: {lightboxItem.stepTitle}</p>}
          </div>
        )}
      </div>
    );
  }

  if (!step) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">{language === 'nl' ? 'Categorieën' : language === 'fr' ? 'Catégories' : 'Categories'}</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="hover:text-foreground transition-colors">{getTranslated(category, 'name', language) || '...'}</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate(`/product/${productId}`)} className="hover:text-foreground transition-colors">{getTranslated(product, 'name', language) || '...'}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'} {currentIndex + 1}</span>
      </div>

      <Button variant="ghost" onClick={() => navigate(`/product/${productId}`)} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4 mr-1" /> {language === 'nl' ? 'Terug naar stappen' : language === 'fr' ? 'Retour aux étapes' : 'Back to steps'}
      </Button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
            {currentIndex + 1}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{getTranslated(step, 'title', language)}</h1>
            {step.duration_seconds && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(step.duration_seconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {getTranslated(step, 'tips', language) && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: getTranslated(step, 'tips', language) }} />
          </div>
        )}

        {/* Video */}
        <div className="mb-5">
          <VideoPlayer videoUrl={step.video_url} language={language} />
        </div>

        {/* Description */}
        {getTranslated(step, 'description', language) && (
          <div className="mb-4 prose prose-sm max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: getTranslated(step, 'description', language) }} />
        )}

        {/* QC Foto's */}
        <QcFotoGalerij qcItems={step.qc_items} photos={step.qc_photo_urls} label={step.qc_label} language={language} />

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => goToStep(prevStep)}
            disabled={!prevStep}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {language === 'nl' ? 'Vorige stap' : language === 'fr' ? 'Étape précédente' : 'Previous step'}
          </Button>
          {nextStep ? (
            <Button onClick={() => goToStep(nextStep)} className="flex-1">
              {language === 'nl' ? 'Volgende stap' : language === 'fr' ? 'Étape suivante' : 'Next step'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : hasQc ? (
            <Button
              onClick={() => navigate(`/product/${productId}/stap/${QC_ID}`)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              QC <ShieldCheck className="w-4 h-4 ml-1" />
            </Button>
          ) : null}
        </div>

        {/* Step counter */}
        <p className="text-center text-sm text-muted-foreground mt-3">
          {language === 'nl' ? 'Stap' : language === 'fr' ? 'Étape' : 'Step'} {currentIndex + 1} {language === 'nl' ? 'van' : language === 'fr' ? 'sur' : 'of'} {steps.length}
        </p>
      </motion.div>
    </div>
  );
}