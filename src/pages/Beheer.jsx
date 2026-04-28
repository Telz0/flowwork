import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CategoriesBeheer from '@/components/beheer/CategoriesBeheer';
import ProductenBeheer from '@/components/beheer/ProductenBeheer';
import StappenBeheer from '@/components/beheer/StappenBeheer';
import { ShieldAlert } from 'lucide-react';

export default function Beheer() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeamleider = user?.role === 'teamleider' || isAdmin;

  if (!isTeamleider) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-4">
        <ShieldAlert className="w-12 h-12 opacity-30" />
        <p className="text-lg font-medium">Geen toegang</p>
        <p className="text-sm">Deze pagina is alleen voor admins en teamleiders.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Beheer</h1>
        <p className="text-muted-foreground mt-1">Beheer categorieën, producten en instructievideo's.</p>
      </div>

      <Tabs defaultValue="categorieen">
        <TabsList className="mb-6">
          {isAdmin && <TabsTrigger value="categorieen">Categorieën</TabsTrigger>}
          <TabsTrigger value="producten">Producten</TabsTrigger>
          <TabsTrigger value="stappen">Stappen & Video's</TabsTrigger>
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