// Importaciones:
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderOffRoundedIcon from "@mui/icons-material/FolderOffRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import MonitorRoundedIcon from "@mui/icons-material/MonitorRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { db, storage } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

// JSX:
// Constantes:
const COLORS = [
  "#136F63",
  "#2B1B17",
  "#12824C",
  "#3E6B1F",
  "#A50454",
  "#D16B18",
  "#2E1941",
  "#16A34A",
  "#2563EB",
  "#0F766E",
  "#7C3AED",
  "#DC2626",
  "#0891B2",
  "#CA8A04",
  "#DB2777",
  "#475569",
  "#1E3A8A",
  "#6D28D9",
  "#9F1239",
  "#92400E",
];

const STATUS_OPTIONS = ["activo", "pausado", "finalizado"];

const PROJECT_TYPES = [
  { value: "mobile", label: "Mobile", icon: <SmartphoneRoundedIcon /> },
  { value: "web", label: "Web", icon: <MonitorRoundedIcon /> },
  { value: "both", label: "Web + Mobile", icon: <DevicesRoundedIcon /> },
];

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

const getStatusLabel = (value) => {
  if (value === "activo") return "Activo";
  if (value === "pausado") return "Pausado";
  if (value === "finalizado") return "Finalizado";

  return "Activo";
};

const getStatusIcon = (value) => {
  if (value === "pausado") return <PauseCircleRoundedIcon />;
  if (value === "finalizado") return <CheckCircleRoundedIcon />;

  return <RocketLaunchRoundedIcon />;
};

const getStatusColor = (theme, value) => {
  if (value === "pausado") return theme.palette.warning.main;
  if (value === "finalizado") return theme.palette.success.main;

  return theme.palette.info.main;
};

const getProjectType = (value) => {
  return PROJECT_TYPES.find((type) => type.value === value) || PROJECT_TYPES[1];
};

const getStatusOrder = (status) => {
  if (status === "activo") return 1;
  if (status === "pausado") return 2;
  if (status === "finalizado") return 3;

  return 1;
};

