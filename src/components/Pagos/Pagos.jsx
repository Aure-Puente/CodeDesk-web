//Pagos:
import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { esES } from "@mui/x-date-pickers/locales";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byCreatedDesc, byName } from "../../shared/hooks/useUserCollection";
import { formatMoney, projectFields, withPaymentInfo } from "../../shared/utils";
import {
  AppDialog,
  DeleteDialog,
  EmptyState,
  FilterBar,
  FormDialog,
  IconAction,
  OptionToggle,
  PageAlert,
  PageHeader,
  PageShell,
  ProjectAvatar,
  ProjectSelect,
  SearchField,
  Section,
  Stack,
  Toast,
  getCardStyles,
  getSoftBackground,
  getSoftFadeSx,
  roundedFieldSx,
  softTint,
  useToast,
} from "../../shared/ui";

const CURRENCIES = {
  ARS: { label: "Pesos", icon: <span style={{ fontWeight: 900, fontSize: "0.95em" }}>$</span> },
  USD: { label: "Dólares", icon: <span style={{ fontWeight: 900, fontSize: "0.72em" }}>US$</span> },
};
const STATUS = {
  no_pagado: {
    label: "No pagado",
    icon: <CancelRoundedIcon />,
    color: (t) => t.palette.error.main,
    order: 1,
  },
  parcial: {
    label: "Parcial",
    icon: <AccessTimeRoundedIcon />,
    color: (t) => t.palette.warning.main,
    order: 2,
  },
  pagado: {
    label: "Pagado",
    icon: <CheckCircleRoundedIcon />,
    color: (t) => t.palette.success.main,
    order: 3,
  },
};
const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Mercado Pago", "Otro"];
const EMPTY_PAYMENT = { projectId: "", totalAmount: "", currency: "ARS", notes: "" };
const emptyInstallment = () => ({ amount: "", method: "", note: "", date: dayjs() });

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
const DAYJS_LOCALE = "es-cap";
dayjs.locale(
  {
    ...es,
    name: DAYJS_LOCALE,
    months: es.months.map(capitalize),
    monthsShort: es.monthsShort.map(capitalize),
  },
  null,
  true,
);
const pickerLocaleText = esES.components.MuiLocalizationProvider.defaultProps.localeText;

const cleanAmount = (value) =>
  value
    .replace(",", ".")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");
const paymentRef = (id) => doc(db, "payments", id);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const formatDay = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" })
        .format(date)
        .replace(/ de /g, " ")
        .replace(".", "");
};

