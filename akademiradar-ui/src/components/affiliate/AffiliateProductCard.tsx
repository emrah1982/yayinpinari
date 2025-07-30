import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Box, Rating, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 350,
  margin: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const DiscountBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: theme.palette.error.main,
  color: theme.palette.error.contrastText,
  fontWeight: 'bold',
}));

interface AffiliateProductCardProps {
  product: {
    asin: string;
    title: string;
    price: string;
    listPrice?: string;
    currency: string;
    imageUrl: string;
    rating?: number;
    reviewCount?: number;
    affiliateUrl: string;
    category?: string;
    inStock?: boolean;
  };
  showCategory?: boolean;
  showRating?: boolean;
}

const AffiliateProductCard: React.FC<AffiliateProductCardProps> = ({
  product,
  showCategory = true,
  showRating = true,
}) => {
  const hasDiscount = product.listPrice && parseFloat(product.listPrice) > parseFloat(product.price);
  const discountPercentage = hasDiscount
    ? Math.round(((parseFloat(product.listPrice!) - parseFloat(product.price)) / parseFloat(product.listPrice!)) * 100)
    : 0;

  return (
    <StyledCard elevation={3}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={product.imageUrl}
          alt={product.title}
          sx={{ objectFit: 'contain', p: 2, backgroundColor: '#f5f5f5' }}
        />
        {hasDiscount && (
          <DiscountBadge
            label={`%${discountPercentage} İndirim`}
            size="small"
          />
        )}
      </Box>
      <CardContent>
        {showCategory && product.category && (
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {product.category}
          </Typography>
        )}
        <Typography variant="h6" component="div" sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '3.6em',
          mb: 1
        }}>
          {product.title}
        </Typography>
        
        {showRating && product.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              name="read-only"
              value={product.rating}
              precision={0.5}
              readOnly
              size="small"
            />
            {product.reviewCount && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({product.reviewCount})
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="h6" color="primary" component="span" sx={{ fontWeight: 'bold' }}>
            {product.price} {product.currency}
          </Typography>
          {hasDiscount && (
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ textDecoration: 'line-through', ml: 1 }}
            >
              {product.listPrice} {product.currency}
            </Typography>
          )}
        </Box>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          endIcon={<OpenInNewIcon />}
          startIcon={<LocalOfferIcon />}
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ mt: 2 }}
        >
          Amazon'da Görüntüle
        </Button>
      </CardContent>
    </StyledCard>
  );
};

export default AffiliateProductCard;