const getCardStyles = (theme) => ({
  borderRadius: "24px",
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

const getProjectIconBackground = (theme, color) => {
  if (theme.palette.mode === "dark") return alpha("#FFFFFF", 0.94);
  return hexToRgba(color || theme.palette.primary.main, 0.1);
};

const getProjectIconBorder = (theme, color) => {
  if (theme.palette.mode === "dark") {
    return hexToRgba(color || theme.palette.primary.main, 0.38);
  }

  return hexToRgba(color || theme.palette.primary.main, 0.18);
};

export default function Proyectos() {
  const theme = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState(null);

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [status, setStatus] = useState("activo");
  const [projectType, setProjectType] = useState("web");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setProjects([]);
      setTasks([]);
      setNotes([]);
      setCredentials([]);
      setDatabases([]);
      setPayments([]);
      setLoadingProjects(false);
      return;
    }

    const projectsQuery = query(
      collection(db, "projects"),
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
            const statusA = getStatusOrder(a.status);
            const statusB = getStatusOrder(b.status);

            if (statusA !== statusB) return statusA - statusB;

            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;

            return dateB - dateA;
          });

        setProjects(data);
        setLoadingProjects(false);
      },
      (error) => {
        console.error(error);
        setLoadingProjects(false);
        setPageError("No se pudieron cargar los proyectos.");
      }
    );

    const unsubscribeTasks = onSnapshot(
      query(collection(db, "tasks"), where("userId", "==", user.uid)),
      (snapshot) => {
        setTasks(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      }
    );

    const unsubscribeNotes = onSnapshot(
      query(collection(db, "notes"), where("userId", "==", user.uid)),
      (snapshot) => {
        setNotes(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      }
    );

    const unsubscribeCredentials = onSnapshot(
      query(collection(db, "credentials"), where("userId", "==", user.uid)),
      (snapshot) => {
        setCredentials(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      }
    );

    const unsubscribeDatabases = onSnapshot(
      query(collection(db, "databasesInfo"), where("userId", "==", user.uid)),
      (snapshot) => {
        setDatabases(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      }
    );

    const unsubscribePayments = onSnapshot(
      query(collection(db, "payments"), where("userId", "==", user.uid)),
      (snapshot) => {
        setPayments(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeNotes();
      unsubscribeCredentials();
      unsubscribeDatabases();
      unsubscribePayments();
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    };
  }, [logoPreviewUrl]);

  const projectStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((project) => project.status === "activo").length;
    const paused = projects.filter((project) => project.status === "pausado").length;
    const finished = projects.filter(
      (project) => project.status === "finalizado"
    ).length;

    const completionPercent = total > 0 ? Math.round((finished / total) * 100) : 0;

    return {
      total,
      active,
      paused,
      finished,
      completionPercent,
    };
  }, [projects]);


  const projectDetailData = useMemo(() => {
    if (!selectedProjectDetail?.id) {
      return {
        tasks: [],
        notes: [],
        credentials: [],
        databases: [],
        payments: [],
      };
    }

    return {
      tasks: tasks.filter((item) => item.projectId === selectedProjectDetail.id),
      notes: notes.filter((item) => item.projectId === selectedProjectDetail.id),
      credentials: credentials.filter(
        (item) => item.projectId === selectedProjectDetail.id
      ),
      databases: databases.filter(
        (item) => item.projectId === selectedProjectDetail.id
      ),
      payments: payments.filter((item) => item.projectId === selectedProjectDetail.id),
    };
  }, [selectedProjectDetail, tasks, notes, credentials, databases, payments]);

  const getRelatedCount = (projectId) => {
    const relatedTasks = tasks.filter((item) => item.projectId === projectId).length;
    const relatedNotes = notes.filter((item) => item.projectId === projectId).length;
    const relatedCredentials = credentials.filter(
      (item) => item.projectId === projectId
    ).length;
    const relatedDatabases = databases.filter(
      (item) => item.projectId === projectId
    ).length;
    const relatedPayments = payments.filter(
      (item) => item.projectId === projectId
    ).length;

    return {
      tasks: relatedTasks,
      notes: relatedNotes,
      credentials: relatedCredentials,
      databases: relatedDatabases,
      payments: relatedPayments,
      total:
        relatedTasks +
        relatedNotes +
        relatedCredentials +
        relatedDatabases +
        relatedPayments,
    };
  };

  const resetForm = () => {
    setEditingProject(null);
    setName("");
    setClient("");
    setDescription("");
    setSelectedColor(COLORS[0]);
    setStatus("activo");
    setProjectType("web");
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setCurrentLogoUrl(null);
    setPageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setProjectDialogOpen(true);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setName(project.name || "");
    setClient(project.client || "");
    setDescription(project.description || "");
    setSelectedColor(project.color || COLORS[0]);
    setStatus(
      project.status === "pausado"
        ? "pausado"
        : project.status === "finalizado"
        ? "finalizado"
        : "activo"
    );
    setProjectType(project.projectType || "web");
    setCurrentLogoUrl(project.logoUrl || null);
    setLogoFile(null);
    setLogoPreviewUrl(null);
    setPageError("");
    setProjectDialogOpen(true);
  };

  const closeProjectDialog = () => {
    if (saving) return;
    resetForm();
    setProjectDialogOpen(false);
  };

  const openDeleteDialog = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setProjectToDelete(null);
    setDeleteDialogOpen(false);
  };

  const openProjectDetail = (project) => {
    setSelectedProjectDetail(project);
    setDetailDialogOpen(true);
  };

  const closeProjectDetail = () => {
    setSelectedProjectDetail(null);
    setDetailDialogOpen(false);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const uploadLogo = async (projectId) => {
    if (!logoFile) return currentLogoUrl || null;

    const extension = logoFile.name?.split(".")?.pop() || "jpg";

    const logoRef = ref(
      storage,
      `projectLogos/${user.uid}/${projectId}-${Date.now()}.${extension}`
    );

    await uploadBytes(logoRef, logoFile);

    return getDownloadURL(logoRef);
  };

  const handleSaveProject = async (event) => {
    event?.preventDefault();

    if (!name.trim()) {
      setPageError("El proyecto necesita un nombre.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");

      if (editingProject) {
        const logoUrl = await uploadLogo(editingProject.id);

        await updateDoc(doc(db, "projects", editingProject.id), {
          name: name.trim(),
          client: client.trim(),
          description: description.trim(),
          color: selectedColor,
          status,
          projectType,
          logoUrl,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, "projects"), {
          userId: user.uid,
          name: name.trim(),
          client: client.trim(),
          description: description.trim(),
          color: selectedColor,
          status,
          projectType,
          logoUrl: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const logoUrl = await uploadLogo(docRef.id);

        if (logoUrl) {
          await updateDoc(doc(db, "projects", docRef.id), {
            logoUrl,
            updatedAt: serverTimestamp(),
          });
        }
      }

      closeProjectDialog();
    } catch (error) {
      console.error(error);
      setPageError("No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "projects", projectToDelete.id));
      closeDeleteDialog();
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar el proyecto.");
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2, md: 2.4 }}>
        <PageHeader stats={projectStats} onCreate={openCreateDialog} />

        {pageError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "18px",
              border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              fontWeight: 700,
            }}
          >
            {pageError}
          </Alert>
        )}

        {loadingProjects ? (
          <ProjectsSkeleton />
        ) : projects.length === 0 ? (
          <EmptyState onCreate={openCreateDialog} />
        ) : (
          <>
            <StatsGrid stats={projectStats} />

            <ListHeader count={projects.length} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, minmax(0, 1fr))",
                },
                gap: { xs: 1.4, md: 1.7 },
              }}
            >
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  related={getRelatedCount(project.id)}
                  onOpenDetail={() => openProjectDetail(project)}
                  onEdit={() => openEditDialog(project)}
                  onDelete={() => openDeleteDialog(project)}
                />
              ))}
            </Box>
          </>
        )}
      </Stack>

      <ProjectFormDialog
        open={projectDialogOpen}
        editingProject={editingProject}
        name={name}
        setName={setName}
        client={client}
        setClient={setClient}
        description={description}
        setDescription={setDescription}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        status={status}
        setStatus={setStatus}
        projectType={projectType}
        setProjectType={setProjectType}
        logoPreviewUrl={logoPreviewUrl}
        currentLogoUrl={currentLogoUrl}
        fileInputRef={fileInputRef}
        saving={saving}
        pageError={pageError}
        onLogoChange={handleLogoChange}
        onClose={closeProjectDialog}
        onSave={handleSaveProject}
      />

      <ProjectDetailDialog
        open={detailDialogOpen}
        project={selectedProjectDetail}
        data={projectDetailData}
        onClose={closeProjectDetail}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        projectToDelete={projectToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteProject}
      />
    </Box>
  );
}

