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
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
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
    borderRadius: "24px",
    border: `1px solid ${theme.palette.app?.borderSoft || alpha(theme.palette.divider, 0.8)}`,
    backgroundColor: theme.palette.app?.surface || theme.palette.background.paper,
    backgroundImage: "none",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 18px 48px rgba(0, 0, 0, 0.16)"
        : "0 16px 42px rgba(15, 23, 42, 0.045)",
  };
}
function normalizeUrl(value) {
  const clean = String(value || "").trim();

  if (!clean) return "";

  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  return `https://${clean}`;
}

function getShortUrl(value) {
  const clean = String(value || "").trim();

  if (!clean) return "Sin enlace";

  return clean
    .replace("https://", "")
    .replace("http://", "")
    .replace("console.firebase.google.com/", "firebase.google.com/");
}

export default function DataBase() {
  const theme = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [databaseDialogOpen, setDatabaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingDatabase, setEditingDatabase] = useState(null);
  const [databaseToDelete, setDatabaseToDelete] = useState(null);

  const [projectId, setProjectId] = useState("");
  const [firebaseUrl, setFirebaseUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const databasesQuery = query(
      collection(db, "databasesInfo"),
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

    const unsubscribeDatabases = onSnapshot(
      databasesQuery,
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

        setDatabases(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setDatabases([]);
        setLoading(false);
        setPageError("No se pudieron cargar los enlaces.");
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeDatabases();
    };
  }, [user]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const stats = useMemo(() => {
    const projectsWithDatabase = new Set(
      databases
        .map((item) => item.projectId)
        .filter(Boolean)
    ).size;

    return {
      totalDatabases: databases.length,
      totalProjects: projects.length,
      projectsWithDatabase,
      projectsWithoutDatabase: Math.max(projects.length - projectsWithDatabase, 0),
    };
  }, [databases, projects]);

  function resetForm() {
    setEditingDatabase(null);
    setProjectId("");
    setFirebaseUrl("");
    setNotes("");
    setPageError("");
  }

  function openCreateDialog() {
    resetForm();
    setDatabaseDialogOpen(true);
  }

  function openEditDialog(item) {
    setEditingDatabase(item);
    setProjectId(item.projectId || "");
    setFirebaseUrl(item.firebaseUrl || "");
    setNotes(item.notes || "");
    setPageError("");
    setDatabaseDialogOpen(true);
  }

  function closeDatabaseDialog() {
    resetForm();
    setDatabaseDialogOpen(false);
  }

  function openDeleteDialog(item) {
    setDatabaseToDelete(item);
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setDatabaseToDelete(null);
    setDeleteDialogOpen(false);
  }

  function openFirebaseLink(item) {
    const url = normalizeUrl(item.firebaseUrl);

    if (!url) {
      setPageError("Este proyecto no tiene enlace cargado.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleSaveDatabase(event) {
    event?.preventDefault();

    if (!projectId) {
      setPageError("Seleccioná un proyecto.");
      return;
    }

    if (!firebaseUrl.trim()) {
      setPageError("Pegá el enlace de Firebase.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");

      const payload = {
        userId: user.uid,
        projectId,
        projectName: selectedProject?.name || "",
        projectColor: selectedProject?.color || null,
        projectLogoUrl: selectedProject?.logoUrl || null,
        firebaseUrl: normalizeUrl(firebaseUrl),
        notes: notes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingDatabase) {
        await updateDoc(doc(db, "databasesInfo", editingDatabase.id), payload);
      } else {
        await addDoc(collection(db, "databasesInfo"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      closeDatabaseDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo guardar la base de datos.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteDatabase() {
    if (!databaseToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "databasesInfo", databaseToDelete.id));
      closeDeleteDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo eliminar el enlace.");
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
              borderRadius: 3,
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageError}
          </Alert>
        ) : null}

        {loading ? (
          <DatabasesSkeleton />
        ) : databases.length === 0 ? (
          <>
            <StatsGrid stats={stats} />
            <EmptyState onCreate={openCreateDialog} />
          </>
        ) : (
          <>
            <StatsGrid stats={stats} />

            <ListHeader count={databases.length} />

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
              {databases.map((item) => (
                <DatabaseCard
                  key={item.id}
                  item={item}
                  onOpen={() => openFirebaseLink(item)}
                  onEdit={() => openEditDialog(item)}
                  onDelete={() => openDeleteDialog(item)}
                />
              ))}
            </Box>
          </>
        )}
      </Stack>

      <DatabaseFormDialog
        open={databaseDialogOpen}
        editingDatabase={editingDatabase}
        projects={projects}
        selectedProject={selectedProject}
        projectId={projectId}
        setProjectId={setProjectId}
        firebaseUrl={firebaseUrl}
        setFirebaseUrl={setFirebaseUrl}
        notes={notes}
        setNotes={setNotes}
        saving={saving}
        pageError={pageError}
        onClose={closeDatabaseDialog}
        onSave={handleSaveDatabase}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        databaseToDelete={databaseToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteDatabase}
      />
    </Box>
  );
}

function BackgroundGlow() {
  const theme = useTheme();

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: -1,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -130,
          right: -150,
          width: 380,
          height: 380,
          borderRadius: "50%",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.warning.main, 0.12)
              : alpha(theme.palette.warning.main, 0.08),
          filter: "blur(65px)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          top: 340,
          left: -190,
          width: 340,
          height: 340,
          borderRadius: "50%",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.info.main, 0.1)
              : alpha(theme.palette.info.main, 0.08),
          filter: "blur(70px)",
        }}
      />
    </Box>
  );
}

