import { useState, useCallback, KeyboardEvent, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    MenuItem,
    FormControl,
    Chip,
    Link,
    CircularProgress,
    Alert,
    FormGroup,
    FormControlLabel,
    Checkbox,
    InputLabel,
    Select,
    OutlinedInput,
    ListItemText,
    Pagination,
    Stack,
    Paper,
    Divider,
    IconButton,
    Tooltip,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ViewListIcon from '@mui/icons-material/ViewList';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { addSearchHistory } from '../store/historySlice';
import { academicSearchService, citationService } from '../services/api';
import { SearchHistory, CitationInfo } from '../types';
import CitationInfoComponent from './CitationInfo';
import CitationModal from './CitationModal';
import PDFModal from './PDFModal'; // YENİ: PDF Modal import

type SuccessResult = {
    id: string;
    title: string;
    authors?: string[];
    abstract?: string;
    summary?: string;
    published?: string;
    doi?: string;
    url?: string;
    source: string;
    citationInfo?: CitationInfo;
    isOpenAccess?: boolean;
};

export type ErrorResult = {
    source: string;
    error: string;
};

export type SearchResult = SuccessResult | ErrorResult;

const HomePage = () => {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    // Sayfalama için state'ler
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    // API tabanlı sayfa kontrolü için state'ler
    const [apiPage, setApiPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [filters, setFilters] = useState({
        type: [] as string[],
        category: 'Makale',
        authorName: '',
        orcid: '',
    });
    
    // Available services mapping
    const serviceOptions = {
        'makale': ['arxiv', 'core', 'pubmed'],
        'arastirma': ['arxiv', 'core', 'openlibrary', 'loc'],
        'kimyasal': ['pubchem'],
        'all': ['arxiv', 'openlibrary', 'pubchem', 'loc', 'core', 'pubmed']
    };

    // Tip seçenekleri
    const typeOptions = [
        { value: 'makale', label: 'Makale' },
        { value: 'arastirma', label: 'Araştırma' },
        { value: 'kimyasal', label: 'Kimyasal' }
    ];
    
    const [loading, setLoading] = useState(false);
    const [searchCompleted, setSearchCompleted] = useState(false);
    const [citationsLoading, setCitationsLoading] = useState(false);
    const [citationsLoaded, setCitationsLoaded] = useState(false);
    
    // Citation modal states
    const [citationModalOpen, setCitationModalOpen] = useState(false);
    const [selectedCitationInfo, setSelectedCitationInfo] = useState<CitationInfo | null>(null);
    const [selectedPublicationTitle, setSelectedPublicationTitle] = useState('');

    // PDF Modal states - YENİ
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
    const [selectedPdfTitle, setSelectedPdfTitle] = useState('');
    const [selectedPdfAuthors, setSelectedPdfAuthors] = useState<string[]>([]);
    const [selectedPdfAbstract, setSelectedPdfAbstract] = useState('');
    const [selectedPdfDoi, setSelectedPdfDoi] = useState('');
    const [selectedPdfPublished, setSelectedPdfPublished] = useState('');

    // Get selected services based on selected types
    const getSelectedServices = () => {
        if (filters.type.length === 0) {
            return serviceOptions.all;
        }
        
        const services = new Set<string>();
        filters.type.forEach(type => {
            const typeServices = serviceOptions[type as keyof typeof serviceOptions] || [];
            typeServices.forEach(service => services.add(service));
        });
        
        return Array.from(services);
    };
    
    // Sayfalama için yardımcı fonksiyonlar
    const getTotalPages = () => {
        return Math.ceil(searchResults.length / itemsPerPage);
    };
    
    const getCurrentPageResults = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return searchResults.slice(startIndex, endIndex);
    };

    // PDF URL kontrolü - YENİ
    const isPdfUrl = (url: string): boolean => {
        return url.toLowerCase().includes('.pdf') || 
               url.toLowerCase().includes('pdf') ||
               url.includes('application/pdf') ||
               url.includes('filetype:pdf');
    };

    // PDF Modal handlers - YENİ
    const handleOpenPdfModal = useCallback((result: SuccessResult) => {
        setSelectedPdfUrl(result.url || '');
        setSelectedPdfTitle(result.title);
        setSelectedPdfAuthors(Array.isArray(result.authors) ? result.authors : result.authors ? [result.authors] : []);
        setSelectedPdfAbstract(result.abstract || '');
        setSelectedPdfDoi(result.doi || '');
        setSelectedPdfPublished(result.published || '');
        setPdfModalOpen(true);
    }, []);

    const handleClosePdfModal = useCallback(() => {
        setPdfModalOpen(false);
        setSelectedPdfUrl('');
        setSelectedPdfTitle('');
        setSelectedPdfAuthors([]);
        setSelectedPdfAbstract('');
        setSelectedPdfDoi('');
        setSelectedPdfPublished('');
    }, []);

    // Debug için state'i izleyin
    useEffect(() => {
        console.log('SearchResults updated:', searchResults);
        console.log('SearchResults length:', searchResults.length);
    }, [searchResults]);

    // Arama işlemini gerçekleştiren ayrı fonksiyon
    const performSearch = async (pageNumber: number = 1, clearResults: boolean = false) => {
        try {
            if (clearResults || pageNumber === 1) {
                setSearchResults([]);
                setCitationsLoaded(false);
            }

            const selectedServices = getSelectedServices();
            console.log('Using services:', selectedServices);
            
            const eventSource = academicSearchService.search(
                searchQuery,
                selectedServices,
                pageNumber,
                10,
                (result) => {
                    console.log('SSE Result received:', result);

                    if (result.data && result.data.success && result.data.data) {
                        const serviceData = result.data.data;
                        let processedResults: SuccessResult[] = [];

                        // Arxiv ve Core: articles[]
                        if ('articles' in serviceData) {
                            processedResults = serviceData.articles.map((article: any, index: number) => ({
                                id: article.id || `arxiv_${Date.now()}_${index}`,
                                title: article.title || 'Başlık bulunamadı',
                                authors: article.authors || [],
                                abstract: article.abstract || article.summary || '',
                                published: article.published || article.updated || '',
                                url: article.link || article.url || '',
                                source: result.source
                            }));
                        }
                        // OpenLibrary, LOC, CORE: results[]
                        else if ('results' in serviceData) {
                            processedResults = serviceData.results.map((item: any, index: number) => ({
                                id: item.id || `result_${Date.now()}_${index}`,
                                title: item.title || item.originalTitle || 'Başlık bulunamadı',
                                authors: item.authors || item.contributor || item.creator || [],
                                published: item.publishYear?.toString() || item.date || '',
                                abstract: item.abstract || item.description || item.subject?.join(', ') || '',
                                url: item.url || item.link || '',
                                source: result.source
                            }));
                        }
                        // PubChem: compounds[]
                        else if ('compounds' in serviceData) {
                            processedResults = serviceData.compounds.map((compound: any, index: number) => ({
                                id: compound.cid?.toString() || `compound_${Date.now()}_${index}`,
                                title: compound.title || compound.name || 'Bileşik adı bulunamadı',
                                abstract: compound.description || compound.summary || '',
                                url: compound.url || '',
                                source: result.source
                            }));
                        }

                        if (processedResults.length > 0) {
                            if (clearResults || pageNumber === 1) {
                                setSearchResults(processedResults);
                            } else {
                                setSearchResults(prev => [...prev, ...processedResults]);
                            }
                        }
                    }
                    // Hatalı durumlar
                    else if (result.error || (result.data && !result.data.success)) {
                        let errorMessage = 'Bilinmeyen hata';

                        if (result.error) {
                            errorMessage = result.error;
                        } else if (result.data && result.data.error) {
                            if (typeof result.data.error === 'object' && result.data.error.message) {
                                errorMessage = result.data.error.message;

                                if (errorMessage.includes('404')) {
                                    errorMessage = `${result.source.toUpperCase()} servisi şu anda erişilebilir değil (404)`;
                                } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
                                    errorMessage = `${result.source.toUpperCase()} servisi için API anahtarı gerekli`;
                                } else if (errorMessage.includes('timeout')) {
                                    errorMessage = `${result.source.toUpperCase()} servisi zaman aşımına uğradı`;
                                } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
                                    errorMessage = `${result.source.toUpperCase()} servisine bağlanılamadı (Ağ hatası)`;
                                }
                            } else if (typeof result.data.error === 'string') {
                                errorMessage = result.data.error;
                            }
                        }

                        const errorResult = {
                            source: result.source,
                            error: errorMessage
                        };

                        if (clearResults || pageNumber === 1) {
                            setSearchResults(prev => prev.length === 0 ? [errorResult] : [...prev, errorResult]);
                        } else {
                            setSearchResults(prev => [...prev, errorResult]);
                        }
                    }
                },

                async () => {
                    console.log('Search completed');
                    setLoading(false);
                    setSearchCompleted(true);
                    
                    const searchHistoryItem: SearchHistory = {
                        id: `search_${Date.now()}`,
                        query: searchQuery,
                        type: filters.type.length > 0 ? filters.type.join(', ') : 'all',
                        timestamp: new Date().toISOString()
                    };
                    dispatch(addSearchHistory(searchHistoryItem));
                }
            );

            return () => eventSource?.close();
        } catch (error) {
            console.error('Search error:', error);
            setLoading(false);
            setSearchCompleted(true);
        }
    };

    // 🚀 Birleştirilmiş Sayfalama Yöneticisi
    const paginationManager = {
        // Frontend sayfalama işlemleri
        frontend: {
            changePage: (event: React.ChangeEvent<unknown>, value: number) => {
                setCurrentPage(value);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            changeItemsPerPage: (event: any) => {
                const newItemsPerPage = parseInt(event.target.value);
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
            }
        },
        
        // API sayfalama işlemleri
        api: {
            changePage: async (newApiPage: number) => {
                if (newApiPage < 1) return;
                setLoading(true);
                setApiPage(newApiPage);
                setCurrentPage(1);
                await performSearch(newApiPage, true);
            },
            goToFirst: async () => {
                await paginationManager.api.changePage(1);
            },
            goToLast: async () => {
                const estimatedLastPage = Math.max(1, apiPage + 5);
                await paginationManager.api.changePage(estimatedLastPage);
            },
            goToPrevious: async () => {
                await paginationManager.api.changePage(apiPage - 1);
            },
            goToNext: async () => {
                await paginationManager.api.changePage(apiPage + 1);
            }
        }
    };
    
    // Handle type selection changes for dropdown
    const handleTypeChange = (event: any) => {
        const value = event.target.value;
        setFilters({ ...filters, type: typeof value === 'string' ? value.split(',') : value });
    };

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        
        setLoading(true);
        setSearchCompleted(false);
        setCitationsLoading(false);
        setCitationsLoaded(false);
        setCurrentPage(1);
        setApiPage(1);
        
        await performSearch(1, true);
    }, [searchQuery, dispatch, filters.type]);

    // Arama sonuçlarını atıf bilgisi ile zenginleştir
    const enrichResultsWithCitations = useCallback(async () => {
        if (searchResults.length === 0) return;
        
        setCitationsLoading(true);
        console.log('Fetching citation info for results...');
        
        try {
            const successResults = searchResults.filter((result): result is SuccessResult => 
                !isError(result)
            );
            
            if (successResults.length === 0) {
                setCitationsLoading(false);
                return;
            }
            
            const publicationsForCitation = successResults.map(result => ({
                title: result.title,
                author: Array.isArray(result.authors) ? result.authors.join(', ') : result.authors,
                year: result.published ? new Date(result.published).getFullYear().toString() : undefined,
                doi: result.doi
            }));
            
            console.log('Calling backend citation API with:', publicationsForCitation.length, 'publications');
            const citationResponse = await citationService.getBatch(publicationsForCitation);
            
            if (citationResponse.success && citationResponse.results) {
                const enrichedResults = searchResults.map((result, index) => {
                    if (isError(result)) return result;
                    
                    const successIndex = searchResults.slice(0, index).filter(r => !isError(r)).length;
                    const citationData = citationResponse.results[successIndex];
                    
                    if (citationData && citationData.citationInfo) {
                        return {
                            ...result,
                            citationInfo: citationData.citationInfo
                        };
                    }
                    
                    return result;
                });
                
                setSearchResults(enrichedResults);
                console.log('Citation info added to results');
            }
        } catch (error) {
            console.error('Error fetching citation info:', error);
        } finally {
            setCitationsLoading(false);
            setCitationsLoaded(true);
        }
    }, [searchResults]);

    useEffect(() => {
        if (searchCompleted && !loading && searchResults.length > 0 && !citationsLoading && !citationsLoaded) {
            console.log('Fetching citation info after search completion...');
            enrichResultsWithCitations();
        }
    }, [searchCompleted, loading, searchResults.length, citationsLoading, citationsLoaded, enrichResultsWithCitations]);

    const handleKeyPress = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    // Citation modal handlers
    const handleOpenCitationModal = useCallback((citationInfo: CitationInfo, title: string) => {
        setSelectedCitationInfo(citationInfo);
        setSelectedPublicationTitle(title);
        setCitationModalOpen(true);
    }, []);

    const handleCloseCitationModal = useCallback(() => {
        setCitationModalOpen(false);
        setSelectedCitationInfo(null);
        setSelectedPublicationTitle('');
    }, []);

    const exampleTopics = [
        'Yapay Zeka',
        'Sürdürülebilir Tarım', 
        'Yenilenebilir Enerji',
        'Biyoteknoloji',
    ];

    // Hata durumu kontrolü için helper fonksiyon
    const isError = (res: SearchResult): res is ErrorResult => 'error' in res;

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 8 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Akademik Radar
                </Typography>
                <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
                    Bilimsel makaleler, araştırmalar ve kimyasal bileşikler için arama yapın
                </Typography>

                <Box sx={{ mt: 4, mb: 4 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                                <InputLabel>Tip</InputLabel>
                                <Select
                                    multiple
                                    value={filters.type}
                                    onChange={handleTypeChange}
                                    input={<OutlinedInput label="Tip" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => {
                                                const option = typeOptions.find(opt => opt.value === value);
                                                return (
                                                    <Chip key={value} label={option?.label || value} size="small" />
                                                );
                                            })}
                                        </Box>
                                    )}
                                >
                                    {typeOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Checkbox checked={filters.type.indexOf(option.value) > -1} />
                                            <ListItemText primary={option.label} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                                <TextField
                                    select
                                    label="Kategori"
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    variant="outlined"
                                >
                                    <MenuItem value="Makale">Makale</MenuItem>
                                    <MenuItem value="Tez">Tez</MenuItem>
                                    <MenuItem value="Konferans">Konferans</MenuItem>
                                </TextField>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="Yazar Adı"
                                value={filters.authorName}
                                onChange={(e) => setFilters({ ...filters, authorName: e.target.value })}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="ORCID"
                                value={filters.orcid}
                                onChange={(e) => setFilters({ ...filters, orcid: e.target.value })}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Arama"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            variant="outlined"
                            placeholder="Anahtar kelimeler..."
                        />
                        <Button
                            variant="contained"
                            onClick={handleSearch}
                            startIcon={<SearchIcon />}
                            sx={{ minWidth: 120 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Ara'}
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Örnek Konular:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {exampleTopics.map((topic) => (
                                <Button
                                    key={topic}
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        setSearchQuery(topic);
                                    }}
                                    sx={{ textTransform: 'none' }}
                                    disabled={loading}
                                >
                                    {topic}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Loading durumu */}
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Aranıyor...</Typography>
                    </Box>
                )}
                
                {/* Citation loading durumu */}
                {citationsLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <CircularProgress size={20} />
                        <Typography sx={{ ml: 2 }} variant="body2" color="text.secondary">
                            Atıf bilgileri yükleniyor...
                        </Typography>
                    </Box>
                )}

                {/* Debug bilgisi */}
                {process.env.NODE_ENV === 'development' && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Debug: {searchResults.length} sonuç bulundu. Loading: {loading.toString()}
                    </Alert>
                )}

                {/* API Sayfa Kontrolü */}
                {searchResults && searchResults.length > 0 && (
                    <Paper 
                        elevation={2}
                        sx={{ 
                            mb: 3,
                            borderRadius: 3,
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{ 
                                p: 2.5,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CloudDownloadIcon sx={{ fontSize: 28 }} />
                                    <Box>
                                        <Typography variant="h6" fontWeight="700">
                                            Araştırma sonuçları sayfası
                                        </Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                            Sonuçlar: Sayfa {apiPage} 
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title="İlk Sayfa">
                                        <span>
                                            <IconButton
                                                onClick={paginationManager.api.goToFirst}
                                                disabled={loading || apiPage === 1}
                                                sx={{ 
                                                    color: 'white',
                                                    bgcolor: 'rgba(255,255,255,0.15)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    '&:hover': { 
                                                        bgcolor: 'rgba(255,255,255,0.25)',
                                                        transform: 'scale(1.05)'
                                                    },
                                                    '&:disabled': { 
                                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                                        color: 'rgba(255,255,255,0.3)',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    },
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <FirstPageIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    
                                    <Tooltip title="Önceki Sayfa">
                                        <span>
                                            <IconButton
                                                onClick={paginationManager.api.goToPrevious}
                                                disabled={loading || apiPage === 1}
                                                sx={{ 
                                                    color: 'white',
                                                    bgcolor: 'rgba(255,255,255,0.15)',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    '&:hover': { 
                                                        bgcolor: 'rgba(255,255,255,0.25)',
                                                        transform: 'scale(1.05)'
                                                    },
                                                    '&:disabled': { 
                                                        bgcolor: 'rgba(255,255,255,0.05)', 
                                                        color: 'rgba(255,255,255,0.3)',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    },
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <NavigateBeforeIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    
                                    <Box 
                                        sx={{ 
                                            px: 4, 
                                            py: 1.5, 
                                            bgcolor: 'rgba(255,255,255,0.2)', 
                                            borderRadius: 2,
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            minWidth: 100,
                                            textAlign: 'center',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <Typography variant="h6" fontWeight="700">
                                            {apiPage}
                                        </Typography>
                                    </Box>
                                    
                                    <Tooltip title="Sonraki Sayfa">
                                        <IconButton
                                            onClick={paginationManager.api.goToNext}
                                            disabled={loading}
                                            sx={{ 
                                                color: 'white',
                                                bgcolor: 'rgba(255,255,255,0.15)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                '&:hover': { 
                                                    bgcolor: 'rgba(255,255,255,0.25)',
                                                    transform: 'scale(1.05)'
                                                },
                                                '&:disabled': { 
                                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                                    color: 'rgba(255,255,255,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <NavigateNextIcon />
                                        </IconButton>
                                    </Tooltip>
                                    
                                    <Tooltip title="Son Sayfa">
                                        <IconButton
                                            onClick={paginationManager.api.goToLast}
                                            disabled={loading}
                                            sx={{ 
                                                color: 'white',
                                                bgcolor: 'rgba(255,255,255,0.15)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                '&:hover': { 
                                                    bgcolor: 'rgba(255,255,255,0.25)',
                                                    transform: 'scale(1.05)'
                                                },
                                                '&:disabled': { 
                                                    bgcolor: 'rgba(255,255,255,0.05)', 
                                                    color: 'rgba(255,255,255,0.3)',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                },
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <LastPageIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                )}

                {/* Sonuç kartları */}
                <Grid container spacing={3}>
                    {searchResults && searchResults.length > 0 ? (
                        searchResults.map((result, index) => (
                            <Grid item xs={12} key={`${result.source}-${index}`}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h6" component="h3">
                                                {isError(result) ? 'Servis Hatası' : result.title}
                                            </Typography>
                                            <Chip
                                                label={result.source}
                                                size="small"
                                                color={isError(result) ? "error" : "primary"}
                                                variant="outlined"
                                            />
                                        </Box>

                                        {isError(result) ? (
                                            <Typography color="error" sx={{ mb: 2 }}>
                                                {result.error}
                                            </Typography>
                                        ) : (
                                            <>
                                                {result.authors && result.authors.length > 0 && (
                                                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                                                        {Array.isArray(result.authors) ? result.authors.join(', ') : result.authors}
                                                    </Typography>
                                                )}
                                                {result.abstract && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {result.abstract.substring(0, 300)}
                                                        {result.abstract.length > 300 ? '...' : ''}
                                                    </Typography>
                                                )}
                                                {result.summary && !result.abstract && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {result.summary.substring(0, 300)}
                                                        {result.summary.length > 300 ? '...' : ''}
                                                    </Typography>
                                                )}
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {result.published && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Published: {new Date(result.published).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                    {result.doi && (
                                                        <Link
                                                            href={`https://doi.org/${result.doi}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            underline="hover"
                                                        >
                                                            DOI: {result.doi}
                                                        </Link>
                                                    )}
                                                    {result.url && (
                                                        <>
                                                            {/* GÜNCELLENDİ: PDF kontrolü ile buton değişikliği */}
                                                            {isPdfUrl(result.url) ? (
                                                                <Button
                                                                    onClick={() => handleOpenPdfModal(result)}
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<PictureAsPdfIcon />}
                                                                    color="error"
                                                                >
                                                                    PDF Görüntüle
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    href={result.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    variant="outlined"
                                                                    size="small"
                                                                    endIcon={<OpenInNewIcon />}
                                                                >
                                                                    View Source
                                                                </Button>
                                                            )}

                                                            <Button
                                                                href={`/ai-summary?id=${encodeURIComponent(result.id)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                variant="outlined"
                                                                size="small"
                                                                endIcon={<OpenInNewIcon />}
                                                            >
                                                                AI Özet
                                                            </Button>
                                                            
                                                            {/* Atıf Bilgisi Butonu */}
                                                            <Button
                                                                onClick={() => {
                                                                    if (result.citationInfo) {
                                                                        handleOpenCitationModal(result.citationInfo, result.title);
                                                                    } else {
                                                                        const mockCitation: CitationInfo = {
                                                                            title: result.title,
                                                                            author: Array.isArray(result.authors) ? result.authors.join(', ') : result.authors || 'Bilinmeyen Yazar',
                                                                            citationCount: Math.floor(Math.random() * 300) + 20,
                                                                            hIndex: Math.floor(Math.random() * 15) + 3,
                                                                            sources: ['Akademik Veritabanı'],
                                                                            lastUpdated: new Date().toISOString(),
                                                                            details: {
                                                                                influentialCitationCount: Math.floor(Math.random() * 50) + 10,
                                                                                recentCitations: Math.floor(Math.random() * 30) + 5,
                                                                                selfCitations: Math.floor(Math.random() * 10) + 2,
                                                                                citationVelocity: Math.floor(Math.random() * 20) + 5
                                                                            },
                                                                            isMockData: true
                                                                        };
                                                                        handleOpenCitationModal(mockCitation, result.title);
                                                                    }
                                                                }}
                                                                variant="outlined"
                                                                size="small"
                                                                color="secondary"
                                                            >
                                                                📊 Atıf Bilgisi
                                                            </Button>
                                                            
                                                            {/* Açık Erişim Göstergesi */}
                                                            {(result.isOpenAccess || result.citationInfo?.details?.isOpenAccess) && (
                                                                <Box 
                                                                    sx={{ 
                                                                        display: 'inline-flex', 
                                                                        alignItems: 'center', 
                                                                        ml: 1, 
                                                                        px: 1.5, 
                                                                        py: 0.5, 
                                                                        bgcolor: 'success.light', 
                                                                        color: 'success.dark',
                                                                        borderRadius: 1,
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 'medium'
                                                                    }}
                                                                >
                                                                    🔓 Açık Erişim
                                                                </Box>
                                                            )}
                                                        </>
                                                    )}
                                                </Box>
                                                
                                                {/* Atıf bilgisi gösterimi */}
                                                <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                                                    {result.citationInfo ? (
                                                        <>
                                                            <Typography 
                                                                variant="body2" 
                                                                color={result.citationInfo.isMockData ? "error.main" : "success.main"} 
                                                                sx={{ mb: 1 }}
                                                            >
                                                                {result.citationInfo.isMockData 
                                                                    ? "❌ Atıf Bilgisi Mevcut Değil" 
                                                                    : "📊 Atıf Bilgisi Mevcut!"
                                                                }
                                                            </Typography>
                                                            <CitationInfoComponent 
                                                                citationInfo={result.citationInfo} 
                                                                compact={true} 
                                                            />
                                                        </>
                                                    ) : (
                                                        <Typography variant="body2" color="warning.main">
                                                            ⚠️ Atıf bilgisi yüklenemedi
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : searchCompleted && !loading ? (
                        <Grid item xs={12}>
                            <Typography variant="body1" color="text.secondary" align="center">
                                {searchQuery ? 'Arama sonucu bulunamadı.' : 'Arama yapmak için yukarıdaki kutucuğa anahtar kelimeler girin.'}
                            </Typography>
                        </Grid>
                    ) : null}
                </Grid>
            </Box>
            
            {/* Citation Modal */}
            <CitationModal
                open={citationModalOpen}
                onClose={handleCloseCitationModal}
                citationInfo={selectedCitationInfo}
                publicationTitle={selectedPublicationTitle}
            />

            {/* PDF Modal - YENİ */}
            <PDFModal
                open={pdfModalOpen}
                onClose={handleClosePdfModal}
                pdfUrl={selectedPdfUrl}
                title={selectedPdfTitle}
                authors={selectedPdfAuthors}
                abstract={selectedPdfAbstract}
                doi={selectedPdfDoi}
                published={selectedPdfPublished}
            />
        </Container>
    );
};

export default HomePage;