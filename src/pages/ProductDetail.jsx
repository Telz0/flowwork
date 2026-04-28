import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StepVideoCard from '@/components/StepVideoCard';
import { ChevronLeft, Loader2, Film, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then((r) => r[0]),
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['steps', productId],
    queryFn: () => base44.entities.ProductionStep.filter({ product_id: productId }, 'step_number'),
  });

  const { data: category } = useQuery({
    queryKey: ['category', product?.category_id],
    queryFn: () => base44.entities.Category.filter({ id: product?.category_id }).then((r) => r[0]),
    enabled: !!product?.category_id,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">
          Categorieën
        </button>
        <ChevronRight className="w-3 h-3" />
        <button
          onClick={() => navigate(`/categorie/${product?.category_id}`)}
          className="hover:text-foreground transition-colors"
        >
          {category?.name || '...'}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{product?.name || '...'}</span>
      </div>

      <Button
        variant="ghost"
        onClick={() => navigate(`/categorie/${product?.category_id}`)}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Terug naar producten
      </Button>

      {/* Product header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{product?.name}</h1>
        {product?.description && (
          <p className="text-muted-foreground mt-2">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sm font-semibold text-primary bg-accent px-3 py-1 rounded-full">
            {steps.length} productiestap{steps.length !== 1 ? 'pen' : ''}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-3">
          <Film className="w-12 h-12 opacity-30" />
          <p className="text-lg font-medium">Geen stappen beschikbaar</p>
          <p className="text-sm">Vraag een teamleider om stappen en video's toe te voegen.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {steps.map((step) => (
              <StepVideoCard
                key={step.id}
                step={step}
                isActive={false}
                onClick={() => navigate(`/product/${productId}/stap/${step.id}`)}
              />
          ))}
        </motion.div>
      )}
    </div>
  );
}