export default function Pagos() {
  const theme = useTheme();
  const { user } = useAuth();
  const [projects] = useUserCollection("projects", { sort: byName });
  const [payments, loading, loadError] = useUserCollection("payments", {
    sort: byCreatedDesc,
    errorMessage: "No se pudieron cargar los pagos.",
  });

  const [form, setForm] = useState(EMPTY_PAYMENT);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [installmentFor, setInstallmentFor] = useState(null);
  const [installment, setInstallment] = useState(emptyInstallment);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [installmentToDelete, setInstallmentToDelete] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const enriched = useMemo(() => payments.map(withPaymentInfo), [payments]);
  const detail = enriched.find((payment) => payment.id === detailId) || null;

  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      enriched
        .filter(
          (payment) =>
            (filter === "todos" || payment.paymentStatus === filter) &&
            (!query ||
              `${payment.projectName || ""} ${payment.notes || ""}`.toLowerCase().includes(query)),
        )
        .sort(
          (a, b) =>
            STATUS[a.paymentStatus].order - STATUS[b.paymentStatus].order ||
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        ),
    [enriched, filter, query],
  );
  const hasFilters = filter !== "todos" || Boolean(query);
  const resetFilters = () => {
    setFilter("todos");
    setSearch("");
  };

  const statusCounts = useMemo(
    () =>
      Object.keys(STATUS).reduce(
        (acc, key) => ({ ...acc, [key]: enriched.filter((p) => p.paymentStatus === key).length }),
        {},
      ),
    [enriched],
  );

  const summary = useMemo(() => {
    const totals = { ARS: { agreed: 0, paid: 0 }, USD: { agreed: 0, paid: 0 } };
    enriched.forEach((p) => {
      totals[p.currency].agreed += Number(p.totalAmount || 0);
      totals[p.currency].paid += p.paidAmount;
    });
    Object.values(totals).forEach((t) => {
      t.pending = Math.max(t.agreed - t.paid, 0);
      t.percent = t.agreed > 0 ? Math.round(Math.min(t.paid / t.agreed, 1) * 100) : 0;
    });
    return totals;
  }, [enriched]);

  const activeCurrencies = Object.keys(summary).filter((key) => summary[key].agreed > 0);

  const openForm = (payment = null) => {
    setEditing(payment);
    setForm(
      payment
        ? {
            projectId: payment.projectId || "",
            totalAmount: String(payment.totalAmount || ""),
            currency: payment.currency || "ARS",
            notes: payment.notes || "",
          }
        : EMPTY_PAYMENT,
    );
    setFormError("");
    setFormOpen(true);
  };

  const openInstallment = (payment) => {
    setInstallmentFor(payment);
    setInstallment(emptyInstallment());
    setFormError("");
  };

  const run = async (action, errorMessage, setError = setFormError) => {
    try {
      setSaving(true);
      setError("");
      await action();
      return true;
    } catch (error) {
      console.error(error);
      setError(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayment = async (event) => {
    event?.preventDefault();
    if (!form.projectId) return setFormError("Seleccioná un proyecto.");
    if (!(Number(form.totalAmount) > 0)) return setFormError("Ingresá el monto total acordado.");

    const data = {
      ...projectFields(projects.find((project) => project.id === form.projectId)),
      totalAmount: Number(form.totalAmount),
      currency: form.currency,
      notes: form.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    const ok = await run(async () => {
      if (editing) return updateDoc(paymentRef(editing.id), data);
      await addDoc(collection(db, "payments"), {
        ...data,
        userId: user.uid,
        installments: [],
        createdAt: serverTimestamp(),
      });
    }, "No se pudo guardar el registro.");
    if (ok) {
      setFormOpen(false);
      showToast(editing ? "Registro actualizado." : "Registro creado.");
    }
  };

  const handleAddInstallment = async (event) => {
    event?.preventDefault();
    if (!(Number(installment.amount) > 0)) return setFormError("Ingresá el monto pagado.");

    const date = installment.date?.isValid?.()
      ? installment.date.hour(12).minute(0).second(0).toDate()
      : new Date();
    const newInstallment = {
      id: Date.now().toString(),
      amount: Number(installment.amount),
      method: installment.method.trim(),
      note: installment.note.trim(),
      date: date.toISOString(),
    };

    const ok = await run(
      () =>
        updateDoc(paymentRef(installmentFor.id), {
          installments: [...(installmentFor.installments || []), newInstallment],
          updatedAt: serverTimestamp(),
        }),
      "No se pudo agregar el pago.",
    );
    if (ok) {
      setInstallmentFor(null);
      showToast(`Pago de ${formatMoney(newInstallment.amount, installmentFor.currency)} agregado.`);
    }
  };

  const confirmDeletePayment = async () => {
    const ok = await run(
      () => deleteDoc(paymentRef(paymentToDelete.id)),
      "No se pudo eliminar el registro.",
      setPageError,
    );
    if (ok) {
      if (detailId === paymentToDelete.id) setDetailId(null);
      setPaymentToDelete(null);
    }
  };

  const confirmDeleteInstallment = async () => {
    const { payment, item } = installmentToDelete;
    const ok = await run(
      () =>
        updateDoc(paymentRef(payment.id), {
          installments: (payment.installments || []).filter((row) => row.id !== item.id),
          updatedAt: serverTimestamp(),
        }),
      "No se pudo eliminar el pago.",
      setPageError,
    );
    if (ok) setInstallmentToDelete(null);
  };

  const pendingForInstallment = installmentFor ? withPaymentInfo(installmentFor) : null;
  const amountPreview =
    Number(form.totalAmount) > 0 && formatMoney(form.totalAmount, form.currency);

  return (
    <PageShell
      loading={loading}
      after={
        <>
          <PaymentDetailDialog
            payment={detail}
            onClose={() => setDetailId(null)}
            onAddInstallment={() => openInstallment(detail)}
            onEdit={() => {
              const payment = detail;
              setDetailId(null);
              openForm(payment);
            }}
            onDelete={() => setPaymentToDelete(detail)}
            onDeleteInstallment={(item) => setInstallmentToDelete({ payment: detail, item })}
          />

          <FormDialog
            open={formOpen}
            onClose={() => !saving && setFormOpen(false)}
            onSubmit={handleSavePayment}
            saving={saving}
            error={formError}
            icon={editing ? <EditRoundedIcon /> : <ReceiptLongRoundedIcon />}
            title={editing ? "Editar registro" : "Nuevo registro"}
            subtitle="Proyecto, moneda y monto total acordado."
            submitIcon={editing ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editing ? "Guardar cambios" : "Guardar registro"}
            submitDisabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: "14px", fontWeight: 650 }}>
                Primero necesitás crear un proyecto para poder cargar pagos.
              </Alert>
            ) : (
              <ProjectSelect
                projects={projects}
                value={form.projectId}
                onChange={(projectId) => setForm({ ...form, projectId })}
                disabled={saving}
                showPreview={false}
              />
            )}
            <CurrencyToggle
              value={form.currency}
              onChange={(currency) => setForm({ ...form, currency })}
              disabled={saving}
            />
            <TextField
              label={`Monto total acordado en ${form.currency}`}
              value={form.totalAmount}
              onChange={(event) =>
                setForm({ ...form, totalAmount: cleanAmount(event.target.value) })
              }
              fullWidth
              disabled={saving}
              helperText={amountPreview && `Se va a registrar como ${amountPreview}`}
              slotProps={{
                htmlInput: { inputMode: "decimal", autoComplete: "off" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {form.currency === "USD" ? "US$" : "$"}
                    </InputAdornment>
                  ),
                },
              }}
              sx={roundedFieldSx("12px")}
            />
            <TextField
              label="Notas"
              placeholder="Ej: 3 cuotas, anticipo del 50%, factura pendiente..."
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              disabled={saving}
              sx={roundedFieldSx("12px")}
            />
          </FormDialog>

          <FormDialog
            open={Boolean(installmentFor)}
            onClose={() => !saving && setInstallmentFor(null)}
            onSubmit={handleAddInstallment}
            saving={saving}
            error={formError}
            icon={<PaymentsRoundedIcon />}
            iconColor={theme.palette.success.main}
            title="Agregar pago"
            subtitle={installmentFor?.projectName || "Registro seleccionado"}
            submitIcon={<PaymentsRoundedIcon />}
            submitLabel="Guardar pago"
          >
            {pendingForInstallment && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{
                  px: 1.6,
                  py: 1.2,
                  borderRadius: "14px",
                  bgcolor: softTint(theme, theme.palette.warning.main, 0.07, 0.12),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.22)}`,
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: theme.palette.app.secondary,
                    }}
                  >
                    Saldo pendiente · {CURRENCIES[pendingForInstallment.currency].label}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "1.15rem", fontWeight: 850, color: theme.palette.app.text }}
                  >
                    {formatMoney(
                      pendingForInstallment.pendingAmount,
                      pendingForInstallment.currency,
                    )}
                  </Typography>
                </Box>
                {pendingForInstallment.pendingAmount > 0 && (
                  <Button
                    size="small"
                    onClick={() =>
                      setInstallment({
                        ...installment,
                        amount: String(pendingForInstallment.pendingAmount),
                      })
                    }
                    variant="contained"
                    disableElevation
                    sx={{
                      px: 1.6,
                      borderRadius: "10px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      color: theme.palette.getContrastText(theme.palette.warning.main),
                      bgcolor: theme.palette.warning.main,
                      "&:hover": { bgcolor: theme.palette.warning.dark, color: "#fff" },
                    }}
                  >
                    Saldo total
                  </Button>
                )}
              </Stack>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1.3fr 1fr" },
                gap: 1.75,
              }}
            >
              <TextField
                label="Monto pagado"
                value={installment.amount}
                onChange={(event) =>
                  setInstallment({ ...installment, amount: cleanAmount(event.target.value) })
                }
                fullWidth
                disabled={saving}
                autoFocus
                slotProps={{
                  htmlInput: { inputMode: "decimal", autoComplete: "off" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        {installmentFor?.currency === "USD" ? "US$" : "$"}
                      </InputAdornment>
                    ),
                  },
                }}
                sx={roundedFieldSx("12px")}
              />
              <PaymentDatePicker
                value={installment.date}
                onChange={(date) => setInstallment({ ...installment, date })}
                disabled={saving}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  mb: 0.9,
                  color: theme.palette.app.secondary,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                Método de pago
              </Typography>
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.8 }}>
                {PAYMENT_METHODS.map((method) => (
                  <SelectableChip
                    key={method}
                    label={method}
                    selected={installment.method === method}
                    color={theme.palette.success.main}
                    onClick={() =>
                      setInstallment({
                        ...installment,
                        method: installment.method === method ? "" : method,
                      })
                    }
                  />
                ))}
              </Stack>
            </Box>
            <TextField
              label="Nota"
              placeholder="Ej: anticipo, cuota 2 de 3..."
              value={installment.note}
              onChange={(event) => setInstallment({ ...installment, note: event.target.value })}
              fullWidth
              disabled={saving}
              sx={roundedFieldSx("12px")}
            />
          </FormDialog>

          <DeleteDialog
            open={Boolean(paymentToDelete)}
            title="Eliminar registro"
            text="Se borra el registro y todos sus pagos cargados."
            previewTitle={paymentToDelete?.projectName}
            previewSubtitle={
              paymentToDelete &&
              `Total acordado: ${formatMoney(paymentToDelete.totalAmount, paymentToDelete.currency)}`
            }
            deleting={saving}
            onClose={() => setPaymentToDelete(null)}
            onConfirm={confirmDeletePayment}
          />

          <DeleteDialog
            open={Boolean(installmentToDelete)}
            title="Eliminar pago"
            text="¿Seguro que querés eliminar este pago recibido?"
            previewTitle={
              installmentToDelete &&
              formatMoney(installmentToDelete.item.amount, installmentToDelete.payment.currency)
            }
            previewSubtitle={
              installmentToDelete &&
              `${installmentToDelete.item.method || "Sin método"} · ${formatDay(installmentToDelete.item.date)}`
            }
            deleting={saving}
            onClose={() => setInstallmentToDelete(null)}
            onConfirm={confirmDeleteInstallment}
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<AccountBalanceWalletRoundedIcon />}
          title="Pagos"
          description="Cobros por proyecto, pagos parciales y saldos pendientes en cada moneda."
          actionLabel="Nuevo registro"
          onAction={() => openForm()}
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      {enriched.length === 0 ? (
        <Section delay={70}>
          <EmptyState
            icon={<PaymentsRoundedIcon />}
            title="Todavía no cargaste cobros"
            text="Creá un registro con el monto acordado de un proyecto y andá sumando los pagos a medida que te los hacen."
            actionLabel="Nuevo registro"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={70}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: `repeat(${activeCurrencies.length + 1}, minmax(0, 1fr))`,
                },
                gap: { xs: 1.5, md: 1.75 },
              }}
            >
              {activeCurrencies.map((currency, index) => (
                <CurrencySummary
                  key={currency}
                  currency={currency}
                  data={summary[currency]}
                  delay={index * 45}
                />
              ))}
              <StatusSummary counts={statusCounts} total={enriched.length} />
            </Box>
          </Section>

          <Section delay={140}>
            <FilterBar
              title="Registros de cobro"
              subtitle={`${filtered.length} de ${enriched.length} visibles`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.8 }}>
                <SelectableChip
                  label={`Todos · ${enriched.length}`}
                  icon={<FormatListBulletedRoundedIcon />}
                  selected={filter === "todos"}
                  onClick={() => setFilter("todos")}
                />
                {Object.entries(STATUS).map(([key, info]) => (
                  <SelectableChip
                    key={key}
                    label={`${info.label} · ${statusCounts[key]}`}
                    icon={info.icon}
                    color={info.color(theme)}
                    selected={filter === key}
                    onClick={() => setFilter(key)}
                  />
                ))}
              </Stack>
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar proyecto..."
                width={220}
              />
            </FilterBar>
          </Section>

          <Section delay={200}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title="Sin resultados"
                text="Ningún registro coincide con el estado o la búsqueda elegida."
                actionLabel="Limpiar filtros"
                actionIcon={<FilterAltOffRoundedIcon />}
                onAction={resetFilters}
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: { xs: 1.5, md: 1.75 },
                }}
              >
                {filtered.map((payment, index) => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    delay={index * 45}
                    onOpen={() => setDetailId(payment.id)}
                    onAddInstallment={() => openInstallment(payment)}
                    onEdit={() => openForm(payment)}
                    onDelete={() => setPaymentToDelete(payment)}
                  />
                ))}
              </Box>
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
}

function SelectableChip({ label, icon, selected, color, onClick }) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Chip
      icon={icon}
      label={label}
      clickable
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        height: 34,
        borderRadius: "10px",
        border: `1px solid ${selected ? alpha(c, 0.35) : theme.palette.app.borderSoft}`,
        bgcolor: selected ? softTint(theme, c, 0.1, 0.18) : getSoftBackground(theme),
        color: selected ? c : theme.palette.app.secondary,
        fontWeight: 750,
        fontSize: "0.8rem",
        transition: "0.18s ease",
        "& .MuiChip-icon": { fontSize: 17, color: selected ? c : theme.palette.app.secondary },
        "&:hover": { bgcolor: softTint(theme, c, 0.1, 0.18) },
      }}
    />
  );
}

function CurrencyToggle({ value, onChange, disabled }) {
  return (
    <Box
      sx={{
        "& .MuiToggleButton-root": {
          minHeight: "46px !important",
          flexDirection: "row !important",
          gap: "8px !important",
          fontSize: "0.86rem !important",
        },
        "& .MuiToggleButton-root svg": { fontSize: "19px !important" },
        "& .MuiTypography-root": { fontSize: "0.78rem", fontWeight: 700, mb: 0.9 },
      }}
    >
      <OptionToggle
        label="Moneda"
        value={value}
        onChange={onChange}
        options={Object.entries(CURRENCIES).map(([key, info]) => ({
          value: key,
          icon: info.icon,
          label: `${info.label} (${key})`,
        }))}
        disabled={disabled}
      />
    </Box>
  );
}

function ProgressBar({ value, color, height = 8 }) {
  const theme = useTheme();

  return (
    <LinearProgress
      variant="determinate"
      value={value}
      sx={{
        height,
        borderRadius: 999,
        bgcolor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.07),
        "& .MuiLinearProgress-bar": { borderRadius: 999, ...(color && { bgcolor: color }) },
      }}
    />
  );
}

function TintIcon({ color, size = 36, children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.3)}px`,
        display: "grid",
        placeItems: "center",
        color,
        bgcolor: softTint(theme, color),
        "& svg": { fontSize: size * 0.55 },
      }}
    >
      {children}
    </Box>
  );
}

