import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ProductCard from '@/components/ProductCard';
import { ChevronLeft, Loader2, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CategoryDetail() {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => base44.entities.Category.filter({ id: categoryId }).then((r) => r[0]),
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categoryId],
    queryFn: () => base44.entities.Product.filter({ category_id: categoryId, is_active: true }, 'order'),
  });

  const { data: allSteps = [] } = useQuery({
    queryKey: ['steps-all'],
    queryFn: () => base44.entities.ProductionStep.list(),
  });

  const stepCountForProduct = (productId) =>
    allSteps.filter((s) => s.product_id === productId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Terug naar categorieën
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          {category?.icon && (
            <span className="text-3xl">{category.icon}</span>
          )}
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            {category?.name || 'Categorie'}
          </h1>
        </div>
        {category?.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3">
          <PackageOpen className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">Geen producten in deze categorie</p>
          <p className="text-sm">Vraag een beheerder of teamleider om producten toe te voegen.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <ProductCard
                product={product}
                stepCount={stepCountForProduct(product.id)}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}