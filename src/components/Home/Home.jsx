// Importaciones:
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import {
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { alpha, useTheme } from "@mui/material/styles";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

// Funciones auxiliares:
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

const getTaskDateValue = (task) => {
  return task?.createdAt?.seconds || task?.updatedAt?.seconds || 0;
};

const sortTasksLikeMainList = (a, b) => {
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;

  if (orderA !== orderB) return orderA - orderB;

  return getTaskDateValue(b) - getTaskDateValue(a);
};

const getStatusLabel = (status) => {
  if (status === "pendiente") return "Pendiente";
  if (status === "en progreso") return "En progreso";
  if (status === "completada") return "Completada";
  if (status === "pausada") return "Pausada";

  return "Sin estado";
};

const getStatusColor = (theme, status) => {
  if (status === "pendiente") return theme.palette.warning.main;
  if (status === "en progreso") return theme.palette.info.main;
  if (status === "completada") return theme.palette.success.main;
  if (status === "pausada") return theme.palette.app.secondary;

  return theme.palette.primary.main;
};

const getStatusIcon = (status) => {
  if (status === "pendiente") return <PendingActionsRoundedIcon />;
  if (status === "en progreso") return <AccessTimeRoundedIcon />;
  if (status === "completada") return <CheckCircleRoundedIcon />;
  if (status === "pausada") return <PauseCircleRoundedIcon />;

  return <FormatListBulletedRoundedIcon />;
};

const getCardStyles = (theme) => ({
  borderRadius: "24px",
  border: `1px solid ${theme.palette.app.borderSoft}`,
  backgroundColor: theme.palette.app.surface,
  backgroundImage: "none",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 18px 48px rgba(0, 0, 0, 0.18)"
      : "0 16px 42px rgba(15, 23, 42, 0.045)",
});

const getProjectLogoBackground = (theme, projectColor) => {
  if (theme.palette.mode === "dark") {
    return alpha("#FFFFFF", 0.94);
  }

  return hexToRgba(projectColor || theme.palette.primary.main, 0.08);
};

const getProjectLogoBorder = (theme, projectColor) => {
  return hexToRgba(
    projectColor || theme.palette.primary.main,
    theme.palette.mode === "dark" ? 0.34 : 0.18
  );
};

// JSX:
const Home = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);

  const loading = !tasksLoaded || !projectsLoaded;

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      setProjects([]);
      setTasksLoaded(true);
      setProjectsLoaded(true);
      return;
    }

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const unsubscribeTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort(sortTasksLikeMainList);

        setTasks(data);
        setTasksLoaded(true);
      },
      (error) => {
        console.error("Error cargando tareas:", error);
        setTasks([]);
        setTasksLoaded(true);
      }
    );

    const unsubscribeProjects = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setProjects(data);
        setProjectsLoaded(true);
      },
      (error) => {
        console.error("Error cargando proyectos:", error);
        setProjects([]);
        setProjectsLoaded(true);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeProjects();
    };
  }, [user]);

  const featuredTask = useMemo(() => {
    return (
      tasks.find((task) => task.status === "en progreso") ||
      tasks.find((task) => task.status === "pendiente") ||
      tasks[0] ||
      null
    );
  }, [tasks]);

  const featuredProject = useMemo(() => {
    if (!featuredTask?.projectId) return null;

    return (
      projects.find((project) => project.id === featuredTask.projectId) || null
    );
  }, [featuredTask, projects]);

  const stats = useMemo(() => {
    const pendingTasks = tasks.filter(
      (task) => task.status === "pendiente"
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === "en progreso"
    ).length;

    const completedTasks = tasks.filter(
      (task) => task.status === "completada"
    ).length;

    const pausedTasks = tasks.filter((task) => task.status === "pausada").length;

    const activeTasks = pendingTasks + inProgressTasks;

    const inProgressPercent =
      activeTasks > 0 ? Math.round((inProgressTasks / activeTasks) * 100) : 0;

    const activeProjects = projects.filter(
      (project) => project.status === "activo"
    ).length;

    const finishedProjects = projects.filter(
      (project) => project.status === "finalizado"
    ).length;

    return {
      totalTasks: tasks.length,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      pausedTasks,
      activeTasks,
      inProgressPercent,
      activeProjects,
      finishedProjects,
      totalProjects: projects.length,
    };
  }, [tasks, projects]);

  const pendingTasks = useMemo(() => {
    return tasks.filter((task) => task.status === "pendiente").slice(0, 4);
  }, [tasks]);

  const inProgressTasks = useMemo(() => {
    return tasks.filter((task) => task.status === "en progreso").slice(0, 4);
  }, [tasks]);

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
        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            <HeaderCard
              stats={stats}
              featuredTask={featuredTask}
              featuredProject={featuredProject}
            />

            <OverviewGrid stats={stats} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "0.95fr 1.05fr",
                },
                gap: { xs: 2, md: 2.4 },
                alignItems: "stretch",
              }}
            >
              <ActiveProgressCard stats={stats} />

              <ProjectsResume
                activeProjects={stats.activeProjects}
                finishedProjects={stats.finishedProjects}
                totalProjects={stats.totalProjects}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "1fr 1fr",
                },
                gap: { xs: 2, md: 2.4 },
              }}
            >
              <TaskSection
                title="En progreso"
                subtitle="Lo que conviene mirar primero"
                tasks={inProgressTasks}
                icon={<RocketLaunchRoundedIcon />}
                color={theme.palette.info.main}
              />

              <TaskSection
                title="Pendientes"
                subtitle="Tareas que todavía esperan acción"
                tasks={pendingTasks}
                icon={<PendingActionsRoundedIcon />}
                color={theme.palette.warning.main}
              />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

