//Importaciones:
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import Badge from "@mui/material/Badge";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import GitHubIcon from "@mui/icons-material/GitHub";
import ChangeHistoryRoundedIcon from "@mui/icons-material/ChangeHistoryRounded";
import TrainRoundedIcon from "@mui/icons-material/TrainRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
const TYPES = [
  "Todos",
  "General",
  "Firebase",
  "GitHub",
  "Vercel",
  "Railway",
  "Hosting",
  "Admin",
];

const CREDENTIAL_TYPES = TYPES.filter((item) => item !== "Todos");

const hexToRgba = (hex, opacity = 1) => {
  const clean = String(hex || "").replace("#", "");

  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((character) => character + character)
          .join("")
      : clean;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return `rgba(37, 99, 235, ${opacity})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function getTypeIcon(type) {
  if (type === "Firebase") return <StorageRoundedIcon />;
  if (type === "GitHub") return <GitHubIcon />;
  if (type === "Vercel") return <ChangeHistoryRoundedIcon />;
  if (type === "Railway") return <TrainRoundedIcon />;
  if (type === "Hosting") return <DnsRoundedIcon />;
  if (type === "Admin") return <AdminPanelSettingsRoundedIcon />;

  return <KeyRoundedIcon />;
}

function hasProductionData(credential) {
  return Boolean(
    credential?.production?.email ||
      credential?.production?.password ||
      credential?.production?.url
  );
}

function hasLocalData(credential) {
  return Boolean(credential?.local?.email || credential?.local?.password);
}

function getProjectIconBackground(theme, projectColor) {
  if (theme.palette.mode === "dark") {
    return alpha("#F8FAFC", 0.94);
  }

  return hexToRgba(projectColor || theme.palette.primary.main, 0.1);
}

function getProjectIconBorder(theme, projectColor) {
  if (theme.palette.mode === "dark") {
    return hexToRgba(projectColor || theme.palette.primary.main, 0.38);
  }

  return hexToRgba(projectColor || theme.palette.primary.main, 0.18);
}

function getGlassCardStyles(theme) {
  return {
    borderRadius: "22px",
    border: "1px solid",
    borderColor:
      theme.palette.mode === "dark"
        ? alpha("#FFFFFF", 0.08)
        : alpha("#0F172A", 0.08),
    bgcolor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.82)
        : alpha(theme.palette.background.paper, 0.96),
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 20px 60px rgba(0,0,0,0.28)"
        : "0 18px 45px rgba(15,23,42,0.06)",
  };
}

function getTypeColor(theme, type) {
  if (type === "Firebase") return theme.palette.warning.main;
  if (type === "GitHub") return theme.palette.text.primary;
  if (type === "Vercel") return theme.palette.text.secondary;
  if (type === "Railway") return theme.palette.primary.main;
  if (type === "Hosting") return theme.palette.info.main;
  if (type === "Admin") return theme.palette.error.main;

  return theme.palette.primary.main;
}

export default function Credenciales() {
  const theme = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingCredential, setEditingCredential] = useState(null);
  const [selectedCredential, setSelectedCredential] = useState(null);
  const [credentialToDelete, setCredentialToDelete] = useState(null);

  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("General");
  const [filterType, setFilterType] = useState("Todos");

  const [productionEmail, setProductionEmail] = useState("");
  const [productionPassword, setProductionPassword] = useState("");
  const [productionUrl, setProductionUrl] = useState("");

  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const credentialsQuery = query(
      collection(db, "credentials"),
      where("userId", "==", user.uid)
    );

    const unsubscribeProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort((a, b) => {
            const nameA = String(a.name || "").toLowerCase();
            const nameB = String(b.name || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });

        setProjects(data);
      },
      (error) => {
        console.log(error);
        setPageError("No se pudieron cargar los proyectos.");
      }
    );

    const unsubscribeCredentials = onSnapshot(
      credentialsQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });

        setCredentials(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setCredentials([]);
        setLoading(false);
        setPageError("No se pudieron cargar las credenciales.");
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeCredentials();
    };
  }, [user]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const filteredCredentials = useMemo(() => {
    if (filterType === "Todos") return credentials;

    return credentials.filter(
      (credential) => (credential.type || "General") === filterType
    );
  }, [credentials, filterType]);

  const stats = useMemo(() => {
    const productionCount = credentials.filter(hasProductionData).length;
    const localCount = credentials.filter(hasLocalData).length;
    const projectsWithCredentials = new Set(
      credentials.map((credential) => credential.projectId).filter(Boolean)
    ).size;

    return {
      total: credentials.length,
      productionCount,
      localCount,
      projectsWithCredentials,
    };
  }, [credentials]);

  function resetForm() {
    setEditingCredential(null);
    setProjectId("");
    setType("General");

    setProductionEmail("");
    setProductionPassword("");
    setProductionUrl("");

    setLocalEmail("");
    setLocalPassword("");

    setNotes("");
    setPageError("");
  }

  function openCreateDialog() {
    resetForm();
    setCredentialDialogOpen(true);
  }

  function openEditDialog(credential) {
    setEditingCredential(credential);
    setProjectId(credential.projectId || "");
    setType(credential.type || "General");

    setProductionEmail(credential.production?.email || "");
    setProductionPassword(credential.production?.password || "");
    setProductionUrl(credential.production?.url || "");

    setLocalEmail(credential.local?.email || "");
    setLocalPassword(credential.local?.password || "");

    setNotes(credential.notes || "");
    setPageError("");
    setCredentialDialogOpen(true);
  }

  function closeCredentialDialog() {
    resetForm();
    setCredentialDialogOpen(false);
  }

  function openDetails(credential) {
    setSelectedCredential(credential);
    setDetailDialogOpen(true);
  }

  function closeDetails() {
    setSelectedCredential(null);
    setDetailDialogOpen(false);
  }

  function openDeleteDialog(credential) {
    setCredentialToDelete(credential);
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setCredentialToDelete(null);
    setDeleteDialogOpen(false);
  }

  async function copyValue(value, label) {
    if (!value) {
      setPageError(`No hay ${label} para copiar.`);
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setPageSuccess(`${label} copiado al portapapeles.`);

      setTimeout(() => {
        setPageSuccess("");
      }, 2200);
    } catch (error) {
      console.log(error);
      setPageError("No se pudo copiar el dato.");
    }
  }

  async function handleSaveCredential(event) {
    event?.preventDefault();

    if (!projectId) {
      setPageError("Seleccioná un proyecto.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setPageSuccess("");

      const selectedProject = projects.find((project) => project.id === projectId);

      const payload = {
        userId: user.uid,
        projectId,
        projectName: selectedProject?.name || "",
        projectColor: selectedProject?.color || null,
        projectLogoUrl: selectedProject?.logoUrl || null,
        type,
        production: {
          email: productionEmail.trim(),
          password: productionPassword.trim(),
          url: productionUrl.trim(),
        },
        local: {
          email: localEmail.trim(),
          password: localPassword.trim(),
        },
        notes: notes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingCredential) {
        await updateDoc(doc(db, "credentials", editingCredential.id), payload);
      } else {
        await addDoc(collection(db, "credentials"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      closeCredentialDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudieron guardar las credenciales.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteCredential() {
    if (!credentialToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "credentials", credentialToDelete.id));

      if (selectedCredential?.id === credentialToDelete.id) {
        closeDetails();
      }

      closeDeleteDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudieron eliminar las credenciales.");
    }
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        px: { xs: 0, sm: 1, lg: 2 },
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.3, md: 3 }}>
        <PageHeader onCreate={openCreateDialog} stats={stats} />

        {pageError ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageError}
          </Alert>
        ) : null}

        {pageSuccess ? (
          <Alert
            severity="success"
            sx={{
              borderRadius: "16px",
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageSuccess}
          </Alert>
        ) : null}

        {loading ? (
          <CredentialsSkeleton />
        ) : (
          <>
            <StatsGrid stats={stats} />

            <FilterPanel
              filterType={filterType}
              setFilterType={setFilterType}
              visibleCount={filteredCredentials.length}
              totalCount={credentials.length}
            />

            <ListHeader
              loading={loading}
              filteredCount={filteredCredentials.length}
            />

            {filteredCredentials.length === 0 ? (
              <EmptyState onCreate={openCreateDialog} />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "repeat(2, 1fr)",
                  },
                  gap: { xs: 1.6, md: 2 },
                }}
              >
                {filteredCredentials.map((credential) => (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    onOpen={() => openDetails(credential)}
                  />
                ))}
              </Box>
            )}
          </>
        )}
      </Stack>

      <CredentialFormDialog
        open={credentialDialogOpen}
        editingCredential={editingCredential}
        projects={projects}
        selectedProject={selectedProject}
        projectId={projectId}
        setProjectId={setProjectId}
        type={type}
        setType={setType}
        productionEmail={productionEmail}
        setProductionEmail={setProductionEmail}
        productionPassword={productionPassword}
        setProductionPassword={setProductionPassword}
        productionUrl={productionUrl}
        setProductionUrl={setProductionUrl}
        localEmail={localEmail}
        setLocalEmail={setLocalEmail}
        localPassword={localPassword}
        setLocalPassword={setLocalPassword}
        notes={notes}
        setNotes={setNotes}
        saving={saving}
        pageError={pageError}
        onClose={closeCredentialDialog}
        onSave={handleSaveCredential}
      />

      <CredentialDetailDialog
        open={detailDialogOpen}
        selectedCredential={selectedCredential}
        onClose={closeDetails}
        onEdit={() => {
          if (!selectedCredential) return;
          const credential = selectedCredential;
          closeDetails();

          setTimeout(() => {
            openEditDialog(credential);
          }, 120);
        }}
        onDelete={() => {
          if (!selectedCredential) return;
          openDeleteDialog(selectedCredential);
        }}
        onCopy={copyValue}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        credentialToDelete={credentialToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteCredential}
      />
    </Box>
  );
}

function BackgroundGlow() {
  return null;
}

function PageHeader({ onCreate, stats }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "22px",
        px: { xs: 2.2, md: 3 },
        py: { xs: 2.4, md: 3 },
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 18px 48px rgba(0, 0, 0, 0.16)"
            : "0 16px 42px rgba(15, 23, 42, 0.045)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2.5}
      >
        <Stack direction="row" spacing={1.7} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 54, md: 60 },
              height: { xs: 54, md: 60 },
              borderRadius: "18px",
              color: theme.palette.primary.main,
              bgcolor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <ShieldRoundedIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 950,
                letterSpacing: "-0.6px",
                fontSize: { xs: "1.7rem", md: "2.15rem" },
                lineHeight: 1.05,
              }}
            >
              Credenciales
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: theme.palette.app.secondary,
                maxWidth: 720,
                fontSize: { xs: "0.92rem", md: "0.98rem" },
                lineHeight: 1.6,
                fontWeight: 600,
              }}
            >
              Guardá accesos por proyecto para producción y entorno local, con copia rápida cuando los necesites.
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            alignSelf: { xs: "stretch", md: "center" },
            minHeight: 46,
            px: 2.4,
            borderRadius: "16px",
            fontWeight: 950,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Nueva credencial
        </Button>
      </Stack>
    </Card>
  );
}

function StatsGrid({ stats }) {
  const theme = useTheme();

  const items = [
    {
      label: "Credenciales",
      value: stats.total,
      icon: <KeyRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Producción",
      value: stats.productionCount,
      icon: <CloudQueueRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Local",
      value: stats.localCount,
      icon: <LaptopRoundedIcon />,
      color: theme.palette.warning.main,
    },
    {
      label: "Proyectos",
      value: stats.projectsWithCredentials,
      icon: <FolderRoundedIcon />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: { xs: 1.3, md: 1.8 },
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          variant="outlined"
          sx={{
            ...getGlassCardStyles(theme),
            borderRadius: "20px",
            p: { xs: 1.7, md: 2.1 },
            boxShadow: "none",
            transition: "0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(item.color, 0.28),
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 46 },
                height: { xs: 40, md: 46 },
                borderRadius: 2.1,
                color: item.color,
                bgcolor: alpha(
                  item.color,
                  theme.palette.mode === "dark" ? 0.16 : 0.1
                ),
              }}
            >
              {item.icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 25, md: 32 },
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: -0.7,
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                color="text.secondary"
                sx={{
                  mt: 0.65,
                  fontSize: { xs: 12.5, md: 13.5 },
                  fontWeight: 900,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

function FilterPanel({ filterType, setFilterType, visibleCount, totalCount }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "20px",
        p: { xs: 1.6, md: 2 },
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1.6}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <FilterAltRoundedIcon />
          </Avatar>

          <Box>
            <Typography sx={{ fontWeight: 950 }}>Filtros por tipo</Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.2, fontSize: 13, fontWeight: 650 }}
            >
              {visibleCount} visibles de {totalCount} credenciales.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {TYPES.map((item) => {
            const selected = filterType === item;
            const color =
              item === "Todos" ? theme.palette.primary.main : getTypeColor(theme, item);

            return (
              <FilterChip
                key={item}
                label={item}
                icon={item === "Todos" ? <KeyRoundedIcon /> : getTypeIcon(item)}
                selected={selected}
                color={color}
                onClick={() => setFilterType(item)}
              />
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

function FilterChip({ label, icon, selected, color, onClick }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      clickable
      onClick={onClick}
      sx={{
        height: 38,
        borderRadius: 999,
        border: "1px solid",
        borderColor: selected
          ? alpha(color, theme.palette.mode === "dark" ? 0.34 : 0.22)
          : theme.palette.mode === "dark"
          ? alpha("#FFFFFF", 0.08)
          : alpha("#0F172A", 0.08),
        bgcolor: selected
          ? alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.1)
          : theme.palette.mode === "dark"
          ? alpha("#FFFFFF", 0.04)
          : alpha("#0F172A", 0.035),
        color: selected ? color : "text.secondary",
        fontWeight: 950,
        transition: "0.18s ease",
        "& .MuiChip-icon": {
          color: selected ? color : theme.palette.text.secondary,
        },
        "&:hover": {
          transform: "translateY(-1px)",
          bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.1),
        },
      }}
    />
  );
}

function ListHeader({ loading, filteredCount }) {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={1}
      sx={{ px: { xs: 0.2, md: 0.4 } }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.8,
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <LockRoundedIcon sx={{ fontSize: 18 }} />
        </Avatar>

        <Box>
          <Typography
            sx={{
              fontSize: { xs: 12, md: 13 },
              fontWeight: 950,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {loading
              ? "Cargando credenciales"
              : `${filteredCount} credenciales visibles`}
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ fontSize: 12.5, fontWeight: 650 }}
          >
            Tocá una tarjeta para ver o copiar accesos.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}

function CredentialCard({ credential, onOpen }) {
  const theme = useTheme();

  const projectColor = credential.projectColor || theme.palette.primary.main;
  const typeValue = credential.type || "General";
  const typeColor = getTypeColor(theme, typeValue);
  const hasProduction = hasProductionData(credential);
  const hasLocal = hasLocalData(credential);

  return (
    <Card
      variant="outlined"
      onClick={onOpen}
      sx={{
        borderRadius: "22px",
        bgcolor: theme.palette.app.surface,
        backgroundImage: "none",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        overflow: "hidden",
        cursor: "pointer",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 16px 36px rgba(0,0,0,0.16)"
            : "0 14px 30px rgba(15,23,42,0.045)",
        transition: "0.18s ease",
        "&:hover": {
          borderColor: alpha(projectColor, 0.34),
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.7}
        sx={{ p: { xs: 1.8, md: 2.1 } }}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <Avatar
              sx={{
                width: 28,
                height: 28,
                bgcolor: typeColor,
                color: "#FFFFFF",
                border: "2px solid",
                borderColor: theme.palette.app.surface,
                "& svg": { fontSize: 16 },
              }}
            >
              {getTypeIcon(typeValue)}
            </Avatar>
          }
        >
          <ProjectIcon item={credential} size={62} />
        </Badge>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={0.8} sx={{ mb: 0.65 }}>
            <Chip
              icon={getTypeIcon(typeValue)}
              label={typeValue}
              size="small"
              sx={{
                height: 26,
                borderRadius: "999px",
                bgcolor: alpha(typeColor, theme.palette.mode === "dark" ? 0.14 : 0.08),
                color: typeColor,
                border: `1px solid ${alpha(typeColor, theme.palette.mode === "dark" ? 0.22 : 0.14)}`,
                fontWeight: 900,
                "& .MuiChip-icon": { color: typeColor },
              }}
            />
          </Stack>

          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1rem", md: "1.15rem" },
              fontWeight: 950,
              letterSpacing: "-0.25px",
            }}
          >
            {credential.projectName || "Proyecto sin nombre"}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.55 }}>
            <BusinessCenterRoundedIcon sx={{ fontSize: 16, color: theme.palette.app.secondary, flexShrink: 0 }} />
            <Typography
              noWrap
              sx={{
                color: theme.palette.app.secondary,
                fontSize: "0.84rem",
                fontWeight: 700,
              }}
            >
              Accesos guardados
            </Typography>
          </Stack>

          {(hasProduction || hasLocal) && (
            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mt: 1.1 }}>
              {hasProduction ? (
                <SmallInfoChip label="Producción" icon={<CloudQueueRoundedIcon />} color={theme.palette.info.main} />
              ) : null}

              {hasLocal ? (
                <SmallInfoChip label="Local" icon={<LaptopRoundedIcon />} color={theme.palette.warning.main} />
              ) : null}
            </Stack>
          )}
        </Box>

        <ChevronRightRoundedIcon sx={{ color: theme.palette.app.secondary, flexShrink: 0 }} />
      </Stack>
    </Card>
  );
}

function SmallInfoChip({ label, icon, color }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        height: 29,
        borderRadius: 999,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.15 : 0.09),
        color,
        border: "1px solid",
        borderColor: alpha(color, theme.palette.mode === "dark" ? 0.24 : 0.14),
        fontWeight: 900,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function ProjectIcon({ item, size = 56 }) {
  const theme = useTheme();

  const color = item?.projectColor || item?.color || theme.palette.primary.main;
  const logoUrl = item?.projectLogoUrl || item?.logoUrl;

  return (
    <Box
      sx={{
        width: { xs: size - 8, md: size },
        height: { xs: size - 8, md: size },
        flexShrink: 0,
        borderRadius: `${size / 3}px`,
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, color),
        bgcolor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(color, 0.13)}`,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={item?.projectName || "Proyecto"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Typography
          sx={{
            color,
            fontSize: { xs: 23, md: 29 },
            fontWeight: 950,
          }}
        >
          {(item?.projectName || item?.name || "P").charAt(0).toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}

function EmptyState({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      <Stack alignItems="center" sx={{ p: { xs: 3, md: 5 } }}>
        <Avatar
          variant="rounded"
          sx={{
            width: { xs: 68, md: 82 },
            height: { xs: 68, md: 82 },
            borderRadius: 3.2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            mb: 2.2,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.16),
          }}
        >
          <KeyRoundedIcon sx={{ fontSize: { xs: 34, md: 42 } }} />
        </Avatar>

        <Typography
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 950,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          Sin credenciales todavía
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 1,
            mb: 2.8,
            maxWidth: 540,
            textAlign: "center",
            lineHeight: 1.7,
            fontWeight: 600,
          }}
        >
          Agregá accesos por proyecto para local y producción. Vas a poder
          copiarlos rápido cuando los necesites.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 2.6,
            borderRadius: "14px",
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Nueva credencial
        </Button>
      </Stack>
    </Card>
  );
}

