import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    Card,
    CardContent,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Close as CloseIcon,
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    Timeline as TimelineIcon,
    Assessment as AssessmentIcon,
    Info as InfoIcon,
    Person as PersonIcon,
    Link as LinkIcon,
    MenuBook as BookIcon,
    Business as BusinessIcon,
    Public as PublicIcon,
    LockOpen as OpenAccessIcon,
    OpenInNew as OpenInNewIcon,
    Timeline,
    MenuBook
} from '@mui/icons-material';
import { CitationInfo } from '../types';

interface CitationModalProps {
    open: boolean;
    onClose: () => void;
    citationInfo: CitationInfo | null;
    publicationTitle: string;
}

/**
 * Citation Modal Component
 * Yayının detaylı atıf bilgilerini modal içinde gösterir
 */
const CitationModal: React.FC<CitationModalProps> = ({
    open,
    onClose,
    citationInfo,
    publicationTitle
}) => {
    if (!citationInfo) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">📊 Atıf Bilgisi</Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Bu yayın için atıf bilgisi bulunamadı.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Kapat</Button>
                </DialogActions>
            </Dialog>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            📊 Detaylı Atıf Bilgisi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {publicationTitle}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Ana Atıf Metrikleri */}
                    <Grid item xs={12}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    🎯 Ana Metrikler
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center" p={2}>
                                            <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="h4" color="primary">
                                                {citationInfo.citationCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Toplam Atıf
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box textAlign="center" p={2}>
                                            <SchoolIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="h4" color="secondary">
                                                {citationInfo.hIndex}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                H-Index
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    {citationInfo.details?.influentialCitationCount && (
                                        <Grid item xs={6} sm={3}>
                                            <Box textAlign="center" p={2}>
                                                <AssessmentIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography variant="h4" color="success.main">
                                                    {citationInfo.details.influentialCitationCount}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Etkili Atıf
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                    {citationInfo.details?.citationVelocity && (
                                        <Grid item xs={6} sm={3}>
                                            <Box textAlign="center" p={2}>
                                                <TimelineIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                                                <Typography variant="h4" color="warning.main">
                                                    {citationInfo.details.citationVelocity}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Atıf Hızı (Yıllık)
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Detaylı İstatistikler */}
                    {citationInfo.details && (
                        <Grid item xs={12} md={6}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        📈 Detaylı İstatistikler
                                    </Typography>
                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Son Dönem Atıfları
                                        </Typography>
                                        <Typography variant="h6">
                                            {citationInfo.details.recentCitations || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box mb={2}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Öz Atıflar
                                        </Typography>
                                        <Typography variant="h6">
                                            {citationInfo.details.selfCitations || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Box>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Son Güncelleme
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatDate(citationInfo.lastUpdated)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Veri Kaynakları */}
                    <Grid item xs={12} md={6}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    🔍 Veri Kaynakları
                                </Typography>
                                <Box mb={2}>
                                    {citationInfo.sources.map((source, index) => (
                                        <Chip
                                            key={index}
                                            label={source}
                                            variant="outlined"
                                            color="primary"
                                            sx={{ mr: 1, mb: 1 }}
                                            icon={<InfoIcon />}
                                        />
                                    ))}
                                </Box>
                                {citationInfo.primarySource && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Birincil Kaynak
                                        </Typography>
                                        <Chip
                                            label={citationInfo.primarySource}
                                            color="secondary"
                                            variant="filled"
                                        />
                                    </>
                                )}
                                {citationInfo.isMockData && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Box 
                                            sx={{ 
                                                bgcolor: 'warning.light', 
                                                p: 2, 
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'warning.main'
                                            }}
                                        >
                                            <Typography variant="body2" color="warning.dark">
                                                ⚠️ Bu veriler test amaçlı mock data'dır
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Kimlik Bilgileri */}
                    {citationInfo.details?.identifiers && (
                        <Grid item xs={12} md={6}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        🔗 Kimlik Bilgileri
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {citationInfo.details.identifiers.doi && (
                                            <Grid item xs={12}>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <LinkIcon color="primary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">DOI:</Typography>
                                                    <Button
                                                        href={`https://doi.org/${citationInfo.details.identifiers.doi}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ 
                                                            ml: 1, 
                                                            fontFamily: 'monospace',
                                                            textTransform: 'none',
                                                            fontSize: '0.75rem'
                                                        }}
                                                        endIcon={<OpenInNewIcon />}
                                                    >
                                                        {citationInfo.details.identifiers.doi}
                                                    </Button>
                                                </Box>
                                            </Grid>
                                        )}
                                        {citationInfo.details.identifiers.issn && citationInfo.details.identifiers.issn.length > 0 && (
                                            <Grid item xs={12}>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <BookIcon color="secondary" sx={{ mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">ISSN:</Typography>
                                                    <Box sx={{ ml: 1 }}>
                                                        {citationInfo.details.identifiers.issn.map((issn, idx) => (
                                                            <Chip key={idx} label={issn} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        )}
                                        {citationInfo.details.identifiers.isbn && citationInfo.details.identifiers.isbn.length > 0 && (
                                            <Grid item xs={12}>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <MenuBook color="info" sx={{ mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">ISBN:</Typography>
                                                    <Box sx={{ ml: 1 }}>
                                                        {citationInfo.details.identifiers.isbn.map((isbn, idx) => (
                                                            <Chip key={idx} label={isbn} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        )}
                                        {citationInfo.details.identifiers.pmid && (
                                            <Grid item xs={12}>
                                                <Box display="flex" alignItems="center" mb={1}>
                                                    <PublicIcon color="success" sx={{ mr: 1 }} />
                                                    <Typography variant="body2" color="text.secondary">PMID:</Typography>
                                                    <Typography variant="body2" sx={{ ml: 1, fontFamily: 'monospace' }}>
                                                        {citationInfo.details.identifiers.pmid}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Yayın Bilgileri */}
                    {(citationInfo.details?.journal || citationInfo.details?.publisher || citationInfo.details?.isOpenAccess) && (
                        <Grid item xs={12} md={6}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        📚 Yayın Bilgileri
                                    </Typography>
                                    {citationInfo.details.journal && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <BusinessIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">Dergi:</Typography>
                                            <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                                                {citationInfo.details.journal}
                                            </Typography>
                                        </Box>
                                    )}
                                    {citationInfo.details.publisher && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">Yayıncı:</Typography>
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {citationInfo.details.publisher}
                                            </Typography>
                                        </Box>
                                    )}
                                    {citationInfo.details.publishedDate && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Timeline color="info" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">Yayın Tarihi:</Typography>
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                {Array.isArray(citationInfo.details.publishedDate) 
                                                    ? citationInfo.details.publishedDate.join('-')
                                                    : citationInfo.details.publishedDate}
                                            </Typography>
                                        </Box>
                                    )}
                                    {citationInfo.details.isOpenAccess && (
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <OpenAccessIcon color="success" sx={{ mr: 1 }} />
                                            <Chip label="Açık Erişim" color="success" size="small" />
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Detaylı Yazar Bilgileri */}
                    {citationInfo.details?.authorDetails && citationInfo.details.authorDetails.length > 0 && (
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        👥 Detaylı Yazar Bilgileri
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {citationInfo.details.authorDetails.slice(0, 6).map((author, idx) => (
                                            <Grid item xs={12} md={6} key={idx}>
                                                <Card variant="outlined" sx={{ p: 2 }}>
                                                    <Box display="flex" alignItems="center" mb={1}>
                                                        <PersonIcon color="primary" sx={{ mr: 1 }} />
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {author.name}
                                                        </Typography>
                                                    </Box>
                                                    {author.orcid && (
                                                        <Box display="flex" alignItems="center" mb={0.5}>
                                                            <LinkIcon color="success" sx={{ mr: 1, fontSize: 16 }} />
                                                            <Typography variant="caption" color="text.secondary">ORCID:</Typography>
                                                            <Button
                                                                href={`https://orcid.org/${author.orcid}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ 
                                                                    ml: 0.5, 
                                                                    fontFamily: 'monospace',
                                                                    textTransform: 'none',
                                                                    fontSize: '0.65rem',
                                                                    minHeight: '20px',
                                                                    py: 0.25
                                                                }}
                                                                endIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                                                            >
                                                                {author.orcid}
                                                            </Button>
                                                        </Box>
                                                    )}
                                                    {author.hIndex && (
                                                        <Box display="flex" alignItems="center" mb={0.5}>
                                                            <SchoolIcon color="secondary" sx={{ mr: 1, fontSize: 16 }} />
                                                            <Typography variant="caption" color="text.secondary">H-Index:</Typography>
                                                            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                                                                {author.hIndex}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {author.affiliations && author.affiliations.length > 0 && (
                                                        <Box mt={1}>
                                                            <Typography variant="caption" color="text.secondary">Bağlılık:</Typography>
                                                            <Box sx={{ mt: 0.5 }}>
                                                                {author.affiliations.slice(0, 2).map((aff, affIdx) => (
                                                                    <Chip 
                                                                        key={affIdx} 
                                                                        label={aff.name} 
                                                                        size="small" 
                                                                        variant="outlined"
                                                                        sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    )}
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {citationInfo.details.authorDetails.length > 6 && (
                                        <Box mt={2} textAlign="center">
                                            <Typography variant="body2" color="text.secondary">
                                                ... ve {citationInfo.details.authorDetails.length - 6} yazar daha
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}

                    {/* Yazar Bilgisi */}
                    <Grid item xs={12}>
                        <Card elevation={2}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    👤 Yazar Bilgisi
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Yazar:</strong> {citationInfo.author}
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    <strong>Başlık:</strong> {citationInfo.title}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </DialogContent>
            
            <DialogActions>
                <Tooltip title="Modalı kapat">
                    <Button onClick={onClose} variant="contained" color="primary">
                        Kapat
                    </Button>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};

export default CitationModal;
