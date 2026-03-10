import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Avatar,
    Divider,
    alpha,
    IconButton,
    Tooltip
} from "@mui/material";
import DashboardIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from "../context/AuthContext";

const drawerWidth = 260;

export function ManagementLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();

    const menuItems = [
        { text: "Auditorías", icon: <DashboardIcon />, path: "/" },
        { text: "Informes", icon: <BarChartIcon />, path: "/reports" },
        { text: "Configuración", icon: <SettingsIcon />, path: "/settings" },
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        background: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '24px 16px',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 6, px: 1 }}>
                    <Box
                        sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '18px'
                        }}
                    >
                        D
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>
                        DevAudit IA
                    </Typography>
                </Box>

                <List sx={{ flexGrow: 1 }}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        borderRadius: '10px',
                                        backgroundColor: isActive ? alpha('#2563eb', 0.15) : 'transparent',
                                        color: isActive ? '#60a5fa' : '#94a3b8',
                                        '&:hover': {
                                            backgroundColor: alpha('#2563eb', 0.1),
                                            color: '#f8fafc',
                                        },
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: 'inherit',
                                        minWidth: 40,
                                        '& svg': { fontSize: '20px' }
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: '14px',
                                            fontWeight: isActive ? 600 : 500
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>

                <Box sx={{ mt: 'auto', p: 1 }}>
                    <Divider sx={{ mb: 3, opacity: 0.5 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: alpha('#2563eb', 0.2),
                                color: '#60a5fa',
                                fontWeight: 600,
                                fontSize: '14px',
                                border: '1px solid rgba(96, 165, 250, 0.2)'
                            }}
                        >
                            JD
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                                John Doe
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                Auditor Principal
                            </Typography>
                        </Box>
                        <Tooltip title="Cerrar Sesión">
                            <IconButton 
                                onClick={() => { auth.logout(); navigate('/login'); }} 
                                sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239, 68, 68, 0.1)' } }}
                            >
                                <ExitToAppIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Drawer>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 0,
                    minHeight: '100vh',
                    backgroundColor: 'transparent',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
}
