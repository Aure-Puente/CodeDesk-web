//Home:
import { useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  Box,
  Button,
  Card,
  IconButton,
  InputBase,
  LinearProgress,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import { db } from "../../firebase/firebase";
import useUserCollection, { byCreatedDesc } from "../../shared/hooks/useUserCollection";
import { formatMoney, withPaymentInfo } from "../../shared/utils";
import {
  EmptyState,
  ProjectAvatar,
  Section,
  Stack,
  getCardStyles,
  getSoftBackground,
  getSoftFadeSx,
  softTint,
} from "../../shared/ui";
import { ChecklistItems, DoneToggle, MetaPill } from "../Tareas/TaskCard";
import {
  PRIORITY,
  getChecklist,
  getChecklistProgress,
  getDueColor,
  getDueInfo,
  getStatusLabel,
  getStatusRank,
  isOverdue,
  sortTasks,
  textToChecklistItems,
} from "../Tareas/taskUtils";
import logoIcon from "../../assets/images/logo-icon.png";

const taskRef = (id) => doc(db, "tasks", id);

const Home = ({ onNavigate }) => {
  const theme = useTheme();
  const [tasks, loadingTasks, , setTasks] = useUserCollection("tasks", { sort: sortTasks });
  const [projects, loadingProjects] = useUserCollection("projects");
  const [payments, loadingPayments] = useUserCollection("payments");
  const [notes, loadingNotes] = useUserCollection("notes", { sort: byCreatedDesc });
  const [links] = useUserCollection("projectLinks");
  const [credentials] = useUserCollection("credentials");
  const [databases] = useUserCollection("databasesInfo");
  const loading = loadingTasks || loadingProjects || loadingPayments || loadingNotes;
  const go = (section) => onNavigate?.(section);
  const openTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== "completada")
        .sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status) || sortTasks(a, b)),
    [tasks],
  );
  const focus = openTasks[0] || null;
  const focusProject = projects.find((project) => project.id === focus?.projectId) || null;

  const summary = useMemo(() => {
    const dueSoon = openTasks.filter((task) => {
      const due = getDueInfo(task);
      return due && due.days >= 0 && due.days <= 7;
    }).length;
    const pending = payments.map(withPaymentInfo).filter((p) => p.pendingAmount > 0);
    const now = new Date();
    const received = payments
      .flatMap((p) =>
        (p.installments || []).map((i) => ({
          ...i,
          date: new Date(i.date),
          currency: p.currency || "ARS",
          projectId: p.projectId,
          projectName: p.projectName,
          projectColor: p.projectColor,
          projectLogoUrl: p.projectLogoUrl,
        })),
      )
      .filter((i) => !Number.isNaN(i.date.getTime()))
      .sort((a, b) => b.date - a.date);
    const collectedMonth = received
      .filter(
        (i) => i.date.getFullYear() === now.getFullYear() && i.date.getMonth() === now.getMonth(),
      )
      .reduce((acc, i) => {
        acc[i.currency] = (acc[i.currency] || 0) + Number(i.amount || 0);
        return acc;
      }, {});

    const toCollect = pending.reduce((acc, p) => {
      acc[p.currency] = (acc[p.currency] || 0) + p.pendingAmount;
      return acc;
    }, {});

    const activeProjects = projects
      .filter((project) => project.status === "activo")
      .map((project) => {
        const own = tasks.filter((task) => task.projectId === project.id);
        const done = own.filter((task) => task.status === "completada").length;
        return { ...project, taskTotal: own.length, taskDone: done };
      })
      .sort((a, b) => b.taskTotal - b.taskDone - (a.taskTotal - a.taskDone))
      .slice(0, 4);

    return {
      overdue: tasks.filter(isOverdue).length,
      dueSoon,
      pending: pending.sort((a, b) => a.progress - b.progress),
      toCollect,
      received,
      collectedMonth,
      activeProjects,
      activeCount: projects.filter((project) => project.status === "activo").length,
    };
  }, [tasks, openTasks, projects, payments]);

  const firstOrder = () => Math.min(0, ...tasks.map((task) => task.order ?? 0)) - 1;
  const updateTask = async (task, changes) => {
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, ...changes } : t)));
    try {
      await updateDoc(taskRef(task.id), { ...changes, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error(error);
    }
  };
  const completeTask = (task) => updateTask(task, { status: "completada", order: firstOrder() });
  const toggleItem = (task, itemId) => {
    const checklist = getChecklist(task).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    const { allDone } = getChecklistProgress(checklist);
    updateTask(task, {
      checklist,
      ...(allDone && { status: "completada", order: firstOrder() }),
    });
  };

  const addItems = (task, text) => {
    const items = textToChecklistItems(text);
    if (items.length) updateTask(task, { checklist: [...getChecklist(task), ...items] });
  };

  if (loading) return <HomeSkeleton />;

  const isEmpty = !tasks.length && !projects.length && !payments.length && !notes.length;
  if (isEmpty)
    return (
      <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto" }}>
        <EmptyState
          icon={<RocketLaunchRoundedIcon />}
          title="¡Bienvenido a CodeDesk!"
          text="Empezá creando tu primer proyecto. Después vas a poder sumarle tareas, cobros, notas, enlaces y accesos."
          actionLabel="Crear proyecto"
          actionIcon={<WorkspacesRoundedIcon />}
          onAction={() => go("proyectos")}
        />
      </Box>
    );

  const upcoming = openTasks.slice(1, 6);
  const collectEntries = Object.entries(summary.toCollect);

  return (
    <Box sx={{ width: "100%", maxWidth: 1280, mx: "auto", pb: { xs: 4, md: 6 } }}>
      <Stack spacing={{ xs: 1.5, md: 1.75 }}>
        {/* Fila 1: tarea en foco + resumen del día */}
        <Section>
          <Grid columns={{ xs: "1fr", lg: "minmax(0, 1.65fr) minmax(0, 1fr)" }}>
            <FocusCard
              task={focus}
              project={focusProject}
              next={openTasks[1]}
              onToggleItem={(itemId) => toggleItem(focus, itemId)}
              onAddItems={(text) => addItems(focus, text)}
              onComplete={() => completeTask(focus)}
              onGo={() => go("tareas")}
            />

            <Panel title="Tu resumen" icon={<AssignmentRoundedIcon />}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <MiniStat
                  label="Tareas abiertas"
                  value={openTasks.length}
                  color={theme.palette.info.main}
                  icon={<AssignmentRoundedIcon />}
                  onClick={() => go("tareas")}
                />
                <MiniStat
                  label="Vencidas"
                  value={summary.overdue}
                  color={summary.overdue ? theme.palette.error.main : theme.palette.success.main}
                  icon={<EventBusyRoundedIcon />}
                  onClick={() => go("tareas")}
                />
                <MiniStat
                  label="Vencen en 7 días"
                  value={summary.dueSoon}
                  color={theme.palette.warning.main}
                  icon={<EventRoundedIcon />}
                  onClick={() => go("tareas")}
                />
                <MiniStat
                  label="Proyectos activos"
                  value={summary.activeCount}
                  color={theme.palette.primary.main}
                  icon={<WorkspacesRoundedIcon />}
                  onClick={() => go("proyectos")}
                />
              </Box>

              <Typography sx={{ ...sectionTitle(theme), mt: 2 }}>Accesos rápidos</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 0.75,
                }}
              >
                {[
                  { id: "notas", label: "Notas", icon: <NotesRoundedIcon />, count: notes.length },
                  {
                    id: "enlaces",
                    label: "Enlaces",
                    icon: <LinkRoundedIcon />,
                    count: links.length,
                  },
                  {
                    id: "credenciales",
                    label: "Accesos",
                    icon: <KeyRoundedIcon />,
                    count: credentials.length,
                  },
                  {
                    id: "database",
                    label: "Bases",
                    icon: <StorageRoundedIcon />,
                    count: databases.length,
                  },
                  {
                    id: "pagos",
                    label: "Pagos",
                    icon: <PaymentsRoundedIcon />,
                    count: payments.length,
                  },
                  {
                    id: "proyectos",
                    label: "Proyectos",
                    icon: <WorkspacesRoundedIcon />,
                    count: projects.length,
                  },
                ].map((item) => (
                  <QuickLink key={item.id} {...item} onClick={() => go(item.id)} />
                ))}
              </Box>
            </Panel>
          </Grid>
        </Section>

        {/* Fila 2: próximas tareas + por cobrar */}
        <Section delay={80}>
          <Grid columns={{ xs: "1fr", lg: "minmax(0, 1.65fr) minmax(0, 1fr)" }}>
            <Panel
              title="Próximas tareas"
              subtitle="Según el orden de tu tablero"
              icon={<TaskAltRoundedIcon />}
              onMore={() => go("tareas")}
            >
              {upcoming.length === 0 ? (
                <EmptyRow
                  icon={<TaskAltRoundedIcon />}
                  text={
                    focus ? "No hay más tareas en cola." : "No tenés tareas abiertas. ¡Todo al día!"
                  }
                />
              ) : (
                <Stack spacing={0.75}>
                  {upcoming.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      delay={index * 40}
                      onComplete={() => completeTask(task)}
                      onOpen={() => go("tareas")}
                    />
                  ))}
                </Stack>
              )}
            </Panel>

            <Panel
              title="Por cobrar"
              subtitle="Saldos pendientes de tus proyectos"
              icon={<PaymentsRoundedIcon />}
              iconColor={theme.palette.warning.main}
              onMore={() => go("pagos")}
            >
              {collectEntries.length === 0 ? (
                <Typography
                  sx={{
                    mb: 1,
                    fontSize: "0.86rem",
                    fontWeight: 650,
                    color: theme.palette.success.main,
                  }}
                >
                  No tenés saldos pendientes. ¡Todo cobrado!
                </Typography>
              ) : (
                <>
                  <Stack direction="row" sx={{ gap: 2.5, flexWrap: "wrap", mb: 1.5 }}>
                    {collectEntries.map(([currency, amount]) => (
                      <Box key={currency}>
                        <Typography
                          sx={{
                            fontSize: "1.45rem",
                            fontWeight: 850,
                            letterSpacing: "-0.5px",
                            lineHeight: 1.1,
                            color: theme.palette.app.text,
                          }}
                        >
                          {formatMoney(amount, currency)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.74rem",
                            fontWeight: 650,
                            color: theme.palette.app.secondary,
                          }}
                        >
                          Pendiente en {currency === "USD" ? "dólares" : "pesos"}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Stack spacing={0.75}>
                    {summary.pending.slice(0, 2).map((p) => (
                      <ProgressRow
                        key={p.id}
                        item={p}
                        title={p.projectName || "Proyecto sin nombre"}
                        subtitle={`Falta ${formatMoney(p.pendingAmount, p.currency)}`}
                        value={Math.round(p.progress * 100)}
                        color={theme.palette.warning.main}
                      />
                    ))}
                  </Stack>
                </>
              )}

              {/* Cobrado este mes + últimos pagos recibidos */}
              <Box
                sx={{ mt: 1.75, pt: 1.5, borderTop: `1px solid ${theme.palette.app.borderSoft}` }}
              >
                <Stack
                  direction="row"
                  alignItems="baseline"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography sx={{ ...sectionTitle(theme), mb: 0 }}>Cobrado este mes</Typography>
                  <Stack direction="row" sx={{ gap: 1.25 }}>
                    {(Object.keys(summary.collectedMonth).length
                      ? Object.entries(summary.collectedMonth)
                      : [["ARS", 0]]
                    ).map(([currency, amount]) => (
                      <Typography
                        key={currency}
                        sx={{
                          fontSize: "0.92rem",
                          fontWeight: 850,
                          color: amount ? theme.palette.success.main : theme.palette.app.secondary,
                        }}
                      >
                        {formatMoney(amount, currency)}
                      </Typography>
                    ))}
                  </Stack>
                </Stack>

                {summary.received.length === 0 ? (
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.app.secondary }}
                  >
                    Todavía no registraste pagos recibidos.
                  </Typography>
                ) : (
                  <Stack spacing={0.6}>
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: theme.palette.app.secondary,
                      }}
                    >
                      Últimos pagos recibidos
                    </Typography>
                    {summary.received.slice(0, 3).map((item) => (
                      <PaymentRow key={`${item.projectId}-${item.id}`} item={item} />
                    ))}
                  </Stack>
                )}
              </Box>
            </Panel>
          </Grid>
        </Section>

        {/* Fila 3: proyectos activos + notas recientes */}
        <Section delay={160}>
          <Grid columns={{ xs: "1fr", md: "1fr 1fr" }}>
            <Panel
              title="Proyectos activos"
              subtitle="Avance según sus tareas"
              icon={<WorkspacesRoundedIcon />}
              onMore={() => go("proyectos")}
            >
              {summary.activeProjects.length === 0 ? (
                <EmptyRow icon={<WorkspacesRoundedIcon />} text="No tenés proyectos activos." />
              ) : (
                <Stack spacing={0.75}>
                  {summary.activeProjects.map((project) => (
                    <ProgressRow
                      key={project.id}
                      item={project}
                      title={project.name || "Proyecto sin nombre"}
                      subtitle={
                        project.taskTotal
                          ? `${project.taskTotal - project.taskDone} abiertas · ${project.taskDone} completadas`
                          : project.client || "Sin tareas todavía"
                      }
                      value={
                        project.taskTotal
                          ? Math.round((project.taskDone / project.taskTotal) * 100)
                          : 0
                      }
                      color={project.color || theme.palette.primary.main}
                    />
                  ))}
                </Stack>
              )}
            </Panel>

            <Panel
              title="Notas recientes"
              subtitle="Lo último que anotaste"
              icon={<NotesRoundedIcon />}
              onMore={() => go("notas")}
            >
              {notes.length === 0 ? (
                <EmptyRow icon={<NotesRoundedIcon />} text="Todavía no tenés notas." />
              ) : (
                <Stack spacing={0.75}>
                  {notes.slice(0, 3).map((note) => (
                    <NoteRow key={note.id} note={note} onOpen={() => go("notas")} />
                  ))}
                </Stack>
              )}
            </Panel>
          </Grid>
        </Section>
      </Stack>
    </Box>
  );
};

