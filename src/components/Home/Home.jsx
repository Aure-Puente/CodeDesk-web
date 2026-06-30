// Importaciones:
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import {
  Avatar,
  Box,
  Card,
  Chip,
  Divider,
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
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
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

const getPaidAmount = (payment) => {
  return (payment?.installments || []).reduce((total, installment) => {
    return total + Number(installment?.amount || 0);
  }, 0);
};

const getPaymentStatus = (payment) => {
  const total = Number(payment?.totalAmount || 0);
  const paid = getPaidAmount(payment);

  if (total > 0 && paid >= total) return "pagado";
  if (paid > 0 && paid < total) return "parcial";

  return "no_pagado";
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

const getSoftBackground = (theme) => {
  return theme.palette.mode === "dark"
    ? alpha("#FFFFFF", 0.035)
    : alpha("#0F172A", 0.025);
};

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
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const loading = !tasksLoaded || !projectsLoaded || !paymentsLoaded || !notesLoaded;

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      setProjects([]);
      setPayments([]);
      setNotes([]);
      setTasksLoaded(true);
      setProjectsLoaded(true);
      setPaymentsLoaded(true);
      setNotesLoaded(true);
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

    const paymentsQuery = query(
      collection(db, "payments"),
      where("userId", "==", user.uid)
    );

    const notesQuery = query(
      collection(db, "notes"),
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

    const unsubscribePayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setPayments(data);
        setPaymentsLoaded(true);
      },
      (error) => {
        console.error("Error cargando pagos:", error);
        setPayments([]);
        setPaymentsLoaded(true);
      }
    );

    const unsubscribeNotes = onSnapshot(
      notesQuery,
      (snapshot) => {
        const data = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort(sortTasksLikeMainList);

        setNotes(data);
        setNotesLoaded(true);
      },
      (error) => {
        console.error("Error cargando notas:", error);
        setNotes([]);
        setNotesLoaded(true);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeProjects();
      unsubscribePayments();
      unsubscribeNotes();
    };
  }, [user]);

  // Proyecto en progreso dinámico: toma el proyecto de la primera tarea de la lista principal.
  const featuredTask = useMemo(() => {
    return tasks[0] || null;
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

    const paymentsWithStatus = payments.map((payment) => ({
      ...payment,
      paymentStatus: getPaymentStatus(payment),
    }));

    const unpaidPayments = paymentsWithStatus.filter(
      (payment) => payment.paymentStatus === "no_pagado"
    ).length;

    const partialPayments = paymentsWithStatus.filter(
      (payment) => payment.paymentStatus === "parcial"
    ).length;

    const paidPayments = paymentsWithStatus.filter(
      (payment) => payment.paymentStatus === "pagado"
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
      unpaidPayments,
      partialPayments,
      paidPayments,
      totalPayments: payments.length,
    };
  }, [tasks, projects, payments]);

  const firstTasks = useMemo(() => {
    return tasks.slice(0, 4);
  }, [tasks]);

  const recentNotes = useMemo(() => {
    return notes
      .slice(0, 2)
      .map((note) => {
        const relatedProject = note.projectId
          ? projects.find((project) => project.id === note.projectId)
          : null;

        return {
          ...note,
          projectName:
            note.projectName || relatedProject?.name || "Nota personal",
          projectLogoUrl: note.projectLogoUrl || relatedProject?.logoUrl || null,
          projectColor:
            note.projectColor || relatedProject?.color || theme.palette.primary.main,
        };
      });
  }, [notes, projects, theme.palette.primary.main]);

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
            <HeaderCard />

            <OverviewGrid stats={stats} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "1fr 1fr",
                },
                gap: { xs: 2, md: 2.4 },
                alignItems: "stretch",
              }}
            >
              <ProjectInProgressCard
                task={featuredTask}
                project={featuredProject}
              />

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
                title="Tareas"
                subtitle="Estas son tus siguientes tareas según tu orden principal"
                tasks={firstTasks}
                icon={<FormatListBulletedRoundedIcon />}
                color={theme.palette.primary.main}
              />

              <WorkspaceSummaryCard stats={stats} notes={recentNotes} />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

