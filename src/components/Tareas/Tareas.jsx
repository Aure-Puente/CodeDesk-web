// Importaciones:
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
// Animaciones:
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const softFadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.985);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const getFadeInSx = (delay = 0) => ({
  opacity: 0,
  animation: `${fadeInUp} 420ms ease forwards`,
  animationDelay: `${delay}ms`,
});

const getSoftFadeSx = (delay = 0) => ({
  opacity: 0,
  animation: `${softFadeIn} 380ms ease forwards`,
  animationDelay: `${delay}ms`,
});

// Constantes:
const STATUSES = ["pendiente", "en progreso", "completada", "pausada"];

const statusIcons = {
  pendiente: <PendingActionsRoundedIcon />,
  "en progreso": <AccessTimeRoundedIcon />,
  completada: <CheckCircleRoundedIcon />,
  pausada: <PauseCircleRoundedIcon />,
};

const getStatusLabel = (status) => {
  if (status === "pendiente") return "Pendiente";
  if (status === "en progreso") return "En progreso";
  if (status === "completada") return "Completada";
  if (status === "pausada") return "Pausada";

  return "Pendiente";
};

const getStatusIcon = (status) => {
  return statusIcons[status] || statusIcons.pendiente;
};

const getStatusColor = (theme, status) => {
  if (status === "pendiente") return theme.palette.warning.main;
  if (status === "en progreso") return theme.palette.info.main;
  if (status === "completada") return theme.palette.success.main;
  if (status === "pausada") return theme.palette.app.secondary;

  return theme.palette.primary.main;
};

const getTaskDateValue = (task) => {
  return task?.createdAt?.seconds || task?.updatedAt?.seconds || 0;
};

