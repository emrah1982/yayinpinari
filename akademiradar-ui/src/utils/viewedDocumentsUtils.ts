// ViewedDocuments için utility fonksiyonları

export interface ViewedDocument {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    doi: string;
    published: string;
    pdfUrl: string;
    viewedAt: string;
}

export interface SimilarPublication {
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

// Benzer yayını ViewedDocument formatına dönüştür
export const convertSimilarPublicationToViewedDocument = (
    publication: SimilarPublication
): ViewedDocument => {
    return {
        id: publication.key || `similar-${Date.now()}-${Math.random()}`,
        title: publication.title || 'Başlık Bulunamadı',
        authors: publication.authors || [],
        abstract: publication.subject ? `Konular: ${publication.subject.slice(0, 3).join(', ')}` : '',
        doi: publication.isbn && publication.isbn.length > 0 ? `ISBN: ${publication.isbn[0]}` : '',
        published: publication.first_publish_year ? publication.first_publish_year.toString() : '',
        pdfUrl: `https://openlibrary.org${publication.key}`, // OpenLibrary linkini PDF URL olarak kullan
        viewedAt: new Date().toISOString()
    };
};

// ViewedDocuments listesine yeni belge ekle
export const addToViewedDocuments = (document: ViewedDocument): boolean => {
    try {
        // Mevcut belgeleri al
        const existingDocs = getViewedDocuments();
        
        // Aynı ID'ye sahip belge var mı kontrol et
        const isDuplicate = existingDocs.some(doc => doc.id === document.id);
        
        if (isDuplicate) {
            console.log('Bu belge zaten takip listesinde mevcut');
            return false;
        }
        
        // Yeni belgeyi listeye ekle (en başa)
        const updatedDocs = [document, ...existingDocs];
        
        // localStorage'a kaydet
        localStorage.setItem('viewedDocuments', JSON.stringify(updatedDocs));
        
        // Storage event'i tetikle (diğer tab/window'lar için)
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'viewedDocuments',
            newValue: JSON.stringify(updatedDocs),
            storageArea: localStorage
        }));
        
        return true;
    } catch (error) {
        console.error('Belge takip listesine eklenirken hata:', error);
        return false;
    }
};

// ViewedDocuments listesini al
export const getViewedDocuments = (): ViewedDocument[] => {
    try {
        const storedDocs = localStorage.getItem('viewedDocuments');
        return storedDocs ? JSON.parse(storedDocs) : [];
    } catch (error) {
        console.error('Takip listesi yüklenirken hata:', error);
        return [];
    }
};

// Benzer yayını takip listesine ekle (ana fonksiyon)
export const addSimilarPublicationToTracking = (publication: SimilarPublication): boolean => {
    const viewedDocument = convertSimilarPublicationToViewedDocument(publication);
    return addToViewedDocuments(viewedDocument);
};