/* ---------- Piezas ---------- */

const sectionTitle = (theme) => ({
  mb: 0.9,
  fontSize: "0.7rem",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: theme.palette.app.secondary,
});

function Grid({ columns, children }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: { xs: 1.5, md: 1.75 },
        alignItems: "stretch",
      }}
    >
      {children}
    </Box>
  );
}

function Panel({ title, subtitle, icon, iconColor, onMore, children }) {
  const theme = useTheme();
  const color = iconColor || theme.palette.primary.main;

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme, "18px"),
        p: { xs: 1.6, md: 1.9 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            color,
            bgcolor: softTint(theme, color),
            "& svg": { fontSize: 19 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.text, fontSize: "0.95rem", fontWeight: 800 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              noWrap
              sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {onMore && (
          <Button
            size="small"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={onMore}
            sx={{
              flexShrink: 0,
              height: 30,
              px: 1.2,
              borderRadius: "9px",
              fontSize: "0.78rem",
              fontWeight: 750,
              "& .MuiButton-endIcon": { ml: 0.4, "& svg": { fontSize: 16 } },
            }}
          >
            Ver
          </Button>
        )}
      </Stack>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Card>
  );
}

function FocusCard({ task, project, next, onToggleItem, onAddItems, onComplete, onGo }) {
  const theme = useTheme();
  const color = task?.projectColor || project?.color || theme.palette.primary.main;
  const checklist = getChecklist(task);
  const progress = getChecklistProgress(checklist);
  const pendingItems = checklist.filter((item) => !item.done);
  const due = task ? getDueInfo(task) : null;
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme, "20px"),
        position: "relative",
        overflow: "hidden",
        height: "100%",
        p: { xs: 2, md: 2.5 },
        borderColor: alpha(color, isDark ? 0.35 : 0.25),
        backgroundImage: `radial-gradient(520px 260px at 0% 0%, ${alpha(color, isDark ? 0.22 : 0.12)}, transparent 70%)`,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 2, sm: 2.5 }}
        alignItems={{ xs: "flex-start", sm: "stretch" }}
        sx={{ height: "100%" }}
      >
        <Box sx={{ flexShrink: 0 }}>
          {task?.projectId ? (
            <ProjectAvatar
              item={{ ...project, ...task }}
              size={{ xs: 88, md: 120 }}
              radius="24px"
              fontSize={44}
              sx={{ boxShadow: `0 18px 40px ${alpha(color, isDark ? 0.35 : 0.25)}` }}
            />
          ) : (
            <Box
              sx={{
                width: { xs: 88, md: 120 },
                height: { xs: 88, md: 120 },
                borderRadius: "24px",
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(145deg, #0f1b33, #060b16)",
                boxShadow: "0 18px 40px rgba(37,99,235,0.25)",
              }}
            >
              <Box component="img" src={logoIcon} alt="" sx={{ width: "70%" }} />
            </Box>
          )}
        </Box>

        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "1.25rem", md: "1.45rem" },
              fontWeight: 850,
              letterSpacing: "-0.4px",
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task?.title || "Todo al día"}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.4, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{ color: theme.palette.app.secondary, fontSize: "0.86rem", fontWeight: 650 }}
            >
              {task
                ? [task.projectName || "Tarea personal", project?.client]
                    .filter(Boolean)
                    .join(" · ")
                : "Cuando tengas tareas abiertas, la primera de tu tablero aparece acá."}
            </Typography>
            {due && (
              <MetaPill
                icon={<EventRoundedIcon />}
                label={due.label}
                color={getDueColor(theme, due.tone)}
              />
            )}
          </Stack>

          {(task?.description || project?.description) && (
            <Typography
              sx={{
                mt: 1.1,
                color: theme.palette.app.secondary,
                fontSize: "0.86rem",
                fontWeight: 500,
                lineHeight: 1.55,
                display: "-webkit-box",
                WebkitLineClamp: progress.total ? 1 : 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                opacity: task?.description ? 1 : 0.8,
              }}
            >
              {task?.description || project.description}
            </Typography>
          )}

          {progress.total > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LinearProgress
                  variant="determinate"
                  value={progress.percent}
                  sx={{
                    flex: 1,
                    height: 7,
                    borderRadius: 999,
                    bgcolor: alpha(isDark ? "#FFFFFF" : "#0F172A", 0.08),
                    "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: color },
                  }}
                />
                <Typography
                  sx={{ fontSize: "0.78rem", fontWeight: 800, color: theme.palette.app.text }}
                >
                  {progress.done}/{progress.total}
                </Typography>
              </Stack>
              {pendingItems.length > 0 && (
                <Box sx={{ mt: 0.75, ml: -0.5 }}>
                  <ChecklistItems
                    checklist={pendingItems}
                    onToggle={onToggleItem}
                    limit={3}
                    dense
                  />
                </Box>
              )}
            </Box>
          )}

          {task && !progress.total && <EmptyChecklist onAdd={onAddItems} />}

          <Box sx={{ flex: 1, minHeight: 12 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={1}
            sx={{ pt: 1.5, borderTop: `1px solid ${alpha(color, 0.15)}` }}
          >
            <Stack direction="row" alignItems="center" spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
              {next && <NextUp task={next} />}
            </Stack>
            <Stack direction="row" spacing={1}>
              {task && (
                <Button
                  onClick={onComplete}
                  startIcon={<TaskAltRoundedIcon />}
                  sx={{
                    height: 36,
                    px: 1.5,
                    borderRadius: "10px",
                    fontWeight: 750,
                    fontSize: "0.8rem",
                    color: theme.palette.success.main,
                    bgcolor: softTint(theme, theme.palette.success.main, 0.1, 0.16),
                    "&:hover": { bgcolor: softTint(theme, theme.palette.success.main, 0.16, 0.22) },
                  }}
                >
                  Completar
                </Button>
              )}
              <Button
                variant="contained"
                disableElevation
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={onGo}
                sx={{
                  height: 36,
                  px: 1.6,
                  borderRadius: "10px",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                }}
              >
                Ir a tareas
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

function EmptyChecklist({ onAdd }) {
  const theme = useTheme();
  const color = theme.palette.primary.main;
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  return (
    <Box
      sx={{
        mt: 1.75,
        p: { xs: 1.5, md: 1.75 },
        borderRadius: "16px",
        border: `1px dashed ${alpha(color, 0.3)}`,
        backgroundColor: softTint(theme, color, 0.03, 0.04),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            borderRadius: "11px",
            display: "grid",
            placeItems: "center",
            color,
            backgroundColor: theme.palette.app.primarySoft,
            "& svg": { fontSize: 20 },
          }}
        >
          <ChecklistRoundedIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.88rem", fontWeight: 800, color: theme.palette.app.text }}>
            Esta tarea no tiene checklist
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 550, color: theme.palette.app.secondary }}>
            Dividila en pasos chicos y seguí el avance desde acá.
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          mt: 1.4,
          pl: 1.5,
          pr: 0.5,
          height: 40,
          borderRadius: "12px",
          backgroundColor: getSoftBackground(theme),
          border: `1px solid ${theme.palette.app.borderSoft}`,
          transition: "border-color 0.2s ease",
          "&:focus-within": { borderColor: alpha(color, 0.6) },
        }}
      >
        <InputBase
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (!pasted.includes("\n")) return;
            event.preventDefault();
            onAdd(pasted);
          }}
          placeholder="Agregar primer paso y presionar Enter"
          inputProps={{ "aria-label": "Agregar paso al checklist" }}
          sx={{ flex: 1, fontSize: "0.84rem", color: theme.palette.app.text }}
        />
        <IconButton
          size="small"
          aria-label="Agregar paso"
          onClick={submit}
          disabled={!text.trim()}
          sx={{
            width: 30,
            height: 30,
            borderRadius: "9px",
            color,
            backgroundColor: theme.palette.app.primarySoft,
            "&:hover": { backgroundColor: softTint(theme, color, 0.16, 0.24) },
          }}
        >
          <AddRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

