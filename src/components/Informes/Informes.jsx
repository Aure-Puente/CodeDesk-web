//Informes:
import { useMemo, useState } from "react";
import { Box, Card, LinearProgress, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DonutLargeRoundedIcon from "@mui/icons-material/DonutLargeRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import useUserCollection from "../../shared/hooks/useUserCollection";
import { formatMoney, withPaymentInfo } from "../../shared/utils";
import {
  EmptyState,
  PageAlert,
  PageHeader,
  PageShell,
  ProjectAvatar,
  Section,
  Stack,
  StatsGrid,
  getCardStyles,
  getSoftBackground,
  softTint,
} from "../../shared/ui";
import {
  PRIORITIES,
  PRIORITY,
  getChecklist,
  getDueColor,
  getDueInfo,
  getStatusColor,
  isOverdue,
} from "../Tareas/taskUtils";

const RANGES = [
  { value: "all", label: "Todo", text: "Últimos 6 meses" },
  { value: "year", label: "Este año", text: "Este año" },
  { value: "month", label: "Este mes", text: "Este mes" },
];

const TASK_STATUSES = [
  { key: "en progreso", label: "En progreso" },
  { key: "pendiente", label: "Pendientes" },
  { key: "pausada", label: "Pausadas" },
  { key: "completada", label: "Completadas" },
];

const PROJECT_STATUSES = [
  { key: "activo", label: "Activos", color: (t) => t.palette.info.main },
  { key: "pausado", label: "Pausados", color: (t) => t.palette.warning.main },
  { key: "finalizado", label: "Finalizados", color: (t) => t.palette.success.main },
];

const percent = (part, total) => (total > 0 ? Math.round(Math.min(part / total, 1) * 100) : 0);
const toDate = (ts) => (ts?.seconds ? new Date(ts.seconds * 1000) : null);
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const monthLabel = (date) =>
  capitalize(date.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""));

const inRange = (date, range) => {
  if (range === "all" || !date) return true;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    (range === "year" || date.getMonth() === now.getMonth())
  );
};

const getBuckets = (range) => {
  const now = new Date();
  if (range === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil(days / 7) }, (_, i) => ({
      label: `Sem ${i + 1}`,
      match: (d) =>
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        Math.floor((d.getDate() - 1) / 7) === i,
    }));
  }
  const count = range === "year" ? now.getMonth() + 1 : 6;
  return Array.from({ length: count }, (_, i) => {
    const ref =
      range === "year"
        ? new Date(now.getFullYear(), i, 1)
        : new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return {
      label: monthLabel(ref),
      match: (d) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth(),
    };
  });
};

