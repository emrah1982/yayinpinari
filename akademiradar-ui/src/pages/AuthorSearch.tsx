import React, { useState } from 'react';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    Alert,
    CircularProgress,
    Avatar,
    Divider,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Article as ArticleIcon
} from '@mui/icons-material';
import AuthorDetailsModal from '../components/AuthorDetailsModal';
import { searchAuthors, getAuthorAnalysis } from '../services/api';

interface Author {
    orcidId: string;
    name: string;
    givenNames?: string;
    familyName?: string;
    institutionNames: string[];
    score: number;
}

interface AuthorAnalysis {
    author: {
        orcidId: string;
        name: string;
        biography?: string;
        emails: string[];
        affiliations: Array<{
            organization: string;
            department?: string;
            role?: string;
        }>;
        worksCount: number;
    };
    publications: Array<{
        title: string;
        journal?: string;
        doi?: string;
        url?: string;
        publicationDate?: any;
        citationData: {
            citedByCount: number;
            error?: string;
        };
    }>;
    metrics: {
        totalPublications: number;
        totalCitations: number;
        hIndex: number;
        averageCitationsPerPaper: number;
        mostCitedPaper?: {
            title: string;
            citations: number;
            doi: string;
        };
    };
}

const AuthorSearch: React.FC = () => {
    const [searchType, setSearchType] = useState<'name' | 'orcid'>('name');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [orcidId, setOrcidId] = useState('');
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAuthor, setSelectedAuthor] = useState<AuthorAnalysis | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    const handleSearch = async () => {
        // Validation based on search type
        if (searchType === 'name' && (!firstName.trim() || !lastName.trim())) {
            setError('Lütfen ad ve soyad alanlarını doldurun');
            return;
        }
        
        if (searchType === 'orcid' && !orcidId.trim()) {
            setError('Lütfen ORCID numarasını girin');
            return;
        }
        
        // Basic ORCID format validation
        if (searchType === 'orcid') {
            const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
            if (!orcidPattern.test(orcidId.trim())) {
                setError('Geçersiz ORCID formatı. Beklenen format: 0000-0000-0000-0000');
                return;
            }
        }

        setLoading(true);
        setError(null);
        setAuthors([]);

        try {
            console.log(`🔍 Starting ${searchType} search...`, 
                searchType === 'name' ? { firstName, lastName } : { orcidId }
            );
            
            let response;
            if (searchType === 'name') {
                response = await searchAuthors(firstName.trim(), lastName.trim());
            } else {
                response = await getAuthorAnalysis(orcidId.trim());
            }
            
            console.log('✅ Search response:', response);
            
            if (response.success) {
                if (searchType === 'name') {
                    setAuthors(response.authors);
                    console.log(`📊 Found ${response.authors.length} authors`);
                } else {
                    setSelectedAuthor(response);
                    setModalOpen(true); // Open the modal to show author details
                    console.log(`📊 Found author with ORCID ${orcidId}`);
                }
            } else {
                console.warn('⚠️ No authors in response');
                setAuthors([]);
            }
        } catch (error: any) {
            console.error('❌ Search failed:', error);
            if (error.response?.status === 404) {
                setError('Bu ORCID numarasına sahip yazar bulunamadı');
            } else {
                setError(error.response?.data?.message || 'Arama sırasında bir hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAuthorDetails = async (author: Author, event?: React.MouseEvent) => {
        // Prevent page reload
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('🔍 Getting author details for:', author.name, 'ORCID:', author.orcidId);
        
        // Reset previous state
        setSelectedAuthor(null);
        setError(null);
        setLoadingAnalysis(true);
        
        // Open modal immediately with loading state
        setModalOpen(true);

        try {
            console.log('📡 Calling getAuthorAnalysis API...');
            const response = await getAuthorAnalysis(author.orcidId);
            console.log('📊 API Response:', response);
            
            if (response.success) {
                console.log('✅ Analysis successful!');
                console.log('📚 Publications count:', response.publications?.length || 0);
                console.log('📈 Metrics:', response.metrics);
                setSelectedAuthor(response);
            } else {
                console.log('❌ Analysis failed:', response);
                setError('Yazar detayları alınırken bir hata oluştu');
                setSelectedAuthor(null);
            }
        } catch (err: any) {
            console.error('💥 Error in handleAuthorDetails:', err);
            console.error('Error details:', err.response?.data);
            setError(err.message || 'Yazar detayları alınırken bir hata oluştu');
            setSelectedAuthor(null);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Yazar Arama
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Akademik yazarları ad-soyad veya ORCID numarası ile arayın ve detaylı bilgilerini görüntüleyin.
                </Typography>
            </Box>

            {/* Search Form */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    {/* Search Type Selection */}
                    <Box sx={{ mb: 3 }}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Arama Türü</FormLabel>
                            <RadioGroup
                                row
                                value={searchType}
                                onChange={(e) => {
                                    setSearchType(e.target.value as 'name' | 'orcid');
                                    setError(null);
                                }}
                            >
                                <FormControlLabel
                                    value="name"
                                    control={<Radio disabled={loading} />}
                                    label="Ad-Soyad ile Ara"
                                    disabled={loading}
                                />
                                <FormControlLabel
                                    value="orcid"
                                    control={<Radio disabled={loading} />}
                                    label="ORCID Numarası ile Ara"
                                    disabled={loading}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    <Grid container spacing={3} alignItems="center">
                        {searchType === 'name' ? (
                            <>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Ad"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Örn: John"
                                        disabled={loading}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Soyad"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Örn: Smith"
                                        disabled={loading}
                                        required
                                    />
                                </Grid>
                            </>
                        ) : (
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="ORCID Numarası"
                                    value={orcidId}
                                    onChange={(e) => setOrcidId(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Örn: 0000-0002-0366-5396"
                                    disabled={loading}
                                    required
                                    helperText="Format: 0000-0000-0000-0000"
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={4}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? 'Aranıyor...' : 'Ara'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Results */}
            {authors.length > 0 && (
                <Box>
                    <Typography variant="h5" gutterBottom>
                        Arama Sonuçları ({authors.length} yazar bulundu)
                    </Typography>
                    <Grid container spacing={3}>
                        {authors.map((author, index) => (
                            <Grid item xs={12} md={6} key={author.orcidId || index}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                                <PersonIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" component="h3">
                                                    {author.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ORCID: {author.orcidId}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {author.institutionNames && author.institutionNames.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    <SchoolIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                                    Kurumlar:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {author.institutionNames.slice(0, 3).map((institution, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={institution}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    ))}
                                                    {author.institutionNames.length > 3 && (
                                                        <Chip
                                                            label={`+${author.institutionNames.length - 3} daha`}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip
                                                label={`Skor: ${author.score.toFixed(2)}`}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </CardContent>

                                    <Divider />

                                    <CardActions>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            startIcon={loadingAnalysis ? <CircularProgress size={16} /> : <ArticleIcon />}
                                            onClick={(event) => handleAuthorDetails(author, event)}
                                            disabled={loadingAnalysis}
                                        >
                                            {loadingAnalysis ? 'Yükleniyor...' : 'Detayları Görüntüle'}
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Author Details Modal */}
            <AuthorDetailsModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                authorData={selectedAuthor}
                loading={loadingAnalysis}
            />
        </Container>
    );
};

export default AuthorSearch;