function NextUp({ task }) {
  const theme = useTheme();
  const color = task.projectColor || theme.palette.primary.main;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      sx={{
        minWidth: 0,
        maxWidth: { xs: "100%", sm: 340 },
        py: 0.6,
        pl: 0.6,
        pr: 1.5,
        borderRadius: "13px",
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <ProjectAvatar
        item={task.projectId ? task : null}
        size={30}
        fontSize={13}
        radius="9px"
        sx={{ border: "none", boxShadow: `0 4px 12px ${alpha(color, 0.25)}` }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            fontSize: "0.64rem",
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: theme.palette.app.secondary,
            lineHeight: 1.3,
          }}
        >
          Siguiente · {task.projectName || "Personal"}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: "0.84rem", fontWeight: 750, color: theme.palette.app.text, lineHeight: 1.3 }}
        >
          {task.title}
        </Typography>
      </Box>
    </Stack>
  );
}

function MiniStat({ label, value, color, icon, onClick }) {
  const theme = useTheme();

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        p: 1.2,
        borderRadius: "12px",
        cursor: "pointer",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        transition: "border-color 0.16s ease",
        "&:hover": { borderColor: alpha(color, 0.4) },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography
          sx={{
            fontSize: "1.35rem",
            fontWeight: 850,
            lineHeight: 1,
            color: theme.palette.app.text,
          }}
        >
          {value}
        </Typography>
        <Box sx={{ color, display: "flex", "& svg": { fontSize: 18 } }}>{icon}</Box>
      </Stack>
      <Typography
        noWrap
        sx={{ mt: 0.6, fontSize: "0.74rem", fontWeight: 650, color: theme.palette.app.secondary }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function QuickLink({ label, icon, count, onClick }) {
  const theme = useTheme();

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1,
        py: 0.85,
        borderRadius: "10px",
        cursor: "pointer",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        transition: "all 0.16s ease",
        "&:hover": {
          bgcolor: theme.palette.app.primarySoft,
          borderColor: alpha(theme.palette.primary.main, 0.3),
          color: theme.palette.primary.main,
        },
      }}
    >
      <Box sx={{ display: "flex", color: theme.palette.primary.main, "& svg": { fontSize: 16 } }}>
        {icon}
      </Box>
      <Typography noWrap sx={{ flex: 1, fontSize: "0.76rem", fontWeight: 700, color: "inherit" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: theme.palette.app.secondary }}>
        {count}
      </Typography>
    </Box>
  );
}