export default function Informes() {
  const theme = useTheme();
  const [allTasks, loadingTasks, errorTasks] = useUserCollection("tasks");
  const [allProjects, loadingProjects] = useUserCollection("projects");
  const [allPayments, loadingPayments] = useUserCollection("payments");
  const loading = loadingTasks || loadingProjects || loadingPayments;

  const [range, setRange] = useState("all");
  const [currencyPick, setCurrencyPick] = useState(null);

  const data = useMemo(() => {
    const tasks = allTasks.filter((t) => inRange(toDate(t.createdAt), range));
    const projects = allProjects.filter((p) => inRange(toDate(p.createdAt), range));
    const payments = allPayments.map(withPaymentInfo);

    const installments = payments.flatMap((p) =>
      (p.installments || []).map((i) => ({ ...i, currency: p.currency, date: new Date(i.date) })),
    );
    const collected = { ARS: 0, USD: 0 };
    installments
      .filter((i) => !Number.isNaN(i.date.getTime()) && inRange(i.date, range))
      .forEach((i) => (collected[i.currency] += Number(i.amount || 0)));

    const buckets = getBuckets(range);
    const series = (currency) =>
      buckets.map((b) =>
        installments
          .filter(
            (i) => i.currency === currency && !Number.isNaN(i.date.getTime()) && b.match(i.date),
          )
          .reduce((acc, i) => acc + Number(i.amount || 0), 0),
      );

    const byProject = new Map();
    tasks.forEach((t) => {
      const key = t.projectId || "personal";
      if (!byProject.has(key))
        byProject.set(key, { name: t.projectName || "Personal", active: 0, done: 0 });
      byProject.get(key)[t.status === "completada" ? "done" : "active"] += 1;
    });

    const open = tasks.filter((t) => t.status !== "completada");
    const checklist = tasks.flatMap(getChecklist);

    return {
      tasks,
      open,
      overdue: tasks.filter(isOverdue).length,
      completed: tasks.length - open.length,
      statusCounts: Object.fromEntries(
        TASK_STATUSES.map(({ key }) => [key, tasks.filter((t) => t.status === key).length]),
      ),
      priorityCounts: Object.fromEntries(
        [...PRIORITIES, "none"].map((key) => [
          key,
          open.filter((t) => (t.priority || "none") === key).length,
        ]),
      ),
      checklistTotal: checklist.length,
      checklistDone: checklist.filter((i) => i.done).length,
      projects,
      projectCounts: Object.fromEntries(
        PROJECT_STATUSES.map(({ key }) => [key, projects.filter((p) => p.status === key).length]),
      ),
      byProject: [...byProject.values()]
        .sort((a, b) => b.active + b.done - (a.active + a.done))
        .slice(0, 6),
      collected,
      buckets: buckets.map((b) => b.label),
      money: { ARS: series("ARS"), USD: series("USD") },
      currencies: ["ARS", "USD"].filter(
        (c) => payments.some((p) => p.currency === c) || collected[c] > 0,
      ),
      upcoming: allTasks
        .filter((t) => t.status !== "completada" && t.dueDate)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5),
      pending: payments
        .filter((p) => p.pendingAmount > 0)
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 5),
    };
  }, [allTasks, allProjects, allPayments, range]);

  const currency = data.currencies.includes(currencyPick) ? currencyPick : data.currencies[0];
  const rangeText = RANGES.find((r) => r.value === range).text;
  const isEmpty = !allTasks.length && !allProjects.length && !allPayments.length;
  const taskPercent = percent(data.completed, data.tasks.length);
  const checklistPercent = percent(data.checklistDone, data.checklistTotal);

  return (
    <PageShell loading={loading}>
      <Section>
        <PageHeader
          icon={<InsightsRoundedIcon />}
          title="Informes"
          description="Cómo vienen tus cobros, tareas y proyectos, en un vistazo."
          actions={<RangeToggle value={range} onChange={setRange} />}
        />
      </Section>

      <PageAlert message={errorTasks} />

      {isEmpty ? (
        <Section delay={70}>
          <EmptyState
            icon={<InsightsRoundedIcon />}
            title="Todavía no hay datos para analizar"
            text="Cuando cargues proyectos, tareas o cobros, acá vas a ver gráficos con tu avance."
          />
        </Section>
      ) : (
        <>
          <Section delay={70}>
            <StatsGrid
              items={[
                {
                  label: "Tareas abiertas",
                  value: data.open.length,
                  helper: data.overdue ? `${data.overdue} vencidas` : "Ninguna vencida",
                  icon: <AssignmentRoundedIcon />,
                  color: theme.palette.info.main,
                },
                {
                  label: "Completadas",
                  value: data.completed,
                  helper: `${taskPercent}% del total`,
                  icon: <CheckCircleRoundedIcon />,
                  color: theme.palette.success.main,
                },
                {
                  label: `Cobrado · ${rangeText.toLowerCase()}`,
                  value: formatMoney(data.collected[currency || "ARS"], currency || "ARS"),
                  helper:
                    data.currencies.length > 1
                      ? `+ ${formatMoney(data.collected[currency === "USD" ? "ARS" : "USD"], currency === "USD" ? "ARS" : "USD")}`
                      : undefined,
                  icon: <PriceCheckRoundedIcon />,
                  color: theme.palette.warning.main,
                  small: true,
                },
                {
                  label: "Proyectos activos",
                  value: data.projectCounts.activo,
                  helper: `${data.projectCounts.finalizado} finalizados`,
                  icon: <RocketLaunchRoundedIcon />,
                  color: theme.palette.primary.main,
                },
              ]}
            />
          </Section>

          {/* Fila 1: cobros por período + tareas por estado */}
          <Section delay={130}>
            <Grid columns={{ xs: "1fr", lg: "minmax(0, 1.65fr) minmax(0, 1fr)" }}>
              <ChartCard
                title="Cobros recibidos"
                subtitle={`${rangeText} · según la fecha de cada pago`}
                icon={<BarChartRoundedIcon />}
                color={theme.palette.success.main}
                aside={
                  data.currencies.length > 1 && (
                    <Segmented
                      value={currency}
                      onChange={setCurrencyPick}
                      options={data.currencies.map((c) => ({ value: c, label: c }))}
                    />
                  )
                }
              >
                {!currency || data.money[currency].every((v) => v === 0) ? (
                  <EmptyBox
                    icon={<AccountBalanceWalletRoundedIcon />}
                    text="No hay pagos recibidos en este período."
                  />
                ) : (
                  <Box sx={{ height: { xs: 240, lg: "100%" }, minHeight: 240, mx: -1 }}>
                    <BarChart
                      key={`cobros-${range}-${currency}`}
                      xAxis={[
                        {
                          scaleType: "band",
                          data: data.buckets,
                          categoryGapRatio: 0.45,
                          tickLabelStyle: { fontSize: 11 },
                        },
                      ]}
                      yAxis={[
                        {
                          width: 64,
                          valueFormatter: (v) => compactMoney(v, currency),
                          tickLabelStyle: { fontSize: 11 },
                        },
                      ]}
                      series={[
                        {
                          data: data.money[currency],
                          label: `Cobrado ${currency}`,
                          color: theme.palette.success.main,
                          valueFormatter: (v) => formatMoney(v, currency),
                        },
                      ]}
                      borderRadius={6}
                      grid={{ horizontal: true }}
                      hideLegend
                      margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    />
                  </Box>
                )}
              </ChartCard>

              <ChartCard
                title="Tareas por estado"
                subtitle={rangeText}
                icon={<DonutLargeRoundedIcon />}
                color={theme.palette.info.main}
              >
                {data.tasks.length === 0 ? (
                  <EmptyBox
                    icon={<AssignmentRoundedIcon />}
                    text="No hay tareas en este período."
                  />
                ) : (
                  <Donut
                    total={data.tasks.length}
                    caption="tareas"
                    items={TASK_STATUSES.map(({ key, label }) => ({
                      id: key,
                      label,
                      value: data.statusCounts[key],
                      color: getStatusColor(theme, key),
                    }))}
                  />
                )}
              </ChartCard>
            </Grid>
          </Section>

          {/* Fila 2: tareas por proyecto + avance y prioridades */}
          <Section delay={190}>
            <Grid columns={{ xs: "1fr", lg: "minmax(0, 1.65fr) minmax(0, 1fr)" }}>
              <ChartCard
                title="Tareas por proyecto"
                subtitle="Abiertas y completadas · los 6 con más tareas"
                icon={<ViewListRoundedIcon />}
                color={theme.palette.primary.main}
              >
                {data.byProject.length === 0 ? (
                  <EmptyBox icon={<ViewListRoundedIcon />} text="No hay tareas en este período." />
                ) : (
                  <Box
                    sx={{
                      height: { xs: 64 + data.byProject.length * 34, lg: "100%" },
                      minHeight: 64 + data.byProject.length * 34,
                      mx: -1,
                    }}
                  >
                    <BarChart
                      key={`proyectos-${range}`}
                      layout="horizontal"
                      dataset={data.byProject}
                      yAxis={[
                        {
                          scaleType: "band",
                          dataKey: "name",
                          width: 96,
                          categoryGapRatio: 0.45,
                          tickLabelStyle: { fontSize: 11 },
                          valueFormatter: (name) =>
                            name.length > 13 ? `${name.slice(0, 12)}…` : name,
                        },
                      ]}
                      xAxis={[{ tickMinStep: 1, tickLabelStyle: { fontSize: 11 } }]}
                      series={[
                        {
                          dataKey: "active",
                          label: "Abiertas",
                          stack: "total",
                          color: theme.palette.info.main,
                        },
                        {
                          dataKey: "done",
                          label: "Completadas",
                          stack: "total",
                          color: theme.palette.success.main,
                        },
                      ]}
                      borderRadius={5}
                      grid={{ vertical: true }}
                      slotProps={{
                        legend: {
                          position: { vertical: "top", horizontal: "end" },
                          sx: { fontSize: 12, "& .MuiChartsLegend-mark": { borderRadius: "3px" } },
                        },
                      }}
                      margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                    />
                  </Box>
                )}
              </ChartCard>

              <ChartCard
                title="Avance"
                subtitle="Tareas completadas e ítems de checklist"
                icon={<SpeedRoundedIcon />}
                color={theme.palette.success.main}
              >
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                  <GaugeBox
                    value={taskPercent}
                    label="Tareas"
                    detail={`${data.completed} de ${data.tasks.length}`}
                    color={theme.palette.success.main}
                  />
                  <GaugeBox
                    value={checklistPercent}
                    label="Checklist"
                    detail={`${data.checklistDone} de ${data.checklistTotal}`}
                    color={theme.palette.primary.main}
                  />
                </Box>

                <Typography sx={{ ...sectionTitle(theme), mt: 2 }}>
                  Prioridad de las abiertas
                </Typography>
                <Stack spacing={0.9}>
                  {[...PRIORITIES, "none"].map((key) => (
                    <BarRow
                      key={key}
                      icon={<FlagRoundedIcon />}
                      label={key === "none" ? "Sin prioridad" : PRIORITY[key].label}
                      value={data.priorityCounts[key]}
                      total={data.open.length}
                      color={
                        key === "none" ? theme.palette.app.secondary : PRIORITY[key].color(theme)
                      }
                    />
                  ))}
                </Stack>
              </ChartCard>
            </Grid>
          </Section>

          {/* Fila 3: listas accionables + proyectos */}
          <Section delay={250}>
            <Grid columns={{ xs: "1fr", md: "1fr 1fr", lg: "repeat(3, minmax(0, 1fr))" }}>
              <ChartCard
                title="Próximos vencimientos"
                subtitle="Tareas abiertas con fecha límite"
                icon={<EventRoundedIcon />}
                color={theme.palette.error.main}
              >
                {data.upcoming.length === 0 ? (
                  <EmptyBox icon={<EventRoundedIcon />} text="No hay tareas con fecha límite." />
                ) : (
                  <Stack spacing={0.75}>
                    {data.upcoming.map((task) => {
                      const due = getDueInfo(task);
                      return (
                        <ListRow
                          key={task.id}
                          item={task.projectId ? task : null}
                          title={task.title || "Tarea sin título"}
                          subtitle={task.projectName || "Personal"}
                          right={
                            <Typography
                              noWrap
                              sx={{
                                fontSize: "0.74rem",
                                fontWeight: 800,
                                color: getDueColor(theme, due?.tone),
                              }}
                            >
                              {due?.label}
                            </Typography>
                          }
                        />
                      );
                    })}
                  </Stack>
                )}
              </ChartCard>

              <ChartCard
                title="Saldos pendientes"
                subtitle="Registros con menos avance de cobro"
                icon={<RequestQuoteRoundedIcon />}
                color={theme.palette.warning.main}
              >
                {data.pending.length === 0 ? (
                  <EmptyBox icon={<PriceCheckRoundedIcon />} text="No hay saldos pendientes." />
                ) : (
                  <Stack spacing={0.75}>
                    {data.pending.map((p) => (
                      <ListRow
                        key={p.id}
                        item={p}
                        title={p.projectName || "Proyecto sin nombre"}
                        subtitle={`Falta ${formatMoney(p.pendingAmount, p.currency)}`}
                        progress={Math.round(p.progress * 100)}
                        right={
                          <Typography
                            sx={{
                              fontSize: "0.76rem",
                              fontWeight: 800,
                              color: theme.palette.app.text,
                            }}
                          >
                            {Math.round(p.progress * 100)}%
                          </Typography>
                        }
                      />
                    ))}
                  </Stack>
                )}
              </ChartCard>

              <ChartCard
                title="Proyectos por estado"
                subtitle={rangeText}
                icon={<DonutLargeRoundedIcon />}
                color={theme.palette.primary.main}
              >
                {data.projects.length === 0 ? (
                  <EmptyBox
                    icon={<RocketLaunchRoundedIcon />}
                    text="No hay proyectos en este período."
                  />
                ) : (
                  <Donut
                    total={data.projects.length}
                    caption="proyectos"
                    size={170}
                    items={PROJECT_STATUSES.map(({ key, label, color }) => ({
                      id: key,
                      label,
                      value: data.projectCounts[key],
                      color: color(theme),
                    }))}
                  />
                )}
              </ChartCard>
            </Grid>
          </Section>
        </>
      )}
    </PageShell>
  );
}

