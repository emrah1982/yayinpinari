import React, { useState } from 'react';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Chip,
  Alert,
  Grid,
  Paper,
  CircularProgress,
  Container,
  Stack,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  BarChart as BarChartIcon,
  Search,
  CalendarToday,
  Lightbulb,
  Delete,
  AccessTime,
  MenuBook,
  Groups,
  MonetizationOn
} from '@mui/icons-material';

interface TrendData {
  query: string;
  summary: {
    totalPublications: number;
    totalProjects: number;
    totalFunding: number;
    trendType: string;
    growthRate: number;
    peakYear: string | null;
    topFunders: Array<{name: string; publications: number; totalAmount: number}>;
    topCountries: Array<{country: string; publications: number}>;
  };
  yearlyData: Record<string, {
    publications: number;
    projects: number;
    funding: number;
    citations: number;
  }>;
  insights: Array<{type: string; level: string; message: string}>;
  recommendations: Array<{type: string; priority: string; message: string}>;
  sources: string[];
}

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
      id={`trend-tabpanel-${index}`}
      aria-labelledby={`trend-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Simple Chart Component using Canvas
const SimpleLineChart: React.FC<{
  data: Array<{year: number; publications: number; citations: number; projects?: number; funding?: number}>;
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 300 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{x: number; y: number; data: any} | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Data preparation
    const years = data.map(d => d.year);
    const publications = data.map(d => d.publications);
    const citations = data.map(d => d.citations);

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const maxPub = Math.max(...publications);
    const maxCit = Math.max(...citations);

    // Scale functions
    const scaleX = (year: number) => margin.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
    const scaleYPub = (pub: number) => margin.top + ((maxPub - pub) / maxPub) * chartHeight;
    const scaleYCit = (cit: number) => margin.top + ((maxCit - cit) / maxCit) * chartHeight;

    // Draw axes
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Draw publications line
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = scaleX(point.year);
      const y = scaleYPub(point.publications);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw citations line
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, index) => {
      const x = scaleX(point.year);
      const y = scaleYCit(point.citations);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw data points
    data.forEach(point => {
      const x = scaleX(point.year);
      const yPub = scaleYPub(point.publications);
      const yCit = scaleYCit(point.citations);

      // Publications points
      ctx.fillStyle = '#1976d2';
      ctx.beginPath();
      ctx.arc(x, yPub, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Citations points
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath();
      ctx.arc(x, yCit, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // X axis labels
    years.forEach(year => {
      const x = scaleX(year);
      ctx.fillText(year.toString(), x, height - margin.bottom + 15);
    });

  }, [data, width, height]);

  // Mouse hover olayları
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;

    const years = data.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // En yakın veri noktasını bul
    let closestPoint = null;
    let minDistance = Infinity;

    data.forEach(point => {
      const x = margin.left + ((point.year - minYear) / (maxYear - minYear)) * chartWidth;
      const distance = Math.abs(mouseX - x);
      
      if (distance < minDistance && distance < 30) { // 30px tolerance
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint) {
      setTooltip({
        x: mouseX,
        y: mouseY,
        data: closestPoint
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      />
      
      {/* Tooltip */}
      {tooltip && (
        <Box
          sx={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
            {tooltip.data.year} Yılı
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: '#90caf9' }}>
            📚 Yayınlar: {tooltip.data.publications}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: '#a5d6a7' }}>
            📖 Atıflar: {tooltip.data.citations}
          </Typography>
          {tooltip.data.projects !== undefined && (
            <>
              <br />
              <Typography variant="caption" sx={{ color: '#ffcc02' }}>
                🏗️ Projeler: {tooltip.data.projects}
              </Typography>
            </>
          )}
          {tooltip.data.funding !== undefined && (
            <>
              <br />
              <Typography variant="caption" sx={{ color: '#ff9800' }}>
                💰 Fonlama: {(tooltip.data.funding / 1000000).toFixed(1)}M €
              </Typography>
            </>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 2, bgcolor: '#1976d2' }} />
          <Typography variant="caption">Yayınlar</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 2, bgcolor: '#2e7d32' }} />
          <Typography variant="caption">Atıflar</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const SimpleBarChart: React.FC<{
  data: Array<{year: number; projects: number; funding: number; publications?: number; citations?: number}>;
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 300 }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{x: number; y: number; data: any} | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Data preparation
    const years = data.map(d => d.year);
    const projects = data.map(d => d.projects);
    const funding = data.map(d => d.funding);

    const maxProjects = Math.max(...projects);
    const maxFunding = Math.max(...funding);

    const barWidth = chartWidth / (years.length * 2.5);

    // Draw axes
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.stroke();

    // Draw bars
    data.forEach((point, index) => {
      const x = margin.left + (index * chartWidth) / years.length;
      
      // Projects bars
      const projectHeight = (point.projects / maxProjects) * chartHeight;
      ctx.fillStyle = '#ffc658';
      ctx.fillRect(x, height - margin.bottom - projectHeight, barWidth, projectHeight);

      // Funding bars
      const fundingHeight = (point.funding / maxFunding) * chartHeight;
      ctx.fillStyle = '#ff7300';
      ctx.fillRect(x + barWidth + 2, height - margin.bottom - fundingHeight, barWidth, fundingHeight);

      // Year labels
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.year.toString(), x + barWidth, height - margin.bottom + 15);
    });

  }, [data, width, height]);

  // Mouse hover olayları
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Chart margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const barWidth = chartWidth / data.length * 0.8;

    // Hangi bar'ın üzerinde olduğumuzu bul
    let hoveredData = null;
    data.forEach((point, index) => {
      const x = margin.left + (index * chartWidth / data.length) + (chartWidth / data.length - barWidth) / 2;
      
      if (mouseX >= x && mouseX <= x + barWidth && mouseY >= margin.top && mouseY <= height - margin.bottom) {
        hoveredData = point;
      }
    });

    if (hoveredData) {
      setTooltip({
        x: mouseX,
        y: mouseY,
        data: hoveredData
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: 'crosshair' }}
      />
      
      {/* Tooltip */}
      {tooltip && (
        <Box
          sx={{
            position: 'absolute',
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'white' }}>
            {tooltip.data.year} Yılı
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: '#ffc658' }}>
            🏗️ Projeler: {tooltip.data.projects}
          </Typography>
          <br />
          <Typography variant="caption" sx={{ color: '#ff7300' }}>
            💰 Fonlama: {(tooltip.data.funding / 1000000).toFixed(1)}M €
          </Typography>
          {tooltip.data.publications !== undefined && (
            <>
              <br />
              <Typography variant="caption" sx={{ color: '#90caf9' }}>
                📚 Yayınlar: {tooltip.data.publications}
              </Typography>
            </>
          )}
          {tooltip.data.citations !== undefined && (
            <>
              <br />
              <Typography variant="caption" sx={{ color: '#a5d6a7' }}>
                📖 Atıflar: {tooltip.data.citations}
              </Typography>
            </>
          )}
        </Box>
      )}
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#ffc658' }} />
          <Typography variant="caption">Projeler</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, bgcolor: '#ff7300' }} />
          <Typography variant="caption">Fonlama (M€)</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const TrendAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [startYear, setStartYear] = useState(2019);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [quickQuery, setQuickQuery] = useState('');
  const [quickSummary, setQuickSummary] = useState<any>(null);
  const [keywords, setKeywords] = useState<string[]>(['']);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleComprehensiveAnalysis = async () => {
    if (!query.trim()) {
      setError('Lütfen bir arama sorgusu girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/trend-analysis/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          startYear: startYear,
          endYear: endYear,
          includeProjects: true,
          includeFunding: true,
          includeCitations: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setTrendData(result.data);
      } else {
        throw new Error('Geçersiz API yanıtı');
      }
    } catch (err: any) {
      console.error('Trend analysis error:', err);
      setError(err.message || 'Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSummary = async () => {
    if (!quickQuery.trim()) {
      setError('Lütfen bir arama sorgusu girin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/api/trend-analysis/quick-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: quickQuery.trim(),
          years: 5,
          includeKeywords: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API isteği başarısız oldu');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setQuickSummary(result.data);
      } else {
        throw new Error('Geçersiz API yanıtı');
      }
    } catch (err: any) {
      console.error('Quick summary error:', err);
      setError(err.message || 'Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case 'rising':
      case 'rapidly_growing':
      case 'growing':
        return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'declining':
        return <TrendingDown sx={{ color: 'error.main' }} />;
      default:
        return <BarChartIcon sx={{ color: 'primary.main' }} />;
    }
  };

  const getTrendColor = (trendType: string): "success" | "error" | "primary" => {
    switch (trendType) {
      case 'rising':
      case 'rapidly_growing':
      case 'growing':
        return 'success';
      case 'declining':
        return 'error';
      default:
        return 'primary';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M €`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K €`;
    return `${amount} €`;
  };

  const prepareChartData = (yearlyData: Record<string, any>, startYear?: number, endYear?: number) => {
    // Eğer başlangıç ve bitiş yılı belirtilmişse, tüm yılları dahil et
    if (startYear && endYear) {
      const allYears: Array<{year: number; publications: number; projects: number; citations: number; funding: number}> = [];
      
      for (let year = startYear; year <= endYear; year++) {
        const data = yearlyData[year.toString()] || {};
        allYears.push({
          year: year,
          publications: data.publications || 0,
          projects: data.projects || 0,
          citations: data.citations || 0,
          funding: (data.funding || 0) / 1000000
        });
      }
      
      return allYears;
    }
    
    // Eğer yıl aralığı belirtilmemişse, sadece mevcut verileri kullan
    return Object.entries(yearlyData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, data]) => ({
        year: parseInt(year),
        publications: data.publications || 0,
        projects: data.projects || 0,
        citations: data.citations || 0,
        funding: (data.funding || 0) / 1000000
      }));
  };

  const addKeyword = () => {
    if (keywords.length < 5) setKeywords([...keywords, '']);
  };

// ... (diğer kodlar)
  const removeKeyword = (index: number) => {
    if (keywords.length > 1) setKeywords(keywords.filter((_, i) => i !== index));
  };

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords];
    newKeywords[index] = value;
    setKeywords(newKeywords);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          📊 Akademik Trend Analizi
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Akademik konuların, anahtar kelimelerin ve araştırma alanlarının zaman içindeki gelişimini analiz edin
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" component="div">
            Hata
          </Typography>
          {error}
        </Alert>
      )}

      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="trend analysis tabs">
            <Tab label="Kapsamlı Analiz" />
            <Tab label="Hızlı Özet" />
            <Tab label="Kelime Karşılaştırma" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Stack spacing={3}>
            <Card elevation={2}>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BarChartIcon color="primary" />
                    <Typography variant="h6">Kapsamlı Trend Analizi</Typography>
                  </Stack>
                }
              />
              <CardContent>
                <Stack spacing={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Arama Sorgusu
                      </Typography>
                      <TextField
                        fullWidth
                        value={query}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                        placeholder="Örn: yapay zeka, iklim değişikliği"
                        disabled={loading}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Başlangıç Yılı
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={startYear}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartYear(parseInt(e.target.value))}
                        inputProps={{ min: 2000, max: endYear }}
                        disabled={loading}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Bitiş Yılı
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={endYear}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndYear(parseInt(e.target.value))}
                        inputProps={{ min: startYear, max: new Date().getFullYear() }}
                        disabled={loading}
                        size="small"
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                  <Button 
                    variant="contained"
                    onClick={handleComprehensiveAnalysis} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <Search />}
                    sx={{ alignSelf: 'flex-start' }}
                    size="large"
                  >
                    {loading ? 'Analiz Ediliyor...' : 'Analizi Başlat'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {trendData && (
              <Stack spacing={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Toplam Yayın</Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {trendData.summary.totalPublications.toLocaleString()}
                            </Typography>
                          </Box>
                          <MenuBook sx={{ fontSize: 40, opacity: 0.8 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Toplam Proje</Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {trendData.summary.totalProjects.toLocaleString()}
                            </Typography>
                          </Box>
                          <Groups sx={{ fontSize: 40, opacity: 0.8 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Toplam Fonlama</Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {formatCurrency(trendData.summary.totalFunding)}
                            </Typography>
                          </Box>
                          <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} lg={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                      <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>Büyüme Oranı</Typography>
                            <Typography variant="h4" fontWeight="bold">
                              {trendData.summary.growthRate}%
                            </Typography>
                          </Box>
                          {getTrendIcon(trendData.summary.trendType)}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={getTrendIcon(trendData.summary.trendType)}
                    label={
                      trendData.summary.trendType === 'rising' ? 'Yükselen Trend' :
                      trendData.summary.trendType === 'declining' ? 'Azalan Trend' :
                      'Stabil Trend'
                    }
                    color={getTrendColor(trendData.summary.trendType)}
                    variant="filled"
                    size="medium"
                  />
                  {trendData.summary.peakYear && (
                    <Chip
                      icon={<CalendarToday />}
                      label={`Zirve: ${trendData.summary.peakYear}`}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                </Stack>

                <Grid container spacing={3}>
                  <Grid item xs={12} lg={6}>
                    <Card elevation={2}>
                      <CardHeader title="Yıllık Yayın Trendi" />
                      <CardContent>
                        <SimpleLineChart 
                          data={prepareChartData(trendData.yearlyData, startYear, endYear)} 
                          width={500} 
                          height={300} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} lg={6}>
                    <Card elevation={2}>
                      <CardHeader title="Fonlama ve Proje Trendi" />
                      <CardContent>
                        <SimpleBarChart 
                          data={prepareChartData(trendData.yearlyData, startYear, endYear)} 
                          width={500} 
                          height={300} 
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {trendData.insights.length > 0 && (
                  <Card elevation={2}>
                    <CardHeader
                      title={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Lightbulb color="warning" />
                          <Typography variant="h6">İçgörüler</Typography>
                        </Stack>
                      }
                    />
                    <CardContent>
                      <Stack spacing={2}>
                        {trendData.insights.map((insight, index) => (
                          <Alert 
                            key={index} 
                            severity={
                              insight.level === 'positive' ? 'success' :
                              insight.level === 'warning' ? 'warning' :
                              'info'
                            }
                          >
                            {insight.message}
                          </Alert>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}
          </Stack>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            <Card elevation={2}>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTime color="primary" />
                    <Typography variant="h6">Hızlı Trend Özeti</Typography>
                  </Stack>
                }
              />
              <CardContent>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    value={quickQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickQuery(e.target.value)}
                    placeholder="Arama sorgusu girin..."
                    disabled={loading}
                    size="small"
                    variant="outlined"
                  />
                  <Button 
                    variant="contained"
                    onClick={handleQuickSummary} 
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <Search />}
                  >
                    Ara
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {quickSummary && (
              <Card elevation={2}>
                <CardHeader title={`"${quickSummary.query}" Trend Özeti`} />
                <CardContent>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white'
                      }}>
                        <Typography variant="h3" fontWeight="bold">
                          {quickSummary.totalPublications?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Toplam Yayın</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white'
                      }}>
                        <Typography variant="h3" fontWeight="bold">
                          {quickSummary.recentActivity?.toLocaleString() || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Son 3 Yıl</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white'
                      }}>
                        <Typography variant="h4" fontWeight="bold">
                          {quickSummary.timespan || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Zaman Aralığı</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Alert severity="info" sx={{ fontSize: '1rem' }}>
                    {quickSummary.quickInsight || 'Analiz tamamlandı'}
                  </Alert>
                </CardContent>
              </Card>
            )}
          </Stack>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            <Card elevation={2}>
              <CardHeader
                title={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <BarChartIcon color="primary" />
                    <Typography variant="h6">Anahtar Kelime Karşılaştırması</Typography>
                  </Stack>
                }
              />
              <CardContent>
                <Stack spacing={3}>
                  <Typography variant="subtitle2">
                    Anahtar Kelimeler (En fazla 5)
                  </Typography>
                  {keywords.map((keyword, index) => (
                    <Stack key={index} direction="row" spacing={1}>
                      <TextField
                        fullWidth
                        value={keyword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateKeyword(index, e.target.value)}
                        placeholder={`Anahtar kelime ${index + 1}`}
                        disabled={loading}
                        size="small"
                        variant="outlined"
                      />
                      {keywords.length > 1 && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => removeKeyword(index)}
                          disabled={loading}
                          startIcon={<Delete />}
                          color="error"
                        >
                          Sil
                        </Button>
                      )}
                    </Stack>
                  ))}
                  {keywords.length < 5 && (
                    <Button 
                      variant="outlined" 
                      size="small" 
                      onClick={addKeyword} 
                      disabled={loading}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      + Kelime Ekle
                    </Button>
                  )}
                  
                  <Button 
                    variant="contained"
                    disabled={loading} 
                    fullWidth
                    startIcon={loading ? <CircularProgress size={16} /> : <BarChartIcon />}
                    size="large"
                  >
                    {loading ? 'Karşılaştırılıyor...' : 'Karşılaştır'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default TrendAnalysis;