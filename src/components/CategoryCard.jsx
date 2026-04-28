import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getTranslated } from '@/lib/getTranslated';

export default function CategoryCard({ category, productCount, onClick }) {
  const { language } = useLanguage();
  const colors = [
    { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-500', text: 'text-blue-700', count: 'text-blue-500' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-500', text: 'text-emerald-700', count: 'text-emerald-500' },
    { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-500', text: 'text-violet-700', count: 'text-violet-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-500', text: 'text-amber-700', count: 'text-amber-500' },
    { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-500', text: 'text-rose-700', count: 'text-rose-500' },
    { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'bg-cyan-500', text: 'text-cyan-700', count: 'text-cyan-500' },
  ];
  const translatedName = getTranslated(category, 'name', language);
  const colorIndex = Math.abs((translatedName || '').charCodeAt(0) || 0) % colors.length;
  const c = colors[colorIndex];

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 ${c.bg} ${c.border} transition-all duration-200 shadow-sm hover:shadow-md group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center text-2xl mb-3 shadow-sm`}>
            {category.icon || '📦'}
          </div>
          <h3 className={`font-bold text-lg ${c.text} truncate`}>{translatedName}</h3>
          {getTranslated(category, 'description', language) && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{getTranslated(category, 'description', language)}</p>
          )}
          <p className={`text-xs font-semibold mt-2 ${c.count}`}>{productCount} product{productCount !== 1 ? 'en' : ''}</p>
        </div>
        <ChevronRight className={`w-5 h-5 ${c.text} opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0`} />
      </div>
    </motion.button>
  );
}