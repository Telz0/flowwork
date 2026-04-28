import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Loader2, Camera, Image } from 'lucide-react';

// qcItems = [{ label: string, photo_url: string }]
export default function QcFotoUpload({ qcItems = [], onChange }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const addItem = () => {
    onChange([...qcItems, { label: '', photo_url: '' }]);
  };

  const removeItem = (index) => {
    onChange(qcItems.filter((_, i) => i !== index));
  };

  const updateLabel = (index, label) => {
    const updated = qcItems.map((item, i) => i === index ? { ...item, label } : item);
    onChange(updated);
  };

  const uploadPhoto = async (index, file) => {
    setUploadingIndex(index);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = qcItems.map((item, i) => i === index ? { ...item, photo_url: file_url } : item);
    onChange(updated);
    setUploadingIndex(null);
  };

  const removePhoto = (index) => {
    const updated = qcItems.map((item, i) => i === index ? { ...item, photo_url: '' } : item);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">QC controlepunten</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-xs h-7 px-2 gap-1">
          <Plus className="w-3 h-3" /> Punt toevoegen
        </Button>
      </div>

      {qcItems.length === 0 && (
        <p className="text-xs text-muted-foreground italic">Geen QC punten. Klik op "Punt toevoegen" om te beginnen.</p>
      )}

      <div className="space-y-3">
        {qcItems.map((item, index) => (
          <div key={index} className="border border-border rounded-xl p-3 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                {index + 1}
              </div>
              <Input
                value={item.label}
                onChange={e => updateLabel(index, e.target.value)}
                placeholder="Omschrijving (bijv. 'Controleer lassnaad')"
                className="flex-1 h-8 text-sm"
              />
              <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo */}
            {item.photo_url ? (
              <div className="relative group w-24 h-24">
                <img src={item.photo_url} alt={item.label || `QC ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-border" />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block w-fit">
                <div className={`flex items-center gap-1.5 border border-dashed border-border rounded-lg px-3 py-2 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors ${uploadingIndex === index ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingIndex === index ? <Loader2 className="w-3 h-3 animate-spin" /> : <Image className="w-3 h-3" />}
                  {uploadingIndex === index ? 'Uploaden...' : 'Foto toevoegen'}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files[0]) uploadPhoto(index, e.target.files[0]);
                  e.target.value = '';
                }} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}