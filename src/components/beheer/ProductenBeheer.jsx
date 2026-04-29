import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, X, Check, Loader2, Upload } from 'lucide-react';

export default function ProductenBeheer({ isAdmin }) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState('');
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
    try {
      let savedId = editing;
      if (editing) {
        await base44.entities.Product.update(editing, form);
      } else {
        const created = await base44.entities.Product.create(form);
        savedId = created.id;
      }
      setForm({ name: '', category_id: '', description: '', image_url: '', order: 0, is_active: true });
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      // Automatisch vertalen op de achtergrond
      base44.functions.invoke('autoTranslateEntity', { entity_name: 'Product', entity_id: savedId });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ 
      name: p.name || p.name_nl || '', 
      category_id: p.category_id, 
      description: p.description || p.description_nl || '', 
      image_url: p.image_url || '', 
      order: p.order || 0, 
      is_active: p.is_active !== false,
      // Behoud alle bestaande vertalingen
      name_nl: p.name_nl || '',
      name_fr: p.name_fr || '',
      name_en: p.name_en || '',
      description_nl: p.description_nl || '',
      description_fr: p.description_fr || '',
      description_en: p.description_en || ''
    });
  };

  const remove = async (id) => {
    if (!confirm(language === 'nl' ? 'Product verwijderen? Alle stappen en video\'s worden ook verwijderd.' : language === 'fr' ? 'Supprimer le produit ? Toutes les étapes et vidéos seront également supprimées.' : 'Delete product? All steps and videos will also be deleted.')) return;
    // Verwijder eerst alle gekoppelde stappen
    const steps = await base44.entities.ProductionStep.filter({ product_id: id });
    await Promise.all(steps.map(s => base44.entities.ProductionStep.delete(s.id)));
    await base44.entities.Product.delete(id);
    queryClient.invalidateQueries({ queryKey: ['products-all'] });
    queryClient.invalidateQueries({ queryKey: ['steps', id] });
  };

  const cancel = () => {
    setEditing(null);
    setForm({ name: '', category_id: '', description: '', image_url: '', order: 0, is_active: true });
  };

  const catName = (id) => {
    const cat = categories.find(c => c.id === id);
    return cat?.name_nl || cat?.name || id;
  };

  const filteredProducts = filterCategory
    ? products.filter(p => p.category_id === filterCategory)
    : products;

  const handleFilterCategory = (val) => {
    setFilterCategory(val);
    if (!editing) setForm(f => ({ ...f, category_id: val }));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category filter */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
        <Label className="text-sm font-semibold mb-2 block">{language === 'nl' ? 'Kies een categorie' : language === 'fr' ? 'Choisir une catégorie' : 'Choose a category'}</Label>
        <Select value={filterCategory} onValueChange={handleFilterCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={language === 'nl' ? 'Kies categorie...' : language === 'fr' ? 'Choisir une catégorie...' : 'Choose category...'} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name_nl || c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!filterCategory && (
        <p className="text-muted-foreground text-sm text-center py-8">{language === 'nl' ? 'Kies eerst een categorie om producten te zien.' : language === 'fr' ? 'Choisissez d\'abord une catégorie pour voir les produits.' : 'Choose a category first to see products.'}</p>
      )}

      {filterCategory && <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm order-last lg:order-first min-w-0">
        <h2 className="font-bold text-base sm:text-lg mb-4">{editing ? (language === 'nl' ? 'Product bewerken' : language === 'fr' ? 'Modifier le produit' : 'Edit product') : (language === 'nl' ? 'Nieuw product' : language === 'fr' ? 'Nouveau produit' : 'New product')}</h2>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">{language === 'nl' ? 'Naam *' : language === 'fr' ? 'Nom *' : 'Name *'}</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={language === 'nl' ? 'Productnaam' : language === 'fr' ? 'Nom du produit' : 'Product name'} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{language === 'nl' ? 'Categorie *' : language === 'fr' ? 'Catégorie *' : 'Category *'}</Label>
            <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={language === 'nl' ? 'Kies categorie...' : language === 'fr' ? 'Choisir une catégorie...' : 'Choose category...'} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name_nl || c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs mb-1 block">{language === 'nl' ? 'Omschrijving' : language === 'fr' ? 'Description' : 'Description'}</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={language === 'nl' ? 'Korte omschrijving...' : language === 'fr' ? 'Courte description...' : 'Short description...'} />
          </div>
          <div>
            <Label className="text-xs mb-1 block">{language === 'nl' ? 'Afbeelding' : language === 'fr' ? 'Image' : 'Image'}</Label>
            <div className="flex gap-2">
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder={language === 'nl' ? 'https://... of upload →' : language === 'fr' ? 'https://... ou télécharger →' : 'https://... or upload →'} className="flex-1" />
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
              {editing ? (language === 'nl' ? 'Opslaan' : language === 'fr' ? 'Enregistrer' : 'Save') : (language === 'nl' ? 'Aanmaken' : language === 'fr' ? 'Créer' : 'Create')}
            </Button>
            {editing && <Button variant="outline" onClick={cancel}><X className="w-4 h-4" /></Button>}
          </div>
        </div>
      </div>

      <div className="space-y-2 order-first lg:order-last min-w-0 w-full">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-muted-foreground text-xs sm:text-sm text-center py-8">{language === 'nl' ? 'Geen producten gevonden.' : language === 'fr' ? 'Aucun produit trouvé.' : 'No products found.'}</p>
        ) : (
          filteredProducts.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 flex items-center justify-between gap-2 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {p.image_url && <img src={p.image_url} alt="" className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name_nl || p.name}</p>
                  <p className="text-xs text-muted-foreground">{catName(p.category_id)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{p.order ?? 0}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Pencil className="w-3 h-3" /></Button>
                {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>}
    </div>
    );
    }