const percentColor = (theme, percent) =>
  percent >= 100
    ? theme.palette.success.main
    : percent > 0
      ? theme.palette.warning.main
      : theme.palette.error.main;

function CurrencySummary({ currency, data, delay }) {
  const theme = useTheme();
  const color = theme.palette.primary.main;

  return (
    <Card
      elevation={0}
      sx={{ ...getCardStyles(theme, "18px"), ...getSoftFadeSx(delay), p: { xs: 1.6, md: 1.75 } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <TintIcon color={color} size={32}>
          {CURRENCIES[currency].icon}
        </TintIcon>
        <Typography
          sx={{ flex: 1, fontSize: "0.82rem", fontWeight: 750, color: theme.palette.app.secondary }}
        >
          {CURRENCIES[currency].label} · {currency}
        </Typography>
        <Typography
          sx={{ fontSize: "0.86rem", fontWeight: 850, color: percentColor(theme, data.percent) }}
        >
          {data.percent}%
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mt: 1.4, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            fontSize: { xs: "1.3rem", md: "1.45rem" },
            fontWeight: 850,
            letterSpacing: "-0.5px",
            color: theme.palette.app.text,
          }}
        >
          {formatMoney(data.paid, currency)}
        </Typography>
        <Typography
          noWrap
          sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.app.secondary }}
        >
          de {formatMoney(data.agreed, currency)}
        </Typography>
      </Stack>

      <Box sx={{ mt: 1.1 }}>
        <ProgressBar value={data.percent} color={percentColor(theme, data.percent)} />
      </Box>

      <Typography
        sx={{ mt: 1, fontSize: "0.76rem", fontWeight: 650, color: theme.palette.app.secondary }}
      >
        {data.pending > 0 ? (
          <>
            Pendiente{" "}
            <Box component="b" sx={{ color: theme.palette.app.text }}>
              {formatMoney(data.pending, currency)}
            </Box>
          </>
        ) : (
          "Todo cobrado"
        )}
      </Typography>
    </Card>
  );
}