function PageHeader({ stats, onCreate }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, sm: 2.4, md: 2.8 },
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2.4, lg: 3 }}
        sx={{ width: "100%" }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1.35}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 44, md: 48 },
              height: { xs: 44, md: 48 },
              mt: { xs: 0.15, md: 0.25 },
              borderRadius: "16px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <WorkspacesRoundedIcon sx={{ fontSize: { xs: 23, md: 25 } }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 950,
                letterSpacing: "-0.6px",
                fontSize: {
                  xs: "1.55rem",
                  sm: "1.85rem",
                  md: "2.15rem",
                },
                lineHeight: 1.05,
              }}
            >
              Proyectos
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: theme.palette.app.secondary,
                fontSize: { xs: "0.9rem", md: "0.98rem" },
                lineHeight: 1.65,
                fontWeight: 600,
                maxWidth: 680,
              }}
            >
              Centralizá clientes, logos, colores, tareas, pagos, credenciales
              y enlaces importantes de cada desarrollo.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.6, flexWrap: "wrap", rowGap: 1 }}
            >
              <HeaderMiniChip label={`${stats.total} proyectos`} />
              <HeaderMiniChip label={`${stats.active} activos`} />
              <HeaderMiniChip label={`${stats.completionPercent}% finalizados`} />
            </Stack>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.4}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="flex-end"
          sx={{
            flexShrink: 0,
            ml: { xs: 0, lg: "auto" },
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onCreate}
            sx={{
              height: 42,
              minHeight: 42,
              px: 1.7,
              py: 0,
              borderRadius: "13px",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "none",
              whiteSpace: "nowrap",
              fontSize: "0.84rem",
              alignSelf: "center",
              "& .MuiButton-startIcon": {
                mr: 0.55,
              },
            }}
          >
            Nuevo proyecto
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

function HeaderMiniChip({ label }) {
  const theme = useTheme();

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 28,
        borderRadius: "999px",
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        color: theme.palette.app.secondary,
        fontWeight: 800,
      }}
    />
  );
}

function StatsGrid({ stats }) {
  const theme = useTheme();

  const items = [
    {
      label: "Totales",
      value: stats.total,
      icon: <WorkspacesRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      label: "Activos",
      value: stats.active,
      icon: <RocketLaunchRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Pausados",
      value: stats.paused,
      icon: <PauseCircleRoundedIcon />,
      color: theme.palette.warning.main,
    },
    {
      label: "Finalizados",
      value: stats.finished,
      icon: <CheckCircleRoundedIcon />,
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
        gap: { xs: 1.2, md: 1.6 },
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          elevation={0}
          sx={{
            ...getCardStyles(theme),
            p: { xs: 1.6, md: 1.9 },
            borderRadius: "20px",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                borderRadius: "15px",
                color: item.color,
                backgroundColor: alpha(
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
                  color: theme.palette.app.text,
                  fontWeight: 950,
                  fontSize: { xs: "1.45rem", md: "1.75rem" },
                  lineHeight: 1,
                  letterSpacing: "-0.6px",
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.55,
                  color: theme.palette.app.secondary,
                  fontSize: "0.78rem",
                  fontWeight: 800,
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
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 1.5, md: 1.8 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.2}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "15px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
            }}
          >
            <FolderRoundedIcon />
          </Avatar>

          <Box>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 900,
                fontSize: "0.98rem",
              }}
            >
              Proyectos cargados
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: "0.82rem",
                fontWeight: 650,
              }}
            >
              {count} proyectos ordenados por estado y fecha de creación.
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

