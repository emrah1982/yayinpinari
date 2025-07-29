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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookIcon from '@mui/icons-material/Book';

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
}

const SimilarPublicationsModal: React.FC<SimilarPublicationsModalProps> = ({
    open,
    onClose,
    publicationTitle,
    publicationAuthors
}) => {
    const [similarPublications, setSimilarPublications] = useState<SimilarPublication[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            setSimilarPublications(data.docs || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
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
                        Benzer Yayınlar
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
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: 'medium',
                                                    mb: 1,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {publication.title}
                                            </Typography>

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

                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
        </Dialog>
    );
};

export default SimilarPublicationsModal;