function CredentialFormDialog({
  open,
  editingCredential,
  projects,
  selectedProject,
  projectId,
  setProjectId,
  type,
  setType,
  productionEmail,
  setProductionEmail,
  productionPassword,
  setProductionPassword,
  productionUrl,
  setProductionUrl,
  localEmail,
  setLocalEmail,
  localPassword,
  setLocalPassword,
  notes,
  setNotes,
  saving,
  pageError,
  onClose,
  onSave,
}) {
  const theme = useTheme();

  const [showProductionPassword, setShowProductionPassword] = useState(false);
  const [showLocalPassword, setShowLocalPassword] = useState(false);

  const typeColor = getTypeColor(theme, type);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <Box component="form" onSubmit={onSave}>
        <DialogTitle
          sx={{
            position: "relative",
            px: { xs: 2.2, md: 3 },
            pt: { xs: 2.2, md: 3 },
            pb: 2,
            pr: 7,
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1.6} alignItems="flex-start">
              <Avatar
                variant="rounded"
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  color: typeColor,
                  bgcolor: alpha(typeColor, theme.palette.mode === "dark" ? 0.16 : 0.1),
                  border: "1px solid",
                  borderColor: alpha(typeColor, 0.18),
                }}
              >
                {editingCredential ? <EditRoundedIcon /> : <AddRoundedIcon />}
              </Avatar>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.35 }}>
                  {editingCredential ? "Editar credenciales" : "Nueva credencial"}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.4, fontWeight: 600, lineHeight: 1.5 }}
                >
                  Cargá accesos para producción y local.
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={onClose}
              disabled={saving}
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
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: { xs: 2.4, md: 3 } }}>
          <Stack spacing={2.4}>
            {pageError ? (
              <Alert severity="error" sx={{ borderRadius: "16px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            ) : null}

            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: "16px", fontWeight: 700 }}>
                Primero necesitás crear un proyecto para guardar credenciales.
              </Alert>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Proyecto</InputLabel>

                <Select
                  label="Proyecto"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  disabled={saving}
                  sx={{ borderRadius: "14px" }}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      <Stack direction="row" alignItems="center" spacing={1.2}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            mt: "-1px",
                            borderRadius: 999,
                            bgcolor: project.color || "primary.main",
                            boxShadow: `0 0 0 4px ${alpha(
                              project.color || theme.palette.primary.main,
                              0.1
                            )}`,
                          }}
                        />

                        <span>{project.name}</span>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedProject ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.3}
                sx={{
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.08)
                      : alpha("#0F172A", 0.08),
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.035)
                      : alpha("#0F172A", 0.025),
                  p: 1.5,
                }}
              >
                <ProjectPreviewIcon project={selectedProject} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 950 }}>
                    {selectedProject.name}
                  </Typography>

                  <Typography
                    noWrap
                    color="text.secondary"
                    sx={{ mt: 0.2, fontSize: 13, fontWeight: 650 }}
                  >
                    Proyecto seleccionado
                  </Typography>
                </Box>
              </Stack>
            ) : null}

            <Box>
              <Typography sx={{ fontWeight: 950, mb: 1.2 }}>Tipo</Typography>

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {CREDENTIAL_TYPES.map((item) => {
                  const selected = type === item;
                  const color = getTypeColor(theme, item);

                  return (
                    <Chip
                      key={item}
                      clickable
                      icon={selected ? <CheckCircleRoundedIcon /> : getTypeIcon(item)}
                      label={item}
                      onClick={() => setType(item)}
                      sx={{
                        height: 38,
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: selected
                          ? alpha(color, theme.palette.mode === "dark" ? 0.34 : 0.22)
                          : theme.palette.mode === "dark"
                          ? alpha("#FFFFFF", 0.08)
                          : alpha("#0F172A", 0.08),
                        bgcolor: selected
                          ? alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.1)
                          : theme.palette.mode === "dark"
                          ? alpha("#FFFFFF", 0.035)
                          : alpha("#0F172A", 0.025),
                        color: selected ? color : "text.secondary",
                        fontWeight: 950,
                        "& .MuiChip-icon": {
                          color: selected ? color : "text.secondary",
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <CredentialFormSection
              title="Producción"
              subtitle="Datos usados en deploy, hosting, admin o servicios online."
              icon={<CloudQueueRoundedIcon />}
              color={theme.palette.info.main}
            />

            <TextField
              label="URL producción"
              value={productionUrl}
              onChange={(event) => setProductionUrl(event.target.value)}
              fullWidth
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkRoundedIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <TextField
              label="Email / usuario producción"
              value={productionEmail}
              onChange={(event) => setProductionEmail(event.target.value)}
              fullWidth
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailRoundedIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <TextField
              label="Contraseña producción"
              type={showProductionPassword ? "text" : "password"}
              value={productionPassword}
              onChange={(event) => setProductionPassword(event.target.value)}
              fullWidth
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasswordRoundedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowProductionPassword((prev) => !prev)
                      }
                      edge="end"
                    >
                      {showProductionPassword ? (
                        <VisibilityOffRoundedIcon />
                      ) : (
                        <VisibilityRoundedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <CredentialFormSection
              title="Local"
              subtitle="Datos para entorno local, pruebas o acceso de desarrollo."
              icon={<LaptopRoundedIcon />}
              color={theme.palette.warning.main}
            />

            <TextField
              label="Email / usuario local"
              value={localEmail}
              onChange={(event) => setLocalEmail(event.target.value)}
              fullWidth
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AlternateEmailRoundedIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <TextField
              label="Contraseña local"
              type={showLocalPassword ? "text" : "password"}
              value={localPassword}
              onChange={(event) => setLocalPassword(event.target.value)}
              fullWidth
              disabled={saving}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasswordRoundedIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowLocalPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showLocalPassword ? (
                        <VisibilityOffRoundedIcon />
                      ) : (
                        <VisibilityRoundedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <TextField
              label="Notas"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2.2 }}>
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              textTransform: "none",
              fontWeight: 850,
              borderRadius: 2.4,
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || projects.length === 0}
            startIcon={editingCredential ? <EditRoundedIcon /> : <AddRoundedIcon />}
            sx={{
              minHeight: 45,
              px: 2.4,
              borderRadius: 2.5,
              fontWeight: 950,
              textTransform: "none",
            }}
          >
            {saving
              ? "Guardando..."
              : editingCredential
              ? "Guardar cambios"
              : "Guardar credencial"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function ProjectPreviewIcon({ project }) {
  const theme = useTheme();

  const projectColor = project.color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: 48,
        height: 48,
        flexShrink: 0,
        borderRadius: 2.2,
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, projectColor),
        bgcolor: getProjectIconBackground(theme, projectColor),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {project.logoUrl ? (
        <Box
          component="img"
          src={project.logoUrl}
          alt={project.name || "Proyecto"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <Typography
          sx={{
            color: projectColor,
            fontSize: 21,
            fontWeight: 950,
          }}
        >
          {project.name?.charAt(0)?.toUpperCase() || "P"}
        </Typography>
      )}
    </Box>
  );
}

function CredentialFormSection({ title, subtitle, icon, color }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.3}
      sx={{
        mt: 1,
        borderRadius: "16px",
        border: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.08)
            : alpha("#0F172A", 0.08),
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        p: 1.5,
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.1,
          bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
          color,
        }}
      >
        {icon}
      </Avatar>

      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 950 }}>{title}</Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 0.2, fontSize: 13, fontWeight: 650 }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

function CredentialDetailDialog({
  open,
  selectedCredential,
  onClose,
  onEdit,
  onDelete,
  onCopy,
}) {
  const theme = useTheme();

  const [showProductionPassword, setShowProductionPassword] = useState(false);
  const [showLocalPassword, setShowLocalPassword] = useState(false);

  if (!selectedCredential) return null;

  const typeValue = selectedCredential.type || "General";
  const typeColor = getTypeColor(theme, typeValue);
  const projectColor = selectedCredential.projectColor || theme.palette.primary.main;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "22px",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: { xs: 2.2, md: 3 },
          pb: 2.2,
          overflow: "hidden",
        }}
      >

        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={2}
          sx={{ position: "relative" }}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: typeColor,
                  color: "#FFFFFF",
                  border: "2px solid",
                  borderColor: "background.paper",
                }}
              >
                {getTypeIcon(typeValue)}
              </Avatar>
            }
          >
            <ProjectIcon item={selectedCredential} size={74} />
          </Badge>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mb: 1 }}>
              <Chip
                icon={getTypeIcon(typeValue)}
                label={typeValue}
                size="small"
                sx={{
                  height: 27,
                  borderRadius: 999,
                  color: typeColor,
                  bgcolor: alpha(typeColor, theme.palette.mode === "dark" ? 0.16 : 0.1),
                  fontWeight: 950,
                  "& .MuiChip-icon": {
                    color: typeColor,
                  },
                }}
              />
            </Stack>

            <Typography
              sx={{
                fontSize: { xs: 23, md: 30 },
                fontWeight: 950,
                letterSpacing: -0.5,
                lineHeight: 1.18,
              }}
            >
              {selectedCredential.projectName || "Proyecto sin nombre"}
            </Typography>

            <Typography
              color="text.secondary"
              sx={{
                mt: 0.6,
                fontWeight: 800,
              }}
            >
              Detalle de accesos guardados.
            </Typography>
          </Box>

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
            <CloseRoundedIcon sx={{ fontSize: 21 }} />
          </IconButton>
        </Stack>
      </Box>

      <Divider />

      <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.5 }}>
        <Stack spacing={2}>
          <CredentialBlock
            title="Producción"
            icon={<CloudQueueRoundedIcon />}
            data={selectedCredential.production}
            color={theme.palette.info.main}
            showPassword={showProductionPassword}
            setShowPassword={setShowProductionPassword}
            onCopy={onCopy}
          />

          <CredentialBlock
            title="Local"
            icon={<LaptopRoundedIcon />}
            data={selectedCredential.local}
            color={theme.palette.warning.main}
            showUrl={false}
            showPassword={showLocalPassword}
            setShowPassword={setShowLocalPassword}
            onCopy={onCopy}
          />

          {selectedCredential.notes ? (
            <Card
              variant="outlined"
              sx={{
                borderRadius: "16px",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.035)
                    : alpha("#0F172A", 0.025),
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.075)
                    : alpha("#0F172A", 0.075),
                boxShadow: "none",
              }}
            >
              <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                      color: "primary.main",
                    }}
                  >
                    <NoteAltRoundedIcon />
                  </Avatar>

                  <Typography sx={{ fontWeight: 950 }}>Notas</Typography>
                </Stack>

                <Typography
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    fontWeight: 600,
                  }}
                >
                  {selectedCredential.notes}
                </Typography>
              </Box>
            </Card>
          ) : null}
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2.2 }}>
        <Button
          variant="contained"
          startIcon={<EditRoundedIcon />}
          onClick={onEdit}
          sx={{
            minHeight: 44,
            borderRadius: 2.5,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Editar
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteRoundedIcon />}
          onClick={onDelete}
          sx={{
            minHeight: 44,
            borderRadius: 2.5,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CredentialBlock({
  title,
  icon,
  data,
  color,
  onCopy,
  showUrl = true,
  showPassword,
  setShowPassword,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "16px",
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.075)
            : alpha("#0F172A", 0.075),
        boxShadow: "none",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
              color,
            }}
          >
            {icon}
          </Avatar>

          <Box>
            <Typography sx={{ fontWeight: 950 }}>{title}</Typography>

            <Typography
              color="text.secondary"
              sx={{ fontSize: 12.5, fontWeight: 650 }}
            >
              {title === "Producción"
                ? "Accesos del entorno publicado."
                : "Accesos del entorno local."}
            </Typography>
          </Box>
        </Stack>

        {showUrl ? (
          <CopyRow
            label="URL"
            value={data?.url}
            icon={<LinkRoundedIcon />}
            onCopy={onCopy}
          />
        ) : null}

        <CopyRow
          label="Email / usuario"
          value={data?.email}
          icon={<AlternateEmailRoundedIcon />}
          onCopy={onCopy}
        />

        <CopyRow
          label="Contraseña"
          value={data?.password}
          icon={<PasswordRoundedIcon />}
          isPassword
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          onCopy={onCopy}
        />
      </Box>
    </Card>
  );
}