function PageHeader({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        px: { xs: 2.2, md: 3 },
        py: { xs: 2.3, md: 3 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2.4, md: 3 }}
      >
        <Stack direction="row" spacing={1.7} alignItems="center">
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 54, md: 60 },
              height: { xs: 54, md: 60 },
              borderRadius: "18px",
              color: theme.palette.primary.main,
              bgcolor: theme.palette.app?.primarySoft || alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${theme.palette.app?.borderSoft || alpha(theme.palette.primary.main, 0.16)}`,
              flexShrink: 0,
            }}
          >
            <StorageRoundedIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.app?.text || theme.palette.text.primary,
                fontWeight: 950,
                letterSpacing: "-0.6px",
                fontSize: { xs: "1.65rem", md: "2.25rem" },
                lineHeight: 1.05,
              }}
            >
              Base de datos
            </Typography>

            <Typography
              sx={{
                mt: 0.85,
                maxWidth: 700,
                color: theme.palette.app?.secondary || theme.palette.text.secondary,
                fontSize: { xs: "0.92rem", md: "1rem" },
                lineHeight: 1.65,
                fontWeight: 600,
              }}
            >
              Guardá accesos directos a Firebase Console por proyecto y notas rápidas para no perder detalles importantes.
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
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            whiteSpace: "nowrap",
            boxShadow: "none",
          }}
        >
          Nuevo enlace
        </Button>
      </Stack>
    </Card>
  );
}
function StatsGrid({ stats }) {
  const theme = useTheme();

  const items = [
    {
      label: "Enlaces",
      value: stats.totalDatabases,
      icon: <StorageRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Proyectos",
      value: stats.totalProjects,
      icon: <FolderRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Con Firebase",
      value: stats.projectsWithDatabase,
      icon: <CloudQueueRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Sin enlace",
      value: stats.projectsWithoutDatabase,
      icon: <FolderOpenRoundedIcon />,
      color: theme.palette.text.secondary,
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
            p: { xs: 1.6, md: 1.9 },
            boxShadow: "none",
            transition: "0.18s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(item.color, 0.28),
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.3}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                borderRadius: "15px",
                color: item.color,
                bgcolor: alpha(item.color, theme.palette.mode === "dark" ? 0.16 : 0.1),
              }}
            >
              {item.icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app?.text || theme.palette.text.primary,
                  fontSize: { xs: "1.45rem", md: "1.75rem" },
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: "-0.6px",
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.55,
                  color: theme.palette.app?.secondary || theme.palette.text.secondary,
                  fontSize: "0.78rem",
                  fontWeight: 850,
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
function ListHeader({ count }) {
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
            borderRadius: "12px",
            color: theme.palette.primary.main,
            bgcolor: theme.palette.app?.primarySoft || alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <StorageRoundedIcon sx={{ fontSize: 18 }} />
        </Avatar>

        <Box>
          <Typography
            sx={{
              color: theme.palette.app?.text || theme.palette.text.primary,
              fontSize: { xs: 12, md: 13 },
              fontWeight: 950,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {count} enlaces guardados
          </Typography>

          <Typography
            sx={{
              color: theme.palette.app?.secondary || theme.palette.text.secondary,
              fontSize: 12.5,
              fontWeight: 650,
            }}
          >
            Ordenados por creación más reciente.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
function DatabaseCard({ item, onOpen, onEdit, onDelete }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "24px",
        overflow: "hidden",
        boxShadow: "none",
        transition: "0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(theme.palette.primary.main, 0.28),
        },
      }}
    >
      <Box sx={{ p: { xs: 1.8, md: 2.2 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.8}>
          <ProjectIcon item={item} size={64} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.app?.text || theme.palette.text.primary,
                fontSize: { xs: "1.08rem", md: "1.28rem" },
                fontWeight: 950,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              {item.projectName || "Proyecto sin nombre"}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.65 }}>
              <BusinessCenterRoundedIcon
                sx={{
                  fontSize: 17,
                  color: theme.palette.app?.secondary || theme.palette.text.secondary,
                  flexShrink: 0,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color: theme.palette.app?.secondary || theme.palette.text.secondary,
                  fontSize: { xs: "0.82rem", md: "0.9rem" },
                  fontWeight: 750,
                  minWidth: 0,
                }}
              >
                Acceso directo a Firebase Console
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Box
          sx={{
            mt: 1.8,
            borderRadius: "18px",
            border: `1px solid ${theme.palette.app?.borderSoft || alpha(theme.palette.divider, 0.8)}`,
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.035)
                : alpha("#0F172A", 0.025),
            p: 1.45,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1.2}>
            <LinkRoundedIcon
              sx={{
                color: theme.palette.app?.secondary || theme.palette.text.secondary,
                mt: 0.1,
                fontSize: 20,
              }}
            />

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.app?.text || theme.palette.text.primary,
                  fontSize: { xs: "0.84rem", md: "0.9rem" },
                  fontWeight: 900,
                }}
              >
                {getShortUrl(item.firebaseUrl)}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: theme.palette.app?.secondary || theme.palette.text.secondary,
                  fontSize: "0.78rem",
                  fontWeight: 650,
                }}
              >
                Enlace normalizado y listo para abrir.
              </Typography>
            </Box>
          </Stack>
        </Box>

        {item.notes ? (
          <Stack
            direction="row"
            alignItems="flex-start"
            spacing={1.2}
            sx={{
              mt: 1.2,
              borderRadius: "18px",
              border: `1px solid ${theme.palette.app?.borderSoft || alpha(theme.palette.divider, 0.8)}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.035)
                  : alpha("#0F172A", 0.025),
              p: 1.45,
            }}
          >
            <NoteAltRoundedIcon
              sx={{
                color: theme.palette.app?.secondary || theme.palette.text.secondary,
                fontSize: 20,
              }}
            />

            <Typography
              sx={{
                flex: 1,
                color: theme.palette.app?.secondary || theme.palette.text.secondary,
                fontSize: { xs: "0.86rem", md: "0.94rem" },
                lineHeight: 1.55,
                fontWeight: 600,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.notes}
            </Typography>
          </Stack>
        ) : null}

        <Divider sx={{ my: 1.8, borderColor: theme.palette.app?.borderSoft }} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
          sx={{ width: "100%" }}
        >
          <Button
            variant="outlined"
            startIcon={<OpenInNewRoundedIcon />}
            onClick={onOpen}
            sx={{
              minHeight: 40,
              px: 1.8,
              borderRadius: "14px",
              color: theme.palette.primary.main,
              borderColor: alpha(theme.palette.primary.main, 0.28),
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.055),
              fontWeight: 900,
              textTransform: "none",
              whiteSpace: "nowrap",
              "&:hover": {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.1),
              },
            }}
          >
            Abrir Firebase
          </Button>

          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ ml: "auto" }}>
            <Tooltip title="Editar">
              <IconButton
                onClick={onEdit}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha("#FFFFFF", 0.06)
                      : alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                <EditRoundedIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Eliminar">
              <IconButton
                onClick={onDelete}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.main,
                  "&:hover": {
                    bgcolor: alpha(theme.palette.error.main, 0.18),
                  },
                }}
              >
                <DeleteRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    </Card>
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
        borderRadius: "18px",
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, color),
        bgcolor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 22px rgba(0,0,0,0.22)"
            : `0 10px 22px ${alpha(color, 0.1)}`,
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
            fontSize: { xs: "1.45rem", md: "1.75rem" },
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
        borderRadius: "24px",
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
          <StorageRoundedIcon sx={{ fontSize: { xs: 34, md: 42 } }} />
        </Avatar>

        <Typography
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 950,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          Sin bases guardadas
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
          Agregá un proyecto y pegá su enlace de Firebase Console para acceder
          rápido cuando lo necesites.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 2.6,
            borderRadius: 2.8,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Nuevo enlace
        </Button>
      </Stack>
    </Card>
  );
}

