import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

interface AffiliateProduct {
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
}

interface SearchResult {
  products: AffiliateProduct[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
}

const useAffiliateMarketing = (initialSearchTerm = '') => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult>({
    products: [],
    totalPages: 1,
    totalItems: 0,
    currentPage: 1,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);

  // Mock data for demonstration
  const mockProducts: AffiliateProduct[] = [
    {
      asin: 'B07PGLST36',
      title: 'Wireless Earbuds, Bluetooth 5.0 Headphones',
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

  const searchProducts = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would call your backend API
      // const response = await axios.get(`/api/affiliate/amazon/search`, {
      //   params: {
      //     keywords: searchQuery,
      //     page: pageNum
      //   }
      // });
      
      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Using mock data for now
      setSearchResults({
        products: mockProducts,
        totalPages: 5,
        totalItems: 25,
        currentPage: pageNum,
      });
    } catch (err) {
      console.error('Error searching products:', err);
      setError('Ürünler aranırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setPage(1);
    searchProducts(searchTerm, 1);
  }, [searchTerm, searchProducts]);

  const handlePageChange = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    searchProducts(searchTerm, value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, searchProducts]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // You could add category filtering here based on the selected tab
  }, []);

  // Load initial data if initialSearchTerm is provided
  useEffect(() => {
    if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      searchProducts(initialSearchTerm, 1);
    }
  }, [initialSearchTerm, searchProducts]);

  return {
    searchTerm,
    setSearchTerm,
    isLoading,
    error,
    searchResults,
    activeTab,
    page,
    handleSearch,
    handlePageChange,
    handleTabChange,
  };
};

export default useAffiliateMarketing;
