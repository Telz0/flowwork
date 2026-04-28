import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StepVideoCard({ step, stepNumber, isActive, onClick }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const formatDuration = (sec) => {
    if (!sec) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl border-2 shadow-sm overflow-hidden transition-all duration-200 ${
        isActive ? 'border-primary shadow-md' : 'border-border hover:border-primary/40'
      }`}
      onClick={onClick}
    >
      {/* Step badge */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}>
          {stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate">{step.title}</h3>
          {step.duration_seconds && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(step.duration_seconds)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Video */}
      <div className="relative mx-4 mb-4 rounded-xl overflow-hidden bg-black aspect-video">
        {step.video_url ? (
          <>
            <video
              ref={videoRef}
              src={step.video_url}
              className="w-full h-full object-contain"
              loop
              playsInline
              onEnded={() => setPlaying(false)}
            />
            {/* Overlay controls */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!playing && (
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105"
                >
                  <Play className="w-6 h-6 text-primary ml-1" />
                </button>
              )}
            </div>
            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
              <button onClick={togglePlay} className="text-white hover:opacity-80 transition-opacity">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button onClick={toggleMute} className="text-white hover:opacity-80 transition-opacity">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
            <Play className="w-10 h-10" />
            <span className="text-xs">Geen video beschikbaar</span>
          </div>
        )}
      </div>

      {/* Description */}
      {step.description && (
        <div className="px-5 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
      )}

      {/* Tips */}
      {step.tips && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">{step.tips}</p>
        </div>
      )}
    </motion.div>
  );
}