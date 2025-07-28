import React, { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Toolbar,
    CircularProgress,
    Alert,
    Tooltip,
    Divider,
    Tab,
    Tabs,
    TextField,
    Paper
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Fullscreen as FullscreenIcon,
    Print as PrintIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    BookmarkAdd as BookmarkAddIcon,
    Psychology as PsychologyIcon,
    Bookmark as BookmarkIcon,
    Note as NoteIcon,
    Save as SaveIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    ColorLens as ColorLensIcon
} from '@mui/icons-material';

interface PDFNote {
    id: string;
    content: string;
    timestamp: Date;
    color: string;
    x?: number;
    y?: number;
    page?: number;
}

interface PDFModalProps {
    open: boolean;
    onClose: () => void;
    pdfUrl: string;
    title?: string;
    authors?: string[];
    abstract?: string;
    doi?: string;
    published?: string;
}

const PDFModal: React.FC<PDFModalProps> = ({ open, onClose, pdfUrl, title, authors, abstract, doi, published }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [currentMethod, setCurrentMethod] = useState<number>(0);
    const [blobUrl, setBlobUrl] = useState<string>('');
    const [isTracked, setIsTracked] = useState<boolean>(false);
    const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
    
    // AI Özet için state'ler
    const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState<boolean>(false);
    const [aiSummaryLoading, setAiSummaryLoading] = useState<boolean>(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
    
    // Not alma için state'ler
    const [notes, setNotes] = useState<PDFNote[]>([]);
    const [showNotesPanel, setShowNotesPanel] = useState<boolean>(false);
    const [newNoteContent, setNewNoteContent] = useState<string>('');
    const [selectedNoteColor, setSelectedNoteColor] = useState<string>('#ffeb3b');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    // PDF yükleme yöntemleri
    const viewerMethods = [
        {
            label: 'PDF.js Mozilla (Tam Özellik)',
            getUrl: (url: string) => `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}&toolbar=1&navpanes=1&scrollbar=1&statusbar=1&messages=1`,
            description: 'Mozilla PDF.js - Zoom, Print, Download, Arama'
        },
        {
            label: 'PDF.js JSDeliver (Tam Özellik)',
            getUrl: (url: string) => `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/web/viewer.html?file=${encodeURIComponent(url)}&toolbar=1&navpanes=1&scrollbar=1&statusbar=1`,
            description: 'JSDeliver PDF.js - Tüm PDF araçları'
        },
        {
            label: 'Google Drive Viewer',
            getUrl: (url: string) => `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`,
            description: 'Google Drive - Güvenilir görüntüleme'
        },
        {
            label: 'Google Docs Viewer',
            getUrl: (url: string) => `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
            description: 'Google Docs - Basit görüntüleme'
        },
        {
            label: 'ViewerJS',
            getUrl: (url: string) => `https://viewerjs.org/ViewerJS/index.html#${encodeURIComponent(url)}`,
            description: 'ViewerJS - Online PDF viewer'
        },
        {
            label: 'Doğrudan İframe',
            getUrl: (url: string) => url,
            description: 'Doğrudan PDF görüntüleme'
        }
    ];

    // PDF'i blob olarak fetch et
    const fetchPdfAsBlob = useCallback(async (url: string) => {
        try {
            setLoading(true);
            setError(null);
            
            // CORS proxy kullan
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            setBlobUrl(objectUrl);
            setLoading(false);
            
        } catch (err) {
            console.error('PDF fetch error:', err);
            setError('PDF dosyası yüklenemedi. Alternatif yöntemleri deneyin.');
            setLoading(false);
        }
    }, []);

    // Component unmount olduğunda blob URL'ini temizle
    useEffect(() => {
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [blobUrl]);

    // Modal açıldığında PDF URL'ini test et ve uygun method'u seç
    useEffect(() => {
        if (open && pdfUrl) {
            // URL formatını kontrol et
            if (!validatePdfUrl(pdfUrl)) {
                setError('Geçersiz PDF URL formatı. Lütfen geçerli bir HTTP/HTTPS URL sağlayın.');
                return;
            }
            
            // PDF URL'ini test et
            testPdfUrl(pdfUrl).then(isValid => {
                if (!isValid) {
                    console.warn('PDF URL test failed, trying alternative methods');
                    setError('PDF dosyasına erişim sorunu. Farklı görüntüleme yöntemlerini deneyin.');
                }
            });
            
            // Blob method seçiliyse fetch'i başlat
            if (currentMethod === viewerMethods.length) {
                fetchPdfAsBlob(pdfUrl);
            }
        }
    }, [open, currentMethod, pdfUrl, fetchPdfAsBlob, viewerMethods.length]);

    // PDF yüklendiğinde çalışır
    const handleIframeLoad = useCallback(() => {
        setLoading(false);
        setError(null);
    }, []);

    // PDF yükleme hatası
    const handleIframeError = useCallback(() => {
        setLoading(false);
        const currentMethodName = viewerMethods[currentMethod]?.label || 'Bilinmeyen';
        
        // Otomatik olarak bir sonraki viewer'ı dene (sadece ilk 3 viewer için)
        if (currentMethod < 2) {
            console.log(`${currentMethodName} başarısız, ${viewerMethods[currentMethod + 1]?.label} deneniyor...`);
            setCurrentMethod(currentMethod + 1);
            setError('');
            setLoading(true);
            return;
        }
        
        setError(`${currentMethodName} ile PDF yüklenemedi.\n\nPDF URL: ${pdfUrl}\n\n✅ Çalışan seçenekler:\n• Google Drive Viewer (1. sekme)\n• Google Docs Viewer (3. sekme)\n\n⚠️ Sorun giderme:\n• PDF dosyasının genel erişime açık olduğundan emin olun\n• Farklı viewer sekmelerini deneyin\n• PDF URL'inin doğru olduğunu kontrol edin`);
    }, [currentMethod, pdfUrl, viewerMethods]);

    // Tam ekran toggle
    const toggleFullscreen = () => setIsFullscreen(prev => !prev);

    // PDF indirme
    const downloadPDF = () => {
        const link = document.createElement('a');
        link.href = blobUrl || pdfUrl;
        link.download = title ? `${title}.pdf` : 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Yeni sekmede aç
    const openInNewTab = () => {
        window.open(pdfUrl, '_blank');
    };

    // Yazdırma
    const printPDF = () => {
        if (blobUrl) {
            const printWindow = window.open(blobUrl, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', () => {
                    printWindow.print();
                });
            }
        } else {
            openInNewTab();
        }
    };

    // Yeniden yükle
    const retryLoad = () => {
        setLoading(true);
        setError(null);
        if (currentMethod === 4) {
            fetchPdfAsBlob(pdfUrl);
        }
    };

    // AI Özet fonksiyonu
    const handleAiSummary = useCallback(async () => {
        if (aiSummaryLoading) return;
        
        setAiSummaryLoading(true);
        setAiSummaryError(null);
        
        try {
            // PDF'in metnini oluştur (başlık, özet, yazarlar)
            let textContent = '';
            
            if (title) {
                textContent += `Başlık: ${title}\n\n`;
            }
            
            if (authors && authors.length > 0) {
                textContent += `Yazarlar: ${authors.join(', ')}\n\n`;
            }
            
            if (abstract) {
                textContent += `Özet: ${abstract}\n\n`;
            }
            
            if (doi) {
                textContent += `DOI: ${doi}\n\n`;
            }
            
            if (published) {
                textContent += `Yayın Tarihi: ${published}\n\n`;
            }
            
            // Eğer hiç metin yoksa hata ver
            if (!textContent.trim()) {
                throw new Error('Bu yayın için yeterli metin bilgisi bulunamadı.');
            }
            
            // Backend'e AI özet isteği gönder
            const response = await fetch('http://localhost:5000/api/ai-summary/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textContent })
            });
            
            if (!response.ok) {
                throw new Error('AI özet servisi yanıt vermedi.');
            }
            
            const data = await response.json();
            
            if (data.summary) {
                setAiSummary(data.summary);
                setAiSummaryModalOpen(true);
            } else {
                throw new Error('AI özet oluşturulamadı.');
            }
            
        } catch (error) {
            console.error('AI özet hatası:', error);
            setAiSummaryError(error instanceof Error ? error.message : 'AI özet oluşturulurken hata oluştu.');
        } finally {
            setAiSummaryLoading(false);
        }
    }, [title, authors, abstract, doi, published, aiSummaryLoading]);

    // Takip fonksiyonu
    const handleTrackDocument = useCallback(async () => {
        if (trackingLoading) return;
        
        setTrackingLoading(true);
        try {
            const documentData = {
                id: `pdf_${Date.now()}`,
                title: title || 'Başlıksız PDF',
                authors: authors || [],
                abstract: abstract || '',
                doi: doi || '',
                published: published || '',
                pdfUrl: pdfUrl,
                addedDate: new Date().toISOString()
            };
            
            // localStorage'dan mevcut belgeleri al
            const existingDocs = JSON.parse(localStorage.getItem('viewedDocuments') || '[]');
            
            // Bu belge zaten takip ediliyor mu kontrol et
            const isAlreadyTracked = existingDocs.some((doc: any) => 
                doc.pdfUrl === pdfUrl || doc.title === title
            );
            
            if (isAlreadyTracked) {
                // Belge zaten takip ediliyor, kaldır
                const updatedDocs = existingDocs.filter((doc: any) => 
                    doc.pdfUrl !== pdfUrl && doc.title !== title
                );
                localStorage.setItem('viewedDocuments', JSON.stringify(updatedDocs));
                setIsTracked(false);
            } else {
                // Belgeyi takip listesine ekle
                const updatedDocs = [documentData, ...existingDocs];
                localStorage.setItem('viewedDocuments', JSON.stringify(updatedDocs));
                setIsTracked(true);
            }
            
        } catch (error) {
            console.error('Belge takip hatası:', error);
        } finally {
            setTrackingLoading(false);
        }
    }, [title, authors, abstract, doi, published, pdfUrl, trackingLoading]);
    useEffect(() => {
        if (open && title && pdfUrl) {
            const existingDocs = JSON.parse(localStorage.getItem('viewedDocuments') || '[]');
            const isAlreadyTracked = existingDocs.some((doc: any) => 
                doc.title === title && doc.pdfUrl === pdfUrl
            );
            setIsTracked(isAlreadyTracked);
        }
    }, [open, title, pdfUrl]);

    // Not alma fonksiyonları
    const noteColors = [
        { color: '#ffeb3b', label: 'Sarı' },
        { color: '#4caf50', label: 'Yeşil' },
        { color: '#2196f3', label: 'Mavi' },
        { color: '#ff9800', label: 'Turuncu' },
        { color: '#f44336', label: 'Kırmızı' },
        { color: '#9c27b0', label: 'Mor' }
    ];

    // Notları localStorage'dan yükle
    useEffect(() => {
        if (open && pdfUrl) {
            const savedNotes = localStorage.getItem(`pdf-notes-${pdfUrl}`);
            if (savedNotes) {
                try {
                    const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
                        ...note,
                        timestamp: new Date(note.timestamp)
                    }));
                    setNotes(parsedNotes);
                } catch (err) {
                    console.error('Not yükleme hatası:', err);
                }
            }
        }
    }, [open, pdfUrl]);

    // Notları localStorage'a kaydet
    const saveNotesToStorage = (updatedNotes: PDFNote[]) => {
        localStorage.setItem(`pdf-notes-${pdfUrl}`, JSON.stringify(updatedNotes));
    };

    // Yeni not ekle
    const addNote = () => {
        if (!newNoteContent.trim()) return;
        
        const newNote: PDFNote = {
            id: `note-${Date.now()}`,
            content: newNoteContent.trim(),
            timestamp: new Date(),
            color: selectedNoteColor
        };
        
        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        saveNotesToStorage(updatedNotes);
        setNewNoteContent('');
    };

    // Not düzenle
    const editNote = (noteId: string, newContent: string) => {
        const updatedNotes = notes.map(note => 
            note.id === noteId 
                ? { ...note, content: newContent.trim(), timestamp: new Date() }
                : note
        );
        setNotes(updatedNotes);
        saveNotesToStorage(updatedNotes);
        setEditingNoteId(null);
    };

    // Not sil
    const deleteNote = (noteId: string) => {
        const updatedNotes = notes.filter(note => note.id !== noteId);
        setNotes(updatedNotes);
        saveNotesToStorage(updatedNotes);
    };

    // Not rengini değiştir
    const changeNoteColor = (noteId: string, newColor: string) => {
        const updatedNotes = notes.map(note => 
            note.id === noteId ? { ...note, color: newColor } : note
        );
        setNotes(updatedNotes);
        saveNotesToStorage(updatedNotes);
    };

    // Notları dışa aktar
    const exportNotes = () => {
        const exportData = {
            document: {
                title: title || 'Başlıksız PDF',
                authors: authors || [],
                doi: doi || '',
                url: pdfUrl
            },
            notes: notes,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || 'document'}-notes.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    };

    // Modal kapatma ve state temizleme
    const handleClose = () => {
        setLoading(true);
        setError(null);
        setIsFullscreen(false);
        setCurrentMethod(0);
        if (blobUrl) {
            URL.revokeObjectURL(blobUrl);
            setBlobUrl('');
        }
        onClose();
    };

    // Tab değiştiğinde
    const handleMethodChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentMethod(newValue);
        setLoading(true);
        setError(null);
        
        if (newValue === 4) { // Blob method
            fetchPdfAsBlob(pdfUrl);
        }
    };

    // PDF URL'ini doğrula
    const validatePdfUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // Görüntülenecek URL'i al
    const getDisplayUrl = () => {
        if (!validatePdfUrl(pdfUrl)) {
            return '';
        }
        
        if (currentMethod === viewerMethods.length) { // Blob method
            return blobUrl;
        }
        return viewerMethods[currentMethod]?.getUrl(pdfUrl) || pdfUrl;
    };

    // PDF URL'ini test et
    const testPdfUrl = async (url: string): Promise<boolean> => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            return response.ok && (contentType?.includes('pdf') || false);
        } catch {
            return false;
        }
    };

    const displayUrl = getDisplayUrl();

    return (
        <>
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth={isFullscreen ? false : "xl"}
            fullWidth
            fullScreen={isFullscreen}
            PaperProps={{
                sx: {
                    height: isFullscreen ? '100vh' : '90vh',
                    maxHeight: isFullscreen ? '100vh' : '90vh',
                }
            }}
        >
            {/* Dialog Başlığı */}
            <DialogTitle sx={{ p: 0 }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {title || 'PDF Görüntüleyici'}
                    </Typography>
                    
                    {/* Kontrol Butonları */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Yenile">
                            <IconButton onClick={retryLoad} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="İndir">
                            <IconButton onClick={downloadPDF} size="small">
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Yeni Sekmede Aç">
                            <IconButton onClick={openInNewTab} size="small">
                                <OpenInNewIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Yazdır">
                            <IconButton onClick={printPDF} size="small">
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        
                        {/* Takip Butonu */}
                        <Tooltip title={isTracked ? "✅ Takip Ediliyor - Viewed Documents'ta görüntülenebilir" : "📌 Bu belgeyi takip et"}>
                            <IconButton 
                                onClick={handleTrackDocument} 
                                size="small"
                                disabled={trackingLoading}
                                sx={{ 
                                    color: isTracked ? 'success.main' : 'inherit',
                                    backgroundColor: isTracked ? 'success.light' : 'transparent',
                                    border: isTracked ? '2px solid' : '1px solid transparent',
                                    borderColor: isTracked ? 'success.main' : 'transparent',
                                    '&:hover': {
                                        color: isTracked ? 'success.dark' : 'primary.main',
                                        backgroundColor: isTracked ? 'success.light' : 'primary.light'
                                    },
                                    '&:disabled': {
                                        backgroundColor: 'grey.200'
                                    }
                                }}
                            >
                                {trackingLoading ? (
                                    <CircularProgress size={20} color="primary" />
                                ) : isTracked ? (
                                    <BookmarkIcon sx={{ fontSize: 20 }} />
                                ) : (
                                    <BookmarkAddIcon sx={{ fontSize: 20 }} />
                                )}
                            </IconButton>
                        </Tooltip>
                        
                        {/* AI Özet Butonu */}
                        <Tooltip title={aiSummaryLoading ? "AI özet oluşturuluyor..." : "🤖 AI ile özet oluştur"}>
                            <IconButton 
                                onClick={handleAiSummary} 
                                size="small"
                                disabled={aiSummaryLoading}
                                sx={{ 
                                    color: 'secondary.main',
                                    '&:hover': {
                                        color: 'secondary.dark'
                                    },
                                    '&:disabled': {
                                        backgroundColor: 'grey.200'
                                    }
                                }}
                            >
                                {aiSummaryLoading ? (
                                    <CircularProgress size={20} color="secondary" />
                                ) : (
                                    <PsychologyIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                        
                        {/* Not Alma Butonu */}
                        <Tooltip title={showNotesPanel ? "Notları Gizle" : "📝 Notlar"}>
                            <IconButton 
                                onClick={() => setShowNotesPanel(!showNotesPanel)} 
                                size="small"
                                sx={{ 
                                    color: showNotesPanel ? 'warning.main' : 'inherit',
                                    backgroundColor: showNotesPanel ? 'warning.light' : 'transparent',
                                    '&:hover': {
                                        color: showNotesPanel ? 'warning.dark' : 'warning.main',
                                        backgroundColor: 'warning.light'
                                    }
                                }}
                            >
                                <NoteIcon />
                                {notes.length > 0 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            backgroundColor: 'error.main',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 16,
                                            height: 16,
                                            fontSize: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {notes.length}
                                    </Box>
                                )}
                            </IconButton>
                        </Tooltip>
                        
                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                        
                        <Tooltip title={isFullscreen ? "Pencere Modu" : "Tam Ekran"}>
                            <IconButton onClick={toggleFullscreen} size="small">
                                <FullscreenIcon />
                            </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Kapat">
                            <IconButton onClick={handleClose} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </DialogTitle>

            {/* Görüntüleme Yöntem Seçimi */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                    value={currentMethod} 
                    onChange={handleMethodChange}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    {viewerMethods.map((method, index) => (
                        <Tab 
                            key={index}
                            label={method.label} 
                            title={method.description}
                        />
                    ))}
                    <Tab label="Blob Viewer" title="Güvenli yükleme" />
                </Tabs>
            </Box>

            {/* Dialog İçeriği */}
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {loading && (
                    <Box 
                        sx={{ 
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            bgcolor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 2,
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            boxShadow: 3
                        }}
                    >
                        <CircularProgress />
                        <Typography>PDF yükleniyor...</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {viewerMethods[currentMethod]?.description || 'Güvenli yükleme'}
                        </Typography>
                    </Box>
                )}
                
                {error && (
                    <Box sx={{ p: 2 }}>
                        <Alert 
                            severity="warning" 
                            action={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" onClick={retryLoad}>
                                        Tekrar Dene
                                    </Button>
                                    <Button size="small" onClick={openInNewTab}>
                                        Yeni Sekmede Aç
                                    </Button>
                                    <Button size="small" onClick={downloadPDF}>
                                        İndir
                                    </Button>
                                </Box>
                            }
                        >
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                {error}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                💡 Farklı görüntüleme yöntemlerini yukarıdaki sekmelerden deneyebilirsiniz.
                            </Typography>
                        </Alert>
                    </Box>
                )}
                
                {!error && displayUrl && (
                    <Box 
                        sx={{ 
                            flex: 1,
                            display: 'flex',
                            position: 'relative',
                            overflow: 'hidden',
                            bgcolor: '#f5f5f5'
                        }}
                    >
                        {/* PDF Viewer */}
                        <Box 
                            sx={{ 
                                flex: showNotesPanel ? '1 1 70%' : '1 1 100%',
                                display: 'flex',
                                transition: 'flex 0.3s ease'
                            }}
                        >
                            <iframe
                                src={displayUrl}
                                width="100%"
                                height="600px"
                                style={{ border: 'none' }}
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads allow-top-navigation allow-presentation allow-pointer-lock"
                                referrerPolicy="no-referrer-when-downgrade"
                                allow="fullscreen; clipboard-read; clipboard-write"
                                loading="lazy"
                                title={`PDF Viewer - ${viewerMethods[currentMethod]?.label}`}
                            />
                        </Box>
                        
                        {/* Not Paneli */}
                        {showNotesPanel && (
                            <Box 
                                sx={{ 
                                    flex: '0 0 30%',
                                    borderLeft: '1px solid #e0e0e0',
                                    bgcolor: 'background.paper',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    maxHeight: '100%'
                                }}
                            >
                                {/* Not Paneli Başlığı */}
                                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <NoteIcon color="warning" />
                                        Notlar ({notes.length})
                                    </Typography>
                                </Box>
                                
                                {/* Yeni Not Ekleme */}
                                <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                        {noteColors.map((colorOption) => (
                                            <Box
                                                key={colorOption.color}
                                                onClick={() => setSelectedNoteColor(colorOption.color)}
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    backgroundColor: colorOption.color,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    border: selectedNoteColor === colorOption.color ? '3px solid #333' : '2px solid #fff',
                                                    boxShadow: 1,
                                                    '&:hover': {
                                                        transform: 'scale(1.1)'
                                                    }
                                                }}
                                                title={colorOption.label}
                                            />
                                        ))}
                                    </Box>
                                    
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        placeholder="Yeni not ekle..."
                                        value={newNoteContent}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNoteContent(e.target.value)}
                                        size="small"
                                        sx={{ mb: 1 }}
                                    />
                                    
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={addNote}
                                            disabled={!newNoteContent.trim()}
                                            startIcon={<SaveIcon />}
                                            sx={{ flex: 1 }}
                                        >
                                            Kaydet
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={exportNotes}
                                            disabled={notes.length === 0}
                                            startIcon={<DownloadIcon />}
                                        >
                                            Dışa Aktar
                                        </Button>
                                    </Box>
                                </Box>
                                
                                {/* Notlar Listesi */}
                                <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                                    {notes.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                            <NoteIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                            <Typography variant="body2">
                                                Henüz not eklenmemiş
                                            </Typography>
                                        </Box>
                                    ) : (
                                        notes.map((note) => (
                                            <Paper
                                                key={note.id}
                                                sx={{
                                                    p: 2,
                                                    mb: 1,
                                                    borderLeft: `4px solid ${note.color}`,
                                                    position: 'relative'
                                                }}
                                            >
                                                {editingNoteId === note.id ? (
                                                    <Box>
                                                        <TextField
                                                            fullWidth
                                                            multiline
                                                            rows={2}
                                                            defaultValue={note.content}
                                                            size="small"
                                                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                if (e.key === 'Enter' && e.ctrlKey) {
                                                                    editNote(note.id, (e.target as HTMLInputElement).value);
                                                                }
                                                                if (e.key === 'Escape') {
                                                                    setEditingNoteId(null);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                            <Button
                                                                size="small"
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                                                    editNote(note.id, input.value);
                                                                }}
                                                            >
                                                                Kaydet
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                onClick={() => setEditingNoteId(null)}
                                                            >
                                                                İptal
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                                            {note.content}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {note.timestamp.toLocaleString('tr-TR')}
                                                        </Typography>
                                                        
                                                        {/* Not Aksiyonları */}
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setEditingNoteId(note.id)}
                                                                title="Düzenle"
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => deleteNote(note.id)}
                                                                title="Sil"
                                                                color="error"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                            
                                                            {/* Renk Seçici */}
                                                            <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                                                {noteColors.map((colorOption) => (
                                                                    <Box
                                                                        key={colorOption.color}
                                                                        onClick={() => changeNoteColor(note.id, colorOption.color)}
                                                                        sx={{
                                                                            width: 16,
                                                                            height: 16,
                                                                            backgroundColor: colorOption.color,
                                                                            borderRadius: '50%',
                                                                            cursor: 'pointer',
                                                                            border: note.color === colorOption.color ? '2px solid #333' : '1px solid #ccc',
                                                                            '&:hover': {
                                                                                transform: 'scale(1.2)'
                                                                            }
                                                                        }}
                                                                        title={colorOption.label}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Paper>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>

            {/* Alt Bilgi Çubuğu */}
            <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {title || 'PDF Belgesi'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Yöntem: {viewerMethods[currentMethod]?.label || 'Blob Viewer'}
                    </Typography>
                </Box>
            </DialogActions>
        </Dialog>
        
        {/* AI Özet Modalı */}
        <Dialog
            open={aiSummaryModalOpen}
            onClose={() => setAiSummaryModalOpen(false)}
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
                backgroundColor: 'secondary.light',
                color: 'secondary.contrastText'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon />
                    <Typography variant="h6">
                        🤖 AI Özet
                    </Typography>
                </Box>
                <IconButton 
                    onClick={() => setAiSummaryModalOpen(false)}
                    size="small"
                    sx={{ color: 'inherit' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
                {/* Yayın Bilgileri */}
                <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        📝 Yayın: {title || 'Başlıksız PDF'}
                    </Typography>
                    {authors && authors.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            👥 Yazarlar: {authors.join(', ')}
                        </Typography>
                    )}
                </Box>
                
                {/* Hata Durumu */}
                {aiSummaryError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            ⚠️ {aiSummaryError}
                        </Typography>
                        <Button 
                            onClick={handleAiSummary}
                            size="small" 
                            sx={{ mt: 1 }}
                            disabled={aiSummaryLoading}
                        >
                            Tekrar Dene
                        </Button>
                    </Alert>
                )}
                
                {/* AI Özet İçeriği */}
                {aiSummary && (
                    <Box sx={{ 
                        p: 2, 
                        backgroundColor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2
                    }}>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.95rem'
                            }}
                        >
                            {aiSummary}
                        </Typography>
                    </Box>
                )}
                
                {/* Yükleme Durumu */}
                {aiSummaryLoading && (
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        py: 4 
                    }}>
                        <CircularProgress size={40} color="secondary" sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            🤖 AI özet oluşturuluyor...
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Bu işlem birkaç saniye sürebilir.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 2, gap: 1 }}>
                {aiSummary && (
                    <>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(aiSummary);
                                // Basit feedback için alert kullanıyoruz
                                alert('✅ AI özet panoya kopyalandı!');
                            }}
                            variant="outlined"
                            size="small"
                            startIcon={<Typography sx={{ fontSize: '16px' }}>📋</Typography>}
                        >
                            Kopyala
                        </Button>
                        
                        <Button
                            onClick={() => {
                                const blob = new Blob([aiSummary], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${title || 'AI_Ozet'}_ozet.txt`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            variant="outlined"
                            size="small"
                            startIcon={<Typography sx={{ fontSize: '16px' }}>💾</Typography>}
                        >
                            İndir
                        </Button>
                    </>
                )}
                
                <Button
                    onClick={() => setAiSummaryModalOpen(false)}
                    variant="contained"
                    color="secondary"
                >
                    Kapat
                </Button>
            </DialogActions>
        </Dialog>
        </>
    );
};

export default PDFModal;