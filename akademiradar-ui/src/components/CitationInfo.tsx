import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Tooltip,
    IconButton,
    Divider,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    School as SchoolIcon,
    Info as InfoIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import { CitationInfo } from '../types';

interface CitationInfoProps {
    citationInfo: CitationInfo;
    compact?: boolean;
}

const CitationInfoComponent: React.FC<CitationInfoProps> = ({ 
    citationInfo, 
    compact = false 
}) => {
    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toString();
    };

    const getCitationColor = (count: number) => {
        if (count >= 100) return 'success';
        if (count >= 50) return 'warning';
        if (count >= 10) return 'info';
        return 'default';
    };

    const getHIndexColor = (hIndex: number) => {
        if (hIndex >= 20) return 'success';
        if (hIndex >= 10) return 'warning';
        if (hIndex >= 5) return 'info';
        return 'default';
    };

    if (compact) {
        return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                    icon={<TrendingUpIcon />}
                    label={`${formatNumber(citationInfo.citationCount)} atıf`}
                    size="small"
                    color={getCitationColor(citationInfo.citationCount)}
                    variant="outlined"
                />
                
                {citationInfo.hIndex && citationInfo.hIndex > 0 && (
                    <Chip
                        icon={<SchoolIcon />}
                        label={`H-Index: ${citationInfo.hIndex}`}
                        size="small"
                        color={getHIndexColor(citationInfo.hIndex)}
                        variant="outlined"
                    />
                )}

                {citationInfo.sources.length > 0 && (
                    <Tooltip title={`Kaynaklar: ${citationInfo.sources.join(', ')}`}>
                        <Chip
                            label={`${citationInfo.sources.length} kaynak`}
                            size="small"
                            variant="outlined"
                        />
                    </Tooltip>
                )}

                {citationInfo.isMockData && (
                    <Tooltip title="Bu veriler simüle edilmiştir">
                        <Chip
                            label="Demo"
                            size="small"
                            color="secondary"
                            variant="outlined"
                        />
                    </Tooltip>
                )}
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    Akademik Etki
                </Typography>
                {citationInfo.isMockData && (
                    <Tooltip title="Bu veriler simüle edilmiştir - gerçek API entegrasyonu için geliştirme devam ediyor">
                        <IconButton size="small" sx={{ ml: 1 }}>
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatNumber(citationInfo.citationCount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Toplam Atıf
                    </Typography>
                </Box>

                {citationInfo.hIndex && citationInfo.hIndex > 0 && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary" fontWeight="bold">
                            {citationInfo.hIndex}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            H-Index
                        </Typography>
                    </Box>
                )}

                {citationInfo.details.influentialCitationCount && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                            {formatNumber(citationInfo.details.influentialCitationCount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Etkili Atıf
                        </Typography>
                    </Box>
                )}

                {citationInfo.details.recentCitations && (
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main" fontWeight="bold">
                            {formatNumber(citationInfo.details.recentCitations)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Son Atıflar
                        </Typography>
                    </Box>
                )}
            </Box>

            {citationInfo.details.citationVelocity && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimelineIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        Atıf Hızı: {citationInfo.details.citationVelocity} atıf/yıl
                    </Typography>
                </Box>
            )}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    Kaynaklar:
                </Typography>
                {citationInfo.sources.map((source, index) => (
                    <Chip
                        key={index}
                        label={source}
                        size="small"
                        variant="outlined"
                        color={source === citationInfo.primarySource ? 'primary' : 'default'}
                    />
                ))}
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Son güncelleme: {new Date(citationInfo.lastUpdated).toLocaleDateString('tr-TR')}
            </Typography>
        </Box>
    );
};

export default CitationInfoComponent;