const sortTasks = (a, b) => {
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;

  if (orderA !== orderB) return orderA - orderB;

  return getTaskDateValue(b) - getTaskDateValue(a);
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

const getProjectColor = (theme, item) => {
  return item?.projectColor || item?.color || theme.palette.primary.main;
};

const Tareas = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pendiente");
  const [projectId, setProjectId] = useState("");

  const [filterStatus, setFilterStatus] = useState("noCompletadas");
  const [filterProject, setFilterProject] = useState("todos");

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 7,
      },
    })
  );

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      setProjects([]);
      setLoading(false);
      return;
    }

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const tasksQuery = query(
      collection(db, "tasks"),
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
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          );

        setProjects(data);
      },
      (error) => {
        console.error(error);
        setPageError("No se pudieron cargar los proyectos.");
      }
    );

    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort(sortTasks);

        setTasks(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setTasks([]);
        setLoading(false);
        setPageError("No se pudieron cargar las tareas.");
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribeTasks();
    };
  }, [user]);

  const stats = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "pendiente").length;
    const inProgress = tasks.filter(
      (task) => task.status === "en progreso"
    ).length;
    const completed = tasks.filter(
      (task) => task.status === "completada"
    ).length;
    const paused = tasks.filter((task) => task.status === "pausada").length;

    const active = pending + inProgress;
    const activePercent =
      active > 0 ? Math.round((inProgress / active) * 100) : 0;

    return {
      total: tasks.length,
      pending,
      inProgress,
      completed,
      paused,
      active,
      activePercent,
    };
  }, [tasks]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        filterStatus === "todas"
          ? true
          : filterStatus === "noCompletadas"
          ? task.status !== "completada"
          : task.status === filterStatus;

      const matchesProject =
        filterProject === "todos"
          ? true
          : filterProject === "sinProyecto"
          ? !task.projectId
          : task.projectId === filterProject;

      return matchesStatus && matchesProject;
    });
  }, [tasks, filterStatus, filterProject]);

  const resetForm = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setStatus("pendiente");
    setProjectId("");
    setPageError("");
  };

  const openCreateDialog = () => {
    resetForm();
    setTaskDialogOpen(true);
  };

  const openEditDialog = (task) => {
    setEditingTask(task);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "pendiente");
    setProjectId(task.projectId || "");
    setPageError("");
    setTaskDialogOpen(true);
  };

  const closeTaskDialog = () => {
    if (saving) return;
    resetForm();
    setTaskDialogOpen(false);
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setTaskDetailOpen(false);
  };

  const openDeleteDialog = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setTaskToDelete(null);
    setDeleteDialogOpen(false);
  };

  const moveExistingTasksDown = async () => {
    const updates = tasks.map((task) =>
      updateDoc(doc(db, "tasks", task.id), {
        order: (task.order ?? 0) + 1,
        updatedAt: serverTimestamp(),
      })
    );

    await Promise.all(updates);
  };

  const handleSaveTask = async (event) => {
    event?.preventDefault();

    if (!title.trim()) {
      setPageError("La tarea necesita un título.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");

      const selectedProjectData = projects.find(
        (project) => project.id === projectId
      );

      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        projectId: projectId || null,
        projectName: selectedProjectData?.name || null,
        projectColor: selectedProjectData?.color || null,
        projectLogoUrl: selectedProjectData?.logoUrl || null,
        updatedAt: serverTimestamp(),
      };

      if (editingTask) {
        await updateDoc(doc(db, "tasks", editingTask.id), payload);
      } else {
        await moveExistingTasksDown();

        await addDoc(collection(db, "tasks"), {
          ...payload,
          userId: user.uid,
          order: 1,
          createdAt: serverTimestamp(),
        });
      }

      closeTaskDialog();
    } catch (error) {
      console.error(error);
      setPageError("No se pudo guardar la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    try {
      const isDone = task.status === "completada";

      if (isDone) {
        await updateDoc(doc(db, "tasks", task.id), {
          status: "pendiente",
          updatedAt: serverTimestamp(),
        });

        return;
      }

      const maxOrder =
        tasks.length > 0 ? Math.max(...tasks.map((item) => item.order ?? 0)) : 0;

      await updateDoc(doc(db, "tasks", task.id), {
        status: "completada",
        order: maxOrder + 1,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      setPageError("No se pudo actualizar la tarea.");
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "tasks", taskToDelete.id));
      closeDeleteDialog();
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar la tarea.");
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredTasks.findIndex((task) => task.id === active.id);
    const newIndex = filteredTasks.findIndex((task) => task.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedVisibleTasks = arrayMove(filteredTasks, oldIndex, newIndex);
    const visibleIds = new Set(filteredTasks.map((task) => task.id));

    let visibleIndex = 0;

    const reorderedAllTasks = tasks.map((task) => {
      if (!visibleIds.has(task.id)) return task;

      const nextTask = reorderedVisibleTasks[visibleIndex];
      visibleIndex += 1;

      return nextTask;
    });

    setTasks(reorderedAllTasks);

    try {
      const updates = reorderedAllTasks.map((task, index) =>
        updateDoc(doc(db, "tasks", task.id), {
          order: index + 1,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.all(updates);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo guardar el nuevo orden.");
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
        {!loading && (
          <>
            <Box sx={getFadeInSx(0)}>
              <PageHeader
                stats={stats}
                projectsCount={projects.length}
                onCreate={openCreateDialog}
              />
            </Box>

            {pageError && (
              <Alert
                severity="error"
                sx={{
                  ...getFadeInSx(40),
                  borderRadius: "18px",
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                  fontWeight: 700,
                }}
              >
                {pageError}
              </Alert>
            )}

            <Box sx={getFadeInSx(70)}>
              <StatsGrid stats={stats} />
            </Box>

            <Box sx={getFadeInSx(140)}>
              <FiltersPanel
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterProject={filterProject}
                setFilterProject={setFilterProject}
                projects={projects}
                visibleCount={filteredTasks.length}
                totalCount={tasks.length}
              />
            </Box>

            <Box sx={getFadeInSx(210)}>
              {filteredTasks.length === 0 ? (
                <EmptyState onCreate={openCreateDialog} />
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredTasks.map((task) => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Stack spacing={1.2}>
                      {filteredTasks.map((task, index) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          delay={index * 45}
                          onOpen={() => openTaskDetail(task)}
                          onEdit={() => openEditDialog(task)}
                          onDelete={() => openDeleteDialog(task)}
                          onToggleDone={() => toggleDone(task)}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              )}
            </Box>
          </>
        )}
      </Stack>

      <TaskFormDialog
        open={taskDialogOpen}
        editingTask={editingTask}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        status={status}
        setStatus={setStatus}
        projectId={projectId}
        setProjectId={setProjectId}
        selectedProject={selectedProject}
        projects={projects}
        saving={saving}
        pageError={pageError}
        onClose={closeTaskDialog}
        onSave={handleSaveTask}
      />

      <TaskDetailDialog
        open={taskDetailOpen}
        task={selectedTask}
        onClose={closeTaskDetail}
        onEdit={() => {
          if (!selectedTask) return;
          const task = selectedTask;
          closeTaskDetail();
          openEditDialog(task);
        }}
        onToggleDone={() => {
          if (!selectedTask) return;
          toggleDone(selectedTask);
          closeTaskDetail();
        }}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        taskToDelete={taskToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteTask}
      />
    </Box>
  );
};

const PageHeader = ({ stats, projectsCount, onCreate }) => {
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
        sx={{
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          spacing={1.35}
          sx={{
            flex: 1,
            minWidth: 0,
          }}
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
            <AssignmentRoundedIcon sx={{ fontSize: { xs: 23, md: 25 } }} />
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
              Tareas
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
              Organizá tus pendientes, tareas en progreso y proyectos con una
              vista simple, rápida y cómoda para trabajar desde notebook.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.6, flexWrap: "wrap", rowGap: 1 }}
            >
              <HeaderMiniChip label={`${stats.total} tareas`} />
              <HeaderMiniChip label={`${stats.active} activas`} />
              <HeaderMiniChip label={`${projectsCount} proyectos`} />
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
            Nueva tarea
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

const HeaderMiniChip = ({ label }) => {
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
};

const StatsGrid = ({ stats }) => {
  const theme = useTheme();

  const items = [
    {
      label: "Pendientes",
      value: stats.pending,
      icon: <PendingActionsRoundedIcon />,
      color: theme.palette.warning.main,
    },
    {
      label: "En progreso",
      value: stats.inProgress,
      icon: <AccessTimeRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      label: "Completadas",
      value: stats.completed,
      icon: <CheckCircleRoundedIcon />,
      color: theme.palette.success.main,
    },
    {
      label: "Pausadas",
      value: stats.paused,
      icon: <PauseCircleRoundedIcon />,
      color: theme.palette.app.secondary,
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
      {items.map((item, index) => (
        <Card
          key={item.label}
          elevation={0}
          sx={{
            ...getCardStyles(theme),
            ...getSoftFadeSx(index * 45),
            p: { xs: 1.6, md: 1.9 },
            borderRadius: "20px",
            transition: "all 0.18s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(item.color, 0.28),
            },
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
};

const FiltersPanel = ({
  filterStatus,
  setFilterStatus,
  filterProject,
  setFilterProject,
  projects,
  visibleCount,
  totalCount,
}) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 1.6, md: 2 },
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
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
            <FilterListRoundedIcon />
          </Avatar>

          <Box>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 900,
                fontSize: "0.98rem",
              }}
            >
              Filtros
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: "0.82rem",
                fontWeight: 650,
              }}
            >
              {visibleCount} visibles de {totalCount} tareas.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.2}
          sx={{ width: { xs: "100%", lg: "auto" } }}
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              sx={{
                borderRadius: "14px",
                backgroundColor: getSoftBackground(theme),
              }}
            >
              <MenuItem value="noCompletadas">No completadas</MenuItem>
              <MenuItem value="todas">Todas</MenuItem>

              {STATUSES.map((item) => (
                <MenuItem key={item} value={item}>
                  {getStatusLabel(item)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 220 } }}>
            <InputLabel>Proyecto</InputLabel>
            <Select
              label="Proyecto"
              value={filterProject}
              onChange={(event) => setFilterProject(event.target.value)}
              sx={{
                borderRadius: "14px",
                backgroundColor: getSoftBackground(theme),
              }}
            >
              <MenuItem value="todos">Todos los proyectos</MenuItem>
              <MenuItem value="sinProyecto">Sin proyecto</MenuItem>

              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>
    </Card>
  );
};

const SortableTaskCard = ({ task, delay = 0, onOpen, onEdit, onDelete, onToggleDone }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.92 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        delay={delay}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        onOpen={onOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleDone={onToggleDone}
      />
    </Box>
  );
};

const TaskCard = ({
  task,
  delay = 0,
  isDragging,
  dragAttributes,
  dragListeners,
  onOpen,
  onEdit,
  onDelete,
  onToggleDone,
}) => {
  const theme = useTheme();

  const isDone = task.status === "completada";
  const statusColor = getStatusColor(theme, task.status);
  const projectColor = getProjectColor(theme, task);

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme),
        ...(!isDragging ? getSoftFadeSx(delay) : {}),
        borderRadius: "22px",
        opacity: isDone ? 0.72 : 1,
        transition: "all 0.18s ease",
        cursor: isDragging ? "grabbing" : "pointer",
        boxShadow: isDragging
          ? theme.palette.mode === "dark"
            ? "0 26px 70px rgba(0, 0, 0, 0.48)"
            : "0 26px 60px rgba(15, 23, 42, 0.18)"
          : getCardStyles(theme).boxShadow,
        "&:hover": {
          transform: isDragging ? "none" : "translateY(-2px)",
          borderColor: alpha(statusColor, 0.32),
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={{ xs: 1.4, md: 2 }}
        sx={{ p: { xs: 1.6, md: 1.9 } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.45}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <ProjectLogo
            color={projectColor}
            logoUrl={task.projectLogoUrl}
            letter={task.projectName?.charAt(0)?.toUpperCase()}
            size={54}
          />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.55 }}>
              <Chip
                size="small"
                icon={getStatusIcon(task.status)}
                label={getStatusLabel(task.status)}
                sx={{
                  height: 27,
                  borderRadius: "999px",
                  color: statusColor,
                  backgroundColor: alpha(
                    statusColor,
                    theme.palette.mode === "dark" ? 0.15 : 0.09
                  ),
                  border: `1px solid ${alpha(statusColor, 0.18)}`,
                  fontWeight: 850,
                  "& .MuiChip-icon": {
                    color: statusColor,
                  },
                }}
              />
            </Stack>

            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1rem", md: "1.1rem" },
                fontWeight: 950,
                letterSpacing: "-0.25px",
                textDecoration: isDone ? "line-through" : "none",
              }}
            >
              {task.title || "Tarea sin título"}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.65} sx={{ mt: 0.45 }}>
              <FolderRoundedIcon
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
                {task.projectName || "Tarea personal"}
              </Typography>
            </Stack>

            {task.description && (
              <Typography
                sx={{
                  mt: 1,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  lineHeight: 1.6,
                  fontWeight: 550,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent={{ xs: "space-between", md: "flex-end" }}
          spacing={0.75}
          sx={{ flexShrink: 0 }}
        >
          <Stack direction="row" spacing={0.6}>
            <Tooltip title={isDone ? "Restaurar tarea" : "Marcar completada"}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleDone();
                }}
                sx={{
                  width: 40,
                  height: 40,
                  color: isDone
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
                  backgroundColor: alpha(
                    isDone
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                    0.11
                  ),
                  "&:hover": {
                    backgroundColor: alpha(
                      isDone
                        ? theme.palette.warning.main
                        : theme.palette.success.main,
                      0.17
                    ),
                  },
                }}
              >
                {isDone ? <RestoreRoundedIcon /> : <CheckCircleRoundedIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Editar">
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
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

          <Tooltip title="Mantener apretado y arrastrar">
            <IconButton
              {...dragAttributes}
              {...dragListeners}
              onClick={(event) => event.stopPropagation()}
              sx={{
                width: 42,
                height: 42,
                borderRadius: "15px",
                cursor: isDragging ? "grabbing" : "grab",
                color: theme.palette.app.secondary,
                backgroundColor: getSoftBackground(theme),
                border: `1px solid ${theme.palette.app.borderSoft}`,
                touchAction: "none",
                "&:hover": {
                  color: theme.palette.primary.main,
                  backgroundColor: theme.palette.app.primarySoft,
                },
              }}
            >
              <DragIndicatorRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Card>
  );
};

const TaskDetailDialog = ({ open, task, onClose, onEdit, onToggleDone }) => {
  const theme = useTheme();

  if (!task) return null;

  const isDone = task.status === "completada";
  const statusColor = getStatusColor(theme, task.status);
  const projectColor = getProjectColor(theme, task);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          backgroundColor: theme.palette.app.surface,
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
          <ProjectLogo
            color={projectColor}
            logoUrl={task.projectLogoUrl}
            letter={task.projectName?.charAt(0)?.toUpperCase()}
            size={58}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              size="small"
              icon={getStatusIcon(task.status)}
              label={getStatusLabel(task.status)}
              sx={{
                height: 28,
                mb: 0.8,
                borderRadius: "999px",
                color: statusColor,
                backgroundColor: alpha(
                  statusColor,
                  theme.palette.mode === "dark" ? 0.15 : 0.09
                ),
                border: `1px solid ${alpha(statusColor, 0.18)}`,
                fontWeight: 900,
                "& .MuiChip-icon": {
                  color: statusColor,
                },
              }}
            />

            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1.2rem", md: "1.45rem" },
                lineHeight: 1.25,
                fontWeight: 950,
                letterSpacing: "-0.3px",
                textDecoration: isDone ? "line-through" : "none",
                overflowWrap: "anywhere",
              }}
            >
              {task.title || "Tarea sin título"}
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
        <Stack spacing={1.8}>
          <Box
            sx={{
              borderRadius: "18px",
              p: 1.6,
              backgroundColor: getSoftBackground(theme),
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Avatar
                variant="rounded"
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "14px",
                  color: projectColor,
                  backgroundColor: alpha(
                    projectColor,
                    theme.palette.mode === "dark" ? 0.16 : 0.1
                  ),
                }}
              >
                <FolderRoundedIcon />
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    color: theme.palette.app.secondary,
                    fontSize: "0.76rem",
                    fontWeight: 850,
                  }}
                >
                  PROYECTO
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,
                    color: theme.palette.app.text,
                    fontWeight: 900,
                    overflowWrap: "anywhere",
                  }}
                >
                  {task.projectName || "Tarea personal"}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              borderRadius: "18px",
              p: { xs: 1.6, md: 1.8 },
              backgroundColor: theme.palette.app.surface,
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: "0.82rem",
                fontWeight: 950,
                textTransform: "uppercase",
                letterSpacing: 0.45,
              }}
            >
              Descripción
            </Typography>

            <Typography
              sx={{
                mt: 1,
                color: task.description
                  ? theme.palette.app.secondary
                  : alpha(theme.palette.app.secondary, 0.72),
                fontSize: "0.95rem",
                lineHeight: 1.75,
                fontWeight: 600,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {task.description || "Esta tarea no tiene descripción."}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <DialogActions
        sx={{
          px: { xs: 2.2, md: 3 },
          py: 2,
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Button
          onClick={onToggleDone}
          startIcon={isDone ? <RestoreRoundedIcon /> : <CheckCircleRoundedIcon />}
          sx={{
            minHeight: 42,
            px: 1.7,
            borderRadius: "14px",
            color: isDone
              ? theme.palette.warning.main
              : theme.palette.success.main,
            backgroundColor: alpha(
              isDone
                ? theme.palette.warning.main
                : theme.palette.success.main,
              0.1
            ),
            fontWeight: 900,
            textTransform: "none",
            "&:hover": {
              backgroundColor: alpha(
                isDone
                  ? theme.palette.warning.main
                  : theme.palette.success.main,
                0.16
              ),
            },
          }}
        >
          {isDone ? "Restaurar" : "Completar"}
        </Button>

        <Stack direction="row" spacing={1}>
          <Button
            onClick={onClose}
            sx={{
              minHeight: 42,
              borderRadius: "14px",
              color: theme.palette.app.secondary,
              fontWeight: 850,
              textTransform: "none",
            }}
          >
            Cerrar
          </Button>

          <Button
            variant="contained"
            startIcon={<EditRoundedIcon />}
            onClick={onEdit}
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: "14px",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            Editar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

const ProjectLogo = ({ color, logoUrl, letter, size = 52 }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "16px",
        border: `1px solid ${alpha(color || theme.palette.primary.main, 0.22)}`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.92)
            : alpha(color || theme.palette.primary.main, 0.08),
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt="Proyecto"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : letter ? (
        <Typography
          sx={{
            color,
            fontSize: "1.25rem",
            fontWeight: 950,
          }}
        >
          {letter}
        </Typography>
      ) : (
        <FolderRoundedIcon
          sx={{
            color,
            fontSize: 27,
          }}
        />
      )}
    </Box>
  );
};

const EmptyState = ({ onCreate }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        ...getSoftFadeSx(40),
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
        <TaskAltRoundedIcon sx={{ fontSize: 36 }} />
      </Avatar>

      <Typography
        sx={{
          color: theme.palette.app.text,
          fontSize: { xs: "1.25rem", md: "1.5rem" },
          fontWeight: 950,
        }}
      >
        No hay tareas para mostrar
      </Typography>

      <Typography
        sx={{
          mt: 0.8,
          mb: 2.2,
          color: theme.palette.app.secondary,
          fontWeight: 600,
        }}
      >
        Creá una nueva tarea o cambiá los filtros activos.
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
        Nueva tarea
      </Button>
    </Card>
  );
};