function StatusSummary({ counts, total }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{ ...getCardStyles(theme, "18px"), ...getSoftFadeSx(90), p: { xs: 1.6, md: 1.75 } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <TintIcon color={theme.palette.info.main} size={32}>
          <ReceiptLongRoundedIcon />
        </TintIcon>
        <Typography
          sx={{ flex: 1, fontSize: "0.82rem", fontWeight: 750, color: theme.palette.app.secondary }}
        >
          Registros
        </Typography>
        <Typography sx={{ fontSize: "0.86rem", fontWeight: 850, color: theme.palette.app.text }}>
          {total}
        </Typography>
      </Stack>

      {/* Barra segmentada por estado */}
      <Stack
        direction="row"
        sx={{ mt: 1.6, height: 8, borderRadius: 999, overflow: "hidden", gap: "3px" }}
      >
        {Object.entries(STATUS).map(
          ([key, info]) =>
            counts[key] > 0 && (
              <Box key={key} sx={{ flex: counts[key], bgcolor: info.color(theme) }} />
            ),
        )}
      </Stack>

      <Stack spacing={0.55} sx={{ mt: 1.3 }}>
        {Object.entries(STATUS).map(([key, info]) => (
          <Stack key={key} direction="row" alignItems="center" spacing={0.9}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: info.color(theme) }} />
            <Typography
              sx={{
                flex: 1,
                fontSize: "0.78rem",
                fontWeight: 650,
                color: theme.palette.app.secondary,
              }}
            >
              {info.label}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: theme.palette.app.text }}>
              {counts[key]}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

function StatusPill({ status }) {
  const theme = useTheme();
  const info = STATUS[status];
  const color = info.color(theme);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{
        flexShrink: 0,
        px: 0.9,
        height: 24,
        borderRadius: "8px",
        color,
        bgcolor: softTint(theme, color, 0.1, 0.16),
        "& svg": { fontSize: 14 },
      }}
    >
      {info.icon}
      <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "inherit" }}>
        {info.label}
      </Typography>
    </Stack>
  );
}