/* ---------- Helpers visuales ---------- */

const compactMoney = (value, currency) => {
  const prefix = currency === "USD" ? "US$" : "$";
  if (value >= 1e6) return `${prefix}${(value / 1e6).toFixed(value % 1e6 ? 1 : 0)}M`;
  if (value >= 1e3) return `${prefix}${Math.round(value / 1e3)}k`;
  return `${prefix}${value}`;
};

const sectionTitle = (theme) => ({
  mb: 1,
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

function Segmented({ value, onChange, options }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      sx={{
        p: 0.4,
        gap: 0.4,
        borderRadius: "11px",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        flexShrink: 0,
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            sx={{
              all: "unset",
              px: 1.2,
              py: 0.55,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.78rem",
              fontWeight: selected ? 800 : 650,
              whiteSpace: "nowrap",
              color: selected ? theme.palette.primary.main : theme.palette.app.secondary,
              bgcolor: selected ? theme.palette.app.surface : "transparent",
              boxShadow: selected ? "0 2px 8px rgba(15,23,42,0.08)" : "none",
              transition: "all 0.16s ease",
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Stack>
  );
}

const RangeToggle = ({ value, onChange }) => (
  <Box sx={{ alignSelf: { xs: "flex-start", lg: "center" } }}>
    <Segmented value={value} onChange={onChange} options={RANGES} />
  </Box>
);

function ChartCard({ title, subtitle, icon, color, aside, children }) {
  const theme = useTheme();

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
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.75 }}>
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
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
          >
            {subtitle}
          </Typography>
        </Box>
        {aside}
      </Stack>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Card>
  );
}

function Donut({ items, total, caption, size = 190 }) {
  const theme = useTheme();
  const visible = items.filter((item) => item.value > 0);

  return (
    <Stack
      direction={{ xs: "column", sm: "row", lg: "column" }}
      alignItems="center"
      spacing={1.5}
      sx={{ "@media (min-width: 1700px)": { flexDirection: size > 180 ? "row" : "column" } }}
    >
      <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <PieChart
          series={[
            {
              data: visible,
              innerRadius: size * 0.33,
              outerRadius: size * 0.48,
              paddingAngle: visible.length > 1 ? 2.5 : 0,
              cornerRadius: 5,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          width={size}
          height={size}
          hideLegend
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 850,
                lineHeight: 1,
                color: theme.palette.app.text,
              }}
            >
              {total}
            </Typography>
            <Typography
              sx={{ fontSize: "0.7rem", fontWeight: 650, color: theme.palette.app.secondary }}
            >
              {caption}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={0.6} sx={{ width: "100%", minWidth: 0 }}>
        {items.map((item) => (
          <Stack
            key={item.id}
            direction="row"
            alignItems="center"
            spacing={0.9}
            sx={{ px: 1, py: 0.6, borderRadius: "9px", bgcolor: getSoftBackground(theme) }}
          >
            <Box
              sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }}
            />
            <Typography
              noWrap
              sx={{
                flex: 1,
                fontSize: "0.8rem",
                fontWeight: 650,
                color: theme.palette.app.secondary,
              }}
            >
              {item.label}
            </Typography>
            <Typography
              sx={{ fontSize: "0.82rem", fontWeight: 800, color: theme.palette.app.text }}
            >
              {item.value}
            </Typography>
            <Typography
              sx={{
                width: 36,
                textAlign: "right",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: theme.palette.app.secondary,
              }}
            >
              {percent(item.value, total)}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function GaugeBox({ value, label, detail, color }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        pt: 1,
        pb: 1.2,
        borderRadius: "14px",
        textAlign: "center",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Gauge
        value={value}
        startAngle={-110}
        endAngle={110}
        innerRadius="76%"
        outerRadius="100%"
        cornerRadius="50%"
        height={110}
        text={({ value: v }) => `${v}%`}
        sx={{
          [`& .${gaugeClasses.valueText}`]: { fontSize: 20, fontWeight: 800 },
          [`& .${gaugeClasses.valueText} text`]: { fill: theme.palette.app.text },
          [`& .${gaugeClasses.valueArc}`]: { fill: color },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.08),
          },
        }}
      />
      <Typography
        sx={{ mt: -0.5, fontSize: "0.82rem", fontWeight: 800, color: theme.palette.app.text }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.app.secondary }}>
        {detail}
      </Typography>
    </Box>
  );
}

function BarRow({ icon, label, value, total, color }) {
  const theme = useTheme();
  const pct = percent(value, total);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.4 }}>
        <Box sx={{ color, display: "flex", "& svg": { fontSize: 14 } }}>{icon}</Box>
        <Typography
          sx={{ flex: 1, fontSize: "0.78rem", fontWeight: 650, color: theme.palette.app.secondary }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: theme.palette.app.text }}>
          {value}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.07),
          "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: color },
        }}
      />
    </Box>
  );
}

function ListRow({ item, title, subtitle, right, progress }) {
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
        <Box sx={{ flexShrink: 0 }}>{right}</Box>
      </Stack>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 0.9,
            height: 4,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.07),
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              bgcolor: progress > 0 ? theme.palette.warning.main : theme.palette.error.main,
            },
          }}
        />
      )}
    </Box>
  );
}

function EmptyBox({ text, icon }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 140,
        p: 2,
        borderRadius: "14px",
        border: `1.5px dashed ${theme.palette.app.borderSoft}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        color: theme.palette.app.secondary,
        "& svg": { fontSize: 28, mb: 0.75, opacity: 0.6 },
      }}
    >
      {icon}
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{text}</Typography>
    </Box>
  );
}
