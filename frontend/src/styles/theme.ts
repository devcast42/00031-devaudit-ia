import { createTheme, alpha } from '@mui/material/styles';

// Premium Color Palette
const brandColors = {
    primary: '#2563eb', // Modern Blue
    secondary: '#6366f1', // Indigo
    background: '#0f172a', // Slate 900
    paper: '#1e293b', // Slate 800
    text: {
        primary: '#f8fafc', // Slate 50
        secondary: '#94a3b8', // Slate 400
    },
    glass: {
        background: 'rgba(30, 41, 59, 0.7)',
        border: 'rgba(255, 255, 255, 0.1)',
    }
};

export const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: brandColors.primary,
            light: alpha(brandColors.primary, 0.5),
            dark: '#1d4ed8',
            contrastText: '#ffffff',
        },
        secondary: {
            main: brandColors.secondary,
            light: alpha(brandColors.secondary, 0.5),
            dark: '#4f46e5',
            contrastText: '#ffffff',
        },
        background: {
            default: brandColors.background,
            paper: brandColors.paper,
        },
        text: {
            primary: brandColors.text.primary,
            secondary: brandColors.text.secondary,
        },
        divider: brandColors.glass.border,
    },
    typography: {
        fontFamily: '"Inter", "Outfit", "system-ui", sans-serif',
        h1: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.025em' },
        h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em' },
        h3: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em' },
        h4: { fontSize: '1.25rem', fontWeight: 600 },
        h5: { fontSize: '1.1rem', fontWeight: 600 },
        h6: { fontSize: '1rem', fontWeight: 600 },
        body1: { fontSize: '1rem', lineHeight: 1.6 },
        body2: { fontSize: '0.875rem', lineHeight: 1.6 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: brandColors.background,
                    backgroundImage: `
            radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(225,39%,30%,0.1) 0, transparent 50%),
            radial-gradient(at 100% 0%, hsla(339,49%,30%,0.1) 0, transparent 50%)
          `,
                    backgroundAttachment: 'fixed',
                    color: brandColors.text.primary,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: brandColors.glass.background,
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${brandColors.glass.border}`,
                    boxShadow: 'none',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: `0 4px 12px ${alpha(brandColors.primary, 0.4)}`,
                    },
                },
                contained: {
                    background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: alpha(brandColors.background, 0.8),
                    backdropFilter: 'blur(20px)',
                    borderRight: `1px solid ${brandColors.glass.border}`,
                },
            },
        },
    },
});

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: brandColors.primary,
        },
        secondary: {
            main: brandColors.secondary,
        },
        background: {
            default: '#ffffff',
            paper: '#f8fafc',
        },
        text: {
            primary: '#0f172a',
            secondary: '#64748b',
        },
    },
    typography: {
        fontFamily: '"Inter", "system-ui", sans-serif',
        h1: { fontWeight: 800 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600 },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiTypography: {
            styleOverrides: {
                root: {
                    color: '#0f172a',
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    backdropFilter: 'none',
                    color: '#0f172a',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a',
                }
            }
        }
    }
});