function TaskRow({ task, delay, onComplete, onOpen }) {
  const theme = useTheme();
  const due = getDueInfo(task);
  const priority = PRIORITY[task.priority];
  const { total, done } = getChecklistProgress(getChecklist(task));

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      onClick={onOpen}
      sx={{
        ...getSoftFadeSx(delay),
        p: 1,
        pl: 1.2,
        borderRadius: "12px",
        cursor: "pointer",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        borderLeft: `3px solid ${priority ? priority.color(theme) : theme.palette.app.borderSoft}`,
        transition: "border-color 0.16s ease",
        "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.35) },
      }}
    >
      <DoneToggle done={false} onToggle={onComplete} />
      <ProjectAvatar
        item={task.projectId ? task : null}
        size={26}
        fontSize={12}
        sx={{ border: "none" }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontSize: "0.86rem", fontWeight: 750, color: theme.palette.app.text }}
        >
          {task.title || "Tarea sin título"}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.app.secondary }}
        >
          {[
            task.projectName || "Personal",
            getStatusLabel(task.status),
            total && `${done}/${total} ítems`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Typography>
      </Box>
      {due && (
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <MetaPill
            icon={<EventRoundedIcon />}
            label={due.label}
            color={getDueColor(theme, due.tone)}
          />
        </Box>
      )}
    </Stack>
  );
}