const HeaderCard = ({ stats, featuredTask, featuredProject }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        position: "relative",
        overflow: "hidden",
        p: {
          xs: 2,
          sm: 2.4,
          md: 2.8,
        },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2.4, md: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.6}>
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 52, md: 58 },
              height: { xs: 52, md: 58 },
              borderRadius: "18px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <HomeRoundedIcon sx={{ fontSize: { xs: 27, md: 31 } }} />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              icon={<AutoAwesomeRoundedIcon />}
              label="Resumen general"
              sx={{
                height: 27,
                borderRadius: "999px",
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
                border: `1px solid ${theme.palette.app.borderSoft}`,
                fontWeight: 850,
                mb: 0.8,
                "& .MuiChip-icon": {
                  color: theme.palette.primary.main,
                },
              }}
            />

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
              Inicio
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: theme.palette.app.secondary,
                fontSize: {
                  xs: "0.9rem",
                  md: "0.98rem",
                },
                lineHeight: 1.65,
                fontWeight: 600,
                maxWidth: 680,
              }}
            >
              Un panel rápido para ver tus tareas activas, proyectos y progreso
              del espacio de trabajo.
            </Typography>
          </Box>
        </Stack>

        <FeaturedProjectCard
          task={featuredTask}
          project={featuredProject}
          activeTasks={stats.activeTasks}
        />
      </Stack>
    </Card>
  );
};

