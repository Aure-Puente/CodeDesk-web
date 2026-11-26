//Importaciones:
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import logoIcon from "../../assets/images/logo-icon.png";
import logoSidebarDark from "../../assets/images/logo-sidebar-dark.png";
import logoSidebarLight from "../../assets/images/logo-sidebar-light.png";
import { useThemeMode } from "../../context/ThemeModeContext";
import { useAuth } from "../../context/AuthContext";
import { db, storage } from "../../firebase/firebase";
import { ConfirmDialog, Stack, Toast, useToast } from "../../shared/ui";

//JSX:
const section = (id, title, icon, load) => ({ id, title, icon, component: lazy(load) });
const SECTIONS = [
  section("inicio", "Inicio", <DashboardRoundedIcon />, () => import("../../components/Home/Home")),
  section(
    "tareas",
    "Tareas",
    <AssignmentRoundedIcon />,
    () => import("../../components/Tareas/Tareas"),
  ),
  section(
    "proyectos",
    "Proyectos",
    <FolderRoundedIcon />,
    () => import("../../components/Proyectos/Proyectos"),
  ),
  section("pagos", "Pagos", <PaymentsRoundedIcon />, () => import("../../components/Pagos/Pagos")),
  section("notas", "Notas", <NotesRoundedIcon />, () => import("../../components/Notas/Notas")),
  section(
    "informes",
    "Informes",
    <AssessmentRoundedIcon />,
    () => import("../../components/Informes/Informes"),
  ),
  section(
    "database",
    "Base de datos",
    <StorageRoundedIcon />,
    () => import("../../components/DataBase/DataBase"),
  ),
  section(
    "enlaces",
    "Enlaces",
    <LinkRoundedIcon />,
    () => import("../../components/Enlaces/Enlaces"),
  ),
  section(
    "credenciales",
    "Credenciales",
    <VpnKeyRoundedIcon />,
    () => import("../../components/Credenciales/Credenciales"),
  ),
];

const DRAWER_WIDTH = { md: 248, lg: 264 };
const HEADER_HEIGHT = { xs: 64, md: 72 };
const TITLEBAR_MEDIA = "@media (display-mode: window-controls-overlay)";
const dragSx = { [TITLEBAR_MEDIA]: { WebkitAppRegion: "drag", appRegion: "drag" } };
const noDragSx = { [TITLEBAR_MEDIA]: { WebkitAppRegion: "no-drag", appRegion: "no-drag" } };
const SECTION_KEY = "codedesk_section";
const v = (min, vh, max) => `clamp(${min}px, ${vh}vh, ${max}px)`;
const px = (obj) => Object.fromEntries(Object.entries(obj).map(([k, val]) => [k, `${val}px`]));

