// Importaciones:
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  CssBaseline,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputBase,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import KeyboardCapslockRoundedIcon from "@mui/icons-material/KeyboardCapslockRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import Stack from "../../shared/ui/Stack";
import { useAuth } from "../../context/AuthContext";
import logoIcon from "../../assets/images/logo-icon.png";
import logoSymbol from "../../assets/images/logo-symbol.png";
import "./Login.css";

//JSX;
const C = {
  primary: "#60A5FA",
  primaryStrong: "#3B82F6",
  indigo: "#6366F1",
  cyan: "#22D3EE",
  text: "#F8FAFC",
  soft: "rgba(226, 232, 240, 0.72)",
  muted: "rgba(148, 163, 184, 0.78)",
  line: "rgba(148, 163, 184, 0.14)",
  glass: "rgba(15, 23, 42, 0.55)",
  field: "rgba(2, 6, 23, 0.55)",
};

const REMEMBER_KEY = "codedesk_remember_email";

const v = (min, vh, max) => `clamp(${min}px, ${vh}vh, ${max}px)`;
const SHORT = "@media (max-height: 780px)";
const MEDIUM = "@media (max-height: 800px)";

const FEATURES = [
  {
    icon: <WorkspacesRoundedIcon />,
    title: "Proyectos centralizados",
    text: "Clientes, logos, enlaces y accesos en un solo lugar.",
  },
  {
    icon: <ChecklistRoundedIcon />,
    title: "Tareas con checklist",
    text: "Subtareas, prioridades y vencimientos que se completan solos.",
  },
  {
    icon: <PaymentsRoundedIcon />,
    title: "Cobros claros",
    text: "Pagos parciales y saldos separados en pesos y dólares.",
  },
];

const rise = (delay) => ({ className: "login-rise", style: { animationDelay: `${delay}ms` } });

