// Gelişmiş benzerlik algoritması - Konu kategorisi ağırlıklandırması

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

export interface ScoredSimilarPublication extends SimilarPublication {
    similarityScore: number;
    scoreBreakdown: {
        titleScore: number;
        subjectScore: number;
        authorScore: number;
        yearScore: number;
        totalScore: number;
    };
}

// Ağırlık katsayıları
const WEIGHTS = {
    TITLE: 0.4,      // Başlık benzerliği %40
    SUBJECT: 0.35,   // Konu kategorisi %35
    AUTHOR: 0.15,    // Yazar benzerliği %15
    YEAR: 0.1        // Yayın yılı yakınlığı %10
};

// Türkçe stop words (yaygın kelimeler)
const TURKISH_STOP_WORDS = new Set([
    'bir', 'bu', 've', 'ile', 'için', 'olan', 'olan', 'da', 'de', 'den', 'dan',
    'nin', 'nın', 'nun', 'nün', 'ın', 'in', 'un', 'ün', 'lar', 'ler',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'
]);

// Metni temizle ve anahtar kelimeleri çıkar
export const extractKeywords = (text: string): string[] => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !TURKISH_STOP_WORDS.has(word))
        .slice(0, 10); // En fazla 10 anahtar kelime
};

// Jaccard benzerlik katsayısı hesapla
export const calculateJaccardSimilarity = (set1: Set<string>, set2: Set<string>): number => {
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
};

// Başlık benzerliği hesapla
export const calculateTitleSimilarity = (originalTitle: string, compareTitle: string): number => {
    const keywords1 = new Set(extractKeywords(originalTitle));
    const keywords2 = new Set(extractKeywords(compareTitle));
    
    return calculateJaccardSimilarity(keywords1, keywords2);
};

// Konu kategorisi benzerliği hesapla
export const calculateSubjectSimilarity = (originalSubjects: string[], compareSubjects?: string[]): number => {
    if (!compareSubjects || compareSubjects.length === 0) return 0;
    
    // Orijinal yayının konularından anahtar kelimeler çıkar
    const originalKeywords = new Set(
        originalSubjects.flatMap(subject => extractKeywords(subject))
    );
    
    // Karşılaştırılan yayının konularından anahtar kelimeler çıkar
    const compareKeywords = new Set(
        compareSubjects.flatMap(subject => extractKeywords(subject))
    );
    
    return calculateJaccardSimilarity(originalKeywords, compareKeywords);
};

// Yazar benzerliği hesapla
export const calculateAuthorSimilarity = (originalAuthors: string[], compareAuthors?: string[]): number => {
    if (!compareAuthors || compareAuthors.length === 0 || originalAuthors.length === 0) return 0;
    
    const originalAuthorSet = new Set(originalAuthors.map(author => author.toLowerCase()));
    const compareAuthorSet = new Set(compareAuthors.map(author => author.toLowerCase()));
    
    return calculateJaccardSimilarity(originalAuthorSet, compareAuthorSet);
};

// Yayın yılı yakınlığı hesapla
export const calculateYearSimilarity = (originalYear?: number, compareYear?: number): number => {
    if (!originalYear || !compareYear) return 0;
    
    const yearDiff = Math.abs(originalYear - compareYear);
    
    // 0-5 yıl arası: 1.0, 5-10 yıl arası: 0.5, 10+ yıl: 0.0
    if (yearDiff <= 5) return 1.0;
    if (yearDiff <= 10) return 0.5;
    return 0.0;
};

// Toplam benzerlik skoru hesapla
export const calculateSimilarityScore = (
    originalPublication: {
        title: string;
        authors?: string | string[];
        published?: string;
        abstract?: string;
    },
    comparePublication: SimilarPublication
): ScoredSimilarPublication => {
    // Başlık benzerliği
    const titleScore = calculateTitleSimilarity(originalPublication.title, comparePublication.title);
    
    // Konu kategorisi benzerliği (abstract'tan da konu çıkarabilir)
    const originalSubjects = originalPublication.abstract 
        ? extractKeywords(originalPublication.abstract)
        : extractKeywords(originalPublication.title);
    const subjectScore = calculateSubjectSimilarity(originalSubjects, comparePublication.subject);
    
    // Yazar benzerliği
    const originalAuthors = Array.isArray(originalPublication.authors) 
        ? originalPublication.authors 
        : originalPublication.authors ? [originalPublication.authors] : [];
    const authorScore = calculateAuthorSimilarity(originalAuthors, comparePublication.authors);
    
    // Yayın yılı benzerliği
    const originalYear = originalPublication.published ? new Date(originalPublication.published).getFullYear() : undefined;
    const yearScore = calculateYearSimilarity(originalYear, comparePublication.first_publish_year);
    
    // Ağırlıklı toplam skor
    const totalScore = (
        titleScore * WEIGHTS.TITLE +
        subjectScore * WEIGHTS.SUBJECT +
        authorScore * WEIGHTS.AUTHOR +
        yearScore * WEIGHTS.YEAR
    );
    
    return {
        ...comparePublication,
        similarityScore: Math.round(totalScore * 100) / 100, // 2 ondalık basamak
        scoreBreakdown: {
            titleScore: Math.round(titleScore * 100) / 100,
            subjectScore: Math.round(subjectScore * 100) / 100,
            authorScore: Math.round(authorScore * 100) / 100,
            yearScore: Math.round(yearScore * 100) / 100,
            totalScore: Math.round(totalScore * 100) / 100
        }
    };
};

// Benzerlik skoruna göre sırala ve filtrele
export const rankSimilarPublications = (
    originalPublication: {
        title: string;
        authors?: string | string[];
        published?: string;
        abstract?: string;
    },
    publications: SimilarPublication[],
    minScore: number = 0.1 // Minimum benzerlik skoru
): ScoredSimilarPublication[] => {
    return publications
        .map(pub => calculateSimilarityScore(originalPublication, pub))
        .filter(pub => pub.similarityScore >= minScore)
        .sort((a, b) => b.similarityScore - a.similarityScore);
};

// Skor açıklaması
export const getScoreDescription = (score: number): { text: string; color: string } => {
    if (score >= 0.8) return { text: 'Çok Yüksek Benzerlik', color: '#4caf50' };
    if (score >= 0.6) return { text: 'Yüksek Benzerlik', color: '#8bc34a' };
    if (score >= 0.4) return { text: 'Orta Benzerlik', color: '#ff9800' };
    if (score >= 0.2) return { text: 'Düşük Benzerlik', color: '#ff5722' };
    return { text: 'Çok Düşük Benzerlik', color: '#f44336' };
};
