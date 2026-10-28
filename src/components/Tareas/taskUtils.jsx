//TaskUtils:
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";

export const DEFAULT_STATUS = "en progreso";
export const BOARD_COLUMNS = ["en progreso", "pendiente", "pausada", "completada"];
export const DONE_PREVIEW = 6;

export const STATUS = {
  "en progreso": {
    label: "En progreso",
    icon: <AccessTimeRoundedIcon />,
    color: (t) => t.palette.info.main,
  },
  pendiente: {
    label: "Pendiente",
    icon: <PendingActionsRoundedIcon />,
    color: (t) => t.palette.warning.main,
  },
  pausada: {
    label: "Pausada",
    icon: <PauseCircleRoundedIcon />,
    color: (t) => t.palette.app.secondary,
  },
  completada: {
    label: "Completada",
    icon: <CheckCircleRoundedIcon />,
    color: (t) => t.palette.success.main,
  },
};
export const STATUSES = Object.keys(STATUS);
export const getStatusRank = (status) => Math.max(STATUSES.indexOf(status), 0);
export const getStatus = (status) => STATUS[status] || STATUS.pendiente;
export const getStatusLabel = (status) => getStatus(status).label;
export const getStatusIcon = (status) => getStatus(status).icon;
export const getStatusColor = (theme, status) => getStatus(status).color(theme);

export const PRIORITY = {
  alta: { label: "Alta", color: (t) => t.palette.error.main, rank: 0 },
  media: { label: "Media", color: (t) => t.palette.warning.main, rank: 1 },
  baja: {
    label: "Baja",
    color: (t) => (t.palette.mode === "dark" ? "#8AA6C8" : "#5B7FA6"),
    rank: 2,
  },
};
export const PRIORITIES = Object.keys(PRIORITY);
export const getPriorityColor = (theme, priority) =>
  PRIORITY[priority]?.color(theme) || "transparent";

export const matchesTaskSearch = (task, query) =>
  !query ||
  [task.title, task.description, task.projectName, ...getChecklist(task).map((i) => i.text)]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));

export const getTaskDateValue = (task) => task?.createdAt?.seconds || task?.updatedAt?.seconds || 0;

export const sortTasks = (a, b) => {
  const orderA = a.order ?? 999999;
  const orderB = b.order ?? 999999;
  return orderA !== orderB ? orderA - orderB : getTaskDateValue(b) - getTaskDateValue(a);
};

const todayKey = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const getDueInfo = (task) => {
  if (!task?.dueDate) return null;

  const days = Math.round(
    (new Date(`${task.dueDate}T00:00:00`) - new Date(`${todayKey()}T00:00:00`)) / 86400000,
  );
  const done = task.status === "completada";
  const due = new Date(`${task.dueDate}T00:00:00`);
  const date = `${due.getDate()} ${due.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}`;

  if (done) return { tone: "done", days, label: date };
  if (days < 0) return { tone: "overdue", days, label: `Venció ${date}` };
  if (days === 0) return { tone: "today", days, label: "Vence hoy" };
  if (days === 1) return { tone: "soon", days, label: "Vence mañana" };
  return { tone: days <= 3 ? "soon" : "normal", days, label: `Vence ${date}` };
};

export const isOverdue = (task) => getDueInfo(task)?.tone === "overdue";

export const getDueColor = (theme, tone) =>
  ({
    overdue: theme.palette.error.main,
    today: theme.palette.warning.main,
    soon: theme.palette.warning.main,
  })[tone] || theme.palette.app.secondary;

const createChecklistId = () =>
  globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const createChecklistItem = (text) => ({
  id: createChecklistId(),
  text: text.trim(),
  done: false,
});

export const textToChecklistItems = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*([-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)
    .map(createChecklistItem);

export const getChecklist = (task) => (Array.isArray(task?.checklist) ? task.checklist : []);

export const getChecklistProgress = (checklist) => {
  const total = checklist.length;
  const done = checklist.filter((item) => item.done).length;
  return {
    total,
    done,
    percent: total ? Math.round((done / total) * 100) : 0,
    allDone: total > 0 && done === total,
  };
};