const TaskFormDialog = ({
  open,
  editingTask,
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  projectId,
  setProjectId,
  selectedProject,
  projects,
  saving,
  pageError,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const statusColor = getStatusColor(theme, status);

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "24px",
          backgroundColor: theme.palette.app.surface,
          backgroundImage: "none",
          border: `1px solid ${theme.palette.app.borderSoft}`,
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
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1.4}>
              <Avatar
                variant="rounded"
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: "16px",
                  color: statusColor,
                  backgroundColor: alpha(statusColor, 0.12),
                }}
              >
                {editingTask ? <EditRoundedIcon /> : <AddRoundedIcon />}
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    color: theme.palette.app.text,
                    fontSize: "1.25rem",
                    fontWeight: 950,
                  }}
                >
                  {editingTask ? "Editar tarea" : "Nueva tarea"}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.3,
                    color: theme.palette.app.secondary,
                    fontSize: "0.86rem",
                    fontWeight: 600,
                  }}
                >
                  Completá los datos principales.
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
          </Stack>
        </DialogTitle>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.4 }}>
          <Stack spacing={2}>
            {pageError && (
              <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            )}

            <TextField
              label="Título"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
              <FormControl fullWidth>
                <InputLabel>Proyecto</InputLabel>

                <Select
                  label="Proyecto"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  disabled={saving}
                  sx={{ borderRadius: "14px" }}
                >
                  <MenuItem value="">Sin proyecto</MenuItem>

                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>

                <Select
                  label="Estado"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={saving}
                  sx={{ borderRadius: "14px" }}
                >
                  {STATUSES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {getStatusLabel(item)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {selectedProject && (
              <Box
                sx={{
                  borderRadius: "18px",
                  p: 1.3,
                  backgroundColor: getSoftBackground(theme),
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.2}>
                  <ProjectLogo
                    color={selectedProject.color || theme.palette.primary.main}
                    logoUrl={selectedProject.logoUrl}
                    letter={selectedProject.name?.charAt(0)?.toUpperCase()}
                    size={44}
                  />

                  <Box>
                    <Typography sx={{ color: theme.palette.app.text, fontWeight: 900 }}>
                      {selectedProject.name}
                    </Typography>

                    <Typography
                      sx={{
                        color: theme.palette.app.secondary,
                        fontSize: "0.8rem",
                        fontWeight: 650,
                      }}
                    >
                      Proyecto seleccionado
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
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
            startIcon={editingTask ? <EditRoundedIcon /> : <AddRoundedIcon />}
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
              : editingTask
              ? "Guardar cambios"
              : "Guardar tarea"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const DeleteDialog = ({ open, taskToDelete, onClose, onConfirm }) => {
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
                color: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.11),
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
                Eliminar tarea
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

          {taskToDelete?.title && (
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
                {taskToDelete.title}
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
};

export default Tareas;