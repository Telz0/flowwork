import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

export default function CategoriesBeheer() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', icon: '📦', order: 0 });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50),
  });

  const save = async () => {
    setSaving(true);
    if (editing) {
      await base44.entities.Category.update(editing, form);
    } else {
      await base44.entities.Category.create(form);
    }
    setSaving(false);
    setForm({ name: '', description: '', icon: '📦', order: 0 });
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const startEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, description: cat.description || '', icon: cat.icon || '📦', order: cat.order || 0 });
  };

  const remove = async (id) => {
    if (!confirm(language === 'nl' ? 'Categorie verwijderen?' : language === 'fr' ? 'Supprimer la catégorie ?' : 'Delete category?')) return;
    await base44.entities.Category.delete(id);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const cancel = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '📦', order: 0 });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 w-full">
      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 shadow-sm order-last lg:order-first min-w-0">
        <h2 className="font-bold text-sm sm:text-lg mb-3">{editing ? (language === 'nl' ? 'Categorie bewerken' : language === 'fr' ? 'Modifier la catégorie' : 'Edit category') : (language === 'nl' ? 'Nieuwe categorie' : language === 'fr' ? 'Nouvelle catégorie' : 'New category')}</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
             <div>
               <Label className="text-xs mb-0.5 block">{language === 'nl' ? 'Icoon' : language === 'fr' ? 'Icône' : 'Icon'}</Label>
              <Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="text-center text-xl" maxLength={2} />
            </div>
            <div className="col-span-3">
              <Label className="text-xs mb-0.5 block">{language === 'nl' ? 'Naam *' : language === 'fr' ? 'Nom *' : 'Name *'}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={language === 'nl' ? 'Categorienaam' : language === 'fr' ? 'Nom de la catégorie' : 'Category name'} />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-0.5 block">{language === 'nl' ? 'Omschrijving' : language === 'fr' ? 'Description' : 'Description'}</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={language === 'nl' ? 'Korte omschrijving...' : language === 'fr' ? 'Courte description...' : 'Short description...'} rows={1} />
          </div>
          <div>
            <Label className="text-xs mb-0.5 block">{language === 'nl' ? 'Volgorde' : language === 'fr' ? 'Ordre' : 'Order'}</Label>
            <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={!form.name || saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editing ? (language === 'nl' ? 'Opslaan' : language === 'fr' ? 'Enregistrer' : 'Save') : (language === 'nl' ? 'Aanmaken' : language === 'fr' ? 'Créer' : 'Create')}
            </Button>
            {editing && (
              <Button variant="outline" onClick={cancel}><X className="w-4 h-4" /></Button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2 order-first lg:order-last min-w-0 w-full">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">{language === 'nl' ? 'Nog geen categorieën.' : language === 'fr' ? 'Pas encore de catégories.' : 'No categories yet.'}</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg flex-shrink-0">{cat.icon || '📦'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground truncate">{cat.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{cat.order ?? 0}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}><Pencil className="w-3 h-3" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(cat.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}