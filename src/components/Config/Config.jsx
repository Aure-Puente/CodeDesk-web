// Importaciones:
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";

//JSX
// Estilos:
const getCardStyles = (theme) => ({
  borderRadius: "22px",
  border: `1px solid ${theme.palette.app.borderSoft}`,
  backgroundColor: theme.palette.app.surface,
  backgroundImage: "none",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 18px 48px rgba(0, 0, 0, 0.16)"
      : "0 16px 42px rgba(15, 23, 42, 0.045)",
});

const getSoftBackground = (theme) => {
  return theme.palette.mode === "dark"
    ? alpha("#FFFFFF", 0.035)
    : alpha("#0F172A", 0.025);
};

const futureItems = [
  {
    title: "Preferencias visuales",
    description: "Ajustes de tema, colores y apariencia del panel.",
    icon: <PaletteRoundedIcon />,
  },
  {
    title: "Notificaciones",
    description: "Recordatorios, alertas de tareas y avisos importantes.",
    icon: <NotificationsRoundedIcon />,
  },
  {
    title: "Seguridad",
    description: "Protección extra para credenciales y datos sensibles.",
    icon: <SecurityRoundedIcon />,
  },
  {
    title: "Respaldo",
    description: "Exportar, guardar o restaurar información del espacio.",
    icon: <BackupRoundedIcon />,
  },
];

// JSX:
const Config = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        px: { xs: 0, sm: 1, lg: 2 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.3, md: 3 }}>
        <Card
          elevation={0}
          sx={{
            ...getCardStyles(theme),
            p: { xs: 2.2, md: 3 },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            spacing={2.5}
          >
            <Stack direction="row" alignItems="flex-start" spacing={1.7}>
              <Avatar
                variant="rounded"
                sx={{
                  width: { xs: 54, md: 62 },
                  height: { xs: 54, md: 62 },
                  borderRadius: "18px",
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.app.primarySoft,
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                }}
              >
                <SettingsRoundedIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontWeight: 950,
                    letterSpacing: "-0.6px",
                    fontSize: { xs: "1.55rem", sm: "1.85rem", md: "2.15rem" },
                    lineHeight: 1.05,
                  }}
                >
                  Configuración
                </Typography>

                <Typography
                  sx={{
                    mt: 0.9,
                    color: theme.palette.app.secondary,
                    fontSize: { xs: "0.9rem", md: "0.98rem" },
                    lineHeight: 1.65,
                    fontWeight: 600,
                    maxWidth: 720,
                  }}
                >
                  Próximamente vas a poder personalizar el comportamiento del
                  panel, la seguridad, las notificaciones y otras preferencias
                  de CodeDesk.
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<ConstructionRoundedIcon />}
              label="En construcción"
              sx={{
                alignSelf: { xs: "flex-start", md: "center" },
                height: 34,
                borderRadius: "999px",
                color: theme.palette.warning.main,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.18)}`,
                fontWeight: 900,
                "& .MuiChip-icon": {
                  color: theme.palette.warning.main,
                },
              }}
            />
          </Stack>
        </Card>

        <Card
          elevation={0}
          sx={{
            ...getCardStyles(theme),
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            alignItems="stretch"
            spacing={0}
          >
            <Box
              sx={{
                flex: 1,
                p: { xs: 2.3, md: 3 },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "16px",
                    color: theme.palette.primary.main,
                    backgroundColor: theme.palette.app.primarySoft,
                    border: `1px solid ${theme.palette.app.borderSoft}`,
                  }}
                >
                  <RocketLaunchRoundedIcon />
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: theme.palette.app.text,
                      fontSize: { xs: "1.25rem", md: "1.45rem" },
                      fontWeight: 950,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Sección en construcción
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.35,
                      color: theme.palette.app.secondary,
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      lineHeight: 1.55,
                    }}
                  >
                    Esta pantalla todavía no tiene opciones activas, pero queda
                    preparada para futuras configuraciones del sistema.
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  mt: 2.4,
                  borderRadius: "18px",
                  p: { xs: 1.7, md: 2 },
                  backgroundColor: getSoftBackground(theme),
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                }}
              >
                <Stack direction="row" alignItems="flex-start" spacing={1.3}>
                  <TuneRoundedIcon
                    sx={{
                      mt: 0.1,
                      color: theme.palette.primary.main,
                      flexShrink: 0,
                    }}
                  />

                  <Typography
                    sx={{
                      color: theme.palette.app.secondary,
                      fontWeight: 650,
                      lineHeight: 1.65,
                    }}
                  >
                    La idea es que desde acá puedas controlar ajustes generales
                    sin mezclarlo con tareas, proyectos, pagos o credenciales.
                  </Typography>
                </Stack>
              </Box>

              <Button
                variant="outlined"
                disabled
                sx={{
                  mt: 2.3,
                  minHeight: 42,
                  borderRadius: "14px",
                  fontWeight: 900,
                  textTransform: "none",
                }}
              >
                Próximamente disponible
              </Button>
            </Box>

            <Divider
              orientation="vertical"
              flexItem
              sx={{
                display: { xs: "none", lg: "block" },
                borderColor: theme.palette.app.borderSoft,
              }}
            />

            <Divider
              sx={{
                display: { xs: "block", lg: "none" },
                borderColor: theme.palette.app.borderSoft,
              }}
            />

            <Box
              sx={{
                width: { xs: "100%", lg: 430 },
                p: { xs: 2.3, md: 3 },
                backgroundColor: getSoftBackground(theme),
              }}
            >
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 950,
                  mb: 1.5,
                }}
              >
                Posibles ajustes futuros
              </Typography>

              <Stack spacing={1.2}>
                {futureItems.map((item) => (
                  <Card
                    key={item.title}
                    elevation={0}
                    sx={{
                      borderRadius: "16px",
                      border: `1px solid ${theme.palette.app.borderSoft}`,
                      backgroundColor: theme.palette.app.surface,
                      backgroundImage: "none",
                      boxShadow: "none",
                      p: 1.4,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.3}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "14px",
                          color: theme.palette.primary.main,
                          backgroundColor: theme.palette.app.primarySoft,
                        }}
                      >
                        {item.icon}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          noWrap
                          sx={{
                            color: theme.palette.app.text,
                            fontWeight: 900,
                            fontSize: "0.92rem",
                          }}
                        >
                          {item.title}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.2,
                            color: theme.palette.app.secondary,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
};

export default Config;