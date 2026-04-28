import { useLanguage } from '@/lib/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'nl', name: '🇳🇱 Nederlands' },
    { code: 'fr', name: '🇫🇷 Français' },
    { code: 'en', name: '🇬🇧 English' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-32 text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}