const readStorage = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
  }
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isDark, toggleThemeMode } = useThemeMode();
  const { logout } = useAuth();

  const [sectionId, setSectionId] = useState(() => readStorage(SECTION_KEY, "inicio"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const profile = useUserProfile();

  const current = SECTIONS.find((item) => item.id === sectionId) || SECTIONS[0];
  const SectionComponent = current.component;

  const changeSection = (id) => {
    setSectionId(id);
    writeStorage(SECTION_KEY, id);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleLogout = async () => {
    try {
      await logout?.();
      ["nombreCompleto", "rol", "uid", "email", SECTION_KEY].forEach((key) =>
        writeStorage(key, null),
      );
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const sidebar = (
    <Sidebar
      activeId={current.id}
      onSelect={changeSection}
      onLogout={() => setLogoutOpen(true)}
      profile={profile}
    />
  );
  const drawerPaperSx = {
    width: px(DRAWER_WIDTH),
    boxSizing: "border-box",
    border: "none",
    borderRight: `1px solid ${theme.palette.app.borderSoft}`,
    backgroundColor: theme.palette.app.surface,
  };

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
          width: {
            md: `calc(100% - ${DRAWER_WIDTH.md}px)`,
            lg: `calc(100% - ${DRAWER_WIDTH.lg}px)`,
          },
          ml: px(DRAWER_WIDTH),
          backgroundColor: alpha(theme.palette.app.background, isDark ? 0.78 : 0.82),
          backdropFilter: "saturate(180%) blur(14px)",
          color: theme.palette.app.text,
          borderBottom: `1px solid ${theme.palette.app.borderSoft}`,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: {
              xs: `${HEADER_HEIGHT.xs}px !important`,
              md: `${HEADER_HEIGHT.md}px !important`,
            },
            px: { xs: 1.5, sm: 2.5, md: 3.5 },
            gap: 1.5,
            ...dragSx,
            [TITLEBAR_MEDIA]: {
              ...dragSx[TITLEBAR_MEDIA],
              pr: "calc(100vw - env(titlebar-area-x, 0px) - env(titlebar-area-width, 100vw) + 16px)",
            },
          }}
        >
          <IconButton
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
            sx={{ ...softIconButtonSx(theme), ...noDragSx, display: { md: "none" } }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <LogoMark size={36} />
          </Box>

          <Greeting name={profile.name} />

          <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: "auto", ...noDragSx }}>
            <HeaderClock />
            <Tooltip title={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} arrow>
              <IconButton
                onClick={toggleThemeMode}
                aria-label="Cambiar tema"
                sx={{
                  ...softIconButtonSx(theme),
                  "& svg": { transition: "transform 0.4s ease" },
                  "&:hover svg": { transform: "rotate(25deg)" },
                }}
              >
                {isDark ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: px(DRAWER_WIDTH), flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              ...drawerPaperSx,
              width: 280,
              boxShadow: isDark
                ? "0 20px 60px rgba(0,0,0,0.45)"
                : "0 20px 60px rgba(15,23,42,0.18)",
            },
          }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": drawerPaperSx }}
        >
          {sidebar}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ flexGrow: 1, pt: px(HEADER_HEIGHT), minHeight: "100vh", minWidth: 0 }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 2.5, md: 3, lg: 4 },
            py: { xs: 2, sm: 2.5, md: v(18, 3.2, 32) },
            maxWidth: 1600,
            mx: "auto",
          }}
        >
          <Suspense
            fallback={
              <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
                <CircularProgress />
              </Box>
            }
          >
            <SectionComponent key={current.id} onNavigate={changeSection} />
          </Suspense>
        </Box>
      </Box>

      <ConfirmDialog
        open={logoutOpen}
        title="Cerrar sesión"
        text="¿Seguro que querés salir de CodeDesk?"
        icon={<LogoutRoundedIcon sx={{ fontSize: 27 }} />}
        preview={
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: "0.9rem",
              fontWeight: 650,
              lineHeight: 1.55,
            }}
          >
            Vas a volver a la pantalla de inicio de sesión. Podés ingresar de nuevo cuando quieras.
          </Typography>
        }
        confirmLabel="Salir"
        confirmIcon={<LogoutRoundedIcon />}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />

      <Toast toast={profile.toast} onClose={profile.closeToast} />
    </Box>
  );
};

const softIconButtonSx = (theme) => ({
  width: 40,
  height: 40,
  color: theme.palette.app.text,
  backgroundColor: theme.palette.app.surface,
  border: `1px solid ${theme.palette.app.borderSoft}`,
  borderRadius: "12px",
  transition: "all 0.18s ease",
  "&:hover": {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.app.primarySoft,
    borderColor: alpha(theme.palette.primary.main, 0.3),
  },
});