const FeaturedProjectCard = ({ task, project, activeTasks }) => {
  const theme = useTheme();

  const projectColor =
    task?.projectColor || project?.color || theme.palette.primary.main;

  const logoUrl = task?.projectLogoUrl || project?.logoUrl;
  const projectName = task?.projectName || project?.name || "Sin proyecto activo";
  const taskTitle = task?.title || "No hay tareas activas";
  const letter = projectName?.charAt(0)?.toUpperCase();

  return (
    <Card
      elevation={0}
      sx={{
        width: { xs: "100%", md: 315 },
        flexShrink: 0,
        borderRadius: "24px",
        p: 1.6,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        boxShadow: "none",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.6}>
        <Box
          sx={{
            width: { xs: 78, md: 92 },
            height: { xs: 78, md: 92 },
            borderRadius: "24px",
            border: `1px solid ${getProjectLogoBorder(theme, projectColor)}`,
            backgroundColor: getProjectLogoBackground(theme, projectColor),
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
              alt={projectName}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : letter ? (
            <Typography
              sx={{
                color: projectColor,
                fontSize: { xs: "2rem", md: "2.35rem" },
                fontWeight: 950,
              }}
            >
              {letter}
            </Typography>
          ) : (
            <FolderRoundedIcon
              sx={{
                color: projectColor,
                fontSize: { xs: 34, md: 40 },
              }}
            />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.7 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "999px",
                backgroundColor:
                  task?.status === "en progreso"
                    ? theme.palette.info.main
                    : theme.palette.warning.main,
                boxShadow: `0 0 0 5px ${alpha(
                  task?.status === "en progreso"
                    ? theme.palette.info.main
                    : theme.palette.warning.main,
                  0.12
                )}`,
                flexShrink: 0,
              }}
            />

            <Typography
              noWrap
              sx={{
                color: theme.palette.app.secondary,
                fontSize: "0.76rem",
                fontWeight: 850,
              }}
            >
              {activeTasks > 0 ? "Proyecto activo" : "Sin tareas activas"}
            </Typography>
          </Stack>

          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1rem", md: "1.08rem" },
              fontWeight: 950,
              letterSpacing: "-0.25px",
            }}
          >
            {projectName}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.35,
              color: theme.palette.app.secondary,
              fontSize: "0.82rem",
              fontWeight: 650,
            }}
          >
            {taskTitle}
          </Typography>

          <Chip
            size="small"
            label={`${activeTasks} activas`}
            sx={{
              mt: 1,
              height: 25,
              borderRadius: "999px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
              fontWeight: 850,
              fontSize: "0.7rem",
            }}
          />
        </Box>
      </Stack>
    </Card>
  );
};

const OverviewGrid = ({ stats }) => {
  const theme = useTheme();

  const items = [
    {
      title: "Activas",
      value: stats.activeTasks,
      icon: <FormatListBulletedRoundedIcon />,
      color: theme.palette.primary.main,
      helper: "Pendientes + en progreso",
    },
    {
      title: "Pendientes",
      value: stats.pendingTasks,
      icon: <PendingActionsRoundedIcon />,
      color: theme.palette.warning.main,
      helper: "Esperando acción",
    },
    {
      title: "En progreso",
      value: stats.inProgressTasks,
      icon: <AccessTimeRoundedIcon />,
      color: theme.palette.info.main,
      helper: "En movimiento",
    },
    {
      title: "Completadas",
      value: stats.completedTasks,
      icon: <CheckCircleRoundedIcon />,
      color: theme.palette.success.main,
      helper: "Finalizadas",
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
          key={item.title}
          elevation={0}
          sx={{
            ...getCardStyles(theme),
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
                {item.title}
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.muted,
                  fontSize: "0.72rem",
                  fontWeight: 650,
                  display: { xs: "none", sm: "block" },
                }}
              >
                {item.helper}
              </Typography>
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
};

const ActiveProgressCard = ({ stats }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, md: 2.4 },
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.4}>
          <Avatar
            variant="rounded"
            sx={{
              width: 46,
              height: 46,
              borderRadius: "16px",
              color: theme.palette.info.main,
              backgroundColor: alpha(theme.palette.info.main, 0.12),
            }}
          >
            <TrendingUpRoundedIcon />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 900,
                fontSize: "1.05rem",
              }}
            >
              Avance de tareas activas
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: theme.palette.app.secondary,
                fontSize: "0.86rem",
                fontWeight: 600,
              }}
            >
              En progreso sobre pendientes + en progreso.
            </Typography>
          </Box>
        </Stack>

        <Box>
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            sx={{ mb: 0.9 }}
          >
            <Box>
              <Typography
                sx={{
                  color: theme.palette.app.secondary,
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}
              >
                En movimiento
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.text,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                }}
              >
                {stats.inProgressTasks} en progreso de {stats.activeTasks} activas
              </Typography>
            </Box>

            <Typography
              sx={{
                color: theme.palette.info.main,
                fontWeight: 950,
                fontSize: "2rem",
                lineHeight: 1,
                letterSpacing: "-0.8px",
              }}
            >
              {stats.inProgressPercent}%
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={stats.inProgressPercent}
            sx={{
              height: 10,
              borderRadius: "999px",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
              "& .MuiLinearProgress-bar": {
                borderRadius: "999px",
              },
            }}
          />
        </Box>

        <Box
          sx={{
            borderRadius: "18px",
            px: 1.6,
            py: 1.25,
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
              fontSize: "0.84rem",
              lineHeight: 1.55,
              fontWeight: 600,
            }}
          >
            Las completadas y pausadas quedan fuera de este cálculo para mostrar
            solo lo que todavía requiere acción.
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
};

