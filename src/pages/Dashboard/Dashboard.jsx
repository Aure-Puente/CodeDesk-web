// Importaciones:
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  Chip,
  Paper,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import logoLight from "../../assets/images/logo-light.png";
import logoDark from "../../assets/images/logo-dark.png";
import Home from "../../components/Home/Home";
import Tareas from "../../components/Tareas/Tareas";
import Proyectos from "../../components/Proyectos/Proyectos";
import Pagos from "../../components/Pagos/Pagos";
import Notas from "../../components/Notas/Notas";
import Informes from "../../components/Informes/Informes";
import DataBase from "../../components/DataBase/DataBase";
import Credenciales from "../../components/Credenciales/Credenciales";
import Config from "../../components/Config/Config";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useAuth } from "../../context/AuthContext";

// JSX:
const drawerWidth = 280;

const sections = [
  {
    id: "inicio",
    title: "Inicio",
    description: "Resumen general de tu espacio de trabajo",
    icon: <DashboardRoundedIcon />,
  },
  {
    id: "tareas",
    title: "Tareas",
    description: "Organización diaria y pendientes",
    icon: <AssignmentRoundedIcon />,
  },
  {
    id: "proyectos",
    title: "Proyectos",
    description: "Seguimiento de tus proyectos activos",
    icon: <FolderRoundedIcon />,
  },
  {
    id: "pagos",
    title: "Pagos",
    description: "Control de ingresos, cobros y movimientos",
    icon: <PaymentsRoundedIcon />,
  },
  {
    id: "notas",
    title: "Notas",
    description: "Ideas, apuntes y recordatorios rápidos",
    icon: <NotesRoundedIcon />,
  },
  {
    id: "informes",
    title: "Informes",
    description: "Métricas, estadísticas y reportes",
    icon: <AssessmentRoundedIcon />,
  },
  {
    id: "database",
    title: "Base de datos",
    description: "Accesos, colecciones y recursos técnicos",
    icon: <StorageRoundedIcon />,
  },
  {
    id: "credenciales",
    title: "Credenciales",
    description: "Datos sensibles y accesos importantes",
    icon: <LockRoundedIcon />,
  },
  {
    id: "configuracion",
    title: "Configuración",
    description: "Preferencias generales de la aplicación",
    icon: <SettingsRoundedIcon />,
  },
];

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const { isDark, toggleThemeMode } = useThemeMode();
  const { logout } = useAuth();

  const [selectedSection, setSelectedSection] = useState("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const dashboardLogo = isDark ? logoDark : logoLight;

  const currentSection = useMemo(() => {
    return sections.find((item) => item.id === selectedSection) || sections[0];
  }, [selectedSection]);

  const formattedDay = useMemo(() => {
    const value = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(currentDateTime);

    return value.charAt(0).toUpperCase() + value.slice(1);
  }, [currentDateTime]);

  const formattedTime = useMemo(() => {
    return new Intl.DateTimeFormat("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(currentDateTime);
  }, [currentDateTime]);

  const nombreUsuario = localStorage.getItem("nombreCompleto") || "Aure";

  const userInitials = useMemo(() => {
    const partes = nombreUsuario
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2);

    if (!partes.length) return "U";

    return partes.map((item) => item[0]?.toUpperCase()).join("");
  }, [nombreUsuario]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChangeSection = (id) => {
    setSelectedSection(id);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }

      localStorage.removeItem("nombreCompleto");
      localStorage.removeItem("rol");
      localStorage.removeItem("uid");
      localStorage.removeItem("email");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const renderSection = () => {
    switch (currentSection?.id) {
      case "inicio":
        return <Home />;

      case "tareas":
        return <Tareas />;

      case "proyectos":
        return <Proyectos />;

      case "pagos":
        return <Pagos />;

      case "notas":
        return <Notas />;

      case "informes":
        return <Informes />;

      case "database":
        return <DataBase />;

      case "credenciales":
        return <Credenciales />;

      case "configuracion":
        return <Config />;

      default:
        return (
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontWeight: 600,
            }}
          >
            Sección no encontrada.
          </Typography>
        );
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: theme.palette.app.surface,
        color: theme.palette.app.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
    <Box
      sx={{
        px: 2.5,
        py: 1.8,
        height: 130,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src={dashboardLogo}
        alt="CodeDesk"
        sx={{
          width: 180,
          height: 180,
          marginTop: 1,
          objectFit: "contain",
          borderRadius: "24px",
        }}
      />
    </Box>
      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <List
        sx={{
          px: 1.5,
          py: 2,
          flex: 1,
          overflowY: "auto",
        }}
      >
        {sections.map((item) => {
          const active = selectedSection === item.id;

          return (
            <ListItemButton
              key={item.id}
              onClick={() => handleChangeSection(item.id)}
              sx={{
                mb: 0.8,
                borderRadius: "16px",
                minHeight: 54,
                px: 1.6,
                color: active
                  ? theme.palette.primary.main
                  : theme.palette.app.text,
                backgroundColor: active
                  ? theme.palette.app.primarySoft
                  : "transparent",
                border: active
                  ? `1px solid ${theme.palette.app.borderSoft}`
                  : "1px solid transparent",
                transition: "all 0.18s ease",
                "&:hover": {
                  backgroundColor: active
                    ? theme.palette.app.primarySoft
                    : theme.palette.app.surfaceSoft,
                  transform: "translateX(2px)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: active
                    ? theme.palette.primary.main
                    : theme.palette.app.secondary,
                  minWidth: 42,
                  "& svg": {
                    fontSize: 24,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: active ? 850 : 650,
                  fontSize: "0.96rem",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.6,
            borderRadius: "22px",
            background: `linear-gradient(135deg, ${theme.palette.app.primarySoft}, transparent)`,
            border: `1px solid ${theme.palette.app.borderSoft}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: theme.palette.primary.main,
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "0.95rem",
                boxShadow: isDark
                  ? "0 10px 22px rgba(96, 165, 250, 0.20)"
                  : "0 10px 22px rgba(37, 99, 235, 0.20)",
              }}
            >
              {userInitials}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.76rem",
                  color: theme.palette.app.secondary,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: 0.35,
                }}
              >
                Sesión actual
              </Typography>

              <Tooltip title={nombreUsuario} placement="top" arrow>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{
                    minWidth: 0,
                    width: "100%",
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontWeight: 850,
                      color: theme.palette.app.text,
                      fontSize: "0.95rem",
                      lineHeight: 1.25,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    {nombreUsuario}
                  </Typography>

                  <Box
                    sx={{
                      width: 23,
                      height: 23,
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.app.primarySoft,
                      border: `1px solid ${theme.palette.app.borderSoft}`,
                      flexShrink: 0,
                    }}
                  >
                    <CodeRoundedIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Stack>
              </Tooltip>
            </Box>
          </Stack>

          <Divider
            sx={{
              my: 1.35,
              borderColor: theme.palette.app.borderSoft,
            }}
          />

          <Button
            fullWidth
            onClick={() => setLogoutDialogOpen(true)}
            startIcon={<LogoutRoundedIcon />}
            sx={{
              minHeight: 36,
              borderRadius: "14px",
              fontWeight: 850,
              textTransform: "none",
              color: theme.palette.app.danger,
              backgroundColor: isDark
                ? "rgba(248, 113, 113, 0.10)"
                : "rgba(220, 38, 38, 0.08)",
              border: `1px solid ${
                isDark
                  ? "rgba(248, 113, 113, 0.20)"
                  : "rgba(220, 38, 38, 0.14)"
              }`,
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(248, 113, 113, 0.14)"
                  : "rgba(220, 38, 38, 0.11)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.18s ease",
              "& .MuiButton-startIcon": {
                mr: 0.8,
              },
              "& svg": {
                fontSize: 18,
              },
            }}
          >
            Cerrar sesión
          </Button>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.palette.app.background,
        color: theme.palette.app.text,
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.88)"
            : "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(12px)",
          color: theme.palette.app.text,
          borderBottom: `1px solid ${theme.palette.app.borderSoft}`,
        }}
      >
        <Toolbar
          sx={{
            minHeight: {
              xs: "76px !important",
              md: "82px !important",
            },
            pt: { xs: 0.8, md: 1 },
            pb: { xs: 0.7, md: 0.9 },
            alignItems: "center",
            px: {
              xs: 1.5,
              sm: 2,
              md: 3,
            },
            display: "flex",
            justifyContent: "space-between",
            gap: {
              xs: 1,
              sm: 2,
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={{
              xs: 1,
              sm: 1.5,
            }}
            sx={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { md: "none" },
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
                borderRadius: "14px",
                border: `1px solid ${theme.palette.app.borderSoft}`,
                "&:hover": {
                  backgroundColor: theme.palette.app.primarySoft,
                },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontWeight: 900,
                  fontSize: {
                    xs: "1.08rem",
                    sm: "1.18rem",
                    md: "1.38rem",
                  },
                  color: theme.palette.app.text,
                  lineHeight: 1.15,
                  letterSpacing: "-0.3px",
                }}
              >
                CodeDesk
              </Typography>

              <Typography
                noWrap
                sx={{
                  color: theme.palette.app.secondary,
                  fontSize: "0.9rem",
                  display: {
                    xs: "none",
                    sm: "block",
                  },
                  mt: 0.2,
                  fontWeight: 600,
                }}
              >
                Todo tu flujo de trabajo centralizado en un solo lugar.              
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={{
              xs: 0.8,
              sm: 1,
            }}
            sx={{
              flexShrink: 0,
            }}
          >
            <Chip
              icon={<AccessTimeRoundedIcon />}
              label={`${formattedDay} · ${formattedTime}`}
              color="primary"
              variant="outlined"
              sx={{
                height: 36,
                px: 0.6,
                borderRadius: "999px",
                fontWeight: 850,
                textTransform: "capitalize",
                backgroundColor: theme.palette.app.primarySoft,
                borderColor: theme.palette.app.borderSoft,
                display: {
                  xs: "none",
                  md: "flex",
                },
                "& .MuiChip-icon": {
                  fontSize: 19,
                  color: theme.palette.primary.main,
                  ml: 0.8,
                },
                "& .MuiChip-label": {
                  px: 1.15,
                  fontSize: "0.82rem",
                  color: theme.palette.app.text,
                },
              }}
            />

            <Tooltip
              title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
              placement="bottom"
              arrow
            >
              <IconButton
                onClick={toggleThemeMode}
                sx={{
                  width: 42,
                  height: 42,
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.app.primarySoft,
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                  borderRadius: "14px",
                  "&:hover": {
                    backgroundColor: theme.palette.app.primarySoft,
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.18s ease",
                }}
              >
                {isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.app.borderSoft}`,
              boxShadow: isDark
                ? "0 20px 60px rgba(0, 0, 0, 0.45)"
                : "0 20px 60px rgba(15, 23, 42, 0.18)",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.app.borderSoft}`,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: {
            xs: "76px",
            md: "82px",
          },
          minHeight: "100vh",
          minWidth: 0,
          backgroundColor: theme.palette.app.background,
        }}
      >
        <Box
          sx={{
            p: {
              xs: 2,
              sm: 2.5,
              md: 4,
            },
          }}
        >
          {renderSection()}
        </Box>
      </Box>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
      />
    </Box>
  );
};

const LogoutConfirmDialog = ({ open, onClose, onConfirm }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          backgroundColor: theme.palette.app.surface,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0, 0, 0, 0.55)"
              : "0 28px 80px rgba(15, 23, 42, 0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          position: "relative",
          px: 3,
          pt: 3,
          pb: 1.8,
          pr: 7,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.4}>
          <Avatar
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              color: theme.palette.app.danger,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.error.main, 0.14)
                  : alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              flexShrink: 0,
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 27 }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: "1.35rem",
                fontWeight: 950,
                lineHeight: 1.15,
                letterSpacing: "-0.35px",
              }}
            >
              Cerrar sesión
            </Typography>

            <Typography
              sx={{
                mt: 0.45,
                color: theme.palette.app.secondary,
                fontSize: "0.9rem",
                fontWeight: 650,
                lineHeight: 1.45,
              }}
            >
              ¿Seguro que querés salir de CodeDesk?
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 38,
            height: 38,
            borderRadius: "14px",
            color: theme.palette.app.secondary,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.045)
                : alpha("#0F172A", 0.035),
            border: `1px solid ${theme.palette.app.borderSoft}`,
            "&:hover": {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
            },
          }}
        >
          ×
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 0.4, pb: 2 }}>
        <Box
          sx={{
            borderRadius: "16px",
            p: 1.6,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.035)
                : alpha("#0F172A", 0.025),
            border: `1px solid ${theme.palette.app.borderSoft}`,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: "0.9rem",
              fontWeight: 650,
              lineHeight: 1.55,
            }}
          >
            Vas a volver a la pantalla de inicio de sesión. Podés ingresar de
            nuevo cuando quieras.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 0.5 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          sx={{
            minHeight: 42,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          Cancelar
        </Button>

        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={<LogoutRoundedIcon />}
          onClick={onConfirm}
          sx={{
            minHeight: 42,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Salir
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Dashboard;