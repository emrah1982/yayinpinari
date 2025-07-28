import React, { useState } from 'react';
import { Box, Button, Typography, Card, CardContent } from '@mui/material';
import CitationInfoComponent from './CitationInfo';
import { CitationInfo } from '../types';

/**
 * Citation Test Component
 * Bu bileşen atıf bilgisi gösterimini test etmek için kullanılır
 */
const CitationTest: React.FC = () => {
    const [showCitation, setShowCitation] = useState(false);

    // Mock citation data
    const mockCitationInfo: CitationInfo = {
        title: "Deep Learning",
        author: "Ian Goodfellow",
        citationCount: 8934,
        hIndex: 38,
        sources: ["Semantic Scholar", "OpenAlex", "Mock Database"],
        lastUpdated: new Date().toISOString(),
        details: {
            influentialCitationCount: 2680,
            recentCitations: 567,
            selfCitations: 89,
            citationVelocity: 298
        },
        isMockData: true,
        primarySource: "Semantic Scholar"
    };

    const mockCitationInfo2: CitationInfo = {
        title: "Artificial Intelligence: A Modern Approach",
        author: "Stuart Russell",
        citationCount: 15420,
        hIndex: 45,
        sources: ["Crossref", "Semantic Scholar"],
        lastUpdated: new Date().toISOString(),
        details: {
            influentialCitationCount: 4626,
            recentCitations: 892,
            selfCitations: 154,
            citationVelocity: 385
        },
        isMockData: true,
        primarySource: "Crossref"
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                🧪 Citation UI Test
            </Typography>
            
            <Button 
                variant="contained" 
                onClick={() => setShowCitation(!showCitation)}
                sx={{ mb: 3 }}
            >
                {showCitation ? 'Hide' : 'Show'} Citation Info
            </Button>

            {showCitation && (
                <Box>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Deep Learning Paper
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Ian Goodfellow, Yoshua Bengio, Aaron Courville
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Deep learning is a form of machine learning that enables computers to learn from experience and understand the world in terms of a hierarchy of concepts...
                            </Typography>
                            
                            {/* Compact Citation Display */}
                            <CitationInfoComponent 
                                citationInfo={mockCitationInfo} 
                                compact={true} 
                            />
                        </CardContent>
                    </Card>

                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI: A Modern Approach
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Stuart Russell, Peter Norvig
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                This is the most comprehensive, up-to-date introduction to the theory and practice of artificial intelligence...
                            </Typography>
                            
                            {/* Full Citation Display */}
                            <CitationInfoComponent 
                                citationInfo={mockCitationInfo2} 
                                compact={false} 
                            />
                        </CardContent>
                    </Card>
                </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2">
                    <strong>Test Instructions:</strong><br/>
                    1. Click "Show Citation Info" to see citation displays<br/>
                    2. First card shows compact view (chips)<br/>
                    3. Second card shows full view (detailed stats)<br/>
                    4. Check browser console for any errors
                </Typography>
            </Box>
        </Box>
    );
};

export default CitationTest;
