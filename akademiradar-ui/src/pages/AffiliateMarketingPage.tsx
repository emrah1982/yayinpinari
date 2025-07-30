import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  CircularProgress, 
  Paper,
  Tabs,
  Tab,
  Pagination,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AffiliateProductCard from '../components/affiliate/AffiliateProductCard';
import axios from 'axios';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`affiliate-tabpanel-${index}`}
      aria-labelledby={`affiliate-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AffiliateMarketingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Mock data for demonstration
  const mockProducts = [
    {
      asin: 'B07PGLST36',
      title: 'Wireless Earbuds, Bluetooth 5.0 Headphones with 4 Mics ENC Noise Cancelling',
      price: '59.99',
      listPrice: '79.99',
      currency: 'USD',
      imageUrl: 'https://m.media-amazon.com/images/I/61bwiPRcvbL._AC_UL320_.jpg',
      rating: 4.5,
      reviewCount: 12456,
      affiliateUrl: 'https://www.amazon.com/dp/B07PGLST36?tag=YOUR_ASSOCIATE_TAG',
      category: 'Electronics',
      inStock: true
    },
    // Add more mock products as needed
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, you would call your backend API
      // const response = await axios.get(`/api/affiliate/amazon/search?keywords=${encodeURIComponent(searchTerm)}&page=${page}`);
      // setProducts(response.data.data);
      // setTotalPages(response.data.pagination.totalPages);
      
      // Using mock data for now
      setProducts(mockProducts);
      setTotalPages(5);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // In a real implementation, you would fetch the new page of results
    // handleSearch(event as any);
  };

  // Load initial data
  useEffect(() => {
    setProducts(mockProducts);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Ürün İncelemeleri ve Tavsiyeler
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ürün, kategori veya marka ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size={isMobile ? 'medium' : 'large'}
                startIcon={<SearchIcon />}
                disabled={isLoading}
                sx={{ height: isMobile ? '40px' : '56px' }}
              >
                {isLoading ? 'Aranıyor...' : 'Ara'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="affiliate tabs"
        >
          <Tab label="Tüm Ürünler" />
          <Tab label="Elektronik" />
          <Tab label="Kitap" />
          <Tab label="Ev & Yaşam" />
          <Tab label="Moda" />
          <Tab label="Spor & Outdoor" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : products.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item key={product.asin} xs={12} sm={6} md={4} lg={3}>
                  <AffiliateProductCard product={product} />
                </Grid>
              ))}
            </Grid>
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? 'small' : 'large'}
              />
            </Box>
          </>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              Henüz ürün bulunamadı. Arama yaparak başlayın.
            </Typography>
          </Box>
        )}
      </TabPanel>

      {/* Other tab panels would go here */}
      {[1, 2, 3, 4, 5].map((index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          <Box textAlign="center" py={4}>
            <Typography variant="h6">
              Bu kategorideki ürünler yakında eklenecektir.
            </Typography>
          </Box>
        </TabPanel>
      ))}
    </Container>
  );
};

export default AffiliateMarketingPage;
