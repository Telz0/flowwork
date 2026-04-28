import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Camera } from 'lucide-react';

export default function QcFotoUpload({ photos = [], label = '', onChange }) {
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange({ photos: [...photos, file_url], label });
    setUploading(false);
  };

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange({ photos: updated, label });
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs mb-1 block">QC controle foto's</Label>

      {/* Label input */}
      <Input
        value={label}
        onChange={e => onChange({ photos, label: e.target.value })}
        placeholder="Omschrijving QC controle (bijv. 'Controleer lassnaad')"
      />

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
              <img src={url} alt={`QC foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className="cursor-pointer block">
        <div className={`flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {uploading ? 'Uploaden...' : 'Foto toevoegen'}
        </div>
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
          const files = Array.from(e.target.files || []);
          files.forEach(f => uploadPhoto(f));
          e.target.value = '';
        }} />
      </label>
    </div>
  );
}