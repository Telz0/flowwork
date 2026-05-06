import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize, Volume2, VolumeX, Film, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Detecteer of een URL een SharePoint webUrl is (geen directe stream)
function isSharePointWebUrl(url) {
  return url && url.includes('sharepoint.com') && !url.includes('download.aspx') && !url.includes('_layouts') && !url.includes('?');
}

export default function VideoPlayer({ videoUrl, language }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPlaying(false);
    setError(null);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    if (!videoUrl) {
      setStreamUrl(null);
      return;
    }

    if (isSharePointWebUrl(videoUrl)) {
      // Haal verse download URL op via backend
      setLoading(true);
      setStreamUrl(null);
      base44.functions.invoke('getSharePointVideoUrl', { video_url: videoUrl })
        .then(res => {
          setStreamUrl(res.data.download_url);
        })
        .catch(err => {
          setError(err.message || 'Kon video URL niet ophalen');
        })
        .finally(() => setLoading(false));
    } else {
      // Directe URL, gewoon gebruiken
      setStreamUrl(videoUrl);
    }
  }, [videoUrl]);

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

  const goFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.webkitEnterFullscreen) { v.webkitEnterFullscreen(); return; }
    if (v.requestFullscreen) v.requestFullscreen();
    else if (v.webkitRequestFullscreen) v.webkitRequestFullscreen();
  };

  const label = (nl, fr, en) => language === 'nl' ? nl : language === 'fr' ? fr : en;

  if (!videoUrl) {
    return (
      <div className="w-full aspect-video bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-3 text-white/30">
        <Film className="w-16 h-16" />
        <span className="text-base">{label('Geen video beschikbaar', 'Aucune vidéo disponible', 'No video available')}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-white/50 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-black/80 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/50 px-4 text-center">
        <Film className="w-10 h-10" />
        <span className="text-sm">{label('Video niet beschikbaar', 'Vidéo non disponible', 'Video unavailable')}</span>
        <span className="text-xs opacity-60 break-all">{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative">
      <video
        ref={videoRef}
        src={streamUrl}
        className="w-full h-full object-contain"
        playsInline
        webkit-playsinline="true"
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-20 h-20 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
          >
            <Play className="w-9 h-9 text-primary ml-1" />
          </button>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-4 bg-gradient-to-t from-black/80 to-transparent">
        <button onClick={togglePlay} className="text-white p-2 active:opacity-60">
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
        </button>
        <div className="flex items-center gap-4">
          <button onClick={toggleMute} className="text-white p-2 active:opacity-60">
            {muted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
          </button>
          <button onClick={goFullscreen} className="text-white p-2 active:opacity-60">
            <Maximize className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
}