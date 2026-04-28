import { motion } from 'framer-motion';
import { Film, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';

export default function ProductCard({ product, stepCount, onClick }) {
  const { language } = useLanguage();
  const translatedName = getTranslated(product, 'name', language);
  const translatedDescription = getTranslated(product, 'description', language);
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
    >
      <div className="relative h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={translatedName} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Film className="w-10 h-10 opacity-40" />
            <span className="text-xs opacity-60">{language === 'nl' ? 'Geen afbeelding' : language === 'fr' ? 'Pas d\'image' : 'No image'}</span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow">
          {stepCount} {language === 'nl' ? `stap${stepCount !== 1 ? 'pen' : ''}` : language === 'fr' ? `étape${stepCount !== 1 ? 's' : ''}` : `step${stepCount !== 1 ? 's' : ''}`}
        </div>
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground truncate">{translatedName}</h3>
          {translatedDescription && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{translatedDescription}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </motion.button>
  );
}