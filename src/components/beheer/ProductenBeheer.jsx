import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Check, Loader2, Upload } from 'lucide-react';

export default function ProductenBeheer({ isAdmin }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', category_id: '', description: '', image_url: '', order: 0, is_active: true });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => base44.entities.Product.list('order', 100),
  });

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.Product.update(editing, form);
    } else {
      await base44.entities.Product.create(form);
    }
    await queryClient.invalidateQueries({ queryKey: ['products-all'] });
    setForm({ name: '', category_id: '', description: '', image_url: '', order: 0, is_active: true });
    setEditing(null);
    setSaving(false);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name, category_id: p.category_id, description: p.description || '', image_url: p.image_url || '', order: p.order || 0, is_active: p.is_active !== false });
  };

  const remove = async (id) => {
    if (!confirm('Product verwijderen?')) return;
    await base44.entities.Product.delete(id);
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
  };

  const cancel = () => {
    setEditing(null);
    setForm({ name: '', category_id: '', description: '', image_url: '', order: 0, is_active: true });
  };

  const catName = (id) => categories.find(c => c.id === id)?.name || id;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-lg mb-5">{editing ? 'Product bewerken' : 'Nieuw product'}</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Naam *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Productnaam" />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Categorie *</Label>
            <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Kies categorie..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Omschrijving</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Korte omschrijving..." />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Afbeelding</Label>
            <div className="flex gap-2">
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://... of upload →" className="flex-1" />
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                  <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
              </label>
            </div>
            {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-20 w-full object-cover rounded-lg" />}
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!form.name || !form.category_id || saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editing ? 'Opslaan' : 'Aanmaken'}
            </Button>
            {editing && <Button variant="outline" onClick={cancel}><X className="w-4 h-4" /></Button>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">Nog geen producten.</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{catName(p.category_id)}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="w-4 h-4" /></Button>
                {isAdmin && <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}