function PaymentRow({ item }) {
  const theme = useTheme();
  const date = item.date
    .toLocaleDateString("es-AR", { day: "numeric", month: "short" })
    .replace(" de ", " ")
    .replace(".", "");

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 1, py: 0.75, borderRadius: "10px", bgcolor: getSoftBackground(theme) }}
    >
      <ProjectAvatar item={item} size={26} fontSize={12} sx={{ border: "none" }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontSize: "0.8rem", fontWeight: 750, color: theme.palette.app.text }}
        >
          {item.projectName || "Proyecto sin nombre"}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: "0.7rem", fontWeight: 600, color: theme.palette.app.secondary }}
        >
          {[date, item.method].filter(Boolean).join(" · ")}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 850, color: theme.palette.success.main }}>
        +{formatMoney(item.amount, item.currency)}
      </Typography>
    </Stack>
  );
}

function ProgressRow({ item, title, subtitle, value, color }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 1,
        borderRadius: "12px",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <ProjectAvatar item={item} size={30} fontSize={13} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: "0.84rem", fontWeight: 750, color: theme.palette.app.text }}
          >
            {title}
          </Typography>
          <Typography
            noWrap
            sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.app.secondary }}
          >
            {subtitle}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 800, color: theme.palette.app.text }}>
          {value}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          mt: 0.9,
          height: 4,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.07),
          "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: color },
        }}
      />
    </Box>
  );
}

