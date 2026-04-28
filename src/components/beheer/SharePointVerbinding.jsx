import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Link2, LogOut, Loader2, AlertCircle, FolderOpen } from 'lucide-react';

const CONNECTOR_ID = "69f08e6060f2243cb70a95b4";

export default function SharePointVerbinding({ folder, onFolderChange }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const checkConnection = async () => {
    try {
      const res = await base44.functions.invoke('checkSharePointConnection', {});
      setConnected(res.data?.connected === true);
    } catch (err) {
      setConnected(false);
    }
    setLoading(false);
  };

  useEffect(() => { checkConnection(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      if (!url) { setConnecting(false); return; }

      // Op mobiel (bijv. iPhone) werken popups niet — navigeer direct
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = url;
        return;
      }

      const popup = window.open(url, '_blank', 'width=600,height=700');
      if (!popup) {
        window.location.href = url;
        return;
      }
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setConnecting(false);
          checkConnection();
        }
      }, 500);
    } catch (err) {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> SharePoint status controleren...
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border ${connected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      {connected ? (
        <>
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">SharePoint verbonden</p>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              value={folder}
              onChange={e => onFolderChange(e.target.value)}
              placeholder="Map bijv. Werkinstructies"
              className="h-7 text-xs w-44 bg-white border-green-300 focus-visible:ring-green-400"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-xs border-green-300 text-green-800 hover:bg-green-100">
            <LogOut className="w-3 h-3 mr-1" /> Ontkoppelen
          </Button>
        </>
      ) : (
        <>
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">SharePoint niet verbonden</p>
            <p className="text-xs text-amber-700">Verbind je Microsoft-account om video's naar SharePoint te uploaden.</p>
          </div>
          <Button size="sm" onClick={handleConnect} disabled={connecting} className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
            {connecting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Link2 className="w-3 h-3 mr-1" />}
            Verbinden
          </Button>
        </>
      )}
    </div>
  );
}