import { useLanguage } from '@/lib/LanguageContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  const languages = [
    { code: 'nl', name: '🇧🇪 Nederlands' },
    { code: 'fr', name: '🇫🇷 Français' },
    { code: 'en', name: '🇬🇧 English' },
  ];

  return (
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
  );
}