function NoteRow({ note, onOpen }) {
  const theme = useTheme();
  const color = note.projectColor || "#94A3B8";

  return (
    <Box
      onClick={onOpen}
      sx={{
        p: 1.1,
        pl: 1.3,
        borderRadius: "12px",
        cursor: "pointer",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        borderLeft: `3px solid ${color}`,
        transition: "border-color 0.16s ease",
        "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.35) },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          noWrap
          sx={{ flex: 1, fontSize: "0.86rem", fontWeight: 750, color: theme.palette.app.text }}
        >
          {note.title || "Sin título"}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: "0.7rem", fontWeight: 650, color: theme.palette.app.secondary }}
        >
          {note.projectName || "Personal"}
        </Typography>
      </Stack>
      {note.content && (
        <Typography
          sx={{
            mt: 0.3,
            fontSize: "0.76rem",
            fontWeight: 500,
            lineHeight: 1.45,
            color: theme.palette.app.secondary,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
          }}
        >
          {note.content}
        </Typography>
      )}
    </Box>
  );
}

function EmptyRow({ text, icon }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 110,
        p: 2,
        borderRadius: "14px",
        border: `1.5px dashed ${theme.palette.app.borderSoft}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: theme.palette.app.secondary,
        "& svg": { fontSize: 26, mb: 0.6, opacity: 0.6 },
      }}
    >
      {icon}
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{text}</Typography>
    </Box>
  );
}

function HomeSkeleton() {
  const theme = useTheme();
  const block = (height, delay) => (
    <Skeleton
      variant="rounded"
      height={height}
      sx={{
        ...getSoftFadeSx(delay),
        borderRadius: "18px",
        backgroundColor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.08),
      }}
    />
  );
  const row = (heights, delay) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "1.65fr 1fr" },
        gap: { xs: 1.5, md: 1.75 },
      }}
    >
      {heights.map((h, i) => (
        <Box key={i}>{block(h, delay + i * 45)}</Box>
      ))}
    </Box>
  );

  return (
    <Stack spacing={{ xs: 1.5, md: 1.75 }} sx={{ maxWidth: 1280, mx: "auto" }}>
      {row([260, 260], 0)}
      {row([300, 300], 120)}
      {row([240, 240], 240)}
    </Stack>
  );
}

export default Home;
