import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Loader2, Film, Clock, AlertTriangle, Play, Pause, Maximize, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import QcFotoGalerij from '@/components/QcFotoGalerij';
import { useRef } from 'react';

function StepPlayer({ step }) {
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
          {step.step_number}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">{step.title}</h2>
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
            <span className="text-sm">Geen video beschikbaar</span>
          </div>
        )}
      </div>

      {/* Description */}
      {step.description && (
        <p className="text-foreground leading-relaxed mb-4">{step.description}</p>
      )}

      {/* QC Foto's */}
      <QcFotoGalerij qcItems={step.qc_items} photos={step.qc_photo_urls} label={step.qc_label} />

      {/* Tips */}
      {step.tips && (
        <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">{step.tips}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [activeStepId, setActiveStepId] = useState(null);

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then((r) => r[0]),
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps', productId],
    queryFn: () => base44.entities.ProductionStep.filter({ product_id: productId }, 'step_number'),
    onSuccess: (data) => {
      if (data.length > 0 && !activeStepId) setActiveStepId(data[0].id);
    },
  });

  const { data: category } = useQuery({
    queryKey: ['category', product?.category_id],
    queryFn: () => base44.entities.Category.filter({ id: product?.category_id }).then((r) => r[0]),
    enabled: !!product?.category_id,
  });

  const activeStep = steps.find(s => s.id === activeStepId) || steps[0];
  const activeIndex = steps.findIndex(s => s.id === activeStep?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
        <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">Categorieën</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate(`/categorie/${product?.category_id}`)} className="hover:text-foreground transition-colors">{category?.name || '...'}</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{product?.name || '...'}</span>
      </div>

      <Button variant="ghost" onClick={() => navigate(`/categorie/${product?.category_id}`)} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-4 h-4 mr-1" /> Terug naar producten
      </Button>

      {/* Product header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{product?.name}</h1>
        {product?.description && <p className="text-muted-foreground mt-1">{product.description}</p>}
        <span className="inline-block text-sm font-semibold text-primary bg-accent px-3 py-1 rounded-full mt-2">
          {steps.length} productiestap{steps.length !== 1 ? 'pen' : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3">
          <Film className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">Geen stappen beschikbaar</p>
          <p className="text-sm">Vraag een teamleider om stappen en video's toe te voegen.</p>
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
                      {step.step_number}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{step.title}</p>
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
                    activeStep?.id === step.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card border-border hover:border-primary/40 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      activeStep?.id === step.id ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'
                    }`}>
                      {step.step_number}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate text-sm">{step.title}</p>
                      {step.duration_seconds && (
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${activeStep?.id === step.id ? 'text-white/70' : 'text-muted-foreground'}`}>
                          <Clock className="w-3 h-3" />
                          {Math.floor(step.duration_seconds / 60)}:{String(step.duration_seconds % 60).padStart(2, '0')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {/* Vorige / Volgende */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={activeIndex <= 0} onClick={() => setActiveStepId(steps[activeIndex - 1].id)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Vorige
                </Button>
                <Button size="sm" className="flex-1" disabled={activeIndex >= steps.length - 1} onClick={() => setActiveStepId(steps[activeIndex + 1].id)}>
                  Volgende <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Stap {activeIndex + 1} van {steps.length}</p>
            </div>

            {/* Right: stap detail */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm min-h-[400px]">
              {activeStep && <StepPlayer key={activeStep.id} step={activeStep} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}