function LogoMark({ size = 40 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${size * 0.3}px`,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(145deg, #0f1b33, #060b16)",
        border: "1px solid rgba(96,165,250,0.25)",
        boxShadow: "0 8px 20px rgba(37,99,235,0.22)",
      }}
    >
      <Box component="img" src={logoIcon} alt="" sx={{ width: "72%", height: "72%" }} />
    </Box>
  );
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function Greeting({ name }) {
  const theme = useTheme();
  const now = useNow();
  const hour = now.getHours();
  const greeting =
    hour < 6
      ? "Buenas noches"
      : hour < 13
        ? "Buen día"
        : hour < 20
          ? "Buenas tardes"
          : "Buenas noches";
  const day = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        noWrap
        sx={{
          fontWeight: 850,
          fontSize: { xs: "1rem", sm: "1.08rem", md: "1.2rem" },
          lineHeight: 1.2,
          letterSpacing: "-0.3px",
        }}
      >
        {greeting}, {name.split(" ")[0]}
      </Typography>
      <Typography
        noWrap
        sx={{
          color: theme.palette.app.secondary,
          fontSize: "0.82rem",
          fontWeight: 600,
          mt: 0.2,
          display: { xs: "none", sm: "block" },
        }}
      >
        {capitalize(day)}
      </Typography>
    </Box>
  );
}

function HeaderClock() {
  const theme = useTheme();
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(useNow());

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.8}
      sx={{
        height: 40,
        px: 1.5,
        borderRadius: "12px",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        backgroundColor: theme.palette.app.surface,
        display: { xs: "none", sm: "flex" },
      }}
    >
      <AccessTimeRoundedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
      <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", fontVariantNumeric: "tabular-nums" }}>
        {time}
      </Typography>
    </Stack>
  );
}

function Sidebar({ activeId, onSelect, onLogout, profile }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: theme.palette.app.text,
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          position: "relative",
          display: "grid",
          placeItems: "center",
          px: 2,
          py: v(14, 2.6, 26),
          borderBottom: `1px solid ${theme.palette.app.borderSoft}`,
          ...dragSx,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            width: "85%",
            height: "75%",
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${alpha(theme.palette.primary.main, isDark ? 0.28 : 0.16)}, transparent)`,
            filter: "blur(6px)",
          },
        }}
      >
        <Box
          component="img"
          src={isDark ? logoSidebarDark : logoSidebarLight}
          alt="CodeDesk"
          sx={{
            position: "relative",
            width: v(82, 15.1, 116),
            height: "auto",
            display: "block",
            filter: `drop-shadow(0 10px 22px ${alpha(theme.palette.primary.main, isDark ? 0.35 : 0.22)})`,
            transition: "transform 0.3s ease",
            "&:hover": { transform: "scale(1.03)" },
          }}
        />
      </Box>

      <Box
        component="nav"
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          py: v(8, 1.6, 16),
          scrollbarWidth: "thin",
        }}
      >
        <List disablePadding>
          {SECTIONS.map((item) => {
            const active = activeId === item.id;
            return (
              <ListItemButton
                key={item.id}
                onClick={() => onSelect(item.id)}
                selected={active}
                aria-current={active ? "page" : undefined}
                sx={{
                  position: "relative",
                  mb: 0.4,
                  px: 1.4,
                  py: 0,
                  minHeight: v(36, 5.4, 44),
                  borderRadius: "12px",
                  color: active ? theme.palette.primary.main : theme.palette.app.text,
                  transition: "background-color 0.18s ease, color 0.18s ease",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: -12,
                    top: "22%",
                    bottom: "22%",
                    width: 4,
                    borderRadius: "0 4px 4px 0",
                    backgroundColor: theme.palette.primary.main,
                    opacity: active ? 1 : 0,
                    transition: "opacity 0.18s ease",
                  },
                  "&:hover": { backgroundColor: theme.palette.app.surfaceSoft },
                  "&.Mui-selected, &.Mui-selected:hover": {
                    backgroundColor: theme.palette.app.primarySoft,
                  },
                  "&:hover .nav-icon": { color: theme.palette.primary.main },
                }}
              >
                <ListItemIcon
                  className="nav-icon"
                  sx={{
                    minWidth: 36,
                    color: active ? theme.palette.primary.main : theme.palette.app.secondary,
                    transition: "color 0.18s ease",
                    "& svg": { fontSize: 21 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  sx={{ my: 0 }}
                  primary={item.title}
                  slotProps={{
                    primary: {
                      fontWeight: active ? 800 : 600,
                      fontSize: "0.92rem",
                      noWrap: true,
                    },
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderTop: `1px solid ${theme.palette.app.borderSoft}`,
          backgroundColor: isDark ? alpha("#000", 0.12) : alpha(theme.palette.app.surfaceSoft, 0.6),
        }}
      >
        <ProfileCard profile={profile} onLogout={onLogout} />
      </Box>
    </Box>
  );
}

function useUserProfile() {
  const { user } = useAuth();
  const [toast, showToast, closeToast] = useToast();

  const uid = user?.uid || null;
  const email = user?.email || "";
  const [name, setName] = useState(() => readStorage("nombreCompleto", "Aure"));
  const [draft, setDraft] = useState(name);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    const userRef = doc(db, "users", uid);

    getDoc(userRef)
      .then(async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const backendName =
            data.name || data.nombreCompleto || readStorage("nombreCompleto", "Aure");
          setName(backendName);
          setImage(data.profileImageUrl || null);
          writeStorage("nombreCompleto", backendName);
        } else {
          await setDoc(
            userRef,
            {
              uid,
              email,
              name: readStorage("nombreCompleto", "Aure"),
              profileImageUrl: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
        }
      })
      .catch((error) => console.error("Error cargando perfil:", error));
  }, [uid, email]);

  const saveProfile = (fields) =>
    setDoc(
      doc(db, "users", uid),
      { uid, email, ...fields, updatedAt: serverTimestamp() },
      { merge: true },
    );

  const handleSaveName = async () => {
    const cleanName = draft.trim() || "Aure";
    try {
      setSaving(true);
      if (uid) await saveProfile({ name: cleanName, nombreCompleto: cleanName });
      setName(cleanName);
      writeStorage("nombreCompleto", cleanName);
      setEditing(false);
    } catch (error) {
      console.error("Error guardando nombre:", error);
      showToast("No se pudo guardar el nombre.", { severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type?.startsWith("image/"))
      return showToast("Seleccioná una imagen válida.", { severity: "warning" });
    if (!uid) return showToast("No se pudo identificar el usuario.", { severity: "error" });

    try {
      setSaving(true);
      const imageRef = ref(
        storage,
        `users/${uid}/profile/${Date.now()}-${file.name.replace(/\s+/g, "-").toLowerCase()}`,
      );
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      await saveProfile({ profileImageUrl: url });
      setImage(url);
      showToast("Imagen de perfil actualizada.");
    } catch (error) {
      console.error("Error guardando imagen:", error);
      showToast("No se pudo guardar la imagen.", { severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const initials =
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  return {
    name,
    email,
    draft,
    setDraft,
    editing,
    setEditing,
    image,
    saving,
    initials,
    handleSaveName,
    handleImageChange,
    toast,
    closeToast,
  };
}

function ProfileCard({ profile, onLogout }) {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const {
    name,
    email,
    draft,
    setDraft,
    editing,
    setEditing,
    image,
    saving,
    initials,
    handleSaveName,
    handleImageChange,
  } = profile;
  const pickImage = saving ? undefined : () => fileInputRef.current?.click();
  const action = (color, hoverColor = color) => ({
    width: 30,
    height: 30,
    flexShrink: 0,
    borderRadius: "10px",
    color,
    "&:hover": {
      color: hoverColor,
      backgroundColor: alpha(hoverColor, theme.palette.mode === "dark" ? 0.16 : 0.1),
    },
    "& svg": { fontSize: 17 },
  });

  return (
    <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minHeight: 44 }}>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />

      <Tooltip title="Cambiar imagen" placement="top" arrow>
        <Box
          onClick={pickImage}
          sx={{
            position: "relative",
            flexShrink: 0,
            borderRadius: "50%",
            cursor: saving ? "default" : "pointer",
            "&:hover .avatar-overlay": { opacity: saving ? 0 : 1 },
          }}
        >
          <Avatar
            src={image || undefined}
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "0.88rem",
              opacity: saving ? 0.6 : 1,
              boxShadow: `0 0 0 2px ${theme.palette.app.surface}, 0 0 0 3.5px ${alpha(theme.palette.primary.main, 0.45)}`,
            }}
          >
            {!image && initials}
          </Avatar>
          <Box
            className="avatar-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              backgroundColor: "rgba(2,6,23,0.55)",
              opacity: 0,
              transition: "opacity 0.18s ease",
              "& svg": { fontSize: 17 },
            }}
          >
            <PhotoCameraRoundedIcon />
          </Box>
          {saving && (
            <CircularProgress
              size={44}
              thickness={2.5}
              sx={{ position: "absolute", top: -2, left: -2 }}
            />
          )}
        </Box>
      </Tooltip>

      {editing ? (
        <>
          <InputBase
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSaveName();
              if (event.key === "Escape") setEditing(false);
            }}
            autoFocus
            placeholder="Tu nombre"
            disabled={saving}
            slotProps={{ input: { "aria-label": "Nombre" } }}
            sx={{
              flex: 1,
              minWidth: 0,
              height: 34,
              px: 1.1,
              borderRadius: "10px",
              fontWeight: 750,
              fontSize: "0.88rem",
              backgroundColor: theme.palette.app.surface,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
              boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          />
          <IconButton
            aria-label="Guardar nombre"
            onClick={handleSaveName}
            disabled={saving}
            sx={action(theme.palette.success.main)}
          >
            <CheckRoundedIcon />
          </IconButton>
          <IconButton
            aria-label="Cancelar"
            onClick={() => setEditing(false)}
            disabled={saving}
            sx={action(theme.palette.app.secondary)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </>
      ) : (
        <>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              noWrap
              title={name}
              sx={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.25 }}
            >
              {name}
            </Typography>
            <Typography
              noWrap
              title={email}
              sx={{ color: theme.palette.app.secondary, fontSize: "0.74rem", fontWeight: 600 }}
            >
              {email || "Sesión actual"}
            </Typography>
          </Box>
          <Tooltip title="Editar nombre" arrow>
            <IconButton
              aria-label="Editar nombre"
              onClick={() => {
                setDraft(name);
                setEditing(true);
              }}
              disabled={saving}
              sx={action(theme.palette.app.secondary, theme.palette.primary.main)}
            >
              <EditRoundedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar sesión" arrow>
            <IconButton
              aria-label="Cerrar sesión"
              onClick={onLogout}
              sx={action(theme.palette.app.secondary, theme.palette.error.main)}
            >
              <LogoutRoundedIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}

export default Dashboard;