function ProjectCard({ project, related, onOpenDetail, onEdit, onDelete }) {
  const theme = useTheme();

  const typeInfo = getProjectType(project.projectType);
  const statusColor = getStatusColor(theme, project.status);

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        borderRadius: "22px",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(statusColor, 0.32),
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: statusColor,
        }}
      />

      <Box sx={{ p: { xs: 1.7, md: 2 }, pl: { xs: 2.1, md: 2.4 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.55}>
          <Box onClick={onOpenDetail} sx={{ cursor: "pointer" }}>
            <ProjectLogo project={project} size={72} />
          </Box>

          <Box
            onClick={onOpenDetail}
            sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
          >
            <Stack
              direction="row"
              spacing={0.8}
              alignItems="center"
              sx={{ mb: 0.7, flexWrap: "wrap", rowGap: 0.7 }}
            >
              <StatusChip
                label={getStatusLabel(project.status)}
                icon={getStatusIcon(project.status)}
                color={statusColor}
              />

              <Chip
                size="small"
                icon={typeInfo.icon}
                label={typeInfo.label}
                sx={{
                  height: 27,
                  borderRadius: "999px",
                  backgroundColor: getSoftBackground(theme),
                  color: theme.palette.app.secondary,
                  fontWeight: 850,
                  "& .MuiChip-icon": {
                    color: theme.palette.app.secondary,
                  },
                }}
              />
            </Stack>

            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1rem", md: "1.12rem" },
                fontWeight: 950,
                letterSpacing: "-0.25px",
                lineHeight: 1.25,
              }}
            >
              {project.name || "Proyecto sin nombre"}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.65} sx={{ mt: 0.55 }}>
              <BusinessCenterRoundedIcon
                sx={{
                  color: theme.palette.app.secondary,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              />

              <Typography
                noWrap
                sx={{
                  color: theme.palette.app.secondary,
                  fontSize: "0.84rem",
                  fontWeight: 650,
                }}
              >
                {project.client || "Sin cliente"}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.6} sx={{ flexShrink: 0 }}>
            <Tooltip title="Editar">
              <IconButton
                onClick={onEdit}
                sx={{
                  width: 40,
                  height: 40,
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.app.primarySoft,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
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
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.error.main, 0.17),
                  },
                }}
              >
                <DeleteRoundedIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Typography
          sx={{
            mt: 1.6,
            color: theme.palette.app.secondary,
            fontSize: "0.88rem",
            lineHeight: 1.6,
            fontWeight: 550,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project.description || "Este proyecto todavía no tiene descripción."}
        </Typography>

        <Divider sx={{ my: 1.6, borderColor: theme.palette.app.borderSoft }} />

        <Stack
          direction="column"
          alignItems="stretch"
          spacing={1.3}
        >
          <Stack direction="row" flexWrap="wrap" gap={0.8}>
            <MiniCounter
              label="Tareas"
              value={related.tasks}
              icon={<FormatListBulletedRoundedIcon />}
              color={theme.palette.primary.main}
            />

            <MiniCounter
              label="Notas"
              value={related.notes}
              icon={<NotesRoundedIcon />}
              color={theme.palette.primary.main}
            />

            <MiniCounter
              label="Total"
              value={related.total}
              icon={<StorageRoundedIcon />}
              color={theme.palette.primary.main}
            />
          </Stack>

          <Button
            variant="text"
            endIcon={<InfoRoundedIcon />}
            onClick={onOpenDetail}
            sx={{
              alignSelf: "flex-end",
              borderRadius: "999px",
              fontWeight: 900,
              textTransform: "none",
              color: statusColor,
              px: 1.3,
            }}
          >
            Ver detalle
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}

