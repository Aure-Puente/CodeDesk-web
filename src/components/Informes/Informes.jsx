//Importaciones:
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import { alpha, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
const RANGE_OPTIONS = [
  { label: "Todo", value: "all", icon: <CalendarMonthRoundedIcon /> },
  { label: "Este mes", value: "month", icon: <DateRangeRoundedIcon /> },
  { label: "Este año", value: "year", icon: <DateRangeRoundedIcon /> },
];

function getPaidAmount(payment) {
  return (payment.installments || []).reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
}

function formatMoney(value, currency = "ARS") {
  const number = Number(value || 0);

  if (currency === "USD") {
    return `US$${number.toLocaleString("es-AR", {
      maximumFractionDigits: 0,
    })}`;
  }

  return `$${number.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;
}

function filterByRange(items, range) {
  if (range === "all") return items;

  const now = new Date();

  return items.filter((item) => {
    const seconds = item.createdAt?.seconds;

    if (!seconds) return true;

    const date = new Date(seconds * 1000);

    if (range === "month") {
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }

    if (range === "year") {
      return date.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

function getRangeText(range) {
  if (range === "month") return "Este mes";
  if (range === "year") return "Este año";
  return "Todo el historial";
}

function getCardStyles(theme) {
  return {
    borderRadius: "24px",
    border: `1px solid ${theme.palette.app.borderSoft}`,
    backgroundColor: theme.palette.app.surface,
    backgroundImage: "none",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 18px 48px rgba(0, 0, 0, 0.16)"
        : "0 16px 42px rgba(15, 23, 42, 0.045)",
  };
}

function getSoftBackground(theme) {
  return theme.palette.mode === "dark"
    ? alpha("#FFFFFF", 0.035)
    : alpha("#0F172A", 0.025);
}

export default function Informes() {
  const theme = useTheme();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notes, setNotes] = useState([]);

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [range, setRange] = useState("all");
  const [pageError, setPageError] = useState("");

  const loading = loadingTasks || loadingProjects || loadingPayments || loadingNotes;

  useEffect(() => {
    if (!user?.uid) {
      setTasks([]);
      setProjects([]);
      setPayments([]);
      setNotes([]);
      setLoadingTasks(false);
      setLoadingProjects(false);
      setLoadingPayments(false);
      setLoadingNotes(false);
      return;
    }

    const unsubTasks = onSnapshot(
      query(collection(db, "tasks"), where("userId", "==", user.uid)),
      (snapshot) => {
        setTasks(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
        setLoadingTasks(false);
      },
      (error) => {
        console.log(error);
        setLoadingTasks(false);
        setPageError("No se pudieron cargar las tareas.");
      }
    );

    const unsubProjects = onSnapshot(
      query(collection(db, "projects"), where("userId", "==", user.uid)),
      (snapshot) => {
        setProjects(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
        setLoadingProjects(false);
      },
      (error) => {
        console.log(error);
        setLoadingProjects(false);
        setPageError("No se pudieron cargar los proyectos.");
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, "payments"), where("userId", "==", user.uid)),
      (snapshot) => {
        setPayments(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
        setLoadingPayments(false);
      },
      (error) => {
        console.log(error);
        setLoadingPayments(false);
        setPageError("No se pudieron cargar los pagos.");
      }
    );

    const unsubNotes = onSnapshot(
      query(collection(db, "notes"), where("userId", "==", user.uid)),
      (snapshot) => {
        setNotes(
          snapshot.docs.map((document) => ({
            id: document.id,
            ...document.data(),
          }))
        );
        setLoadingNotes(false);
      },
      (error) => {
        console.log(error);
        setLoadingNotes(false);
        setPageError("No se pudieron cargar las notas.");
      }
    );

    return () => {
      unsubTasks();
      unsubProjects();
      unsubPayments();
      unsubNotes();
    };
  }, [user]);

  const filteredData = useMemo(() => {
    return {
      tasks: filterByRange(tasks, range),
      projects: filterByRange(projects, range),
      payments: filterByRange(payments, range),
      notes: filterByRange(notes, range),
    };
  }, [tasks, projects, payments, notes, range]);

  const stats = useMemo(() => {
    const completedTasks = filteredData.tasks.filter(
      (task) => task.status === "completada"
    ).length;

    const pendingTasks = filteredData.tasks.filter(
      (task) => task.status === "pendiente"
    ).length;

    const inProgressTasks = filteredData.tasks.filter(
      (task) => task.status === "en progreso"
    ).length;

    const pausedTasks = filteredData.tasks.filter(
      (task) => task.status === "pausada"
    ).length;

    const activeProjects = filteredData.projects.filter(
      (project) => project.status === "activo"
    ).length;

    const pausedProjects = filteredData.projects.filter(
      (project) => project.status === "pausado"
    ).length;

    const finishedProjects = filteredData.projects.filter(
      (project) => project.status === "finalizado"
    ).length;

    const money = {
      ARS: { agreed: 0, paid: 0, pending: 0 },
      USD: { agreed: 0, paid: 0, pending: 0 },
    };

    let unpaidPayments = 0;
    let partialPayments = 0;
    let paidPayments = 0;

    filteredData.payments.forEach((payment) => {
      const currency = payment.currency || "ARS";
      const agreed = Number(payment.totalAmount || 0);
      const paid = getPaidAmount(payment);
      const pending = Math.max(agreed - paid, 0);

      if (!money[currency]) {
        money[currency] = { agreed: 0, paid: 0, pending: 0 };
      }

      money[currency].agreed += agreed;
      money[currency].paid += paid;
      money[currency].pending += pending;

      if (paid <= 0 && agreed > 0) unpaidPayments += 1;
      if (paid > 0 && paid < agreed) partialPayments += 1;
      if (agreed > 0 && paid >= agreed) paidPayments += 1;
    });

    const activeTasks = pendingTasks + inProgressTasks;

    return {
      totalTasks: filteredData.tasks.length,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      pausedTasks,
      activeTasks,

      totalProjects: filteredData.projects.length,
      activeProjects,
      pausedProjects,
      finishedProjects,

      totalNotes: filteredData.notes.length,
      totalPayments: filteredData.payments.length,
      unpaidPayments,
      partialPayments,
      paidPayments,

      money,
    };
  }, [filteredData]);

  const taskProgressPercent = useMemo(() => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  }, [stats]);

  const projectProgressPercent = useMemo(() => {
    if (stats.totalProjects === 0) return 0;
    return Math.round((stats.finishedProjects / stats.totalProjects) * 100);
  }, [stats]);

  const moneyProgress = useMemo(() => {
    const totalAgreed = stats.money.ARS.agreed + stats.money.USD.agreed;
    const totalPaid = stats.money.ARS.paid + stats.money.USD.paid;

    if (totalAgreed <= 0) return 0;

    return Math.round(Math.min(totalPaid / totalAgreed, 1) * 100);
  }, [stats]);

  const projectPieData = useMemo(() => {
    return [
      {
        id: "activo",
        label: "Activos",
        value: stats.activeProjects,
        color: theme.palette.info.main,
      },
      {
        id: "pausado",
        label: "Pausados",
        value: stats.pausedProjects,
        color: theme.palette.warning.main,
      },
      {
        id: "finalizado",
        label: "Finalizados",
        value: stats.finishedProjects,
        color: theme.palette.success.main,
      },
    ].filter((item) => item.value > 0);
  }, [stats, theme]);

  const taskBarData = useMemo(() => {
    return [
      { label: "Pend.", value: stats.pendingTasks },
      { label: "Progr.", value: stats.inProgressTasks },
      { label: "Hechas", value: stats.completedTasks },
      { label: "Paus.", value: stats.pausedTasks },
    ];
  }, [stats]);

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
      <Stack spacing={{ xs: 2.2, md: 2.6 }}>
        <PageHeader
          range={range}
          taskProgressPercent={taskProgressPercent}
          projectProgressPercent={projectProgressPercent}
        />

        {pageError ? (
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
        ) : null}

        <RangeSelector range={range} setRange={setRange} />

        {loading ? (
          <StatsSkeleton />
        ) : (
          <>
            <MetricGrid stats={stats} moneyProgress={moneyProgress} />

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
              <ProgressOverview
                taskProgressPercent={taskProgressPercent}
                projectProgressPercent={projectProgressPercent}
                moneyProgress={moneyProgress}
                stats={stats}
              />

              <ProjectChartCard
                projectPieData={projectPieData}
                stats={stats}
              />
            </Box>

            <TaskChartCard taskBarData={taskBarData} totalTasks={stats.totalTasks} />

            <FinancialSummary stats={stats} />
          </>
        )}
      </Stack>
    </Box>
  );
}

function PageHeader({ range, taskProgressPercent, projectProgressPercent }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, sm: 2.4, md: 2.8 },
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
            <InsightsRoundedIcon sx={{ fontSize: { xs: 27, md: 31 } }} />
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
              Estadísticas
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: theme.palette.app.secondary,
                fontSize: { xs: "0.9rem", md: "0.98rem" },
                lineHeight: 1.65,
                fontWeight: 600,
                maxWidth: 690,
              }}
            >
              Métricas simples para revisar tareas, proyectos, notas y cobros sin
              sobrecargar el panel.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent={{ xs: "flex-start", md: "flex-end" }}
          sx={{ rowGap: 1 }}
        >
          <HeaderPill
            icon={<CalendarMonthRoundedIcon />}
            label={getRangeText(range)}
            color={theme.palette.primary.main}
          />

          <HeaderPill
            icon={<TrendingUpRoundedIcon />}
            label={`${taskProgressPercent}% tareas`}
            color={theme.palette.success.main}
          />

          <HeaderPill
            icon={<WorkspacesRoundedIcon />}
            label={`${projectProgressPercent}% proyectos`}
            color={theme.palette.info.main}
          />
        </Stack>
      </Stack>
    </Card>
  );
}

function HeaderPill({ icon, label, color }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      sx={{
        height: 32,
        borderRadius: "999px",
        color,
        backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.14 : 0.08),
        border: `1px solid ${alpha(color, theme.palette.mode === "dark" ? 0.24 : 0.16)}`,
        fontWeight: 900,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function RangeSelector({ range, setRange }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 1.4, md: 1.7 },
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 40,
              height: 40,
              borderRadius: "15px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
            }}
          >
            <CalendarMonthRoundedIcon />
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: theme.palette.app.text, fontWeight: 950 }}>
              Rango de análisis
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              Filtrá por fecha de creación.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {RANGE_OPTIONS.map((item) => {
            const selected = range === item.value;

            return (
              <Chip
                key={item.value}
                icon={item.icon}
                label={item.label}
                clickable
                onClick={() => setRange(item.value)}
                sx={{
                  height: 38,
                  borderRadius: "999px",
                  border: `1px solid ${
                    selected
                      ? alpha(theme.palette.primary.main, 0.28)
                      : theme.palette.app.borderSoft
                  }`,
                  backgroundColor: selected
                    ? theme.palette.app.primarySoft
                    : getSoftBackground(theme),
                  color: selected ? theme.palette.primary.main : theme.palette.app.secondary,
                  fontWeight: 950,
                  transition: "0.18s ease",
                  "& .MuiChip-icon": {
                    color: selected ? theme.palette.primary.main : theme.palette.app.secondary,
                  },
                  "&:hover": {
                    transform: "translateY(-1px)",
                    backgroundColor: theme.palette.app.primarySoft,
                  },
                }}
              />
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

function MetricGrid({ stats, moneyProgress }) {
  const theme = useTheme();

  const items = [
    {
      title: "Tareas",
      value: stats.totalTasks,
      icon: <PendingActionsRoundedIcon />,
      color: theme.palette.primary.main,
      helper: `${stats.activeTasks} activas`,
    },
    {
      title: "Completadas",
      value: stats.completedTasks,
      icon: <CheckCircleRoundedIcon />,
      color: theme.palette.success.main,
      helper: `${stats.pendingTasks} pendientes`,
    },
    {
      title: "Proyectos",
      value: stats.totalProjects,
      icon: <FolderRoundedIcon />,
      color: theme.palette.info.main,
      helper: `${stats.finishedProjects} finalizados`,
    },
    {
      title: "Cobros",
      value: `${moneyProgress}%`,
      icon: <AccountBalanceWalletRoundedIcon />,
      color: theme.palette.warning.main,
      helper: `${stats.unpaidPayments + stats.partialPayments} por cobrar`,
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
        <MetricCard key={item.title} {...item} />
      ))}
    </Box>
  );
}

function MetricCard({ title, value, icon, color, helper }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 1.55, md: 1.85 },
        borderRadius: "20px",
        boxShadow: "none",
        transition: "all 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(color, 0.28),
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
            color,
            backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontWeight: 950,
              fontSize: { xs: "1.35rem", md: "1.65rem" },
              lineHeight: 1,
              letterSpacing: "-0.5px",
            }}
          >
            {value}
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
            {title}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.25,
              color: theme.palette.app.muted,
              fontSize: "0.72rem",
              fontWeight: 650,
            }}
          >
            {helper}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function ProgressOverview({
  taskProgressPercent,
  projectProgressPercent,
  moneyProgress,
  stats,
}) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        p: { xs: 2, md: 2.35 },
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.35}>
            <Avatar
              variant="rounded"
              sx={{
                width: 46,
                height: 46,
                borderRadius: "16px",
                color: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.12),
              }}
            >
              <TrendingUpRoundedIcon />
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontWeight: 950,
                  fontSize: "1.05rem",
                }}
              >
                Avance general
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Productividad y cierre del espacio.
              </Typography>
            </Box>
          </Stack>

          <Typography
            sx={{
              color: theme.palette.success.main,
              fontWeight: 950,
              fontSize: { xs: "2rem", md: "2.45rem" },
              lineHeight: 1,
              letterSpacing: "-0.9px",
            }}
          >
            {taskProgressPercent}%
          </Typography>
        </Stack>

        <ProgressLine
          title="Tareas completadas"
          detail={`${stats.completedTasks} de ${stats.totalTasks}`}
          value={taskProgressPercent}
          color={theme.palette.success.main}
          icon={<CheckCircleRoundedIcon />}
        />

        <ProgressLine
          title="Proyectos finalizados"
          detail={`${stats.finishedProjects} de ${stats.totalProjects}`}
          value={projectProgressPercent}
          color={theme.palette.info.main}
          icon={<WorkspacesRoundedIcon />}
        />

        <ProgressLine
          title="Cobros registrados"
          detail={`${stats.paidPayments} pagos completos`}
          value={moneyProgress}
          color={theme.palette.warning.main}
          icon={<SavingsRoundedIcon />}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: 1,
            pt: 0.2,
          }}
        >
          <MiniMetric title="Pend." value={stats.pendingTasks} color={theme.palette.warning.main} />
          <MiniMetric title="Progr." value={stats.inProgressTasks} color={theme.palette.info.main} />
          <MiniMetric title="Hechas" value={stats.completedTasks} color={theme.palette.success.main} />
          <MiniMetric title="Paus." value={stats.pausedTasks} color={theme.palette.app.secondary} />
        </Box>
      </Stack>
    </Card>
  );
}

function ProgressLine({ title, detail, value, icon, color }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "18px",
        p: 1.45,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.15} sx={{ mb: 1 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 34,
            height: 34,
            borderRadius: "13px",
            color,
            backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ color: theme.palette.app.text, fontWeight: 900 }}>
            {title}
          </Typography>
          <Typography noWrap sx={{ color: theme.palette.app.secondary, fontSize: 12.5, fontWeight: 650 }}>
            {detail}
          </Typography>
        </Box>

        <Typography sx={{ color, fontWeight: 950 }}>{value}%</Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 8,
          borderRadius: "999px",
          backgroundColor:
            theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#0F172A", 0.08),
          "& .MuiLinearProgress-bar": {
            borderRadius: "999px",
            backgroundColor: color,
          },
        }}
      />
    </Box>
  );
}

function MiniMetric({ title, value, color }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "16px",
        p: 1.25,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Typography
        sx={{
          color,
          fontSize: { xs: "1.3rem", md: "1.45rem" },
          lineHeight: 1,
          fontWeight: 950,
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </Typography>

      <Typography
        noWrap
        sx={{
          mt: 0.45,
          color: theme.palette.app.secondary,
          fontSize: "0.74rem",
          fontWeight: 850,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

function ProjectChartCard({ projectPieData, stats }) {
  const theme = useTheme();

  return (
    <ChartCard
      title="Proyectos"
      subtitle="Distribución por estado"
      icon={<DonutLargeRoundedIcon />}
      color={theme.palette.primary.main}
    >
      {projectPieData.length === 0 ? (
        <EmptyBox icon={<FolderOpenRoundedIcon />} text="Todavía no hay proyectos para mostrar." />
      ) : (
        <Stack spacing={1.8}>
          <Box
            sx={{
              height: { xs: 230, md: 260 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PieChart
              series={[
                {
                  data: projectPieData,
                  innerRadius: 58,
                  outerRadius: 104,
                  paddingAngle: 3,
                  cornerRadius: 6,
                  highlightScope: {
                    faded: "global",
                    highlighted: "item",
                  },
                },
              ]}
              height={255}
              slotProps={{ legend: { hidden: true } }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 1.1,
            }}
          >
            <LegendItem label="Activos" value={stats.activeProjects} color={theme.palette.info.main} />
            <LegendItem label="Pausados" value={stats.pausedProjects} color={theme.palette.warning.main} />
            <LegendItem label="Finalizados" value={stats.finishedProjects} color={theme.palette.success.main} />
          </Box>
        </Stack>
      )}
    </ChartCard>
  );
}

function TaskChartCard({ taskBarData, totalTasks }) {
  const theme = useTheme();

  return (
    <ChartCard
      title="Tareas por estado"
      subtitle="Comparación rápida de tus tareas"
      icon={<BarChartRoundedIcon />}
      color={theme.palette.info.main}
    >
      {totalTasks === 0 ? (
        <EmptyBox icon={<PendingActionsRoundedIcon />} text="Todavía no hay tareas para graficar." />
      ) : (
        <Box sx={{ width: "100%", height: { xs: 280, md: 330 } }}>
          <BarChart
            dataset={taskBarData}
            xAxis={[{ scaleType: "band", dataKey: "label" }]}
            series={[
              {
                dataKey: "value",
                label: "Tareas",
                color: theme.palette.primary.main,
              },
            ]}
            height={315}
            borderRadius={8}
            grid={{ horizontal: true }}
            margin={{ top: 28, right: 20, bottom: 35, left: 40 }}
          />
        </Box>
      )}
    </ChartCard>
  );
}

function ChartCard({ title, subtitle, icon, color, children }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme),
        overflow: "hidden",
        height: "100%",
      }}
    >
      <Box sx={{ p: { xs: 2, md: 2.4 } }}>
        <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 46,
              height: 46,
              borderRadius: "16px",
              backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
              color,
            }}
          >
            {icon}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1rem", md: "1.15rem" },
                fontWeight: 950,
                letterSpacing: "-0.2px",
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                color: theme.palette.app.secondary,
                fontSize: { xs: "0.82rem", md: "0.9rem" },
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              {subtitle}
            </Typography>
          </Box>
        </Stack>

        {children}
      </Box>
    </Card>
  );
}

function LegendItem({ label, value, color }) {
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
      <Stack direction="row" alignItems="center" spacing={1.15} sx={{ p: 1.35 }}>
        <Box
          sx={{
            width: 11,
            height: 11,
            borderRadius: "999px",
            backgroundColor: color,
            boxShadow: `0 0 0 5px ${alpha(color, 0.12)}`,
            flexShrink: 0,
          }}
        />

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: theme.palette.app.text, fontSize: 18, fontWeight: 950, lineHeight: 1 }}>
            {value}
          </Typography>

          <Typography noWrap sx={{ mt: 0.45, color: theme.palette.app.secondary, fontSize: 12, fontWeight: 850 }}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function FinancialSummary({ stats }) {
  const theme = useTheme();

  return (
    <ChartCard
      title="Resumen financiero"
      subtitle="Cobrado y pendiente por moneda"
      icon={<AccountBalanceWalletRoundedIcon />}
      color={theme.palette.primary.main}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.3,
        }}
      >
        <MoneyBox
          title="Cobrado ARS"
          value={formatMoney(stats.money.ARS.paid, "ARS")}
          icon={<PriceCheckRoundedIcon />}
          color={theme.palette.success.main}
        />

        <MoneyBox
          title="Pendiente ARS"
          value={formatMoney(stats.money.ARS.pending, "ARS")}
          icon={<AccessTimeRoundedIcon />}
          color={theme.palette.warning.main}
        />

        <MoneyBox
          title="Cobrado USD"
          value={formatMoney(stats.money.USD.paid, "USD")}
          icon={<AttachMoneyRoundedIcon />}
          color={theme.palette.success.main}
        />

        <MoneyBox
          title="Pendiente USD"
          value={formatMoney(stats.money.USD.pending, "USD")}
          icon={<RequestQuoteRoundedIcon />}
          color={theme.palette.warning.main}
        />
      </Box>
    </ChartCard>
  );
}

function MoneyBox({ title, value, icon, color }) {
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
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ p: 1.55 }}>
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

        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1rem", md: "1.12rem" },
              fontWeight: 950,
              letterSpacing: "-0.15px",
            }}
          >
            {value}
          </Typography>

          <Typography
            noWrap
            sx={{
              mt: 0.35,
              color: theme.palette.app.secondary,
              fontSize: "0.78rem",
              fontWeight: 850,
            }}
          >
            {title}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function EmptyBox({ text, icon }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "18px",
        backgroundColor: getSoftBackground(theme),
        border: `1px dashed ${theme.palette.app.borderSoft}`,
        boxShadow: "none",
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{
          minHeight: 150,
          p: 2,
          textAlign: "center",
          color: theme.palette.app.secondary,
        }}
      >
        <Box
          sx={{
            display: "flex",
            mb: 1,
            "& svg": {
              fontSize: 36,
            },
          }}
        >
          {icon}
        </Box>

        <Typography sx={{ color: theme.palette.app.secondary, fontWeight: 750 }}>
          {text}
        </Typography>
      </Stack>
    </Card>
  );
}

function StatsSkeleton() {
  const theme = useTheme();

  return (
    <Stack spacing={{ xs: 2.2, md: 2.6 }}>
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
                theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#0F172A", 0.08),
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
          height={360}
          sx={{
            borderRadius: "24px",
            backgroundColor:
              theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#0F172A", 0.08),
          }}
        />

        <Skeleton
          variant="rounded"
          height={360}
          sx={{
            borderRadius: "24px",
            backgroundColor:
              theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#0F172A", 0.08),
          }}
        />
      </Box>

      <Skeleton
        variant="rounded"
        height={360}
        sx={{
          borderRadius: "24px",
          backgroundColor:
            theme.palette.mode === "dark" ? alpha("#FFFFFF", 0.08) : alpha("#0F172A", 0.08),
        }}
      />
    </Stack>
  );
}
