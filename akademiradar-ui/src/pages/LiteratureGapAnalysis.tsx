import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControlLabel,
  Switch,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Compare as CompareIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  Science as ScienceIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`literature-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface EvidencePaper {
  title: string;
  authors: string;
  year: string | number;
  journal: string;
  doi?: string;
  url?: string;
  abstract?: string;
  relevanceScore: number;
  citationCount: number;
}

interface SourceLink {
  id: number;
  title: string;
  authors: string;
  year: string | number;
  doi?: string;
  doiUrl?: string;
  url?: string;
  arxivId?: string;
  arxivUrl?: string;
  pmid?: string;
  pubmedUrl?: string;
  googleScholarUrl?: string;
}

interface AuthorSuggestion {
  suggestion: string;
  source: string;
  authors: string;
  year: string | number;
  confidence: 'high' | 'medium' | 'low';
  category: string;
}

interface PublicationBreakdown {
  topicSpecific: number;
  contentAnalysis: number;
  gapKeywords: number;
  methodological: number;
  temporal: number;
  citation: number;
  uniqueSources: number;
  databases: string[];
  analysisTypes: string[];
}

interface GapAnalysisResult {
  success: boolean;
  topic: string;
  totalGapsFound: number;
  totalAnalyzedPublications: number;
  publicationBreakdown: PublicationBreakdown;
  gapAnalysis: {
    identifiedGaps: Array<{
      type: string;
      title: string;
      description: string;
      areas: string[];
      severity: 'high' | 'medium' | 'low';
      opportunity: string;
      evidence: string;
      evidencePapers?: EvidencePaper[];
      sourceLinks?: SourceLink[];
      authorSuggestions?: AuthorSuggestion[];
      futureWorkSuggestions?: any[];
    }>;
    overallScore: number;
    priorityAreas: string[];
    researchOpportunities: string[];
  };
}

interface TrendAnalysisResult {
  success: boolean;
  topic: string;
  trendAnalysis: {
    publicationTrends: {
      growthRate: number;
      trendDirection: string;
    };
    keywordTrends: {
      emergingKeywords: Array<{ keyword: string; growth: number }>;
      decliningKeywords: Array<{ keyword: string; growth: number }>;
    };
    emergingAreas: string[];
    hotTopics: string[];
  };
}

const LiteratureGapAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Boşluk Analizi State
  const [gapTopic, setGapTopic] = useState('');
  const [gapResult, setGapResult] = useState<GapAnalysisResult | null>(null);
  const [gapOptions, setGapOptions] = useState({
    yearRange: { start: 2019, end: new Date().getFullYear() },
    includePatents: false,
    maxResults: 500
  });

  // Trend Analizi State
  const [trendTopic, setTrendTopic] = useState('');
  const [trendResult, setTrendResult] = useState<TrendAnalysisResult | null>(null);
  const [trendOptions, setTrendOptions] = useState({
    yearRange: { start: 2018, end: new Date().getFullYear() },
    includePreprints: true,
    includeConferences: true
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setError(null);
  };

  const performGapAnalysis = async () => {
    if (!gapTopic.trim()) {
      setError('Lütfen analiz edilecek konuyu girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/literature-gap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: gapTopic, options: gapOptions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setGapResult(data);
      } else {
        setError(data.error || 'Analiz sırasında hata oluştu');
        // Fallback data kullan
        if (data.fallbackData) {
          setGapResult({
            success: true,
            topic: gapTopic,
            totalGapsFound: data.fallbackData.identifiedGaps?.length || 1,
            totalAnalyzedPublications: 0,
            publicationBreakdown: {
              topicSpecific: 0,
              contentAnalysis: 0,
              gapKeywords: 0,
              methodological: 0,
              temporal: 0,
              citation: 0,
              uniqueSources: 0,
              databases: [],
              analysisTypes: []
            },
            gapAnalysis: {
              identifiedGaps: data.fallbackData.identifiedGaps || [{
                type: 'methodological',
                title: 'Metodolojik Boşluk',
                description: `${gapTopic} alanında nitel araştırma yöntemleri yetersiz`,
                areas: ['nitel analiz', 'karma yöntem'],
                severity: 'medium' as const,
                opportunity: 'Karma yöntem araştırmaları yapma fırsatı',
                evidence: 'Mock fallback veri kullanılıyor'
              }],
              overallScore: data.fallbackData.overallScore || 0.7,
              priorityAreas: data.fallbackData.priorityAreas || [`${gapTopic} - nitel analiz`],
              researchOpportunities: data.fallbackData.researchOpportunities || ['Karma yöntem çalışmaları', 'Longitudinal araştırmalar']
            }
          });
        }
      }
    } catch (error) {
      console.error('API çağrısı hatası:', error);
      setError('Sunucuya bağlanırken hata oluştu. Mock data kullanılıyor.');
      // Mock data sağla
      setGapResult({
        success: true,
        topic: gapTopic,
        totalGapsFound: 2,
        totalAnalyzedPublications: 0,
        publicationBreakdown: {
          topicSpecific: 0,
          contentAnalysis: 0,
          gapKeywords: 0,
          methodological: 0,
          temporal: 0,
          citation: 0,
          uniqueSources: 0,
          databases: [],
          analysisTypes: []
        },
        gapAnalysis: {
          identifiedGaps: [
            {
              type: 'theoretical',
              title: 'Teorik Boşluk',
              description: `${gapTopic} alanında teorik çerçeve eksikliği`,
              areas: ['kavramsal model', 'teorik temel'],
              severity: 'high' as const,
              opportunity: 'Yeni teorik modeller geliştirme fırsatı',
              evidence: 'Mock veri - gerçek analiz için backend bağlantısı gerekli'
            },
            {
              type: 'methodological',
              title: 'Metodolojik Boşluk',
              description: `${gapTopic} alanında yöntem çeşitliliği yetersiz`,
              areas: ['nitel yöntemler', 'karma yaklaşım'],
              severity: 'medium' as const,
              opportunity: 'Yenilikçi araştırma yöntemleri uygulama',
              evidence: 'Mock veri - gerçek analiz için backend bağlantısı gerekli'
            }
          ],
          overallScore: 0.75,
          priorityAreas: [`${gapTopic} teorik geliştirme`, `${gapTopic} metodoloji`],
          researchOpportunities: [
            'Teorik model geliştirme',
            'Karma yöntem araştırmaları',
            'Disiplinlerarası yaklaşımlar'
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const performTrendAnalysis = async () => {
    if (!trendTopic.trim()) {
      setError('Lütfen analiz edilecek konuyu girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/literature-gap/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trendTopic, options: trendOptions }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTrendResult(data);
      } else {
        setError(data.error || 'Trend analizi sırasında hata oluştu');
        if (data.fallbackData) {
          setTrendResult({ success: true, topic: trendTopic, trendAnalysis: data.fallbackData });
        }
      }
    } catch (error) {
      console.error('Trend analizi API hatası:', error);
      setError('Sunucuya bağlanırken hata oluştu. Mock data kullanılıyor.');
      // Mock trend data sağla
      setTrendResult({
        success: true,
        topic: trendTopic,
        trendAnalysis: {
          publicationTrends: {
            growthRate: 15.5,
            trendDirection: 'increasing'
          },
          keywordTrends: {
            emergingKeywords: [
              { keyword: `${trendTopic} + AI`, growth: 120 },
              { keyword: `${trendTopic} + automation`, growth: 95 },
              { keyword: `${trendTopic} + sustainability`, growth: 80 }
            ],
            decliningKeywords: [
              { keyword: `traditional ${trendTopic}`, growth: -25 },
              { keyword: `manual ${trendTopic}`, growth: -15 }
            ]
          },
          emergingAreas: [
            `${trendTopic} + yapay zeka`,
            `${trendTopic} + sürdürülebilirlik`,
            `${trendTopic} + otomasyon`
          ],
          hotTopics: [
            `akıllı ${trendTopic}`,
            `dijital ${trendTopic}`,
            `yenilikçi ${trendTopic}`
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <WarningIcon />;
      case 'medium': return <AssessmentIcon />;
      case 'low': return <CheckCircleIcon />;
      default: return <LightbulbIcon />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        📚 Literatür Boşluğu Analiz Sistemi
      </Typography>
      
      <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Akademik literatürde boşlukları tespit edin, trendleri analiz edin ve karşılaştırmalar yapın
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab icon={<SearchIcon />} label="Boşluk Analizi" />
          <Tab icon={<TrendingUpIcon />} label="Trend Analizi" />
          <Tab icon={<CompareIcon />} label="Karşılaştırma" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Boşluk Analizi Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Analiz Parametreleri
                </Typography>
                
                <TextField
                  fullWidth
                  label="Araştırma Konusu"
                  value={gapTopic}
                  onChange={(e) => setGapTopic(e.target.value)}
                  placeholder="Örn: yapay zeka etiği, iklim değişikliği tarım"
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Başlangıç Yılı"
                      type="number"
                      value={gapOptions.yearRange.start}
                      onChange={(e) => setGapOptions({
                        ...gapOptions,
                        yearRange: { ...gapOptions.yearRange, start: parseInt(e.target.value) }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Bitiş Yılı"
                      type="number"
                      value={gapOptions.yearRange.end}
                      onChange={(e) => setGapOptions({
                        ...gapOptions,
                        yearRange: { ...gapOptions.yearRange, end: parseInt(e.target.value) }
                      })}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={
                    <Switch
                      checked={gapOptions.includePatents}
                      onChange={(e) => setGapOptions({
                        ...gapOptions,
                        includePatents: e.target.checked
                      })}
                    />
                  }
                  label="Patentleri Dahil Et"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={performGapAnalysis}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                >
                  {loading ? 'Analiz Ediliyor...' : 'Boşluk Analizi Başlat'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {gapResult && (
              <Box>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      📊 Analiz Sonuçları: {gapResult.topic}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {gapResult.totalGapsFound}
                          </Typography>
                          <Typography variant="body2">Tespit Edilen Boşluk</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {Math.round(gapResult.totalAnalyzedPublications || 0)}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>Analiz Edilen Yayın</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary">
                            {Math.round(gapResult.gapAnalysis.overallScore * 100)}%
                          </Typography>
                          <Typography variant="body2">Genel Boşluk Skoru</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {gapResult.gapAnalysis.priorityAreas.length}
                          </Typography>
                          <Typography variant="body2">Öncelikli Alan</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    {/* Yayın Dağılımı */}
                    {gapResult.publicationBreakdown && (
                      <Card sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            📈 Yayın Dağılımı
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" gutterBottom>
                                📚 Benzersiz Kaynak: <strong>{gapResult.publicationBreakdown.uniqueSources}</strong>
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                🔍 Konuya Özgü: <strong>{gapResult.publicationBreakdown.topicSpecific}</strong>
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                📝 İçerik Analizi: <strong>{gapResult.publicationBreakdown.contentAnalysis}</strong>
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" gutterBottom>
                                📊 Veritabanları:
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {gapResult.publicationBreakdown.databases.map((db, idx) => (
                                  <Chip key={idx} label={db} size="small" sx={{ mr: 1, mb: 1 }} />
                                ))}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    )}

                    <LinearProgress 
                      variant="determinate" 
                      value={gapResult.gapAnalysis.overallScore * 100}
                      sx={{ mb: 2, height: 8, borderRadius: 4 }}
                    />
                  </CardContent>
                </Card>

                {gapResult.gapAnalysis.identifiedGaps.map((gap, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {getSeverityIcon(gap.severity)}
                        <Typography sx={{ ml: 1, flexGrow: 1 }}>
                          {gap.title}
                        </Typography>
                        <Chip 
                          label={gap.severity} 
                          color={getSeverityColor(gap.severity) as any}
                          size="small"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography paragraph>
                        {gap.description}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        🎯 Fırsat:
                      </Typography>
                      <Typography paragraph color="success.main">
                        {gap.opportunity}
                      </Typography>
                      
                      {gap.evidence && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            📊 Kanıt:
                          </Typography>
                          <Typography paragraph color="text.secondary">
                            {gap.evidence}
                          </Typography>
                        </>
                      )}

                      {gap.areas.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            📍 İlgili Alanlar:
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {gap.areas.map((area, areaIndex) => (
                              <Chip 
                                key={areaIndex} 
                                label={area} 
                                variant="outlined" 
                                size="small" 
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        </>
                      )}
                      
                      {/* Kanıt Makaleleri */}
                      {gap.evidencePapers && gap.evidencePapers.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            📚 Kanıt Makaleleri ({gap.evidencePapers.length} adet):
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {gap.evidencePapers.map((paper, paperIndex) => (
                              <Card key={paperIndex} variant="outlined" sx={{ mb: 1, p: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {paper.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {paper.authors} ({paper.year}) - {paper.journal}
                                </Typography>
                                {paper.abstract && (
                                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    {paper.abstract}
                                  </Typography>
                                )}
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                  <Chip label={`Atıf: ${paper.citationCount}`} size="small" sx={{ mr: 1 }} />
                                  <Chip label={`Relevans: ${Math.round(paper.relevanceScore * 100)}%`} size="small" color="primary" />
                                  {paper.doi && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`} 
                                      target="_blank"
                                      sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                                    >
                                      📄 DOI
                                    </Button>
                                  )}
                                  {paper.url && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={paper.url} 
                                      target="_blank"
                                      sx={{ textTransform: 'none', minWidth: 'auto', px: 1 }}
                                    >
                                      🔗 Makale
                                    </Button>
                                  )}
                                </Box>
                              </Card>
                            ))}
                          </Box>
                        </>
                      )}
                      
                      {/* Kaynak Linkleri */}
                      {gap.sourceLinks && gap.sourceLinks.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            🔗 Erişilebilir Linkler ({gap.sourceLinks.length} adet):
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {gap.sourceLinks.map((link, linkIndex) => (
                              <Card key={linkIndex} variant="outlined" sx={{ mb: 1, p: 2 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {link.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {link.authors} ({link.year})
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  {link.doiUrl && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={link.doiUrl} 
                                      target="_blank"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      📄 DOI
                                    </Button>
                                  )}
                                  {link.url && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={link.url} 
                                      target="_blank"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      🔗 URL
                                    </Button>
                                  )}
                                  {link.arxivUrl && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={link.arxivUrl} 
                                      target="_blank"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      📜 ArXiv
                                    </Button>
                                  )}
                                  {link.pubmedUrl && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={link.pubmedUrl} 
                                      target="_blank"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      🧬 PubMed
                                    </Button>
                                  )}
                                  {link.googleScholarUrl && (
                                    <Button 
                                      size="small" 
                                      variant="outlined" 
                                      href={link.googleScholarUrl} 
                                      target="_blank"
                                      sx={{ textTransform: 'none' }}
                                    >
                                      🔍 Scholar
                                    </Button>
                                  )}
                                </Box>
                              </Card>
                            ))}
                          </Box>
                        </>
                      )}
                      
                      {/* Yazar Önerileri */}
                      {gap.authorSuggestions && gap.authorSuggestions.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                            💡 Yazar Önerileri ({gap.authorSuggestions.length} adet):
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {gap.authorSuggestions.map((suggestion, suggestionIndex) => (
                              <Card key={suggestionIndex} variant="outlined" sx={{ mb: 1, p: 2, bgcolor: 'success.50' }}>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {suggestion.suggestion}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Kaynak: {suggestion.source} ({suggestion.year}) - {suggestion.authors}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  <Chip 
                                    label={suggestion.confidence} 
                                    size="small" 
                                    color={suggestion.confidence === 'high' ? 'success' : suggestion.confidence === 'medium' ? 'warning' : 'default'}
                                    sx={{ mr: 1 }}
                                  />
                                  <Chip label={suggestion.category} size="small" variant="outlined" />
                                </Box>
                              </Card>
                            ))}
                          </Box>
                        </>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}

                {gapResult.gapAnalysis.researchOpportunities.length > 0 && (
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        <LightbulbIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Araştırma Fırsatları
                      </Typography>
                      <List>
                        {gapResult.gapAnalysis.researchOpportunities.map((opportunity, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={opportunity} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Trend Analizi Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Trend Analiz Parametreleri
                </Typography>
                
                <TextField
                  fullWidth
                  label="Araştırma Konusu"
                  value={trendTopic}
                  onChange={(e) => setTrendTopic(e.target.value)}
                  placeholder="Örn: makine öğrenmesi, biyoinformatik"
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Başlangıç Yılı"
                      type="number"
                      value={trendOptions.yearRange.start}
                      onChange={(e) => setTrendOptions({
                        ...trendOptions,
                        yearRange: { ...trendOptions.yearRange, start: parseInt(e.target.value) }
                      })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Bitiş Yılı"
                      type="number"
                      value={trendOptions.yearRange.end}
                      onChange={(e) => setTrendOptions({
                        ...trendOptions,
                        yearRange: { ...trendOptions.yearRange, end: parseInt(e.target.value) }
                      })}
                    />
                  </Grid>
                </Grid>

                <FormControlLabel
                  control={
                    <Switch
                      checked={trendOptions.includePreprints}
                      onChange={(e) => setTrendOptions({
                        ...trendOptions,
                        includePreprints: e.target.checked
                      })}
                    />
                  }
                  label="Preprint'leri Dahil Et"
                  sx={{ mb: 2 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={performTrendAnalysis}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                >
                  {loading ? 'Analiz Ediliyor...' : 'Trend Analizi Başlat'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {trendResult && (
              <Box>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      📈 Trend Analizi: {trendResult.topic}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {trendResult.trendAnalysis.publicationTrends?.growthRate?.toFixed(1) || 'N/A'}%
                          </Typography>
                          <Typography variant="body2">Büyüme Oranı</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary">
                            {trendResult.trendAnalysis.emergingAreas?.length || 0}
                          </Typography>
                          <Typography variant="body2">Gelişen Alan</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {trendResult.trendAnalysis.hotTopics?.length || 0}
                          </Typography>
                          <Typography variant="body2">Sıcak Konu</Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Chip 
                      label={`Trend: ${trendResult.trendAnalysis.publicationTrends?.trendDirection || 'Belirsiz'}`}
                      color={
                        trendResult.trendAnalysis.publicationTrends?.trendDirection === 'increasing' ? 'success' :
                        trendResult.trendAnalysis.publicationTrends?.trendDirection === 'decreasing' ? 'error' : 'default'
                      }
                      icon={<TimelineIcon />}
                    />
                  </CardContent>
                </Card>

                {trendResult.trendAnalysis.keywordTrends?.emergingKeywords && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🚀 Gelişen Anahtar Kelimeler
                      </Typography>
                      <Box>
                        {trendResult.trendAnalysis.keywordTrends.emergingKeywords.map((keyword, index) => (
                          <Chip
                            key={index}
                            label={`${keyword.keyword} (+${keyword.growth}%)`}
                            color="success"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {trendResult.trendAnalysis.emergingAreas && trendResult.trendAnalysis.emergingAreas.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        🌟 Gelişen Araştırma Alanları
                      </Typography>
                      <List>
                        {trendResult.trendAnalysis.emergingAreas.map((area, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ScienceIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={area} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Karşılaştırma Tab - Basit versiyon */}
      <TabPanel value={activeTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              🔄 Karşılaştırma Analizi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bu özellik yakında eklenecek. Şu an için Boşluk Analizi ve Trend Analizi özelliklerini kullanabilirsiniz.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default LiteratureGapAnalysis;