function MiniCounter({ label, value, icon, color }) {
  const theme = useTheme();

  return (
    <Chip
      size="small"
      icon={icon}
      label={`${value} ${label}`}
      sx={{
        height: 29,
        borderRadius: "999px",
        backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.14 : 0.08),
        color,
        fontWeight: 900,
        border: `1px solid ${alpha(
          color,
          theme.palette.mode === "dark" ? 0.22 : 0.14
        )}`,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function ProjectLogo({ project, size = 56 }) {
  const theme = useTheme();

  const color = project?.color || project?.projectColor || theme.palette.primary.main;
  const logoUrl = project?.logoUrl || project?.projectLogoUrl;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.max(16, size / 4)}px`,
        border: `1px solid ${getProjectIconBorder(theme, color)}`,
        backgroundColor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={project?.name || "Proyecto"}
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
            fontSize: size * 0.38,
            fontWeight: 950,
          }}
        >
          {(project?.name || project?.projectName || "P").charAt(0).toUpperCase()}
        </Typography>
      )}
    </Box>
  );
}

function StatusChip({ label, icon, color }) {
  const theme = useTheme();

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        height: 27,
        borderRadius: "999px",
        backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
        color,
        fontWeight: 850,
        border: `1px solid ${alpha(
          color,
          theme.palette.mode === "dark" ? 0.26 : 0.15
        )}`,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function EmptyState({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 3, md: 4 },
        textAlign: "center",
      }}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 70,
          height: 70,
          mx: "auto",
          mb: 2,
          borderRadius: "22px",
          color: theme.palette.primary.main,
          backgroundColor: theme.palette.app.primarySoft,
        }}
      >
        <FolderOffRoundedIcon sx={{ fontSize: 36 }} />
      </Avatar>

      <Typography
        sx={{
          color: theme.palette.app.text,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          fontWeight: 950,
        }}
      >
        Todavía no tenés proyectos
      </Typography>

      <Typography
        sx={{
          mt: 0.8,
          mb: 2.2,
          color: theme.palette.app.secondary,
          fontWeight: 600,
        }}
      >
        Cuando agregues proyectos, aparecerán acá con su logo, cliente, tipo y
        estado.
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddRoundedIcon />}
        onClick={onCreate}
        sx={{
          minHeight: 38,
          px: 1.7,
          borderRadius: "13px",
          fontWeight: 900,
          textTransform: "none",
          boxShadow: "none",
          whiteSpace: "nowrap",
          fontSize: "0.84rem",
          alignSelf: "center",
          "& .MuiButton-startIcon": {
            mr: 0.55,
          },
        }}
      >
        Nuevo proyecto
      </Button>
    </Card>
  );
}

function ProjectFormDialog({
  open,
  editingProject,
  name,
  setName,
  client,
  setClient,
  description,
  setDescription,
  selectedColor,
  setSelectedColor,
  status,
  setStatus,
  projectType,
  setProjectType,
  logoPreviewUrl,
  currentLogoUrl,
  fileInputRef,
  saving,
  pageError,
  onLogoChange,
  onClose,
  onSave,
}) {
  const theme = useTheme();

  const visibleLogo = logoPreviewUrl || currentLogoUrl;
  const statusColor = getStatusColor(theme, status);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          backgroundColor: theme.palette.app.surface,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          overflow: "hidden",
        },
      }}
    >
      <Box component="form" onSubmit={onSave}>
        <DialogTitle
          sx={{
            position: "relative",
            px: { xs: 2.2, md: 3 },
            pt: 2.4,
            pb: 2,
            pr: 7,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: 50,
                height: 50,
                borderRadius: "16px",
                color: selectedColor,
                backgroundColor: getProjectIconBackground(theme, selectedColor),
                border: `1px solid ${getProjectIconBorder(theme, selectedColor)}`,
              }}
            >
              {editingProject ? <EditRoundedIcon /> : <AddRoundedIcon />}
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.25rem",
                  fontWeight: 950,
                }}
              >
                {editingProject ? "Editar proyecto" : "Nuevo proyecto"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Definí logo, cliente, tipo, estado y color visual.
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
              backgroundColor: getSoftBackground(theme),
              border: `1px solid ${theme.palette.app.borderSoft}`,
              "&:hover": {
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.4 }}>
          <Stack spacing={2.2}>
            {pageError && (
              <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            )}

            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                minHeight: { xs: 150, md: 190 },
                borderRadius: "20px",
                border: `1.5px dashed ${hexToRgba(
                  selectedColor,
                  theme.palette.mode === "dark" ? 0.42 : 0.3
                )}`,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(selectedColor, 0.11)
                    : hexToRgba(selectedColor, 0.08),
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                transition: "0.18s ease",
                "&:hover": {
                  borderColor: hexToRgba(selectedColor, 0.55),
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onLogoChange}
              />

              {visibleLogo ? (
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: { xs: 170, md: 210 },
                  }}
                >
                  <Box
                    component="img"
                    src={visibleLogo}
                    alt="Logo del proyecto"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />

                  <Chip
                    icon={<CloudUploadRoundedIcon />}
                    label="Cambiar logo"
                    sx={{
                      position: "absolute",
                      left: 16,
                      bottom: 16,
                      borderRadius: "999px",
                      color: "#FFFFFF",
                      backgroundColor: alpha("#000000", 0.56),
                      backdropFilter: "blur(10px)",
                      fontWeight: 900,
                      "& .MuiChip-icon": {
                        color: "#FFFFFF",
                      },
                    }}
                  />
                </Box>
              ) : (
                <Stack alignItems="center" spacing={1}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: { xs: 64, md: 76 },
                      height: { xs: 64, md: 76 },
                      borderRadius: "22px",
                      backgroundColor: getProjectIconBackground(theme, selectedColor),
                      color: selectedColor,
                      border: `1px solid ${getProjectIconBorder(theme, selectedColor)}`,
                    }}
                  >
                    <ImageRoundedIcon sx={{ fontSize: { xs: 32, md: 40 } }} />
                  </Avatar>

                  <Typography sx={{ color: selectedColor, fontWeight: 950 }}>
                    Elegir logo
                  </Typography>

                  <Typography
                    sx={{
                      color: theme.palette.app.secondary,
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    Opcional. Se recomienda una imagen cuadrada.
                  </Typography>
                </Stack>
              )}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.6,
              }}
            >
              <TextField
                label="Nombre del proyecto"
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
                disabled={saving}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                  },
                }}
              />

              <TextField
                label="Cliente"
                value={client}
                onChange={(event) => setClient(event.target.value)}
                fullWidth
                disabled={saving}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                  },
                }}
              />
            </Box>

            <TextField
              label="Descripción"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.6,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontWeight: 900,
                    mb: 1.1,
                  }}
                >
                  Tipo de proyecto
                </Typography>

                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={projectType}
                  onChange={(_, value) => {
                    if (value) setProjectType(value);
                  }}
                  disabled={saving}
                  sx={getToggleGroupStyles(theme, theme.palette.primary.main)}
                >
                  {PROJECT_TYPES.map((type) => (
                    <ToggleButton
                      key={type.value}
                      value={type.value}
                      sx={{
                        minHeight: 76,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.7}
                        sx={{
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            "& svg": {
                              fontSize: 24,
                            },
                          }}
                        >
                          {type.icon}
                        </Box>

                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.82rem",
                            fontWeight: 900,
                            lineHeight: 1.1,
                          }}
                        >
                          {type.label}
                        </Typography>
                      </Stack>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontWeight: 900,
                    mb: 1.1,
                  }}
                >
                  Estado
                </Typography>

                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  value={status}
                  onChange={(_, value) => {
                    if (value) setStatus(value);
                  }}
                  disabled={saving}
                  sx={getToggleGroupStyles(theme, statusColor)}
                >
                  {STATUS_OPTIONS.map((item) => (
                    <ToggleButton
                      key={item}
                      value={item}
                      sx={{
                        minHeight: 76,
                      }}
                    >
                      <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.7}
                        sx={{
                          width: "100%",
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            "& svg": {
                              fontSize: 24,
                            },
                          }}
                        >
                          {getStatusIcon(item)}
                        </Box>

                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.82rem",
                            fontWeight: 900,
                            lineHeight: 1.1,
                          }}
                        >
                          {getStatusLabel(item)}
                        </Typography>
                      </Stack>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Box>

            <Box>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 900,
                  mb: 1.1,
                }}
              >
                Color principal
              </Typography>

              <Stack direction="row" flexWrap="wrap" gap={1.75}>
                {COLORS.map((color) => (
                  <Tooltip key={color} title={color}>
                    <Box
                      onClick={() => setSelectedColor(color)}
                      sx={{
                        width: { xs: 38, md: 42 },
                        height: { xs: 38, md: 42 },
                        borderRadius: "999px",
                        backgroundColor: color,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "3px solid",
                        borderColor:
                          selectedColor === color
                            ? theme.palette.app.surface
                            : "transparent",
                        outline:
                          selectedColor === color
                            ? `2px solid ${alpha(color, 0.55)}`
                            : `1px solid ${alpha(color, 0.16)}`,
                        boxShadow:
                          selectedColor === color
                            ? `0 10px 24px ${alpha(color, 0.22)}`
                            : "none",
                        transition: "0.18s ease",
                        "&:hover": {
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      {selectedColor === color && (
                        <CheckCircleRoundedIcon
                          sx={{ color: "#FFFFFF", fontSize: 20 }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2 }}>
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 850,
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={editingProject ? <EditRoundedIcon /> : <AddRoundedIcon />}
            sx={{
              minHeight: 42,
              px: 2.2,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 900,
              boxShadow: "none",
            }}
          >
            {saving
              ? "Guardando..."
              : editingProject
              ? "Guardar cambios"
              : "Guardar proyecto"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function getToggleGroupStyles(theme, selectedColor) {
  return {
    gap: 1,
    "& .MuiToggleButtonGroup-grouped": {
      margin: 0,
      border: `1px solid ${theme.palette.app.borderSoft} !important`,
      borderRadius: "16px !important",
    },
    "& .MuiToggleButton-root": {
      py: 1.15,
      fontWeight: 900,
      textTransform: "none",
      color: theme.palette.app.secondary,
      backgroundColor: getSoftBackground(theme),
      "&.Mui-selected": {
        color: selectedColor,
        backgroundColor: alpha(selectedColor, theme.palette.mode === "dark" ? 0.16 : 0.1),
        borderColor: `${alpha(selectedColor, 0.28)} !important`,
      },
      "&.Mui-selected:hover": {
        backgroundColor: alpha(selectedColor, theme.palette.mode === "dark" ? 0.2 : 0.14),
      },
    },
  };
}

function ProjectDetailDialog({ open, project, data, onClose }) {
  const theme = useTheme();

  if (!project) return null;

  const color = project.color || theme.palette.primary.main;
  const typeInfo = getProjectType(project.projectType);
  const statusColor = getStatusColor(theme, project.status);

  const total =
    data.tasks.length +
    data.notes.length +
    data.credentials.length +
    data.databases.length +
    data.payments.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          backgroundColor: theme.palette.app.surface,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          position: "relative",
          px: { xs: 2.2, md: 3 },
          pt: 2.4,
          pb: 2,
          pr: 7,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.4}>
          <ProjectLogo project={project} size={70} />

          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mb: 0.7 }}>
              <StatusChip
                label={getStatusLabel(project.status)}
                icon={getStatusIcon(project.status)}
                color={statusColor}
              />

              <Chip
                size="small"
                icon={typeInfo.icon}
                label={typeInfo.label}
                sx={{
                  height: 27,
                  borderRadius: "999px",
                  backgroundColor: getSoftBackground(theme),
                  color: theme.palette.app.secondary,
                  fontWeight: 850,
                  "& .MuiChip-icon": {
                    color: theme.palette.app.secondary,
                  },
                }}
              />
            </Stack>

            <Typography
              noWrap
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1.25rem", md: "1.55rem" },
                fontWeight: 950,
                letterSpacing: "-0.35px",
              }}
            >
              {project.name || "Proyecto sin nombre"}
            </Typography>

            <Typography
              noWrap
              sx={{
                mt: 0.25,
                color: theme.palette.app.secondary,
                fontWeight: 700,
                fontSize: "0.88rem",
              }}
            >
              {project.client || "Sin cliente"}
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
            backgroundColor: getSoftBackground(theme),
            border: `1px solid ${theme.palette.app.borderSoft}`,
            "&:hover": {
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
            },
          }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.4 }}>
        <Stack spacing={2.1}>
          {project.description && (
            <Box
              sx={{
                borderRadius: "18px",
                p: 1.5,
                backgroundColor: getSoftBackground(theme),
                border: `1px solid ${theme.palette.app.borderSoft}`,
              }}
            >
              <Typography
                sx={{
                  color: theme.palette.app.secondary,
                  lineHeight: 1.65,
                  fontWeight: 600,
                }}
              >
                {project.description}
              </Typography>
            </Box>
          )}

          <Stack direction="row" flexWrap="wrap" gap={0.9}>
            <CounterPill
              label="Tareas"
              value={data.tasks.length}
              icon={<FormatListBulletedRoundedIcon />}
              color={theme.palette.info.main}
            />

            <CounterPill
              label="Notas"
              value={data.notes.length}
              icon={<NotesRoundedIcon />}
              color={theme.palette.primary.main}
            />

            <CounterPill
              label="Credenciales"
              value={data.credentials.length}
              icon={<KeyRoundedIcon />}
              color={theme.palette.warning.main}
            />

            <CounterPill
              label="Total"
              value={total}
              icon={<StorageRoundedIcon />}
              color={theme.palette.primary.main}
            />
          </Stack>

          <Box
            sx={{
              maxHeight: { xs: 430, md: 560 },
              overflow: "auto",
              pr: 0.5,
            }}
          >
            <Stack spacing={2}>
              <DetailSection
                title="Tareas"
                icon={<FormatListBulletedRoundedIcon />}
                count={data.tasks.length}
                color={theme.palette.info.main}
              >
                {data.tasks.length === 0 ? (
                  <EmptyDetailText text="No hay tareas asignadas." />
                ) : (
                  data.tasks.map((task) => (
                    <DetailItem
                      key={task.id}
                      title={task.title || "Tarea sin título"}
                      subtitle={task.status || "Sin estado"}
                      icon={<FormatListBulletedRoundedIcon />}
                      color={theme.palette.info.main}
                    />
                  ))
                )}
              </DetailSection>

              <DetailSection
                title="Notas"
                icon={<NotesRoundedIcon />}
                count={data.notes.length}
                color={theme.palette.primary.main}
              >
                {data.notes.length === 0 ? (
                  <EmptyDetailText text="No hay notas asignadas." />
                ) : (
                  data.notes.map((note) => (
                    <DetailItem
                      key={note.id}
                      title={note.title || "Sin título"}
                      subtitle={note.content || "Sin contenido"}
                      icon={<NotesRoundedIcon />}
                      color={theme.palette.primary.main}
                    />
                  ))
                )}
              </DetailSection>

              <DetailSection
                title="Credenciales"
                icon={<KeyRoundedIcon />}
                count={data.credentials.length}
                color={theme.palette.warning.main}
              >
                {data.credentials.length === 0 ? (
                  <EmptyDetailText text="No hay credenciales asignadas." />
                ) : (
                  data.credentials.map((credential) => (
                    <DetailItem
                      key={credential.id}
                      title={credential.type || "Credencial"}
                      subtitle={
                        [
                          credential.production?.email
                            ? `Prod: ${credential.production.email}`
                            : null,
                          credential.local?.email
                            ? `Local: ${credential.local.email}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Sin usuario cargado"
                      }
                      icon={<KeyRoundedIcon />}
                      color={theme.palette.warning.main}
                    />
                  ))
                )}
              </DetailSection>

              <DetailSection
                title="Base de datos"
                icon={<StorageRoundedIcon />}
                count={data.databases.length}
                color={theme.palette.warning.main}
              >
                {data.databases.length === 0 ? (
                  <EmptyDetailText text="No hay enlaces de Firebase asignados." />
                ) : (
                  data.databases.map((database) => (
                    <DetailItem
                      key={database.id}
                      title="Firebase Console"
                      subtitle={database.firebaseUrl || "Sin enlace"}
                      icon={<StorageRoundedIcon />}
                      color={theme.palette.warning.main}
                    />
                  ))
                )}
              </DetailSection>

              <DetailSection
                title="Pagos"
                icon={<PaymentsRoundedIcon />}
                count={data.payments.length}
                color={theme.palette.success.main}
              >
                {data.payments.length === 0 ? (
                  <EmptyDetailText text="No hay pagos asignados." />
                ) : (
                  data.payments.map((payment) => (
                    <DetailItem
                      key={payment.id}
                      title={`Total acordado: ${
                        payment.currency === "USD" ? "US$" : "$"
                      }${Number(payment.totalAmount || 0).toLocaleString("es-AR")}`}
                      subtitle={payment.notes || "Sin notas"}
                      icon={<PaymentsRoundedIcon />}
                      color={theme.palette.success.main}
                    />
                  ))
                )}
              </DetailSection>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            minHeight: 42,
            px: 2.2,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CounterPill({ label, value, icon, color }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={`${value} ${label}`}
      sx={{
        height: 34,
        borderRadius: "999px",
        backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
        color,
        fontWeight: 900,
        border: `1px solid ${alpha(
          color,
          theme.palette.mode === "dark" ? 0.25 : 0.16
        )}`,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function DetailSection({ title, icon, count, color, children }) {
  const theme = useTheme();

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.2 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 42,
            height: 42,
            borderRadius: "15px",
            backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: theme.palette.app.text, fontWeight: 950 }}>
            {title}
          </Typography>

          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: "0.78rem",
              fontWeight: 650,
            }}
          >
            Elementos vinculados al proyecto
          </Typography>
        </Box>

        <Chip
          size="small"
          label={count}
          sx={{
            height: 27,
            minWidth: 34,
            borderRadius: "999px",
            fontWeight: 950,
            color,
            backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.15 : 0.09),
          }}
        />
      </Stack>

      <Stack spacing={1}>{children}</Stack>
    </Box>
  );
}

