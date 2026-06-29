//Importaciones;
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CssBaseline from "@mui/material/CssBaseline";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";
import logoDark from "../../assets/images/logo-dark.png";

//JSX;
const PRIMARY = "#60A5FA";
const PRIMARY_HOVER = "#93C5FD";
const PAGE_BACKGROUND = "#020617";
const CARD_BACKGROUND = "#0B111E";
const INPUT_BACKGROUND = "#030712";
const INPUT_BACKGROUND_FOCUS = "#020617";

const TEXT_MAIN = "#F8FAFC";
const TEXT_MUTED = "rgba(203, 213, 225, 0.42)";

export default function Login() {
  const navigate = useNavigate();
  const { user, checkingAuth, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("codedesk_remember_email");

    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      minHeight: 41,
      backgroundColor: INPUT_BACKGROUND,
      color: TEXT_MAIN,
      transition:
        "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",

      "& fieldset": {
        borderColor: "rgba(148, 163, 184, 0.18)",
      },

      "&:hover fieldset": {
        borderColor: "rgba(96, 165, 250, 0.58)",
      },

      "&.Mui-focused": {
        backgroundColor: INPUT_BACKGROUND_FOCUS,
        boxShadow:
          "0 0 0 3px rgba(96, 165, 250, 0.10), 0 6px 16px rgba(2, 6, 23, 0.18)",
      },

      "&.Mui-focused fieldset": {
        borderColor: PRIMARY,
        borderWidth: "1.7px",
      },

      "&.Mui-disabled": {
        backgroundColor: "rgba(2, 6, 23, 0.65)",
      },
    },

    "& .MuiInputBase-input": {
      color: TEXT_MAIN,
      fontSize: "0.88rem",
      py: 1,

      "&:-webkit-autofill": {
        WebkitTextFillColor: `${TEXT_MAIN} !important`,
        WebkitBoxShadow: `0 0 0 1000px ${INPUT_BACKGROUND} inset !important`,
        caretColor: TEXT_MAIN,
      },
    },

    "& .MuiInputLabel-root": {
      color: "rgba(203, 213, 225, 0.62)",
      backgroundColor: CARD_BACKGROUND,
      px: "6px",
      borderRadius: "999px",
      lineHeight: 1.15,
      fontSize: "0.88rem",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: PRIMARY,
      backgroundColor: CARD_BACKGROUND,
    },

    "& .MuiInputLabel-root.MuiInputLabel-shrink": {
      transform: "translate(13px, -8px) scale(0.74)",
    },
  };

  if (checkingAuth) {
    return (
      <>
        <CssBaseline />

        <Box
          sx={{
            width: "100%",
            minHeight: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 20% 20%, rgba(96, 165, 250, 0.18), transparent 30%), linear-gradient(135deg, #020617 0%, #07111F 45%, #0B1424 100%)",
          }}
        >
          <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
      </>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginError("Ingresá tu email y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setLoginError("");

      await login({
        email: email.trim(),
        password,
      });

      if (remember) {
        localStorage.setItem("codedesk_remember_email", email.trim());
      } else {
        localStorage.removeItem("codedesk_remember_email");
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/user-not-found"
      ) {
        setLoginError("Email o contraseña incorrectos.");
      } else if (error.code === "auth/too-many-requests") {
        setLoginError("Demasiados intentos. Probá nuevamente más tarde.");
      } else {
        setLoginError("No se pudo iniciar sesión. Intentá nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />

      <Box
        sx={{
          width: "100%",
          height: "100dvh",
          minHeight: "100dvh",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at 18% 18%, rgba(96, 165, 250, 0.18), transparent 32%), radial-gradient(circle at 82% 22%, rgba(37, 99, 235, 0.16), transparent 30%), radial-gradient(circle at 50% 88%, rgba(14, 165, 233, 0.10), transparent 34%), linear-gradient(135deg, #020617 0%, #07111F 45%, #0B1424 100%)",

          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(148, 163, 184, 0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.055) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
            maskImage:
              "linear-gradient(to bottom, rgba(0, 0, 0, 0.65), transparent 88%)",
            zIndex: 0,
          },

          "&::after": {
            content: '""',
            position: "absolute",
            width: { xs: 360, sm: 520 },
            height: { xs: 360, sm: 520 },
            right: { xs: -180, sm: -200 },
            bottom: { xs: -180, sm: -230 },
            pointerEvents: "none",
            borderRadius: "999px",
            background: "rgba(96, 165, 250, 0.14)",
            filter: "blur(42px)",
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100dvh",
            minHeight: "100dvh",
            position: "relative",
            zIndex: 1,
            display: "grid",
            placeItems: "center",
            p: {
              xs: "14px",
              sm: "20px",
              md: "24px",
            },
            overflow: "hidden",
          }}
        >
          <Card
            component="main"
            sx={{
              width: "100%",
              maxWidth: {
                xs: "100%",
                sm: 540,
                md: 560,
              },
              maxHeight: {
                xs: "calc(100dvh - 28px)",
                sm: "calc(100dvh - 40px)",
              },
              p: {
                xs: "20px 18px",
                sm: "25px 30px",
                md: "27px 32px",
              },
              borderRadius: {
                xs: "22px",
                sm: "26px",
              },
              border: "1px solid rgba(96, 165, 250, 0.10)",
              background: CARD_BACKGROUND,
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow:
                "0 22px 56px rgba(2, 6, 23, 0.38), 0 8px 22px rgba(37, 99, 235, 0.10)",
              overflow: "hidden",
            }}
          >
            <Stack
              spacing={{
                xs: 1.05,
                sm: 1.15,
                md: 1.25,
              }}
              component="form"
              onSubmit={handleLogin}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <Box
                  component="img"
                  src={logoDark}
                  alt="CodeDesk"
                  sx={{
                    width: {
                      xs: "min(100%, 405px)",
                      sm: "min(100%, 485px)",
                      md: "min(100%, 505px)",
                    },
                    height: "auto",
                    maxHeight: {
                      xs: 210,
                      sm: 255,
                      md: 270,
                    },
                    objectFit: "contain",
                    display: "block",
                    mb: {
                      xs: "-28px",
                      sm: "-36px",
                      md: "-40px",
                    },
                  }}
                />

                <Typography
                  sx={{
                    color: TEXT_MUTED,
                    fontSize: {
                      xs: "0.78rem",
                      sm: "0.84rem",
                    },
                    fontWeight: 400,
                    lineHeight: 1.4,
                    textAlign: "center",
                    maxWidth: 390,
                    letterSpacing: "0.01em",
                  }}
                >
                  Tu espacio central para organizar proyectos, tareas y recursos.
                </Typography>
              </Box>

              <Divider
                sx={{
                  borderColor: "rgba(148, 163, 184, 0.15)",
                  mt: {
                    xs: 0.15,
                    sm: 0.2,
                  },
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.85,
                }}
              >
                <PersonOutlineRoundedIcon
                  sx={{
                    fontSize: 18,
                    color: PRIMARY,
                  }}
                />

                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{
                    fontSize: {
                      xs: "0.98rem",
                      sm: "1.05rem",
                    },
                    color: TEXT_MAIN,
                  }}
                >
                  Iniciar sesión
                </Typography>
              </Box>

              {loginError && (
                <Alert
                  severity="error"
                  sx={{
                    py: 0.25,
                    borderRadius: 2,
                    fontSize: "0.84rem",
                  }}
                >
                  {loginError}
                </Alert>
              )}

              <Stack
                spacing={{
                  xs: 1,
                  sm: 1.1,
                }}
              >
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                  autoComplete="email"
                  disabled={loading}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                />

                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                  autoComplete="current-password"
                  disabled={loading}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={inputSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          disabled={loading}
                          size="small"
                          sx={{
                            color: "rgba(96, 165, 250, 0.9)",
                            "&:hover": {
                              backgroundColor: "rgba(96, 165, 250, 0.09)",
                            },
                          }}
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      disabled={loading}
                      size="small"
                      sx={{
                        p: 0.35,
                        color: "rgba(203, 213, 225, 0.44)",
                        "&.Mui-checked": {
                          color: PRIMARY,
                        },
                        "&:hover": {
                          backgroundColor: "rgba(96, 165, 250, 0.08)",
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      sx={{
                        color: "rgba(203, 213, 225, 0.68)",
                        fontSize: {
                          xs: "0.78rem",
                          sm: "0.82rem",
                        },
                        fontWeight: 400,
                      }}
                    >
                      Recordarme
                    </Typography>
                  }
                  sx={{
                    m: 0,
                    mt: -0.25,
                    width: "fit-content",
                    alignSelf: "flex-start",
                    ".MuiFormControlLabel-label": {
                      lineHeight: 1,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <LoginRoundedIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    minHeight: 42,
                    borderRadius: "999px",
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.9rem",
                    mt: 0,
                    backgroundColor: PRIMARY,
                    color: PAGE_BACKGROUND,
                    boxShadow:
                      "0 5px 12px rgba(96, 165, 250, 0.13), 0 2px 5px rgba(96, 165, 250, 0.09)",

                    "&:hover": {
                      backgroundColor: PRIMARY_HOVER,
                      boxShadow:
                        "0 7px 15px rgba(96, 165, 250, 0.15), 0 3px 7px rgba(96, 165, 250, 0.10)",
                    },

                    "&:disabled": {
                      backgroundColor: "rgba(96, 165, 250, 0.45)",
                      color: PAGE_BACKGROUND,
                    },
                  }}
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Box>
      </Box>
    </>
  );
}