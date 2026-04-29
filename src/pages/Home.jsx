import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import CategoryCard from '@/components/CategoryCard';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';

export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order', 50)
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  const productCountForCategory = (catId) =>
  products.filter((p) => p.category_id === catId).length;

  const filtered = categories.filter((c) => {
    const translatedName = getTranslated(c, 'name', language);
    return translatedName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {language === 'nl' ? 'Werkinstructies' : language === 'fr' ? 'Instructions de travail' : 'Work Instructions'}
        </h1>
        <p className="text-muted-foreground mt-2 text-base">
          {language === 'nl' ? 'Kies een categorie om de stap-voor-stap instructievideo\'s te bekijken.' : language === 'fr' ? 'Choisissez une catégorie pour regarder les vidéos d\'instructions étape par étape.' : 'Choose a category to view step-by-step instruction videos.'}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="lucide lucide-search absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground hidden" />
        


        

        
      </div>

      {loadingCats ?
      <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div> :
      filtered.length === 0 ?
      <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg font-medium">
            {language === 'nl' ? 'Geen categorieën gevonden' : language === 'fr' ? 'Aucune catégorie trouvée' : 'No categories found'}
          </p>
          <p className="text-sm mt-1">
            {language === 'nl' ? 'Probeer een ander zoekwoord.' : language === 'fr' ? 'Essayez un autre terme de recherche.' : 'Try a different search term.'}
          </p>
        </div> :

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        
          {filtered.map((cat, i) =>
        <motion.div
          key={cat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}>
          
              <CategoryCard
            category={cat}
            productCount={productCountForCategory(cat.id)}
            onClick={() => navigate(`/categorie/${cat.id}`)} />
          
            </motion.div>
        )}
        </motion.div>
      }
    </div>);

}