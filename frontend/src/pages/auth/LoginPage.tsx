import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, TextField, Typography, Paper, Container, InputAdornment, IconButton, Link, Divider } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import GitHubIcon from '@mui/icons-material/GitHub';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const auth = useAuth();
    const from = location.state?.from?.pathname || "/";

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            auth.login();
            navigate(from, { replace: true });
        } else {
            setError('Por favor ingresa tu correo y contraseña.');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.1) 0, transparent 50%)',
                backgroundColor: '#0f172a', 
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        background: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 4,
                    }}
                >
                    <Box
                        sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '28px',
                            mb: 2,
                            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.25)'
                        }}
                    >
                        D
                    </Box>
                    <Typography component="h1" variant="h4" fontWeight="bold" sx={{ mb: 1, color: '#f8fafc' }}>
                        Bienvenido
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Ingresa a tu cuenta de DevAudit IA
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(15, 23, 42, 0.5)',
                                }
                            }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'rgba(15, 23, 42, 0.5)',
                                }
                            }}
                        />
                        
                        {error && (
                            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                                {error}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 2 }}>
                            <Link href="#" variant="body2" underline="hover" sx={{ color: 'primary.main' }}>
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            sx={{
                                mt: 1,
                                mb: 3,
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Iniciar Sesión
                        </Button>

                        <Divider sx={{ width: '100%', mb: 3 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                                O continúa con
                            </Typography>
                        </Divider>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<GitHubIcon />}
                            onClick={() => {
                                // Mock GitHub login
                                auth.login();
                                navigate(from, { replace: true });
                            }}
                            sx={{
                                py: 1.2,
                                borderColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'text.primary',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: 'text.primary',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            GitHub
                        </Button>
                    </Box>
                </Paper>
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    © 2024 DevAudit IA. Todos los derechos reservados.
                </Typography>
            </Container>
        </Box>
    );
}
