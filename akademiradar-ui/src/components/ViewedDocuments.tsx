import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tooltip,
    TablePagination,
    List,
    ListItem,
    ListItemText,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import PDFModal from './PDFModal';
import {
    Delete as DeleteIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Psychology as PsychologyIcon,
    Description as DescriptionIcon,
    Clear as ClearIcon,
    FileDownload as FileDownloadIcon,
    TableView as TableViewIcon,
    FormatQuote as FormatQuoteIcon,
    ContentCopy as ContentCopyIcon,
    GetApp as GetAppIcon
} from '@mui/icons-material';

interface ViewedDocument {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    doi: string;
    published: string;
    pdfUrl: string;
    viewedAt: string;
}

const ViewedDocuments: React.FC = () => {
    const [documents, setDocuments] = useState<ViewedDocument[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<ViewedDocument | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<ViewedDocument | null>(null);
    // PDF Modal states
    const [pdfModalOpen, setPdfModalOpen] = useState(false);
    const [selectedPdfDocument, setSelectedPdfDocument] = useState<ViewedDocument | null>(null);
    // Tablo sayfalama states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    // Kaynakça modal states
    const [bibliographyModalOpen, setBibliographyModalOpen] = useState(false);
    const [selectedCitationFormat, setSelectedCitationFormat] = useState<'APA' | 'MLA' | 'Chicago'>('APA');
    const [generatedBibliography, setGeneratedBibliography] = useState<string>('');

    // LocalStorage'dan belgeleri yükle
    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = () => {
        try {
            const storedDocs = localStorage.getItem('viewedDocuments');
            if (storedDocs) {
                const parsedDocs = JSON.parse(storedDocs);
                setDocuments(parsedDocs);
            }
        } catch (error) {
            console.error('Belgeleri yüklerken hata:', error);
        }
    };

    // Storage değişikliklerini dinle
    const handleStorageChange = () => {
        loadDocuments();
    };

    useEffect(() => {
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Belge detaylarını göster
    const handleShowDetails = (document: ViewedDocument) => {
        setSelectedDocument(document);
        setDetailModalOpen(true);
    };

    // PDF'i PDFModal ile aç
    const handleOpenPDF = (document: ViewedDocument) => {
        setSelectedPdfDocument(document);
        setPdfModalOpen(true);
    };
    
    // PDF Modal'i kapat
    const handleClosePdfModal = () => {
        setPdfModalOpen(false);
        setSelectedPdfDocument(null);
    };

    // AI Özet sayfasına git
    const handleAISummary = (document: ViewedDocument) => {
        const summaryUrl = `/ai-summary?title=${encodeURIComponent(document.title || '')}&url=${encodeURIComponent(document.pdfUrl)}`;
        window.open(summaryUrl, '_blank');
    };

    // Belgeyi sil
    const handleDeleteDocument = (document: ViewedDocument) => {
        setDocumentToDelete(document);
        setDeleteConfirmOpen(true);
    };

    // Silme işlemini onayla
    const confirmDelete = () => {
        if (documentToDelete) {
            const updatedDocs = documents.filter(doc => doc.id !== documentToDelete.id);
            setDocuments(updatedDocs);
            localStorage.setItem('viewedDocuments', JSON.stringify(updatedDocs));
            setDeleteConfirmOpen(false);
            setDocumentToDelete(null);
        }
    };

    // Tüm belgeleri temizle
    const handleClearAll = () => {
        setDocuments([]);
        localStorage.removeItem('viewedDocuments');
    };

    // CSV dışa aktarma (Excel alternatifi)
    const handleExportToExcel = () => {
        if (documents.length === 0) {
            alert('Dışa aktarılacak veri yok!');
            return;
        }

        // CSV için veri hazırla
        const csvHeaders = [
            'Sıra',
            'Başlık', 
            'Yazarlar',
            'Yayın Tarihi',
            'DOI',
            'Görüntülenme Tarihi',
            'PDF URL',
            'Özet'
        ];

        const csvData = documents.map((doc, index) => [
            index + 1,
            `"${(doc.title || '').replace(/"/g, '""')}"`,
            `"${doc.authors ? doc.authors.join(', ').replace(/"/g, '""') : ''}"`,
            doc.published || '',
            doc.doi || '',
            formatDate(doc.viewedAt),
            doc.pdfUrl || '',
            `"${(doc.abstract || '').replace(/"/g, '""')}"`
        ]);

        // CSV içeriği oluştur
        const csvContent = [
            csvHeaders.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        // BOM ekle (Türkçe karakterler için)
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Dosyayı indir
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName = `Görüntülenen_Belgeler_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Tablo sayfalama fonksiyonları
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Kaynakça oluşturma fonksiyonları
    const formatAuthorName = (authors: string[], format: 'APA' | 'MLA' | 'Chicago'): string => {
        if (!authors || authors.length === 0) return 'Yazar Belirtilmemiş';
        
        if (format === 'APA') {
            if (authors.length === 1) {
                const parts = authors[0].split(' ');
                if (parts.length >= 2) {
                    const lastName = parts[parts.length - 1];
                    const firstInitials = parts.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('. ');
                    return `${lastName}, ${firstInitials}.`;
                }
                return authors[0];
            } else if (authors.length === 2) {
                return `${formatSingleAuthor(authors[0])} & ${formatSingleAuthor(authors[1])}`;
            } else {
                return `${formatSingleAuthor(authors[0])} et al.`;
            }
        } else if (format === 'MLA') {
            if (authors.length === 1) {
                const parts = authors[0].split(' ');
                if (parts.length >= 2) {
                    const lastName = parts[parts.length - 1];
                    const firstName = parts.slice(0, -1).join(' ');
                    return `${lastName}, ${firstName}`;
                }
                return authors[0];
            } else if (authors.length === 2) {
                const first = formatSingleAuthorMLA(authors[0]);
                const second = authors[1];
                return `${first}, and ${second}`;
            } else {
                return `${formatSingleAuthorMLA(authors[0])}, et al.`;
            }
        } else { // Chicago
            if (authors.length === 1) {
                const parts = authors[0].split(' ');
                if (parts.length >= 2) {
                    const lastName = parts[parts.length - 1];
                    const firstName = parts.slice(0, -1).join(' ');
                    return `${lastName}, ${firstName}`;
                }
                return authors[0];
            } else if (authors.length === 2) {
                const first = formatSingleAuthorChicago(authors[0]);
                const second = authors[1];
                return `${first} and ${second}`;
            } else {
                return `${formatSingleAuthorChicago(authors[0])} et al.`;
            }
        }
    };

    const formatSingleAuthor = (author: string): string => {
        const parts = author.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstInitials = parts.slice(0, -1).map(name => name.charAt(0).toUpperCase()).join('. ');
            return `${lastName}, ${firstInitials}.`;
        }
        return author;
    };

    const formatSingleAuthorMLA = (author: string): string => {
        const parts = author.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            return `${lastName}, ${firstName}`;
        }
        return author;
    };

    const formatSingleAuthorChicago = (author: string): string => {
        const parts = author.split(' ');
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            return `${lastName}, ${firstName}`;
        }
        return author;
    };

    const generateCitation = (document: ViewedDocument, format: 'APA' | 'MLA' | 'Chicago'): string => {
        const authors = formatAuthorName(document.authors, format);
        const title = document.title || 'Başlık Belirtilmemiş';
        const year = document.published ? new Date(document.published).getFullYear().toString() : 'Tarih Belirtilmemiş';
        const doi = document.doi;
        const url = document.pdfUrl;
        
        if (format === 'APA') {
            let citation = `${authors} (${year}). ${title}.`;
            if (doi) {
                citation += ` https://doi.org/${doi}`;
            } else if (url) {
                citation += ` Erişim adresi: ${url}`;
            }
            return citation;
        } else if (format === 'MLA') {
            let citation = `${authors}. "${title}." ${year}.`;
            if (url) {
                citation += ` Web. ${new Date().toLocaleDateString('tr-TR')}.`;
            }
            return citation;
        } else { // Chicago
            let citation = `${authors}. "${title}." Erişim ${new Date().toLocaleDateString('tr-TR')}.`;
            if (doi) {
                citation += ` https://doi.org/${doi}.`;
            } else if (url) {
                citation += ` ${url}.`;
            }
            return citation;
        }
    };

    const handleGenerateBibliography = () => {
        if (documents.length === 0) {
            alert('Kaynakça oluşturmak için en az bir belge gerekli!');
            return;
        }

        const bibliography = documents
            .map(doc => generateCitation(doc, selectedCitationFormat))
            .sort() // Alfabetik sıralama
            .join('\n\n');
        
        setGeneratedBibliography(bibliography);
        setBibliographyModalOpen(true);
    };

    const copyBibliographyToClipboard = () => {
        navigator.clipboard.writeText(generatedBibliography).then(() => {
            alert('Kaynakça panoya kopyalandı!');
        }).catch(() => {
            alert('Kopyalama işlemi başarısız oldu.');
        });
    };

    const downloadBibliographyAsText = () => {
        const blob = new Blob([generatedBibliography], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const fileName = `Kaynakca_${selectedCitationFormat}_${new Date().toISOString().split('T')[0]}.txt`;
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Tarih formatla
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Başlık ve İstatistikler */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    📚 Görüntülenen Belgeler
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Takip ettiğiniz ve görüntülediğiniz PDF belgelerinin listesi
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                    <Chip 
                        label={`${documents.length} Belge`} 
                        color="primary" 
                        variant="outlined"
                        icon={<TableViewIcon />}
                    />
                    {documents.length > 0 && (
                        <>
                            <Button
                                startIcon={<FormatQuoteIcon />}
                                color="primary"
                                variant="contained"
                                size="small"
                                onClick={handleGenerateBibliography}
                            >
                                Kaynakça Oluştur
                            </Button>
                            <Button
                                startIcon={<FileDownloadIcon />}
                                color="success"
                                variant="contained"
                                size="small"
                                onClick={handleExportToExcel}
                            >
                                CSV'ye Aktar
                            </Button>
                            <Button
                                startIcon={<ClearIcon />}
                                color="error"
                                variant="outlined"
                                size="small"
                                onClick={handleClearAll}
                            >
                                Tümünü Temizle
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Belgeler Tablosu */}
            {documents.length === 0 ? (
                <Alert severity="info" sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        📄 Henüz takip edilen belge yok
                    </Typography>
                    <Typography variant="body2">
                        PDF belgelerini görüntülerken "Takip Et" butonuna tıklayarak buraya ekleyebilirsiniz.
                    </Typography>
                </Alert>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="viewed documents table">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light' }}>Sıra</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', minWidth: 300 }}>Başlık</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', minWidth: 200 }}>Yazarlar</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light' }}>Yayın Tarihi</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light' }}>DOI</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light' }}>Görüntülenme</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.light', minWidth: 200 }} align="center">İşlemler</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((document, index) => (
                                        <TableRow
                                            key={document.id}
                                            sx={{ 
                                                '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                                                '&:hover': { backgroundColor: 'action.selected' }
                                            }}
                                        >
                                            <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                                            <TableCell>
                                                <Tooltip title={document.title} placement="top">
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: 300
                                                        }}
                                                    >
                                                        {document.title}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={document.authors?.join(', ') || ''} placement="top">
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            maxWidth: 200
                                                        }}
                                                    >
                                                        {document.authors && document.authors.length > 0
                                                            ? document.authors.slice(0, 2).join(', ') + 
                                                              (document.authors.length > 2 ? ` +${document.authors.length - 2}` : '')
                                                            : '-'
                                                        }
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {document.published || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {document.doi ? (
                                                    <Chip 
                                                        label={document.doi} 
                                                        size="small" 
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(document.viewedAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                                    <Tooltip title="PDF Görüntüle">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleOpenPDF(document)}
                                                        >
                                                            <PictureAsPdfIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="AI Özet">
                                                        <IconButton
                                                            size="small"
                                                            color="secondary"
                                                            onClick={() => handleAISummary(document)}
                                                        >
                                                            <PsychologyIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Detay Görüntüle">
                                                        <IconButton
                                                            size="small"
                                                            color="info"
                                                            onClick={() => handleShowDetails(document)}
                                                        >
                                                            <DescriptionIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Sil">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteDocument(document)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                    
                    {/* Sayfalama */}
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={documents.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        labelRowsPerPage="Sayfa başına satır:"
                        labelDisplayedRows={({ from, to, count }) => 
                            `${from}-${to} / ${count !== -1 ? count : `${to}'den fazla`}`
                        }
                    />
                </Paper>
            )}

            {/* PDF Modal */}
            {selectedPdfDocument && (
                <PDFModal
                    open={pdfModalOpen}
                    onClose={handleClosePdfModal}
                    pdfUrl={selectedPdfDocument.pdfUrl}
                    title={selectedPdfDocument.title}
                    authors={selectedPdfDocument.authors}
                    abstract={selectedPdfDocument.abstract}
                    doi={selectedPdfDocument.doi}
                    published={selectedPdfDocument.published}
                />
            )}

            {/* Detay Modal */}
            <Dialog
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    📄 Belge Detayları
                </DialogTitle>
                <DialogContent>
                    {selectedDocument && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                {selectedDocument.title}
                            </Typography>

                            {selectedDocument.authors && selectedDocument.authors.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Yazarlar:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedDocument.authors.join(', ')}
                                    </Typography>
                                </Box>
                            )}

                            {selectedDocument.abstract && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Özet:
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedDocument.abstract}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Bilgiler:
                                </Typography>
                                <List dense>
                                    {selectedDocument.published && (
                                        <ListItem>
                                            <ListItemText primary="Yayın Tarihi" secondary={selectedDocument.published} />
                                        </ListItem>
                                    )}
                                    {selectedDocument.doi && (
                                        <ListItem>
                                            <ListItemText primary="DOI" secondary={selectedDocument.doi} />
                                        </ListItem>
                                    )}
                                    <ListItem>
                                        <ListItemText primary="Görüntülenme Tarihi" secondary={formatDate(selectedDocument.viewedAt)} />
                                    </ListItem>
                                </List>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailModalOpen(false)}>
                        Kapat
                    </Button>
                    {selectedDocument && (
                        <>
                            <Button
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => handleOpenPDF(selectedDocument)}
                                variant="contained"
                                color="primary"
                            >
                                PDF Görüntüle
                            </Button>
                            <Button
                                startIcon={<PsychologyIcon />}
                                color="secondary"
                                onClick={() => handleAISummary(selectedDocument)}
                            >
                                AI Özet
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Silme Onay Modal */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>
                    🗑️ Belgeyi Sil
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        "{documentToDelete?.title}" belgesini silmek istediğinizden emin misiniz?
                        Bu işlem geri alınamaz.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>
                        İptal
                    </Button>
                    <Button 
                        onClick={confirmDelete} 
                        color="error" 
                        variant="contained"
                    >
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Kaynakça Modal */}
            <Dialog
                open={bibliographyModalOpen}
                onClose={() => setBibliographyModalOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    📚 Kaynakça Oluştur
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Kaynakça Formatı</InputLabel>
                            <Select
                                value={selectedCitationFormat}
                                label="Kaynakça Formatı"
                                onChange={(e) => {
                                    setSelectedCitationFormat(e.target.value as 'APA' | 'MLA' | 'Chicago');
                                    if (generatedBibliography) {
                                        // Format değiştiğinde kaynakçayı yeniden oluştur
                                        const newBibliography = documents
                                            .map(doc => generateCitation(doc, e.target.value as 'APA' | 'MLA' | 'Chicago'))
                                            .sort()
                                            .join('\n\n');
                                        setGeneratedBibliography(newBibliography);
                                    }
                                }}
                            >
                                <MenuItem value="APA">APA (American Psychological Association)</MenuItem>
                                <MenuItem value="MLA">MLA (Modern Language Association)</MenuItem>
                                <MenuItem value="Chicago">Chicago/Turabian</MenuItem>
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                <strong>{selectedCitationFormat} Formatı:</strong> {documents.length} belge için kaynakça oluşturulacak. 
                                Kaynaklar alfabetik sıraya göre düzenlenecektir.
                            </Typography>
                        </Alert>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                                const bibliography = documents
                                    .map(doc => generateCitation(doc, selectedCitationFormat))
                                    .sort()
                                    .join('\n\n');
                                setGeneratedBibliography(bibliography);
                            }}
                            sx={{ mb: 2 }}
                        >
                            Kaynakçayı Oluştur
                        </Button>
                    </Box>

                    {generatedBibliography && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Oluşturulan Kaynakça ({selectedCitationFormat} Formatı):
                            </Typography>
                            <TextField
                                multiline
                                rows={15}
                                fullWidth
                                value={generatedBibliography}
                                variant="outlined"
                                InputProps={{
                                    readOnly: true,
                                    style: {
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        lineHeight: '1.6'
                                    }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: 'grey.50'
                                    }
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
                    <Button onClick={() => setBibliographyModalOpen(false)}>
                        Kapat
                    </Button>
                    {generatedBibliography && (
                        <>
                            <Button
                                startIcon={<ContentCopyIcon />}
                                color="primary"
                                variant="outlined"
                                onClick={copyBibliographyToClipboard}
                            >
                                Panoya Kopyala
                            </Button>
                            <Button
                                startIcon={<GetAppIcon />}
                                color="success"
                                variant="contained"
                                onClick={downloadBibliographyAsText}
                            >
                                TXT Olarak İndir
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ViewedDocuments;
