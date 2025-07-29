import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Link,
    Chip,
    Divider,
    IconButton,
    Snackbar,
    Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookIcon from '@mui/icons-material/Book';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import { addSimilarPublicationToTracking } from '../utils/viewedDocumentsUtils';
import { 
    ScoredSimilarPublication, 
    rankSimilarPublications, 
    getScoreDescription 
} from '../utils/similarityAlgorithm';

interface SimilarPublication {
    key: string;
    title: string;
    authors?: string[];
    first_publish_year?: number;
    subject?: string[];
    publisher?: string[];
    isbn?: string[];
    cover_i?: number;
    edition_count?: number;
    language?: string[];
}

interface OpenLibrarySearchResponse {
    docs: SimilarPublication[];
    numFound: number;
}

interface SimilarPublicationsModalProps {
    open: boolean;
    onClose: () => void;
    publicationTitle: string;
    publicationAuthors?: string | string[];
    publicationAbstract?: string;
    publicationPublished?: string;
}

const SimilarPublicationsModal: React.FC<SimilarPublicationsModalProps> = ({
    open,
    onClose,
    publicationTitle,
    publicationAuthors,
    publicationAbstract,
    publicationPublished
}) => {
    const [similarPublications, setSimilarPublications] = useState<ScoredSimilarPublication[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Takip etme için state'ler
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    const searchSimilarPublications = async () => {
        if (!publicationTitle) return;

        setLoading(true);
        setError(null);
        
        try {
            // Başlıktan anahtar kelimeleri çıkar
            const keywords = publicationTitle
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(' ')
                .filter(word => word.length > 3)
                .slice(0, 3)
                .join(' ');

            const searchQuery = encodeURIComponent(keywords);
            const response = await fetch(
                `https://openlibrary.org/search.json?q=${searchQuery}&limit=10&fields=key,title,author_name,first_publish_year,subject,publisher,isbn,cover_i,edition_count,language`
            );

            if (!response.ok) {
                throw new Error('OpenLibrary API\'den veri alınamadı');
            }

            const data: OpenLibrarySearchResponse = await response.json();
            
            // Gelişmiş benzerlik algoritması ile skorla ve sırala
            const originalPublication = {
                title: publicationTitle,
                authors: publicationAuthors,
                abstract: publicationAbstract,
                published: publicationPublished
            };
            
            const scoredPublications = rankSimilarPublications(
                originalPublication,
                data.docs || [],
                0.05 // Minimum benzerlik skoru (5%)
            );
            
            setSimilarPublications(scoredPublications);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // Yayını takip listesine ekle
    const handleTrackPublication = (publication: SimilarPublication) => {
        const success = addSimilarPublicationToTracking(publication);
        
        if (success) {
            setSnackbarMessage(`"${publication.title}" takip listesine eklendi!`);
            setSnackbarSeverity('success');
        } else {
            setSnackbarMessage('Bu yayın zaten takip listesinde mevcut.');
            setSnackbarSeverity('error');
        }
        
        setSnackbarOpen(true);
    };

    // Snackbar'ı kapat
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    useEffect(() => {
        if (open && publicationTitle) {
            searchSimilarPublications();
        }
    }, [open, publicationTitle]);

    const getCoverImageUrl = (coverId: number) => {
        return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
    };

    const getOpenLibraryUrl = (key: string) => {
        return `https://openlibrary.org${key}`;
    };

    // WorldCat URL oluşturma fonksiyonu
    const getWorldCatUrl = (publication: SimilarPublication) => {
        // Öncelikle ISBN ile arama yapmayı dene
        if (publication.isbn && publication.isbn.length > 0) {
            const isbn = publication.isbn[0].replace(/[^0-9X]/g, ''); // Sadece rakam ve X
            return `https://search.worldcat.org/search?q=bn:${isbn}`;
        }
        
        // ISBN yoksa başlık ile arama yap
        if (publication.title) {
            const encodedTitle = encodeURIComponent(publication.title);
            const authorQuery = publication.authors && publication.authors.length > 0 
                ? `+au:${encodeURIComponent(publication.authors[0])}` 
                : '';
            return `https://search.worldcat.org/search?q=ti:${encodedTitle}${authorQuery}`;
        }
        
        return null;
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    maxHeight: '80vh'
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BookIcon color="primary" />
                    <Typography variant="h6">
                        Benzer Yayınlar (En fazla 10 tane)
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>"{publicationTitle}"</strong> başlıklı yayına benzer içerikler:
                </Typography>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                        <Typography sx={{ ml: 2 }}>Benzer yayınlar aranıyor...</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && similarPublications.length === 0 && (
                    <Alert severity="info">
                        Bu yayın için benzer içerik bulunamadı.
                    </Alert>
                )}

                {!loading && similarPublications.length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {similarPublications.map((publication, index) => (
                            <Card key={publication.key || index} variant="outlined">
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {publication.cover_i && (
                                            <Box sx={{ flexShrink: 0 }}>
                                                <img
                                                    src={getCoverImageUrl(publication.cover_i)}
                                                    alt={publication.title}
                                                    style={{
                                                        width: 60,
                                                        height: 80,
                                                        objectFit: 'cover',
                                                        borderRadius: 4
                                                    }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </Box>
                                        )}
                                        
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                <Typography 
                                                    variant="subtitle1" 
                                                    sx={{ 
                                                        fontWeight: 'medium',
                                                        flex: 1,
                                                        mr: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    {publication.title}
                                                </Typography>
                                                
                                                {/* Benzerlik Skoru */}
                                                <Tooltip
                                                    title={
                                                        <Box sx={{ p: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                                Detaylı Benzerlik Skoru:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                📝 Başlık: {Math.round(publication.scoreBreakdown.titleScore * 100)}% (Ağırlık: %40)
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                📚 Konu: {Math.round(publication.scoreBreakdown.subjectScore * 100)}% (Ağırlık: %35)
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                👥 Yazar: {Math.round(publication.scoreBreakdown.authorScore * 100)}% (Ağırlık: %15)
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                                📅 Yıl: {Math.round(publication.scoreBreakdown.yearScore * 100)}% (Ağırlık: %10)
                                                            </Typography>
                                                            <Divider sx={{ my: 1 }} />
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                🏆 Toplam: {Math.round(publication.scoreBreakdown.totalScore * 100)}%
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    arrow
                                                    placement="left"
                                                >
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        flexDirection: 'column', 
                                                        alignItems: 'center',
                                                        minWidth: 80,
                                                        cursor: 'help',
                                                        p: 0.5,
                                                        borderRadius: 1,
                                                        '&:hover': {
                                                            bgcolor: 'rgba(0,0,0,0.04)'
                                                        }
                                                    }}>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontWeight: 'bold',
                                                                color: getScoreDescription(publication.similarityScore).color,
                                                                fontSize: '1.1rem'
                                                            }}
                                                        >
                                                            {Math.round(publication.similarityScore * 100)}%
                                                        </Typography>
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                color: getScoreDescription(publication.similarityScore).color,
                                                                fontSize: '0.7rem',
                                                                textAlign: 'center',
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            {getScoreDescription(publication.similarityScore).text}
                                                        </Typography>
                                                    </Box>
                                                </Tooltip>
                                            </Box>

                                            {publication.authors && publication.authors.length > 0 && (
                                                <Typography 
                                                    variant="body2" 
                                                    color="text.secondary" 
                                                    sx={{ mb: 1 }}
                                                >
                                                    Yazar: {publication.authors.slice(0, 3).join(', ')}
                                                    {publication.authors.length > 3 && ' ve diğerleri'}
                                                </Typography>
                                            )}

                                            {/* Özet/Açıklama Bölümü */}
                                            {publication.subject && publication.subject.length > 0 && (
                                                <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                                                    <Typography 
                                                        variant="subtitle2" 
                                                        sx={{ 
                                                            fontWeight: 'medium',
                                                            mb: 1,
                                                            color: 'primary.main'
                                                        }}
                                                    >
                                                        📋 Özet Bilgiler:
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        color="text.secondary"
                                                        sx={{ 
                                                            lineHeight: 1.6,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        Bu yayın <strong>{publication.subject.slice(0, 5).join(', ')}</strong> konularını kapsamaktadır.
                                                        {publication.subject.length > 5 && ` ve ${publication.subject.length - 5} diğer konu alanı bulunmaktadır.`}
                                                        {publication.publisher && publication.publisher.length > 0 && (
                                                            <> Yayıncı: <strong>{publication.publisher[0]}</strong>.</>  
                                                        )}
                                                        {publication.edition_count && publication.edition_count > 1 && (
                                                            <> Bu eserin <strong>{publication.edition_count} farklı baskısı</strong> bulunmaktadır.</>  
                                                        )}
                                                    </Typography>
                                                    
                                                    {/* ISBN Bilgileri */}
                                                    {publication.isbn && publication.isbn.length > 0 && (
                                                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'grey.300' }}>
                                                            <Typography 
                                                                variant="subtitle2" 
                                                                sx={{ 
                                                                    fontWeight: 'medium',
                                                                    mb: 0.5,
                                                                    color: 'primary.main',
                                                                    fontSize: '0.8rem'
                                                                }}
                                                            >
                                                                📚 ISBN Bilgileri:
                                                            </Typography>
                                                            <Box sx={{ 
                                                                 display: 'grid', 
                                                                 gridTemplateColumns: 'repeat(4, 1fr)', 
                                                                 gap: 0.5, 
                                                                 alignItems: 'start',
                                                                 mt: 0.5
                                                             }}>
                                                                 {publication.isbn.map((isbn, index) => {
                                                                     const cleanIsbn = isbn.replace(/[^0-9X]/g, '');
                                                                     const isbnType = cleanIsbn.length === 13 ? 'ISBN-13' : cleanIsbn.length === 10 ? 'ISBN-10' : 'ISBN';
                                                                     
                                                                     const handleIsbnClick = () => {
                                                                         // Kütüphane arama sayfasına yönlendir ve ISBN'i localStorage'a kaydet
                                                                         localStorage.setItem('searchIsbn', cleanIsbn);
                                                                         window.open('/library-search', '_blank');
                                                                     };
                                                                     
                                                                     return (
                                                                         <Button
                                                                             key={index}
                                                                             onClick={handleIsbnClick}
                                                                             variant="outlined"
                                                                             size="small"
                                                                             sx={{
                                                                                 p: 0.5,
                                                                                 minWidth: 'auto',
                                                                                 bgcolor: 'grey.50',
                                                                                 borderRadius: 0.5,
                                                                                 border: '1px solid',
                                                                                 borderColor: 'primary.main',
                                                                                 textTransform: 'none',
                                                                                 fontSize: '0.65rem',
                                                                                 fontFamily: 'monospace',
                                                                                 color: 'primary.main',
                                                                                 '&:hover': {
                                                                                     bgcolor: 'primary.light',
                                                                                     color: 'white'
                                                                                 }
                                                                             }}
                                                                         >
                                                                             <Box sx={{ textAlign: 'center', wordBreak: 'break-all' }}>
                                                                                 <Typography 
                                                                                     variant="caption" 
                                                                                     sx={{ 
                                                                                         fontSize: '0.65rem',
                                                                                         fontFamily: 'monospace',
                                                                                         display: 'block',
                                                                                         lineHeight: 1.2
                                                                                     }}
                                                                                 >
                                                                                     <strong>{isbnType}:</strong>
                                                                                 </Typography>
                                                                                 <Typography 
                                                                                     variant="caption" 
                                                                                     sx={{ 
                                                                                         fontSize: '0.65rem',
                                                                                         fontFamily: 'monospace',
                                                                                         display: 'block',
                                                                                         lineHeight: 1.2
                                                                                     }}
                                                                                 >
                                                                                     {cleanIsbn}
                                                                                 </Typography>
                                                                             </Box>
                                                                         </Button>
                                                                     );
                                                                 }).slice(0, 8)}
                                                             </Box>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}

                                            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                {publication.first_publish_year && (
                                                    <Chip 
                                                        label={`${publication.first_publish_year}`} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                )}
                                                {publication.edition_count && (
                                                    <Chip 
                                                        label={`${publication.edition_count} baskı`} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                )}
                                                {publication.language && publication.language.length > 0 && (
                                                    <Chip 
                                                        label={publication.language[0].toUpperCase()} 
                                                        size="small" 
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>

                                            {publication.subject && publication.subject.length > 0 && (
                                                <Typography 
                                                    variant="caption" 
                                                    color="text.secondary"
                                                    sx={{ 
                                                        display: 'block',
                                                        mb: 1
                                                    }}
                                                >
                                                    Konular: {publication.subject.slice(0, 3).join(', ')}
                                                    {publication.subject.length > 3 && '...'}
                                                </Typography>
                                            )}

                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <Link
                                                    href={getOpenLibraryUrl(publication.key)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        gap: 0.5,
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    OpenLibrary'de Görüntüle
                                                    <OpenInNewIcon sx={{ fontSize: 16 }} />
                                                </Link>
                                                
                                                {(() => {
                                                    const worldCatUrl = getWorldCatUrl(publication);
                                                    return worldCatUrl && (
                                                        <Button
                                                            onClick={() => window.open(worldCatUrl, '_blank', 'noopener,noreferrer')}
                                                            variant="outlined"
                                                            size="small"
                                                            color="primary"
                                                            startIcon={<OpenInNewIcon />}
                                                            sx={{ 
                                                                fontSize: '0.75rem',
                                                                py: 0.5,
                                                                px: 1,
                                                                textTransform: 'none'
                                                            }}
                                                        >
                                                            Hangi Kütüphanede
                                                        </Button>
                                                    );
                                                })()}
                                                
                                                <Button
                                                    onClick={() => handleTrackPublication(publication)}
                                                    variant="contained"
                                                    size="small"
                                                    color="warning"
                                                    startIcon={<BookmarkAddIcon />}
                                                    sx={{ 
                                                        fontSize: '0.75rem',
                                                        py: 0.5,
                                                        px: 1
                                                    }}
                                                >
                                                    Takip Et
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="contained">
                    Kapat
                </Button>
            </DialogActions>
            
            {/* Takip etme bildirimleri için Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default SimilarPublicationsModal;