function DatabaseFormDialog({
  open,
  editingDatabase,
  projects,
  selectedProject,
  projectId,
  setProjectId,
  firebaseUrl,
  setFirebaseUrl,
  notes,
  setNotes,
  saving,
  pageError,
  onClose,
  onSave,
}) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "24px",
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
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.16),
                }}
              >
                {editingDatabase ? <EditRoundedIcon /> : <AddRoundedIcon />}
              </Avatar>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.35 }}>
                  {editingDatabase ? "Editar enlace" : "Nuevo enlace Firebase"}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.4, fontWeight: 600, lineHeight: 1.5 }}
                >
                  Vinculá un proyecto con su acceso directo a Firebase Console.
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
                color: theme.palette.text.secondary,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.05)
                    : alpha("#0F172A", 0.04),
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#0F172A", 0.08),
                "&:hover": {
                  color: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
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
              <Alert severity="error" sx={{ borderRadius: 3, fontWeight: 700 }}>
                {pageError}
              </Alert>
            ) : null}

            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 3, fontWeight: 700 }}>
                Primero necesitás crear un proyecto para guardar su enlace de
                Firebase.
              </Alert>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Proyecto</InputLabel>

                <Select
                  label="Proyecto"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  disabled={saving}
                  sx={{ borderRadius: 2.8 }}
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
                            flexShrink: 0,
                          }}
                        />

                        <Typography component="span" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {project.name}
                        </Typography>
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
                  borderRadius: 3,
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

            <TextField
              label="Enlace de Firebase Console"
              value={firebaseUrl}
              onChange={(event) => setFirebaseUrl(event.target.value)}
              fullWidth
              disabled={saving}
              placeholder="https://console.firebase.google.com/..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkRoundedIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.8,
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
                  borderRadius: 2.8,
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
            startIcon={editingDatabase ? <EditRoundedIcon /> : <AddRoundedIcon />}
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
              : editingDatabase
              ? "Guardar cambios"
              : "Guardar enlace"}
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

