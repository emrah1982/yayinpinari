import React from 'react';
import { Grid, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import AffiliateProductCard from './AffiliateProductCard';

// AffiliateProduct type'ını burada tanımlayalım (geçici çözüm)
interface AffiliateProduct {
  asin: string;
  title: string;
  price?: number;
  currency?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  affiliateUrl?: string;
}

interface AmazonAffiliateSectionProps {
  title?: string;
  products: AffiliateProduct[];
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  showHeader?: boolean;
  maxItems?: number;
  associateTag?: string; // Amazon affiliate tag için
}

const AmazonAffiliateSection: React.FC<AmazonAffiliateSectionProps> = ({
  title = 'Öne Çıkan Ürünler',
  products = [],
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  showHeader = true,
  maxItems = 4,
  associateTag = 'YOUR_ASSOCIATE_TAG', // Default değer
}) => {
  const theme = useTheme();
  const displayedProducts = maxItems ? products.slice(0, maxItems) : products;
  
  // Grid değerlerini doğru şekilde hesapla (Material-UI 12'lik sistem)
  const getGridSize = (columnCount: number): number => {
    return Math.floor(12 / columnCount);
  };

  if (products.length === 0) return null;

  return (
    <Box sx={{ my: 4 }}>
      {showHeader && (
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            position: 'relative',
            display: 'inline-block',
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '60px',
              height: '4px',
              backgroundColor: theme.palette.primary.main,
              borderRadius: '2px',
            }
          }}
        >
          {title}
        </Typography>
      )}
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {displayedProducts.map((product) => (
          <Grid 
            item 
            key={product.asin}
            xs={getGridSize(columns.xs || 1)}
            sm={getGridSize(columns.sm || 2)}
            md={getGridSize(columns.md || 3)}
            lg={getGridSize(columns.lg || 4)}
          >
            <AffiliateProductCard 
              product={{
                ...product,
                currency: product.currency || 'USD',
                affiliateUrl: `https://www.amazon.com/dp/${product.asin}?tag=${associateTag}`,
              } as any} 
            />
          </Grid>
        ))}
      </Grid>
      
      {maxItems && products.length > maxItems && (
        <Box textAlign="center" mt={3}>
          <Box
            component="a"
            href="/affiliate-marketing" 
            sx={{
              color: theme.palette.primary.main,
              textDecoration: 'none',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'opacity 0.2s',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              }
            }}
          >
            Tümünü Görüntüle
            <Box
              component="svg" 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              sx={{ ml: 0.5 }}
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AmazonAffiliateSection;