const getErrorMessage = (code) => {
  if (
    [
      "auth/invalid-credential",
      "auth/wrong-password",
      "auth/user-not-found",
      "auth/invalid-email",
    ].includes(code)
  ) {
    return "Email o contraseña incorrectos.";
  }
  if (code === "auth/too-many-requests") return "Demasiados intentos. Probá nuevamente más tarde.";
  if (code === "auth/network-request-failed")
    return "Sin conexión. Revisá tu internet e intentá de nuevo.";
  return "No se pudo iniciar sesión. Intentá nuevamente.";
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem(REMEMBER_KEY);
      if (savedEmail) setEmail(savedEmail);
    } catch {
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLoginError("Ingresá tu email y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setLoginError("");
      await login({ email: email.trim(), password });

      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
      }

      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      setLoginError(getErrorMessage(error?.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />

      {/* Fondo animado */}
      <Box className="login-bg" aria-hidden>
        <span className="login-orb login-orb--blue" />
        <span className="login-orb login-orb--cyan" />
        <span className="login-orb login-orb--violet" />
      </Box>

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 3, md: v(16, 4, 40) },
          color: C.text,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 1160,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 3, md: 7 },
            alignItems: "center",
          }}
        >
          <BrandPanel />

          {/* ---------- Formulario ---------- */}
          <Box
            {...rise(120)}
            sx={{ width: "100%", maxWidth: 460, justifySelf: { xs: "center", md: "end" } }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "28px",
                p: "1px",
                background: `linear-gradient(160deg, ${alpha(C.primary, 0.45)}, ${alpha(C.line, 0.6)} 35%, ${alpha(C.indigo, 0.35)})`,
                boxShadow: "0 30px 80px rgba(2, 6, 23, 0.6), 0 0 0 1px rgba(255,255,255,0.02)",
              }}
            >
              <Box
                component="form"
                noValidate
                onSubmit={handleLogin}
                sx={{
                  borderRadius: "27px",
                  px: { xs: 3, sm: 4.5 },
                  py: { xs: 3, sm: v(24, 4.6, 36) },
                  background: `linear-gradient(180deg, rgba(15, 23, 42, 0.82), ${C.glass})`,
                  backdropFilter: "blur(22px)",
                  WebkitBackdropFilter: "blur(22px)",
                }}
              >
                <Box sx={{ display: { xs: "flex", md: "none" }, mb: 3 }}>
                  <HeroLogo size={54} />
                </Box>

                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "1.6rem", sm: `clamp(1.5rem, 3.6vh, 1.85rem)` },
                    letterSpacing: "-0.8px",
                    lineHeight: 1.15,
                  }}
                >
                  Bienvenido de nuevo
                </Typography>
                <Typography sx={{ mt: 0.8, color: C.muted, fontSize: "0.95rem", fontWeight: 500 }}>
                  Ingresá con tu cuenta para continuar.
                </Typography>

                {loginError && (
                  <Alert
                    severity="error"
                    variant="outlined"
                    sx={{
                      mt: 2.5,
                      borderRadius: "14px",
                      color: "#FECACA",
                      borderColor: "rgba(248, 113, 113, 0.35)",
                      backgroundColor: "rgba(127, 29, 29, 0.25)",
                      fontWeight: 600,
                      "& .MuiAlert-icon": { color: "#F87171" },
                    }}
                  >
                    {loginError}
                  </Alert>
                )}

                <Stack sx={{ mt: v(18, 3.8, 26), gap: v(14, 2.6, 18) }}>
                  <Field
                    id="login-email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    placeholder="tu@email.com"
                    icon={<AlternateEmailRoundedIcon />}
                    disabled={loading}
                    autoFocus={!email}
                  />

                  <Field
                    id="login-password"
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    icon={<LockRoundedIcon />}
                    disabled={loading}
                    autoFocus={Boolean(email)}
                    onKeyUp={(event) => setCapsLock(Boolean(event.getModifierState?.("CapsLock")))}
                    onKeyDown={(event) =>
                      setCapsLock(Boolean(event.getModifierState?.("CapsLock")))
                    }
                    helper={
                      capsLock && (
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{ color: "#FBBF24" }}
                        >
                          <KeyboardCapslockRoundedIcon sx={{ fontSize: 16 }} />
                          <span>Bloq Mayús está activado</span>
                        </Stack>
                      )
                    }
                    end={
                      <IconButton
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={loading}
                        size="small"
                        sx={{
                          color: C.muted,
                          "&:hover": { color: C.primary, backgroundColor: alpha(C.primary, 0.1) },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOffRoundedIcon fontSize="small" />
                        ) : (
                          <VisibilityRoundedIcon fontSize="small" />
                        )}
                      </IconButton>
                    }
                  />
                </Stack>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      disabled={loading}
                      size="small"
                      icon={<Box sx={checkboxBoxSx(false)} />}
                      checkedIcon={
                        <Box sx={checkboxBoxSx(true)}>
                          <CheckRoundedIcon sx={{ fontSize: 14, color: "#0B1220" }} />
                        </Box>
                      }
                    />
                  }
                  label="Recordar mi email"
                  sx={{
                    mt: 1.4,
                    ml: -0.6,
                    "& .MuiFormControlLabel-label": {
                      color: C.soft,
                      fontSize: "0.88rem",
                      fontWeight: 500,
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  className="login-shine"
                  endIcon={loading ? null : <ArrowForwardRoundedIcon />}
                  sx={{
                    mt: v(12, 2.4, 20),
                    height: v(44, 6.4, 52),
                    borderRadius: "16px",
                    fontSize: "1rem",
                    fontWeight: 800,
                    letterSpacing: "0.1px",
                    color: "#FFFFFF",
                    background: `linear-gradient(135deg, ${C.primaryStrong} 0%, ${C.indigo} 100%)`,
                    boxShadow: `0 14px 34px ${alpha(C.primaryStrong, 0.38)}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                    transition: "transform 180ms ease, box-shadow 180ms ease, filter 180ms ease",
                    "& .MuiButton-endIcon": { transition: "transform 180ms ease" },
                    "&:hover": {
                      transform: "translateY(-1px)",
                      filter: "brightness(1.08)",
                      boxShadow: `0 18px 40px ${alpha(C.primaryStrong, 0.48)}, inset 0 1px 0 rgba(255,255,255,0.22)`,
                      "& .MuiButton-endIcon": { transform: "translateX(3px)" },
                    },
                    "&.Mui-disabled": { color: "rgba(255,255,255,0.8)", opacity: 0.75 },
                  }}
                >
                  {loading ? (
                    <Stack direction="row" alignItems="center" spacing={1.2}>
                      <CircularProgress size={18} thickness={5} sx={{ color: "#FFFFFF" }} />
                      <span>Ingresando…</span>
                    </Stack>
                  ) : (
                    "Ingresar"
                  )}
                </Button>

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="center"
                  spacing={0.8}
                  sx={{ mt: v(14, 3, 24), color: C.muted }}
                >
                  <ShieldRoundedIcon sx={{ fontSize: 16, color: alpha(C.primary, 0.85) }} />
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 500 }}>
                    Conexión segura · Firebase Authentication
                  </Typography>
                </Stack>
              </Box>
            </Box>

            <Typography
              {...rise(380)}
              sx={{
                mt: 2.5,
                textAlign: "center",
                color: alpha("#94A3B8", 0.6),
                fontSize: "0.78rem",
              }}
            >
              © {new Date().getFullYear()} CodeDesk
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

// ---------- Panel de marca  ----------
function BrandPanel() {
  return (
    <Box sx={{ display: { xs: "none", md: "block" }, pr: 2 }}>
      <Box {...rise(0)}>
        <HeroLogo size={v(64, 11.5, 104)} />
      </Box>

      <Box {...rise(80)} sx={{ mt: v(18, 4.6, 40) }}>
        <Typography
          component="h2"
          sx={{
            fontWeight: 900,
            fontSize: { md: "clamp(2.1rem, 5.4vh, 2.6rem)", lg: "clamp(2.2rem, 5.8vh, 3.1rem)" },
            lineHeight: 1.05,
            letterSpacing: "-1.6px",
            maxWidth: 560,
          }}
        >
          Todo tu flujo de trabajo,{" "}
          <Box
            component="span"
            sx={{
              background: `linear-gradient(90deg, ${C.primary}, ${C.cyan} 55%, ${C.indigo})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            en un solo lugar.
          </Box>
        </Typography>

        <Typography
          sx={{
            mt: v(10, 2, 16),
            color: C.soft,
            fontSize: "clamp(0.95rem, 2vh, 1.05rem)",
            lineHeight: 1.65,
            maxWidth: 500,
            fontWeight: 400,
          }}
        >
          Organizá proyectos, tareas, cobros y recursos técnicos sin saltar entre diez herramientas
          distintas.
        </Typography>
      </Box>

      <Stack sx={{ mt: v(18, 4.2, 36), gap: v(10, 2.1, 16) }}>
        {FEATURES.map((feature, index) => (
          <Stack
            key={feature.title}
            direction="row"
            spacing={1.6}
            alignItems="flex-start"
            {...rise(160 + index * 70)}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                color: C.primary,
                background: `linear-gradient(145deg, ${alpha(C.primary, 0.18)}, ${alpha(C.indigo, 0.1)})`,
                border: `1px solid ${alpha(C.primary, 0.22)}`,
                "& svg": { fontSize: 21 },
              }}
            >
              {feature.icon}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 750, fontSize: "0.98rem" }}>{feature.title}</Typography>
              <Typography
                sx={{
                  color: C.muted,
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  [MEDIUM]: { display: "none" },
                }}
              >
                {feature.text}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>

      <PreviewCard />
    </Box>
  );
}

function PreviewCard() {
  const items = [
    { text: "Diseñar pantalla de login", done: true },
    { text: "Conectar Firebase Auth", done: true },
    { text: "Deploy en Vercel", done: false },
  ];

  return (
    <Box {...rise(420)} sx={{ mt: v(18, 4.5, 40), maxWidth: 420, [SHORT]: { display: "none" } }}>
      <Box
        className="login-float"
        sx={{
          p: 2.2,
          borderRadius: "20px",
          background: "linear-gradient(160deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.55))",
          border: `1px solid ${C.line}`,
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(2, 6, 23, 0.55)",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <LogoMark size={34} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.9rem" }}>
                Sprint de CodeDesk
              </Typography>
              <Typography sx={{ color: C.muted, fontSize: "0.75rem" }}>
                En progreso · Vence mañana
              </Typography>
            </Box>
          </Stack>
          <Typography sx={{ color: C.cyan, fontWeight: 800, fontSize: "0.8rem" }}>2/3</Typography>
        </Stack>

        <Box
          sx={{
            mt: 1.6,
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(148,163,184,0.15)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "66%",
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${C.primary}, ${C.cyan})`,
            }}
          />
        </Box>

        <Stack spacing={1} sx={{ mt: 1.6 }}>
          {items.map((item) => (
            <Stack key={item.text} direction="row" alignItems="center" spacing={1.1}>
              <Box sx={checkboxBoxSx(item.done)}>
                {item.done && <CheckRoundedIcon sx={{ fontSize: 13, color: "#0B1220" }} />}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: item.done ? C.muted : C.text,
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function HeroLogo({ size }) {
  return (
    <Stack direction="row" alignItems="center" spacing={typeof size === "string" ? 2.2 : 1.5}>
      <Box sx={{ position: "relative", flexShrink: 0, display: "inline-flex" }}>
        <Box
          aria-hidden
          className="login-glow"
          sx={{
            position: "absolute",
            inset: "-45% -30%",
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${alpha(C.primaryStrong, 0.45)}, ${alpha(C.indigo, 0.14)} 55%, transparent 78%)`,
            filter: "blur(16px)",
            pointerEvents: "none",
          }}
        />
        <Box
          component="img"
          src={logoSymbol}
          alt=""
          draggable={false}
          sx={{
            position: "relative",
            display: "block",
            height: size,
            width: "auto",
            filter: `drop-shadow(0 10px 26px ${alpha(C.primaryStrong, 0.5)})`,
            userSelect: "none",
          }}
        />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{
            display: "block",
            fontWeight: 900,
            fontSize: typeof size === "string" ? "clamp(1.9rem, 5.4vh, 2.7rem)" : "1.75rem",
            letterSpacing: "-1px",
            lineHeight: 1,
          }}
        >
          Code
          <Box
            component="span"
            sx={{
              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryStrong})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Desk
          </Box>
        </Typography>
        <Typography
          sx={{
            mt: 0.8,
            color: C.muted,
            fontSize: typeof size === "string" ? "0.74rem" : "0.66rem",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Workspace para devs
        </Typography>
      </Box>
    </Stack>
  );
}

function LogoMark({ size }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${size * 0.3}px`,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(160deg, rgba(30, 41, 59, 0.9), rgba(2, 6, 23, 0.9))",
        border: `1px solid ${alpha(C.primary, 0.3)}`,
        boxShadow: `0 10px 30px ${alpha(C.primaryStrong, 0.3)}`,
      }}
    >
      <Box
        component="img"
        src={logoIcon}
        alt="CodeDesk"
        sx={{ width: "78%", height: "78%", objectFit: "contain" }}
      />
    </Box>
  );
}

function checkboxBoxSx(checked) {
  return {
    width: 18,
    height: 18,
    borderRadius: "6px",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    border: `1.5px solid ${checked ? "transparent" : "rgba(148, 163, 184, 0.45)"}`,
    background: checked ? `linear-gradient(135deg, ${C.primary}, ${C.cyan})` : "transparent",
    transition: "all 160ms ease",
  };
}

function Field({ id, label, icon, end, helper, value, onChange, disabled, ...inputProps }) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={id}
        sx={{ display: "block", mb: 0.9, color: C.soft, fontSize: "0.85rem", fontWeight: 650 }}
      >
        {label}
      </Typography>
      <InputBase
        id={id}
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        startAdornment={
          <InputAdornment
            position="start"
            sx={{ color: "inherit", mr: 1.2, "& svg": { fontSize: 19 } }}
          >
            {icon}
          </InputAdornment>
        }
        endAdornment={end && <InputAdornment position="end">{end}</InputAdornment>}
        sx={{
          height: v(44, 6.4, 52),
          px: 1.8,
          borderRadius: "14px",
          color: C.text,
          backgroundColor: C.field,
          border: `1px solid ${C.line}`,
          transition: "border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease",
          "& .MuiInputAdornment-positionStart": { color: C.muted },
          "&:hover": { borderColor: alpha(C.primary, 0.35) },
          "&.Mui-focused": {
            borderColor: C.primary,
            backgroundColor: "rgba(2, 6, 23, 0.75)",
            boxShadow: `0 0 0 4px ${alpha(C.primary, 0.14)}`,
            "& .MuiInputAdornment-positionStart": { color: C.primary },
          },
          "& input": {
            fontSize: "0.96rem",
            fontWeight: 500,
            "&::placeholder": { color: "rgba(148, 163, 184, 0.55)", opacity: 1 },
            "&:-webkit-autofill": {
              WebkitTextFillColor: `${C.text} !important`,
              WebkitBoxShadow: "0 0 0 1000px #060c1c inset !important",
              caretColor: C.text,
              transition: "background-color 9999s",
            },
          },
        }}
        {...inputProps}
      />
      {helper && <Box sx={{ mt: 0.8, fontSize: "0.8rem", fontWeight: 600 }}>{helper}</Box>}
    </Box>
  );
}