const HeaderCard = () => {
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
      <Stack direction="row" alignItems="center" spacing={1.6} sx={{ minWidth: 0 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: { xs: 52, md: 58 },
            height: { xs: 52, md: 58 },
            borderRadius: "18px",
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.app.primarySoft,
            border: `1px solid ${theme.palette.app.borderSoft}`,
            flexShrink: 0,
          }}
        >
          <HomeRoundedIcon sx={{ fontSize: { xs: 27, md: 31 } }} />
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
              maxWidth: 720,
            }}
          >
            Un panel rápido para ver el estado general de tus tareas, proyectos y avance del espacio de trabajo.
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
};

const ProjectInProgressCard = ({ task, project }) => {
  const theme = useTheme();

  const projectColor =
    task?.projectColor || project?.color || theme.palette.primary.main;

  const logoUrl = task?.projectLogoUrl || project?.logoUrl;
  const projectName = task?.projectName || project?.name || "Sin proyecto";
  const taskTitle = task?.title || "No hay tareas cargadas";
  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, md: 2.4 },
        height: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={{ xs: 2, md: 2.4 }}
        sx={{ height: "100%" }}
      >
        <ProjectLogo
          logoUrl={logoUrl}
          projectName={projectName}
          projectColor={projectColor}
          size={{ xs: 124, md: 154 }}
        />

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1, flexWrap: "wrap", rowGap: 1 }}
          >
            <Chip
              size="small"
              icon={<RocketLaunchRoundedIcon />}
              label={task ? "Proyecto en progreso" : "Sin tareas activas"}
              sx={{
                height: 28,
                borderRadius: "999px",
                color: task ? theme.palette.info.main : theme.palette.app.secondary,
                backgroundColor: task
                  ? alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.15 : 0.09)
                  : getSoftBackground(theme),
                border: `1px solid ${
                  task
                    ? alpha(theme.palette.info.main, 0.18)
                    : theme.palette.app.borderSoft
                }`,
                fontWeight: 900,
                "& .MuiChip-icon": {
                  color: task ? theme.palette.info.main : theme.palette.app.secondary,
                },
              }}
            />

          </Stack>

          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontWeight: 950,
              fontSize: { xs: "1.35rem", md: "1.65rem" },
              letterSpacing: "-0.45px",
              lineHeight: 1.12,
            }}
          >
            {projectName}
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: theme.palette.app.secondary,
              fontSize: { xs: "0.92rem", md: "0.98rem" },
              fontWeight: 700,
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            Tarea: {taskTitle}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
};

const ProjectLogo = ({ logoUrl, projectName, projectColor, size }) => {
  const theme = useTheme();
  const letter = projectName?.charAt(0)?.toUpperCase();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "20px",
        border: `1px solid ${getProjectLogoBorder(theme, projectColor)}`,
        backgroundColor: getProjectLogoBackground(theme, projectColor),
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={projectName || "Proyecto"}
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
            fontSize: { xs: "1.85rem", md: "2.1rem" },
            fontWeight: 950,
            lineHeight: 1,
          }}
        >
          {letter}
        </Typography>
      ) : (
        <FolderRoundedIcon
          sx={{
            color: projectColor,
            fontSize: { xs: 30, md: 34 },
          }}
        />
      )}
    </Box>
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
      title: "En progreso",
      value: stats.inProgressTasks,
      icon: <AccessTimeRoundedIcon />,
      color: theme.palette.info.main,
      helper: "En movimiento",
    },
    {
      title: "Pendientes",
      value: stats.pendingTasks,
      icon: <PendingActionsRoundedIcon />,
      color: theme.palette.warning.main,
      helper: "Esperando acción",
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
            minHeight: { xs: 92, md: 104 },
            p: { xs: 1.55, md: 1.8 },
            borderRadius: "20px",
            transition: "all 0.18s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(item.color, 0.28),
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ height: "100%" }}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 46 },
                height: { xs: 40, md: 46 },
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
                  fontSize: { xs: "1.45rem", md: "1.78rem" },
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
                  fontWeight: 850,
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