function DeleteDialog({ open, databaseToDelete, onClose, onConfirm }) {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          bgcolor: theme.palette.background.paper,
          backgroundImage: "none",
          border: "1px solid",
          borderColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.1)
              : alpha("#0F172A", 0.08),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 28px 90px rgba(0,0,0,0.55)"
              : "0 28px 80px rgba(15,23,42,0.18)",
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
                  fontSize: "1.35rem",
                  fontWeight: 950,
                  lineHeight: 1.15,
                }}
              >
                Eliminar enlace
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.45, lineHeight: 1.5, fontWeight: 600, fontSize: "0.9rem" }}
              >
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          </Stack>

          {databaseToDelete ? (
            <Box
              sx={{
                width: "100%",
                borderRadius: "16px",
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#0F172A", 0.08),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.04)
                    : alpha("#0F172A", 0.035),
                px: 2,
                py: 1.4,
              }}
            >
              <Typography sx={{ fontWeight: 950, textAlign: "center" }}>
                {databaseToDelete.projectName || "Proyecto sin nombre"}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.35, fontWeight: 700, textAlign: "center", fontSize: 13 }}
              >
                Firebase Console
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

function DatabasesSkeleton() {
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
              borderRadius: "24px",
              bgcolor: "background.paper",
              borderColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction="row" spacing={2}>
                <Skeleton
                  variant="rounded"
                  width={74}
                  height={74}
                  sx={{ borderRadius: 3 }}
                />

                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Skeleton
                      variant="rounded"
                      width={86}
                      height={27}
                      sx={{ borderRadius: 999 }}
                    />

                    <Skeleton
                      variant="rounded"
                      width={82}
                      height={27}
                      sx={{ borderRadius: 999 }}
                    />
                  </Stack>

                  <Skeleton variant="text" width="78%" height={30} />
                  <Skeleton variant="text" width="56%" height={22} />
                </Box>
              </Stack>

              <Skeleton
                variant="rounded"
                width="100%"
                height={70}
                sx={{ mt: 2, borderRadius: 3 }}
              />

              <Skeleton
                variant="rounded"
                width="100%"
                height={62}
                sx={{ mt: 1.4, borderRadius: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between">
                <Skeleton
                  variant="rounded"
                  width={150}
                  height={44}
                  sx={{ borderRadius: 999 }}
                />

                <Stack direction="row" spacing={1}>
                  <Skeleton variant="circular" width={42} height={42} />
                  <Skeleton variant="circular" width={42} height={42} />
                </Stack>
              </Stack>
            </Box>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}