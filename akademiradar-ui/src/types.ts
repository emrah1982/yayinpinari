export interface SearchHistory {
    id: string;
    query: string;
    type: string;
    timestamp: string;
}

export interface ViewedDocument {
    id: string;
    title: string;
    source: string;
    type: string;
    year: string;
    authors: string[];
    viewedAt: string;
    timestamp: string;
}

// Detaylı yazar bilgisi
export interface AuthorDetail {
    name: string;
    given?: string;
    family?: string;
    orcid?: string | null;
    authorId?: string;
    hIndex?: number | null;
    citationCount?: number | null;
    paperCount?: number | null;
    worksCount?: number | null;
    affiliations?: Array<{
        name: string;
        id?: string;
        country?: string;
        type?: string;
    }>;
    rawAffiliationString?: string | null;
    homepage?: string | null;
    externalIds?: { [key: string]: any };
}

// Kimlik bilgileri
export interface PublicationIdentifiers {
    doi?: string | null;
    issn?: string[];
    isbn?: string[];
    pmid?: string | null;
    pmcid?: string | null;
    semanticScholarId?: string | null;
    openAlexId?: string | null;
    arxivId?: string | null;
    dblpId?: string | null;
    corpusId?: string | null;
    mag?: string | null;
    openalex?: string | null;
}

// Yayın bilgileri
export interface PublicationInfo {
    venue?: string | null;
    issn?: string[];
    publisher?: string | null;
    isInDoaj?: boolean;
    license?: string | null;
}

// Atıf bilgisi için tip tanımları
export interface CitationInfo {
    title: string;
    author?: string;
    citationCount: number;
    hIndex?: number;
    sources: string[];
    lastUpdated: string;
    details: {
        [key: string]: any;
        influentialCitationCount?: number;
        recentCitations?: number;
        selfCitations?: number;
        citationVelocity?: number;
        // Yeni detaylı bilgiler
        authorDetails?: AuthorDetail[];
        identifiers?: PublicationIdentifiers;
        publicationInfo?: PublicationInfo;
        doi?: string;
        publishedDate?: string | number[];
        journal?: string;
        publisher?: string;
        type?: string;
        url?: string;
        subjects?: string[];
        concepts?: string[];
        fieldsOfStudy?: string[];
        openAccessStatus?: string;
        isOpenAccess?: boolean;
        isRetracted?: boolean;
        externalIds?: { [key: string]: any };
    };
    isMockData?: boolean;
    primarySource?: string;
}
