import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
    History as HistoryIcon,
    Description as DocumentIcon,
    TrendingUp as TrendIcon,
    Person as PersonIcon,
    Assessment as LiteratureIcon,
    MenuBook as LibraryIcon,
} from '@mui/icons-material';

const Navbar: React.FC = () => {
    const navigate = useNavigate();

    return (
        <AppBar position="static" color="primary">
            <Container maxWidth="lg">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        AkademiRadar
                    </Typography>

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            color="inherit"
                            startIcon={<HistoryIcon />}
                            onClick={() => navigate('/search-history')}
                        >
                            Arama Geçmişi
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<DocumentIcon />}
                            onClick={() => navigate('/viewed-documents')}
                        >
                            İncelenen Dokümanlar
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<TrendIcon />}
                            onClick={() => navigate('/trend-analysis')}
                        >
                            Trend Analizi
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<PersonIcon />}
                            onClick={() => navigate('/author-search')}
                        >
                            Yazar Arama
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<LiteratureIcon />}
                            onClick={() => navigate('/literature-gap')}
                        >
                            Literatür Boşluğu
                        </Button>
                        <Button
                            color="inherit"
                            startIcon={<LibraryIcon />}
                            onClick={() => navigate('/library-search')}
                        >
                            Kütüphane Arama
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
