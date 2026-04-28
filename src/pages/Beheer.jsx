import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CategoriesBeheer from '@/components/beheer/CategoriesBeheer';
import ProductenBeheer from '@/components/beheer/ProductenBeheer';
import StappenBeheer from '@/components/beheer/StappenBeheer';
import { ShieldAlert } from 'lucide-react';

export default function Beheer() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAdmin = user?.role === 'admin';
  const isTeamleider = user?.role === 'teamleider' || isAdmin;

  if (!isTeamleider) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
        <ShieldAlert className="w-12 h-12 opacity-30" />
        <p className="text-lg font-medium">{language === 'nl' ? 'Geen toegang' : language === 'fr' ? 'Pas d\'accès' : 'No access'}</p>
        <p className="text-sm">{language === 'nl' ? 'Deze pagina is alleen voor admins en teamleiders.' : language === 'fr' ? 'Cette page est réservée aux administrateurs et aux chefs d\'équipe.' : 'This page is for admins and team leaders only.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{language === 'nl' ? 'Beheer' : language === 'fr' ? 'Gestion' : 'Management'}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{language === 'nl' ? 'Beheer categorieën, producten en instructievideo\'s.' : language === 'fr' ? 'Gérez les catégories, les produits et les vidéos d\'instruction.' : 'Manage categories, products and instruction videos.'}</p>
      </div>

      <Tabs defaultValue="categorieen">
        <TabsList className="mb-6 w-full grid grid-cols-2 sm:flex sm:w-auto h-auto sm:h-10">
          {isAdmin && <TabsTrigger value="categorieen" className="text-xs sm:text-sm">{language === 'nl' ? 'Categorieën' : language === 'fr' ? 'Catégories' : 'Categories'}</TabsTrigger>}
          <TabsTrigger value="producten" className="text-xs sm:text-sm">{language === 'nl' ? 'Producten' : language === 'fr' ? 'Produits' : 'Products'}</TabsTrigger>
          <TabsTrigger value="stappen" className="text-xs sm:text-sm">{language === 'nl' ? 'Stappen & Video\'s' : language === 'fr' ? 'Étapes & Vidéos' : 'Steps & Videos'}</TabsTrigger>
        </TabsList>
        {isAdmin && (
          <TabsContent value="categorieen">
            <CategoriesBeheer />
          </TabsContent>
        )}
        <TabsContent value="producten">
          <ProductenBeheer isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="stappen">
          <StappenBeheer isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}