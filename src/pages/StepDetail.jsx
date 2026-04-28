import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle, Play, Pause, Maximize, Volume2, VolumeX, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import QcFotoGalerij from '@/components/QcFotoGalerij';

export default function StepDetail() {
  const { productId, stepId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

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

  const currentIndex = steps.findIndex((s) => s.id === stepId);
  const step = steps[currentIndex];
  const prevStep = steps[currentIndex - 1];
  const nextStep = steps[currentIndex + 1];

  const goToStep = (s) => {
    setPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    navigate(`/product/${productId}/stap/${s.id}`);
  };

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
    // iOS Safari
    if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
    // Standard
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
  };

  const formatDuration = (sec) => {
    if (!sec) return null;
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

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
        <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">Categorieën</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="hover:text-foreground transition-colors">{category?.name || '...'}</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate(`/product/${productId}`)} className="hover:text-foreground transition-colors">{product?.name || '...'}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Stap {currentIndex + 1}</span>
      </div>

      <Button variant="ghost" onClick={() => navigate(`/product/${productId}`)} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4 mr-1" /> Terug naar stappen
      </Button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg flex-shrink-0">
            {currentIndex + 1}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{step.title}</h1>
            {step.duration_seconds && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatDuration(step.duration_seconds)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        {step.tips && (
          <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">{step.tips}</p>
          </div>
        )}

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
                x-webkit-airplay="allow"
                onEnded={() => setPlaying(false)}
              />
              {/* Center play button */}
              {!playing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-7 h-7 text-primary ml-1" />
                  </button>
                </div>
              )}
              {/* Bottom controls */}
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
              <span className="text-sm">Geen video beschikbaar</span>
            </div>
          )}
        </div>

        {/* Description */}
        {step.description && (
          <div className="mb-4">
            <p className="text-foreground leading-relaxed">{step.description}</p>
          </div>
        )}

        {/* QC Foto's */}
        <QcFotoGalerij qcItems={step.qc_items} photos={step.qc_photo_urls} label={step.qc_label} />

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => goToStep(prevStep)}
            disabled={!prevStep}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Vorige stap
          </Button>
          <Button
            onClick={() => goToStep(nextStep)}
            disabled={!nextStep}
            className="flex-1"
          >
            Volgende stap
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-center text-sm text-muted-foreground mt-3">
          Stap {currentIndex + 1} van {steps.length}
        </p>
      </motion.div>
    </div>
  );
}