const WorkspaceSummaryCard = ({ stats, notes }) => {
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
      <Stack spacing={2.1} sx={{ height: "100%" }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 1.6 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                color: theme.palette.warning.main,
                backgroundColor: alpha(theme.palette.warning.main, 0.12),
                flexShrink: 0,
              }}
            >
              <PaymentsRoundedIcon />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 900,
                  fontSize: "1.05rem",
                }}
              >
                Resumen de cobros
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Estado pendiente de tus proyectos facturados.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.2,
            }}
          >
            <PaymentMiniStat
              title="Sin cobrar"
              value={stats.unpaidPayments}
              helper="Pagos todavía pendientes"
              icon={<PaymentsRoundedIcon />}
              color={theme.palette.warning.main}
            />

            <PaymentMiniStat
              title="Parciales"
              value={stats.partialPayments}
              helper="Cobros iniciados"
              icon={<AccessTimeRoundedIcon />}
              color={theme.palette.info.main}
            />
          </Box>
        </Box>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 1.6 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
                flexShrink: 0,
              }}
            >
              <NotesRoundedIcon />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 900,
                  fontSize: "1.05rem",
                }}
              >
                Resumen de notas
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Tus notas recientes vinculadas a proyectos.
              </Typography>
            </Box>
          </Stack>

          {notes.length === 0 ? (
            <EmptyCard
              text="Aún no tienes notas guardadas."
              icon={<NotesRoundedIcon />}
              color={theme.palette.primary.main}
            />
          ) : (
            <Stack spacing={1.1}>
              {notes.map((note) => (
                <NotePreview key={note.id} note={note} />
              ))}
            </Stack>
          )}
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
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.4} sx={{ minWidth: 0 }}>
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
                flexShrink: 0,
              }}
            >
              <FolderRoundedIcon />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
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
                noWrap
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Estado general del espacio de trabajo.
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 1.2,
            mt: "auto",
          }}
        >
          <ProjectMiniStat
            title="Total"
            value={totalProjects}
            icon={<FolderRoundedIcon />}
            color={theme.palette.primary.main}
          />

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
        p: 1.35,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        minHeight: 74,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.15} sx={{ width: "100%" }}>
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
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1.35rem", md: "1.55rem" },
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.6px",
            }}
          >
            {value}
          </Typography>

          <Typography
            noWrap
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

const PaymentMiniStat = ({ title, value, helper, icon, color }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "18px",
        p: 1.35,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        minHeight: 78,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.15} sx={{ width: "100%" }}>
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
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1.28rem", md: "1.45rem" },
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.6px",
            }}
          >
            {value}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.4,
              color: theme.palette.app.secondary,
              fontSize: "0.76rem",
              fontWeight: 850,
            }}
          >
            {title}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.2,
              color: theme.palette.app.muted,
              fontSize: "0.7rem",
              fontWeight: 650,
            }}
          >
            {helper}
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
        </Stack>
      </Box>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <Box sx={{ p: { xs: 1.2, md: 1.5 } }}>
        {tasks.length === 0 ? (
          <EmptyCard
            text="No hay tareas para mostrar."
            icon={<TaskAltRoundedIcon />}
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

const NotePreview = ({ note }) => {
  const theme = useTheme();

  const projectColor = note.projectColor || theme.palette.primary.main;
  const logoUrl = note.projectLogoUrl;
  const projectLetter = note.projectName?.charAt(0)?.toUpperCase();

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
          borderColor: alpha(projectColor, 0.28),
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
              alt={note.projectName || "Proyecto"}
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
            <NotesRoundedIcon
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
            {note.title || "Nota sin título"}
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
              {note.projectName || "Nota personal"}
            </Typography>
          </Stack>
        </Box>
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
            lg: "1fr 1fr",
          },
          gap: { xs: 2, md: 2.4 },
        }}
      >
        <Skeleton
          variant="rounded"
          height={240}
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
          height={240}
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
