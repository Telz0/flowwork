import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Pencil, Trash2, X, Loader2, Upload, Film } from 'lucide-react';
import SharePointVerbinding from './SharePointVerbinding';
import QcFotoUpload from './QcFotoUpload';

export default function StappenBeheer({ isAdmin }) {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState({ product_id: '', title: '', description: '', video_url: '', order_index: 100, duration_seconds: '', tips: '', qc_items: [] });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => base44.entities.Product.list('name', 100),
  });

  const { data: steps = [], isLoading: loadingSteps } = useQuery({
    queryKey: ['steps', selectedProduct],
    queryFn: () => selectedProduct
      ? base44.entities.ProductionStep.filter({ product_id: selectedProduct }, 'order_index')
      : Promise.resolve([]),
    enabled: !!selectedProduct,
  });

  const uploadVideo = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await base44.functions.invoke('uploadToSharePoint', formData);
      setForm(f => ({ ...f, video_url: res.data.file_url }));
    } catch (err) {
      // Fallback to Base44 storage if SharePoint not connected
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, video_url: file_url }));
    }
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const savedOrderIndex = parseInt(form.order_index) || 100;
    const data = { ...form, product_id: form.product_id || selectedProduct, order_index: savedOrderIndex, duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null };
    if (editing) {
      await base44.entities.ProductionStep.update(editing, data);
    } else {
      await base44.entities.ProductionStep.create(data);
    }
    await queryClient.invalidateQueries({ queryKey: ['steps', selectedProduct] });
    // Bereken volgende index: hoogste van bestaande stappen + opgeslagen index, afgerond op 100tal
    const allIndices = steps.map(s => s.order_index || 0).concat([savedOrderIndex]);
    const maxIndex = Math.max(...allIndices);
    const nextIndex = Math.ceil((maxIndex + 1) / 100) * 100;
    setForm({ product_id: selectedProduct, title: '', description: '', video_url: '', order_index: nextIndex, duration_seconds: '', tips: '', qc_items: [] });
    setEditing(null);
    setSaving(false);
  };

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({ product_id: s.product_id, title: s.title, description: s.description || '', video_url: s.video_url || '', order_index: s.order_index || 100, duration_seconds: s.duration_seconds || '', tips: s.tips || '', qc_items: s.qc_items || [] });
  };

  const remove = async (id) => {
    if (!confirm('Stap verwijderen?')) return;
    await base44.entities.ProductionStep.delete(id);
    queryClient.invalidateQueries({ queryKey: ['steps', selectedProduct] });
  };

  const cancel = () => {
    setEditing(null);
    setForm({ product_id: selectedProduct, title: '', description: '', video_url: '', order_index: nextOrderIndex, duration_seconds: '', tips: '', qc_items: [] });
  };

  const handleCategorySelect = (val) => {
    setSelectedCategory(val);
    setSelectedProduct('');
    setEditing(null);
    setForm(f => ({ ...f, product_id: '', order_index: 100 }));
  };

  const handleProductSelect = (val) => {
    setSelectedProduct(val);
    setForm(f => ({ ...f, product_id: val, order_index: 100 }));
    setEditing(null);
  };

  const nextOrderIndex = steps.length > 0 ? Math.max(...steps.map(s => s.order_index || 0)) + 100 : 100;

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  return (
    <div className="space-y-6">
      {/* SharePoint verbinding status */}
      <SharePointVerbinding />

      {/* Category + Product selector */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-sm font-semibold mb-2 block">1. Kies een categorie</Label>
            <Select value={selectedCategory} onValueChange={handleCategorySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Kies categorie..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-sm font-semibold mb-2 block">2. Kies een product</Label>
            <Select value={selectedProduct} onValueChange={handleProductSelect} disabled={!selectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder={selectedCategory ? 'Kies product...' : 'Eerst categorie kiezen'} />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Steps list - shown first on mobile/tablet, second on desktop */}
          <div className="space-y-3 order-first lg:order-last">
            {loadingSteps ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : steps.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
                <Film className="w-10 h-10 opacity-30" />
                <p className="text-sm">Nog geen stappen. Voeg de eerste stap toe.</p>
              </div>
            ) : (
              steps.map((s, idx) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{s.title}</p>
                        {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>}
                        {s.video_url && (
                          <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                            <Film className="w-3 h-3" /> Video aanwezig
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      {isAdmin && <Button variant="ghost" size="icon" onClick={() => remove(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm order-last lg:order-first">
            <h2 className="font-bold text-lg mb-5">{editing ? 'Stap bewerken' : 'Nieuwe stap'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Volgorde index</Label>
                  <Input type="number" min={1} step={100} value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 100 }))} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs mb-1 block">Titel *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Staptitel" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Uitleg / omschrijving</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Wat moet de medewerker doen?" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Instructievideo</Label>
                <div className="flex gap-2 mb-2">
                  <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://... of upload →" className="flex-1" />
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                      <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                    </Button>
                    <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
                  </label>
                </div>
                {form.video_url && (
                  <video src={form.video_url} className="w-full rounded-lg aspect-video object-contain bg-black" controls />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">Duur (seconden)</Label>
                  <Input type="number" value={form.duration_seconds} onChange={e => setForm(f => ({ ...f, duration_seconds: e.target.value }))} placeholder="bijv. 120" />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Tips / waarschuwingen</Label>
                <Textarea value={form.tips} onChange={e => setForm(f => ({ ...f, tips: e.target.value }))} rows={2} placeholder="Veiligheidstips, aandachtspunten..." />
              </div>
              <QcFotoUpload
                qcItems={form.qc_items}
                onChange={(items) => setForm(f => ({ ...f, qc_items: items }))}
              />
              <div className="flex gap-2">
                <Button onClick={save} disabled={!form.title || saving} className="flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {editing ? 'Opslaan' : 'Stap toevoegen'}
                </Button>
                {editing && <Button variant="outline" onClick={cancel}><X className="w-4 h-4" /></Button>}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}