const ProjectsResume = ({ activeProjects, finishedProjects, totalProjects }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, md: 2.4 },
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
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
                  fontSize: "1.05rem",
                }}
              >
                Proyectos
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Estado general de tus proyectos.
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={`${totalProjects} total`}
            sx={{
              height: 28,
              borderRadius: "999px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
              fontWeight: 850,
            }}
          />
        </Stack>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.4,
          }}
        >
          <ProjectMiniStat
            title="Activos"
            value={activeProjects}
            icon={<FolderOpenRoundedIcon />}
            color={theme.palette.info.main}
          />

          <ProjectMiniStat
            title="Finalizados"
            value={finishedProjects}
            icon={<TaskAltRoundedIcon />}
            color={theme.palette.success.main}
          />
        </Box>
      </Stack>
    </Card>
  );
};

const ProjectMiniStat = ({ title, value, icon, color }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "18px",
        p: 1.45,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2}>
        <Avatar
          variant="rounded"
          sx={{
            width: 39,
            height: 39,
            borderRadius: "14px",
            color,
            backgroundColor: alpha(
              color,
              theme.palette.mode === "dark" ? 0.16 : 0.1
            ),
          }}
        >
          {icon}
        </Avatar>

        <Box>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1.45rem", md: "1.65rem" },
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.6px",
            }}
          >
            {value}
          </Typography>

          <Typography
            sx={{
              mt: 0.45,
              color: theme.palette.app.secondary,
              fontSize: "0.76rem",
              fontWeight: 850,
            }}
          >
            {title}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

const TaskSection = ({ title, subtitle, tasks, icon, color }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 2, md: 2.4 }, pb: 1.6 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: 45,
                height: 45,
                borderRadius: "16px",
                color,
                backgroundColor: alpha(
                  color,
                  theme.palette.mode === "dark" ? 0.16 : 0.1
                ),
              }}
            >
              {icon}
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.05rem",
                  fontWeight: 900,
                }}
              >
                {title}
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.84rem",
                  fontWeight: 600,
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          </Stack>

          <Chip
            size="small"
            label={`${tasks.length}`}
            sx={{
              height: 28,
              minWidth: 38,
              borderRadius: "999px",
              fontWeight: 900,
              color,
              backgroundColor: alpha(
                color,
                theme.palette.mode === "dark" ? 0.15 : 0.09
              ),
            }}
          />
        </Stack>
      </Box>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <Box sx={{ p: { xs: 1.2, md: 1.5 } }}>
        {tasks.length === 0 ? (
          <EmptyCard
            text={
              title === "En progreso"
                ? "No tenés tareas en progreso."
                : "No tenés tareas pendientes."
            }
            icon={
              title === "En progreso" ? (
                <AccessTimeRoundedIcon />
              ) : (
                <TaskAltRoundedIcon />
              )
            }
            color={color}
          />
        ) : (
          <Stack spacing={1.1}>
            {tasks.map((task) => (
              <TaskPreview key={task.id} task={task} />
            ))}
          </Stack>
        )}
      </Box>
    </Card>
  );
};

