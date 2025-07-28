import React from 'react';
import {
    Container,
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Paper,
    IconButton,
    Divider
} from '@mui/material';
import { Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearSearchHistory } from '../store/historySlice';
import { useNavigate } from 'react-router-dom';

const SearchHistoryPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const searchHistory = useSelector((state: RootState) => state.history.searchHistory);

    const handleClearHistory = () => {
        dispatch(clearSearchHistory());
    };

    const handleRepeatSearch = (query: string, type: string) => {
        // Arama sayfasına yönlendir ve parametreleri ayarla
        navigate('/', { state: { query, type } });
    };

    return (
        <Container maxWidth="md">
            <Box sx={{ my: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Arama Geçmişi
                    </Typography>
                    <IconButton 
                        onClick={handleClearHistory}
                        color="error"
                        title="Geçmişi Temizle"
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>

                <Paper elevation={2}>
                    <List>
                        {searchHistory.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <ListItem
                                    secondaryAction={
                                        <IconButton 
                                            edge="end" 
                                            onClick={() => handleRepeatSearch(item.query, item.type)}
                                            title="Aramayı Tekrarla"
                                        >
                                            <SearchIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={item.query}
                                        secondary={`${item.type || 'Genel Arama'} • ${new Date(item.timestamp).toLocaleString('tr-TR')}`}
                                    />
                                </ListItem>
                                {index < searchHistory.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        {searchHistory.length === 0 && (
                            <ListItem>
                                <ListItemText
                                    primary="Henüz arama geçmişi yok"
                                    secondary="Yaptığınız aramalar burada listelenecek"
                                />
                            </ListItem>
                        )}
                    </List>
                </Paper>
            </Box>
        </Container>
    );
};

export default SearchHistoryPage;
