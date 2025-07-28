import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Chip,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    Article as ArticleIcon,
    TrendingUp as TrendingUpIcon,
    ExpandMore as ExpandMoreIcon,
    OpenInNew as OpenInNewIcon,
    Email as EmailIcon,
    Work as WorkIcon
} from '@mui/icons-material';

interface AuthorDetailsModalProps {
    open: boolean;
    onClose: () => void;
    authorData: {
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
    } | null;
    loading?: boolean;
}

const AuthorDetailsModal: React.FC<AuthorDetailsModalProps> = ({
    open,
    onClose,
    authorData,
    loading = false
}) => {
    const [expandedPublication, setExpandedPublication] = useState<string | false>(false);

    // Debug logging
    React.useEffect(() => {
        if (authorData) {
            console.log('🎭 AuthorDetailsModal received data:', authorData);
            console.log('👤 Author:', authorData.author);
            console.log('📚 Publications:', authorData.publications);
            console.log('📊 Metrics:', authorData.metrics);
            console.log('📝 Publications count:', authorData.publications?.length || 0);
        }
    }, [authorData]);

    // Show loading state when modal is open but no data yet
    if (open && loading && !authorData) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h5">Yazar Detayları Yükleniyor...</Typography>
                        <IconButton onClick={onClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <CircularProgress size={60} />
                        <Typography variant="h6" sx={{ ml: 2 }}>Veriler yükleniyor...</Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    if (!authorData) {
        console.log('⚠️ AuthorDetailsModal: No authorData provided');
        return null;
    }

    const { author, publications, metrics } = authorData;

    const handlePublicationExpand = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedPublication(isExpanded ? panel : false);
    };

    const formatDate = (dateObj: any) => {
        if (!dateObj) return 'Tarih belirtilmemiş';
        
        // Handle ORCID date structure
        if (dateObj.year) {
            const year = dateObj.year.value || dateObj.year;
            const month = dateObj.month?.value || dateObj.month;
            const day = dateObj.day?.value || dateObj.day;
            return `${year}${month ? `/${month}` : ''}${day ? `/${day}` : ''}`;
        }
        
        // Handle simple year value
        if (typeof dateObj === 'number' || typeof dateObj === 'string') {
            return dateObj.toString();
        }
        
        return 'Tarih belirtilmemiş';
    };

    const openDOI = (doi: string) => {
        window.open(`https://doi.org/${doi}`, '_blank');
    };

    const openURL = (url: string) => {
        window.open(url, '_blank');
    };

    const openORCID = () => {
        window.open(`https://orcid.org/${author.orcidId}`, '_blank');
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { maxHeight: '90vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <PersonIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5">
                                {author.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                ORCID: {author.orcidId}
                                <IconButton size="small" onClick={openORCID} sx={{ ml: 1 }}>
                                    <OpenInNewIcon fontSize="small" />
                                </IconButton>
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Author Info */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Yazar Bilgileri
                                </Typography>
                                
                                {author.biography && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Biyografi:
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {author.biography}
                                        </Typography>
                                    </Box>
                                )}

                                {author.emails && author.emails.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            <EmailIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                            E-posta:
                                        </Typography>
                                        {author.emails.map((email, idx) => (
                                            <Typography key={idx} variant="body2" color="text.secondary">
                                                {email}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}

                                {author.affiliations && author.affiliations.length > 0 && (
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            <SchoolIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                            Kurumlar:
                                        </Typography>
                                        <List dense>
                                            {author.affiliations.slice(0, 5).map((affiliation, idx) => (
                                                <ListItem key={idx} sx={{ px: 0 }}>
                                                    <ListItemIcon>
                                                        <WorkIcon fontSize="small" />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={affiliation.organization}
                                                        secondary={
                                                            affiliation.department || affiliation.role
                                                                ? `${affiliation.department || ''} ${affiliation.role || ''}`.trim()
                                                                : undefined
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}

                                <Chip
                                    label={`Toplam ${author.worksCount} çalışma`}
                                    color="primary"
                                    variant="outlined"
                                />
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Metrics */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Atıf İstatistikleri
                                </Typography>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="primary">
                                                {metrics.totalPublications}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Toplam Yayın
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="secondary">
                                                {metrics.totalCitations}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Toplam Atıf
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="success.main">
                                                {metrics.hIndex}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                H-Index
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" color="info.main">
                                                {metrics.averageCitationsPerPaper}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Ort. Atıf/Yayın
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                {metrics.mostCitedPaper && (
                                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            En Çok Atıf Alan Yayın:
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {metrics.mostCitedPaper.title}
                                        </Typography>
                                        <Chip
                                            label={`${metrics.mostCitedPaper.citations} atıf`}
                                            color="secondary"
                                            size="small"
                                        />
                                        {metrics.mostCitedPaper.doi && (
                                            <Button
                                                size="small"
                                                onClick={() => openDOI(metrics.mostCitedPaper!.doi)}
                                                sx={{ ml: 1 }}
                                            >
                                                DOI'yi Aç
                                            </Button>
                                        )}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        {/* Publications List */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <ArticleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Yayınlar ({publications.length})
                                </Typography>

                                {publications.length === 0 ? (
                                    <Alert severity="info">
                                        Bu yazar için yayın bilgisi bulunamadı.
                                    </Alert>
                                ) : (
                                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                                        {publications.map((publication, index) => (
                                            <Accordion
                                                key={index}
                                                expanded={expandedPublication === `panel${index}`}
                                                onChange={handlePublicationExpand(`panel${index}`)}
                                            >
                                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                    <Box sx={{ width: '100%' }}>
                                                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                                            {publication.title || 'Başlık belirtilmemiş'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                            {publication.journal && (
                                                                <Chip
                                                                    label={publication.journal}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            <Chip
                                                                label={`${publication.citationData?.citedByCount || 0} atıf`}
                                                                size="small"
                                                                color={(publication.citationData?.citedByCount || 0) > 0 ? 'secondary' : 'default'}
                                                            />
                                                            <Chip
                                                                label={formatDate(publication.publicationDate)}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    </Box>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Box>
                                                        {publication.journal && (
                                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                                <strong>Dergi:</strong> {publication.journal}
                                                            </Typography>
                                                        )}
                                                        
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Yayın Tarihi:</strong> {formatDate(publication.publicationDate)}
                                                        </Typography>

                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            <strong>Atıf Sayısı:</strong> {publication.citationData?.citedByCount || 0}
                                                        </Typography>

                                                        <Box sx={{ mt: 2 }}>
                                                            {publication.doi && (
                                                                <Box sx={{ mb: 2 }}>
                                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                                        <strong>DOI:</strong> {publication.doi}
                                                                    </Typography>
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        startIcon={<OpenInNewIcon />}
                                                                        onClick={() => openDOI(publication.doi!)}
                                                                        sx={{ mr: 1 }}
                                                                    >
                                                                        DOI ile Görüntüle
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                            
                                                            {publication.url && (
                                                                <Box sx={{ mb: 2 }}>
                                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                                        <strong>Yayın URL:</strong> 
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ mb: 1, wordBreak: 'break-all', color: 'text.secondary' }}>
                                                                        {publication.url}
                                                                    </Typography>
                                                                    <Button
                                                                        variant="outlined"
                                                                        size="small"
                                                                        startIcon={<OpenInNewIcon />}
                                                                        onClick={() => openURL(publication.url!)}
                                                                        sx={{ mr: 1 }}
                                                                    >
                                                                        URL ile Görüntüle
                                                                    </Button>
                                                                </Box>
                                                            )}
                                                            
                                                            {!publication.doi && !publication.url && (
                                                                <Alert severity="warning">
                                                                    Bu yayın için DOI veya URL bilgisi bulunmuyor.
                                                                </Alert>
                                                            )}
                                                        </Box>

                                                        {publication.citationData.error && (
                                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                                {publication.citationData.error}
                                                            </Alert>
                                                        )}
                                                    </Box>
                                                </AccordionDetails>
                                            </Accordion>
                                        ))}
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Kapat
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AuthorDetailsModal;