const EmptyCard = ({ text, icon, color }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "18px",
        border: `1px dashed ${theme.palette.app.borderSoft}`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.02)
            : alpha("#0F172A", 0.018),
        p: { xs: 1.8, md: 2.1 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.4}>
        <Avatar
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            borderRadius: "16px",
            backgroundColor: alpha(
              color,
              theme.palette.mode === "dark" ? 0.16 : 0.1
            ),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Typography
          sx={{
            color: theme.palette.app.secondary,
            fontSize: "0.9rem",
            fontWeight: 700,
          }}
        >
          {text}
        </Typography>
      </Stack>
    </Box>
  );
};

const TaskPreview = ({ task }) => {
  const theme = useTheme();

  const statusColor = getStatusColor(theme, task.status);
  const projectColor = task.projectColor || theme.palette.primary.main;
  const logoUrl = task.projectLogoUrl;
  const projectLetter = task.projectName?.charAt(0)?.toUpperCase();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "18px",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.025)
            : alpha("#FFFFFF", 0.8),
        boxShadow: "none",
        transition: "all 0.18s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          borderColor: alpha(statusColor, 0.28),
          backgroundColor:
            theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.04) : "#FFFFFF",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.4}
        sx={{
          minHeight: { xs: 74, md: 82 },
          p: { xs: 1.35, md: 1.55 },
        }}
      >
        <Box
          sx={{
            width: { xs: 46, md: 52 },
            height: { xs: 46, md: 52 },
            borderRadius: "16px",
            border: `1px solid ${alpha(projectColor, 0.22)}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.92)
                : alpha(projectColor, 0.08),
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
              alt={task.projectName || "Proyecto"}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : projectLetter ? (
            <Typography
              sx={{
                color: projectColor,
                fontSize: "1.25rem",
                fontWeight: 950,
              }}
            >
              {projectLetter}
            </Typography>
          ) : (
            <FolderRoundedIcon
              sx={{
                color: projectColor,
                fontSize: 27,
              }}
            />
          )}
        </Box>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontWeight: 900,
              fontSize: { xs: "0.94rem", md: "1rem" },
              letterSpacing: "-0.15px",
            }}
          >
            {task.title || "Tarea sin título"}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.7}
            sx={{ mt: 0.45, minWidth: 0 }}
          >
            <FolderRoundedIcon
              sx={{
                fontSize: 15,
                color: theme.palette.app.secondary,
                flexShrink: 0,
              }}
            />

            <Typography
              noWrap
              sx={{
                color: theme.palette.app.secondary,
                fontSize: "0.82rem",
                fontWeight: 650,
                minWidth: 0,
              }}
            >
              {task.projectName || "Tarea personal"}
            </Typography>
          </Stack>
        </Box>

        <Chip
          icon={getStatusIcon(task.status)}
          label={getStatusLabel(task.status)}
          size="small"
          sx={{
            display: { xs: "none", sm: "inline-flex" },
            height: 31,
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

        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            width: 11,
            height: 11,
            borderRadius: "999px",
            backgroundColor: statusColor,
            boxShadow: `0 0 0 5px ${alpha(statusColor, 0.12)}`,
            flexShrink: 0,
          }}
        />
      </Stack>
    </Card>
  );
};

const HomeSkeleton = () => {
  const theme = useTheme();

  return (
    <Stack spacing={{ xs: 2, md: 2.4 }}>
      <Skeleton
        variant="rounded"
        height={185}
        sx={{
          borderRadius: "24px",
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha("#FFFFFF", 0.08)
              : alpha("#0F172A", 0.08),
        }}
      />

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
        {[1, 2, 3, 4].map((item) => (
          <Skeleton
            key={item}
            variant="rounded"
            height={92}
            sx={{
              borderRadius: "20px",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
            }}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "0.95fr 1.05fr",
          },
          gap: { xs: 2, md: 2.4 },
        }}
      >
        <Skeleton
          variant="rounded"
          height={210}
          sx={{
            borderRadius: "24px",
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.08)
                : alpha("#0F172A", 0.08),
          }}
        />

        <Skeleton
          variant="rounded"
          height={210}
          sx={{
            borderRadius: "24px",
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha("#FFFFFF", 0.08)
                : alpha("#0F172A", 0.08),
          }}
        />
      </Box>
    </Stack>
  );
};

export default Home;