function DetailItem({ title, subtitle, icon, color }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "18px",
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        boxShadow: "none",
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.4} sx={{ p: 1.4 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 40,
            height: 40,
            borderRadius: "14px",
            backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontWeight: 900,
              lineHeight: 1.35,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                mt: 0.4,
                color: theme.palette.app.secondary,
                fontWeight: 600,
                fontSize: "0.86rem",
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

function EmptyDetailText({ text }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "18px",
        border: `1px dashed ${theme.palette.app.borderSoft}`,
        backgroundColor: getSoftBackground(theme),
        px: 1.5,
        py: 1.4,
      }}
    >
      <Typography sx={{ color: theme.palette.app.secondary, fontWeight: 700 }}>
        {text}
      </Typography>
    </Box>
  );
}

function DeleteDialog({ open, projectToDelete, onClose, onConfirm }) {
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
            backgroundColor: theme.palette.app.surface,
            backgroundImage: "none",
            border: `1px solid ${theme.palette.app.borderSoft}`,
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <DeleteRoundedIcon
                  sx={{
                    fontSize: 28,
                    display: "block",
                  }}
                />
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
                  Eliminar proyecto
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

            {projectToDelete?.name && (
              <Box
                sx={{
                  width: "100%",
                  borderRadius: "16px",
                  p: 1.3,
                  backgroundColor: getSoftBackground(theme),
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                }}
              >
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontWeight: 900,
                    textAlign: "center",
                  }}
                >
                  {projectToDelete.name}
                </Typography>
              </Box>
            )}
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

function ProjectsSkeleton() {
  const theme = useTheme();

  return (
    <Stack spacing={1.2}>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton
          key={item}
          variant="rounded"
          height={118}
          sx={{
            borderRadius: "22px",
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.08)
                : alpha("#0F172A", 0.08),
          }}
        />
      ))}
    </Stack>
  );
}