function PaymentCard({ payment, delay, onOpen, onAddInstallment, onEdit, onDelete }) {
  const theme = useTheme();
  const statusColor = STATUS[payment.paymentStatus].color(theme);
  const projectColor = payment.projectColor || theme.palette.primary.main;
  const installments = payment.installments || [];
  const percent = Math.round(payment.progress * 100);
  const done = payment.paymentStatus === "pagado";

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        p: { xs: 1.6, md: 1.75 },
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(projectColor, 0.4),
          boxShadow: `0 14px 34px ${alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
        "&:hover .card-arrow": { color: theme.palette.primary.main, transform: "translateX(2px)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.3}>
        <ProjectAvatar item={payment} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              color: theme.palette.app.text,
              fontSize: "0.98rem",
              fontWeight: 800,
              letterSpacing: "-0.2px",
            }}
          >
            {payment.projectName || "Proyecto sin nombre"}
          </Typography>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
          >
            Acordado {formatMoney(payment.totalAmount, payment.currency)} · {payment.currency}
          </Typography>
        </Box>
        <StatusPill status={payment.paymentStatus} />
      </Stack>

      {/* Cobrado / Falta */}
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderRadius: "12px",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          bgcolor: getSoftBackground(theme),
          "& > div": { px: 1.3, py: 1, minWidth: 0 },
          "& > div + div": { borderLeft: `1px solid ${theme.palette.app.borderSoft}` },
        }}
      >
        <Amount
          label="Cobrado"
          value={formatMoney(payment.paidAmount, payment.currency)}
          color={payment.paidAmount > 0 ? theme.palette.success.main : theme.palette.app.text}
        />
        <Amount
          label="Falta"
          value={formatMoney(payment.pendingAmount, payment.currency)}
          color={done ? theme.palette.app.secondary : theme.palette.app.text}
        />
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 1.3 }}>
        <Box sx={{ flex: 1 }}>
          <ProgressBar value={percent} color={statusColor} height={6} />
        </Box>
        <Typography sx={{ fontSize: "0.78rem", fontWeight: 850, color: statusColor }}>
          {percent}%
        </Typography>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ mt: 1.4, pt: 1.2, borderTop: `1px solid ${theme.palette.app.borderSoft}` }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.4}
          sx={{ flex: 1, minWidth: 0, color: theme.palette.app.secondary }}
        >
          <Typography noWrap sx={{ fontSize: "0.75rem", fontWeight: 700, color: "inherit" }}>
            {installments.length ? plural(installments.length, "pago", "pagos") : "Sin pagos"} · Ver
            detalle
          </Typography>
          <ArrowForwardRoundedIcon
            className="card-arrow"
            sx={{ fontSize: 15, transition: "all 0.18s ease" }}
          />
        </Stack>
        {!done && (
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={(event) => {
              event.stopPropagation();
              onAddInstallment();
            }}
            sx={{
              height: 30,
              px: 1.1,
              borderRadius: "9px",
              fontSize: "0.76rem",
              fontWeight: 800,
              whiteSpace: "nowrap",
              color: theme.palette.success.main,
              bgcolor: softTint(theme, theme.palette.success.main, 0.09, 0.15),
              "&:hover": { bgcolor: softTint(theme, theme.palette.success.main, 0.15, 0.22) },
              "& .MuiButton-startIcon": { mr: 0.4, "& svg": { fontSize: 17 } },
            }}
          >
            Agregar pago
          </Button>
        )}
        <IconAction title="Editar" size={30} color={theme.palette.info.main} onClick={onEdit}>
          <EditRoundedIcon sx={{ fontSize: 15 }} />
        </IconAction>
        <IconAction title="Eliminar" size={30} color={theme.palette.error.main} onClick={onDelete}>
          <DeleteRoundedIcon sx={{ fontSize: 15 }} />
        </IconAction>
      </Stack>
    </Card>
  );
}

function Amount({ label, value, color, big = false }) {
  const theme = useTheme();

  return (
    <Box>
      <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: theme.palette.app.secondary }}>
        {label}
      </Typography>
      <Typography
        noWrap
        sx={{
          fontSize: big ? "1.15rem" : "0.98rem",
          fontWeight: 850,
          letterSpacing: "-0.3px",
          color,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function PaymentDetailDialog({
  payment,
  onClose,
  onAddInstallment,
  onEdit,
  onDelete,
  onDeleteInstallment,
}) {
  const theme = useTheme();
  if (!payment) return null;

  const statusColor = STATUS[payment.paymentStatus].color(theme);
  const percent = Math.round(payment.progress * 100);
  const installments = [...(payment.installments || [])].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const buttonSx = { minHeight: 40, px: 1.6, borderRadius: "12px", fontWeight: 750 };

  return (
    <AppDialog
      open
      onClose={onClose}
      maxWidth="sm"
      header={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ProjectAvatar item={payment} size={46} shadow />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.app.text,
                fontSize: "1.15rem",
                fontWeight: 850,
                letterSpacing: "-0.3px",
                lineHeight: 1.25,
              }}
            >
              {payment.projectName || "Proyecto sin nombre"}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.4 }}>
              <StatusPill status={payment.paymentStatus} />
              <Typography
                noWrap
                sx={{ color: theme.palette.app.secondary, fontSize: "0.78rem", fontWeight: 600 }}
              >
                {CURRENCIES[payment.currency].label} ({payment.currency})
              </Typography>
            </Stack>
          </Box>
        </Stack>
      }
      actions={
        <>
          <Button
            color="error"
            startIcon={<DeleteRoundedIcon />}
            onClick={onDelete}
            sx={{ ...buttonSx, mr: "auto" }}
          >
            Eliminar
          </Button>
          <Button startIcon={<EditRoundedIcon />} onClick={onEdit} sx={buttonSx}>
            Editar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PaymentsRoundedIcon />}
            onClick={onAddInstallment}
            disabled={payment.paymentStatus === "pagado"}
            sx={{ ...buttonSx, fontWeight: 800, boxShadow: "none" }}
          >
            Agregar pago
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        {/* Resumen: acordado / cobrado / falta + avance */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: "14px",
            border: `1px solid ${theme.palette.app.borderSoft}`,
            bgcolor: getSoftBackground(theme),
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
            <Amount
              label="Acordado"
              value={formatMoney(payment.totalAmount, payment.currency)}
              color={theme.palette.app.text}
              big
            />
            <Amount
              label="Cobrado"
              value={formatMoney(payment.paidAmount, payment.currency)}
              color={theme.palette.success.main}
              big
            />
            <Amount
              label="Falta"
              value={formatMoney(payment.pendingAmount, payment.currency)}
              color={
                payment.pendingAmount > 0 ? theme.palette.warning.main : theme.palette.app.secondary
              }
              big
            />
          </Box>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 1.4 }}>
            <Box sx={{ flex: 1 }}>
              <ProgressBar value={percent} color={statusColor} />
            </Box>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 850, color: statusColor }}>
              {percent}%
            </Typography>
          </Stack>
        </Box>

        {payment.notes && (
          <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ px: 0.5 }}>
            <NoteAltRoundedIcon
              sx={{ mt: 0.2, fontSize: 18, color: theme.palette.app.secondary, flexShrink: 0 }}
            />
            <Typography
              sx={{
                color: theme.palette.app.secondary,
                fontSize: "0.86rem",
                fontWeight: 550,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
              }}
            >
              {payment.notes}
            </Typography>
          </Stack>
        )}

        <Box>
          <Typography
            sx={{
              mb: 1,
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: theme.palette.app.secondary,
            }}
          >
            Pagos recibidos · {installments.length}
          </Typography>

          {installments.length === 0 ? (
            <Box
              sx={{
                py: 2.5,
                textAlign: "center",
                borderRadius: "14px",
                border: `1.5px dashed ${theme.palette.app.borderSoft}`,
              }}
            >
              <PaymentsRoundedIcon
                sx={{ fontSize: 26, color: theme.palette.app.secondary, opacity: 0.6 }}
              />
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  color: theme.palette.app.secondary,
                }}
              >
                Todavía no cargaste pagos para este registro.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.8}>
              {installments.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.2}
                  sx={{
                    p: 1,
                    pl: 1.2,
                    borderRadius: "12px",
                    border: `1px solid ${theme.palette.app.borderSoft}`,
                    bgcolor: theme.palette.app.surface,
                  }}
                >
                  <TintIcon color={theme.palette.success.main} size={32}>
                    <PaymentsRoundedIcon />
                  </TintIcon>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{ fontSize: "0.92rem", fontWeight: 800, color: theme.palette.app.text }}
                    >
                      {formatMoney(item.amount, payment.currency)}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: theme.palette.app.secondary,
                      }}
                    >
                      {[formatDay(item.date), item.method, item.note].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  <IconAction
                    title="Eliminar pago"
                    size={30}
                    color={theme.palette.error.main}
                    onClick={() => onDeleteInstallment(item)}
                  >
                    <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                  </IconAction>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </AppDialog>
  );
}

function PaymentDatePicker({ value, onChange, disabled }) {
  const theme = useTheme();

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={DAYJS_LOCALE}
      localeText={pickerLocaleText}
    >
      <DatePicker
        label="Fecha"
        value={value}
        onChange={(date) => onChange(date)}
        disabled={disabled}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth: true,
            sx: {
              "& .MuiPickersOutlinedInput-root, & .MuiOutlinedInput-root": { borderRadius: "12px" },
            },
          },
          openPickerButton: { sx: { color: theme.palette.app.secondary } },
          desktopPaper: {
            sx: {
              mt: 0.75,
              borderRadius: "16px",
              backgroundImage: "none",
              backgroundColor: theme.palette.app.surface,
              border: `1px solid ${theme.palette.app.borderSoft}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 18px 50px rgba(0,0,0,0.5)"
                  : "0 18px 50px rgba(15,23,42,0.14)",
            },
          },
          calendarHeader: {
            sx: { "& .MuiPickersCalendarHeader-label": { fontWeight: 800 } },
          },
          day: { sx: { fontWeight: 600, "&.Mui-selected": { fontWeight: 800 } } },
        }}
      />
    </LocalizationProvider>
  );
}