function CopyRow({
  label,
  value,
  icon,
  isPassword = false,
  showPassword = false,
  setShowPassword = () => {},
  onCopy,
}) {
  const theme = useTheme();

  const visibleValue =
    isPassword && value && !showPassword ? "••••••••••••" : value || "Sin dato";

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.4}
      sx={{
        borderTop: "1px solid",
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.08)
            : alpha("#0F172A", 0.08),
        pt: 1.2,
        mt: 1.2,
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.8,
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.055)
              : alpha("#0F172A", 0.045),
          color: "text.secondary",
        }}
      >
        {icon}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          color="text.secondary"
          sx={{
            fontSize: 12,
            fontWeight: 850,
            mb: 0.2,
          }}
        >
          {label}
        </Typography>

        <Typography
          noWrap
          sx={{
            fontSize: 15,
            fontWeight: 850,
          }}
        >
          {visibleValue}
        </Typography>
      </Box>

      {isPassword && value ? (
        <Tooltip title={showPassword ? "Ocultar" : "Mostrar"}>
          <IconButton onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
          </IconButton>
        </Tooltip>
      ) : null}

      <Tooltip title="Copiar">
        <IconButton
          onClick={() => onCopy(value, label)}
          sx={{
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.055)
                : alpha(theme.palette.primary.main, 0.08),
            color: "primary.main",
            "&:hover": {
              bgcolor: alpha(theme.palette.primary.main, 0.14),
            },
          }}
        >
          <ContentCopyRoundedIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function DeleteDialog({ open, credentialToDelete, onClose, onConfirm }) {
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
          bgcolor: theme.palette.app.surface,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ px: 3, pt: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                borderRadius: "17px",
                bgcolor: alpha(theme.palette.error.main, 0.12),
                color: theme.palette.error.main,
                border: "1px solid",
                borderColor: alpha(theme.palette.error.main, 0.2),
                flexShrink: 0,
              }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 28 }} />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.35rem",
                  fontWeight: 950,
                  lineHeight: 1.15,
                }}
              >
                Eliminar credenciales
              </Typography>

              <Typography
                sx={{
                  mt: 0.45,
                  color: theme.palette.app.secondary,
                  lineHeight: 1.5,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          </Stack>

          {credentialToDelete ? (
            <Box
              sx={{
                width: "100%",
                borderRadius: "16px",
                p: 1.3,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.035)
                    : alpha("#0F172A", 0.025),
                border: `1px solid ${theme.palette.app.borderSoft}`,
              }}
            >
              <Typography sx={{ color: theme.palette.app.text, fontWeight: 900, textAlign: "center" }}>
                {credentialToDelete.projectName || "Proyecto sin nombre"}
              </Typography>

              <Typography sx={{ mt: 0.35, color: theme.palette.app.secondary, fontWeight: 700, textAlign: "center" }}>
                {credentialToDelete.type || "General"}
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
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
          startIcon={<DeleteRoundedIcon />}
          onClick={onConfirm}
          sx={{
            minHeight: 42,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CredentialsSkeleton() {
  const theme = useTheme();

  return (
    <Stack spacing={{ xs: 2.3, md: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: { xs: 1.3, md: 1.8 },
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={118}
            sx={{ borderRadius: 3.5 }}
          />
        ))}
      </Box>

      <Skeleton variant="rounded" height={96} sx={{ borderRadius: 3.5 }} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(2, 1fr)",
          },
          gap: { xs: 1.6, md: 2 },
        }}
      >
        {[1, 2, 3, 4].map((item) => (
          <Card
            key={item}
            variant="outlined"
            sx={{
              borderRadius: "22px",
              bgcolor: "background.paper",
              borderColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Skeleton
                  variant="rounded"
                  width={68}
                  height={68}
                  sx={{ borderRadius: 3 }}
                />

                <Box sx={{ flex: 1 }}>
                  <Skeleton
                    variant="rounded"
                    width={94}
                    height={27}
                    sx={{ borderRadius: 999, mb: 1 }}
                  />

                  <Skeleton variant="text" width="78%" height={30} />
                  <Skeleton variant="text" width="52%" height={22} />

                  <Stack direction="row" spacing={1} sx={{ mt: 1.2 }}>
                    <Skeleton
                      variant="rounded"
                      width={110}
                      height={29}
                      sx={{ borderRadius: 999 }}
                    />

                    <Skeleton
                      variant="rounded"
                      width={80}
                      height={29}
                      sx={{ borderRadius: 999 }}
                    />
                  </Stack>
                </Box>

                <Skeleton variant="circular" width={28} height={28} />
              </Stack>
            </Box>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}