import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, TextField, Button, Switch, FormControlLabel, Divider, Avatar, Grid } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';

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
            id={`settings-tabpanel-${index}`}
            aria-labelledby={`settings-tab-${index}`}
            {...other}
            style={{ width: '100%' }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export function SettingsPage() {
    const [value, setValue] = useState(0);
    const [userSettings, setUserSettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved) : {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            notifications: {
                emailAudit: true,
                emailReport: true,
                emailAlert: false,
                systemSound: true,
                systemPopup: true
            }
        };
    });

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleSave = () => {
        localStorage.setItem('userSettings', JSON.stringify(userSettings));
        alert('Configuración guardada exitosamente');
    };

    const updateSetting = (field: string, val: any) => {
        setUserSettings((prev: any) => ({
            ...prev,
            [field]: val
        }));
    };

    const updateNotification = (field: string, val: boolean) => {
        setUserSettings((prev: any) => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [field]: val
            }
        }));
    };

    return (
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
                Configuración
            </Typography>

            <Paper sx={{ display: 'flex', minHeight: 600, overflow: 'hidden' }}>
                <Box sx={{ borderRight: 1, borderColor: 'divider', width: 250, minWidth: 250 }}>
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        aria-label="Settings tabs"
                        sx={{
                            '& .MuiTab-root': {
                                alignItems: 'flex-start',
                                textAlign: 'left',
                                py: 3,
                                px: 3
                            }
                        }}
                    >
                        <Tab icon={<PersonIcon sx={{ mr: 1 }} />} iconPosition="start" label="General" />
                        <Tab icon={<NotificationsIcon sx={{ mr: 1 }} />} iconPosition="start" label="Notificaciones" />
                        <Tab icon={<SecurityIcon sx={{ mr: 1 }} />} iconPosition="start" label="Seguridad" />
                    </Tabs>
                </Box>

                <Box sx={{ flexGrow: 1 }}>
                    <TabPanel value={value} index={0}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Perfil de Usuario</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 2 }}>
                            <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: 32 }}>
                                {userSettings.firstName[0]}{userSettings.lastName[0]}
                            </Avatar>
                            <Box>
                                <Button variant="outlined" size="small" sx={{ mr: 1 }}>Cambiar Foto</Button>
                                <Button color="error" size="small">Eliminar</Button>
                            </Box>
                        </Box>
                        
                        <Grid container spacing={3} sx={{ maxWidth: 600 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField 
                                    fullWidth 
                                    label="Nombre" 
                                    value={userSettings.firstName} 
                                    onChange={(e) => updateSetting('firstName', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField 
                                    fullWidth 
                                    label="Apellido" 
                                    value={userSettings.lastName} 
                                    onChange={(e) => updateSetting('lastName', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField 
                                    fullWidth 
                                    label="Email" 
                                    value={userSettings.email} 
                                    onChange={(e) => updateSetting('email', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth label="Rol" defaultValue="Auditor Principal" disabled />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button variant="contained" onClick={handleSave}>Guardar Cambios</Button>
                            </Grid>
                        </Grid>
                    </TabPanel>

                    <TabPanel value={value} index={1}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Preferencias de Notificación</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Gestiona cómo y cuándo recibes notificaciones.
                        </Typography>

                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Email</Typography>
                            <FormControlLabel 
                                control={<Switch checked={userSettings.notifications.emailAudit} onChange={(e) => updateNotification('emailAudit', e.target.checked)} />} 
                                label="Nuevas auditorías asignadas" 
                            />
                            <Box />
                            <FormControlLabel 
                                control={<Switch checked={userSettings.notifications.emailReport} onChange={(e) => updateNotification('emailReport', e.target.checked)} />} 
                                label="Reportes finalizados" 
                            />
                            <Box />
                            <FormControlLabel 
                                control={<Switch checked={userSettings.notifications.emailAlert} onChange={(e) => updateNotification('emailAlert', e.target.checked)} />} 
                                label="Alertas de seguridad críticas" 
                            />
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Box>
                            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>Sistema</Typography>
                            <FormControlLabel 
                                control={<Switch checked={userSettings.notifications.systemSound} onChange={(e) => updateNotification('systemSound', e.target.checked)} />} 
                                label="Sonidos de notificación" 
                            />
                            <Box />
                            <FormControlLabel 
                                control={<Switch checked={userSettings.notifications.systemPopup} onChange={(e) => updateNotification('systemPopup', e.target.checked)} />} 
                                label="Mostrar popups" 
                            />
                        </Box>
                        
                        <Box sx={{ mt: 3 }}>
                             <Button variant="contained" onClick={handleSave}>Guardar Preferencias</Button>
                        </Box>
                    </TabPanel>

                    <TabPanel value={value} index={2}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Seguridad</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Actualiza tu contraseña y configura la autenticación de dos factores.
                        </Typography>

                        <Grid container spacing={3} sx={{ maxWidth: 500 }}>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth type="password" label="Contraseña Actual" />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth type="password" label="Nueva Contraseña" />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <TextField fullWidth type="password" label="Confirmar Nueva Contraseña" />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Button variant="contained" color="primary">Actualizar Contraseña</Button>
                            </Grid>
                        </Grid>
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
}
