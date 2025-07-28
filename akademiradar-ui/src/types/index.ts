export interface SearchHistory {
    id: string;
    query: string;
    type: string;
    timestamp: string;
}

export interface ViewedDocument {
    id: string;
    title: string;
    authors: string[];
    year: string;
    type: string;
    viewedAt: string;
}

export interface SearchFilters {
    type: string;
    category: string;
    authorName?: string;
    orcid?: string;
}
