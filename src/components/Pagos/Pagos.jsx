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
import LinearProgress from "@mui/material/LinearProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Collapse from "@mui/material/Collapse";
import Badge from "@mui/material/Badge";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import MoneyOffRoundedIcon from "@mui/icons-material/MoneyOffRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import CreditScoreRoundedIcon from "@mui/icons-material/CreditScoreRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
const FILTERS = ["todos", "no_pagado", "parcial", "pagado"];

const CURRENCIES = [
  {
    value: "ARS",
    label: "Pesos",
    shortLabel: "ARS",
    icon: <MoneyOffRoundedIcon />,
  },
  {
    value: "USD",
    label: "Dólares",
    shortLabel: "USD",
    icon: <AttachMoneyRoundedIcon />,
  },
];

const PAYMENT_METHODS = ["Efectivo", "Transferencia", "Mercado Pago", "Otro"];

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

function getPaidAmount(payment) {
  return (payment.installments || []).reduce(
    (acc, item) => acc + Number(item.amount || 0),
    0
  );
}

function getCurrency(payment) {
  return payment.currency || "ARS";
}

function getCurrencyInfo(currency) {
  return CURRENCIES.find((item) => item.value === currency) || CURRENCIES[0];
}

function getStatusLabel(status) {
  if (status === "no_pagado") return "No pagado";
  if (status === "parcial") return "Parcial";
  if (status === "pagado") return "Pagado";
  return "No pagado";
}

function getStatusIcon(status) {
  if (status === "no_pagado") return <CancelRoundedIcon />;
  if (status === "parcial") return <AccessTimeRoundedIcon />;
  if (status === "pagado") return <CheckCircleRoundedIcon />;
  return <CancelRoundedIcon />;
}

function getStatusColor(theme, status) {
  if (status === "no_pagado") return theme.palette.error.main;
  if (status === "parcial") return theme.palette.warning.main;
  if (status === "pagado") return theme.palette.success.main;
  return theme.palette.error.main;
}

function getPaymentStatusOrder(status) {
  if (status === "no_pagado") return 1;
  if (status === "parcial") return 2;
  if (status === "pagado") return 3;
  return 4;
}

function getProgressColor(theme, status) {
  if (status === "pagado") return theme.palette.success.main;
  if (status === "parcial") return theme.palette.warning.main;
  return theme.palette.error.main;
}

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

export default function Pagos() {
  const theme = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [installmentDialogOpen, setInstallmentDialogOpen] = useState(false);
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [deleteInstallmentDialogOpen, setDeleteInstallmentDialogOpen] =
    useState(false);

  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [installmentToDelete, setInstallmentToDelete] = useState(null);

  const [projectId, setProjectId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [notes, setNotes] = useState("");

  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentMethod, setInstallmentMethod] = useState("");
  const [installmentNote, setInstallmentNote] = useState("");

  const [filter, setFilter] = useState("todos");
  const [expandedPayments, setExpandedPayments] = useState({});

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const paymentsQuery = query(
      collection(db, "payments"),
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

    const unsubscribePayments = onSnapshot(
      paymentsQuery,
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

        setPayments(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setPayments([]);
        setLoading(false);
        setPageError("No se pudieron cargar los pagos.");
      }
    );

    return () => {
      unsubscribeProjects();
      unsubscribePayments();
    };
  }, [user]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const paymentsWithStatus = useMemo(() => {
    return payments.map((payment) => {
      const total = Number(payment.totalAmount || 0);
      const paid = getPaidAmount(payment);
      const pending = Math.max(total - paid, 0);
      const progress = total > 0 ? Math.min(paid / total, 1) : 0;

      let status = "no_pagado";

      if (paid > 0 && paid < total) status = "parcial";
      if (total > 0 && paid >= total) status = "pagado";

      return {
        ...payment,
        currency: getCurrency(payment),
        paidAmount: paid,
        pendingAmount: pending,
        paymentStatus: status,
        progress,
      };
    });
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const visiblePayments =
      filter === "todos"
        ? paymentsWithStatus
        : paymentsWithStatus.filter(
            (payment) => payment.paymentStatus === filter
          );

    return [...visiblePayments].sort((a, b) => {
      const statusA = getPaymentStatusOrder(a.paymentStatus);
      const statusB = getPaymentStatusOrder(b.paymentStatus);

      if (statusA !== statusB) return statusA - statusB;

      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;

      return dateB - dateA;
    });
  }, [paymentsWithStatus, filter]);

  const summary = useMemo(() => {
    const initial = {
      ARS: {
        totalAgreed: 0,
        totalPaid: 0,
        totalPending: 0,
      },
      USD: {
        totalAgreed: 0,
        totalPaid: 0,
        totalPending: 0,
      },
      partialCount: 0,
      paidCount: 0,
      unpaidCount: 0,
      totalCount: 0,
    };

    paymentsWithStatus.forEach((payment) => {
      const paymentCurrency = getCurrency(payment);

      initial[paymentCurrency].totalAgreed += Number(payment.totalAmount || 0);
      initial[paymentCurrency].totalPaid += Number(payment.paidAmount || 0);
      initial[paymentCurrency].totalPending += Number(payment.pendingAmount || 0);

      if (payment.paymentStatus === "parcial") {
        initial.partialCount += 1;
      }

      if (payment.paymentStatus === "pagado") {
        initial.paidCount += 1;
      }

      if (payment.paymentStatus === "no_pagado") {
        initial.unpaidCount += 1;
      }

      initial.totalCount += 1;
    });

    return initial;
  }, [paymentsWithStatus]);

  const overallProgress = useMemo(() => {
    const totalAgreed =
      summary.ARS.totalAgreed +
      summary.USD.totalAgreed;

    const totalPaid =
      summary.ARS.totalPaid +
      summary.USD.totalPaid;

    if (totalAgreed <= 0) return 0;

    return Math.round(Math.min(totalPaid / totalAgreed, 1) * 100);
  }, [summary]);

  function formatMoney(value, moneyCurrency = "ARS") {
    const number = Number(value || 0);

    if (moneyCurrency === "USD") {
      return `US$${number.toLocaleString("es-AR", {
        maximumFractionDigits: 0,
      })}`;
    }

    return `$${number.toLocaleString("es-AR", {
      maximumFractionDigits: 0,
    })}`;
  }

  function formatDate(date) {
    if (!date) return "Sin fecha";

    try {
      return new Date(date).toLocaleDateString("es-AR");
    } catch {
      return "Sin fecha";
    }
  }

  function resetPaymentForm() {
    setEditingPayment(null);
    setProjectId("");
    setTotalAmount("");
    setCurrency("ARS");
    setNotes("");
    setPageError("");
  }

  function resetInstallmentForm() {
    setInstallmentAmount("");
    setInstallmentMethod("");
    setInstallmentNote("");
    setPageError("");
  }

  function openCreateDialog() {
    resetPaymentForm();
    setPaymentDialogOpen(true);
  }

  function openEditDialog(payment) {
    setEditingPayment(payment);
    setProjectId(payment.projectId || "");
    setTotalAmount(String(payment.totalAmount || ""));
    setCurrency(getCurrency(payment));
    setNotes(payment.notes || "");
    setPageError("");
    setPaymentDialogOpen(true);
  }

  function closePaymentDialog() {
    resetPaymentForm();
    setPaymentDialogOpen(false);
  }

  function openInstallmentDialog(payment) {
    setSelectedPayment(payment);
    resetInstallmentForm();
    setInstallmentDialogOpen(true);
  }

  function closeInstallmentDialog() {
    resetInstallmentForm();
    setSelectedPayment(null);
    setInstallmentDialogOpen(false);
  }

  function openDeletePaymentDialog(payment) {
    setPaymentToDelete(payment);
    setDeletePaymentDialogOpen(true);
  }

  function closeDeletePaymentDialog() {
    setPaymentToDelete(null);
    setDeletePaymentDialogOpen(false);
  }

  function openDeleteInstallmentDialog(payment, installment) {
    setInstallmentToDelete({
      payment,
      installment,
    });
    setDeleteInstallmentDialogOpen(true);
  }

  function closeDeleteInstallmentDialog() {
    setInstallmentToDelete(null);
    setDeleteInstallmentDialogOpen(false);
  }

  function toggleExpanded(paymentId) {
    setExpandedPayments((prev) => ({
      ...prev,
      [paymentId]: !prev[paymentId],
    }));
  }

  async function handleSavePayment(event) {
    event?.preventDefault();

    if (!projectId) {
      setPageError("Seleccioná un proyecto.");
      return;
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      setPageError("Ingresá el monto total acordado.");
      return;
    }

    const selectedProject = projects.find((project) => project.id === projectId);

    try {
      setSaving(true);
      setPageError("");

      if (editingPayment) {
        await updateDoc(doc(db, "payments", editingPayment.id), {
          projectId,
          projectName: selectedProject?.name || "",
          projectColor: selectedProject?.color || null,
          projectLogoUrl: selectedProject?.logoUrl || null,
          totalAmount: Number(totalAmount),
          currency,
          notes: notes.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const newDoc = await addDoc(collection(db, "payments"), {
          userId: user.uid,
          projectId,
          projectName: selectedProject?.name || "",
          projectColor: selectedProject?.color || null,
          projectLogoUrl: selectedProject?.logoUrl || null,
          totalAmount: Number(totalAmount),
          currency,
          installments: [],
          notes: notes.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setExpandedPayments((prev) => ({
          ...prev,
          [newDoc.id]: true,
        }));
      }

      closePaymentDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo guardar el registro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddInstallment(event) {
    event?.preventDefault();

    if (!selectedPayment) return;

    if (!installmentAmount || Number(installmentAmount) <= 0) {
      setPageError("Ingresá el monto pagado.");
      return;
    }

    const newInstallment = {
      id: Date.now().toString(),
      amount: Number(installmentAmount),
      method: installmentMethod.trim(),
      note: installmentNote.trim(),
      date: new Date().toISOString(),
    };

    try {
      setSaving(true);
      setPageError("");

      await updateDoc(doc(db, "payments", selectedPayment.id), {
        installments: [...(selectedPayment.installments || []), newInstallment],
        updatedAt: serverTimestamp(),
      });

      setExpandedPayments((prev) => ({
        ...prev,
        [selectedPayment.id]: true,
      }));

      closeInstallmentDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo agregar el pago.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeletePayment() {
    if (!paymentToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "payments", paymentToDelete.id));
      closeDeletePaymentDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo eliminar el registro.");
    }
  }

  async function confirmDeleteInstallment() {
    if (!installmentToDelete?.payment?.id || !installmentToDelete?.installment?.id) {
      return;
    }

    const payment = installmentToDelete.payment;
    const installmentId = installmentToDelete.installment.id;

    const updatedInstallments = (payment.installments || []).filter(
      (item) => item.id !== installmentId
    );

    try {
      await updateDoc(doc(db, "payments", payment.id), {
        installments: updatedInstallments,
        updatedAt: serverTimestamp(),
      });

      closeDeleteInstallmentDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo eliminar el pago.");
    }
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.3, md: 3 }}>
        <PageHeader
          onCreate={openCreateDialog}
          totalCount={summary.totalCount}
          overallProgress={overallProgress}
        />

        {pageError ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: "14px",
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageError}
          </Alert>
        ) : null}

        {loading ? (
          <SummarySkeleton />
        ) : (
          <>
            <SummaryGrid
              summary={summary}
              formatMoney={formatMoney}
              overallProgress={overallProgress}
            />

            <FilterPanel
              filter={filter}
              setFilter={setFilter}
              filteredCount={filteredPayments.length}
              totalCount={paymentsWithStatus.length}
            />
          </>
        )}

        {loading ? (
          <PaymentsSkeleton />
        ) : filteredPayments.length === 0 ? (
          <EmptyState onCreate={openCreateDialog} />
        ) : (
          <Stack spacing={1.7}>
            {filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                expanded={Boolean(expandedPayments[payment.id])}
                onToggleExpanded={() => toggleExpanded(payment.id)}
                onAddInstallment={() => openInstallmentDialog(payment)}
                onEdit={() => openEditDialog(payment)}
                onDelete={() => openDeletePaymentDialog(payment)}
                onDeleteInstallment={(installment) =>
                  openDeleteInstallmentDialog(payment, installment)
                }
                formatMoney={formatMoney}
                formatDate={formatDate}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <PaymentFormDialog
        open={paymentDialogOpen}
        editingPayment={editingPayment}
        projects={projects}
        selectedProject={selectedProject}
        projectId={projectId}
        setProjectId={setProjectId}
        totalAmount={totalAmount}
        setTotalAmount={setTotalAmount}
        currency={currency}
        setCurrency={setCurrency}
        notes={notes}
        setNotes={setNotes}
        saving={saving}
        pageError={pageError}
        onClose={closePaymentDialog}
        onSave={handleSavePayment}
      />

      <InstallmentFormDialog
        open={installmentDialogOpen}
        selectedPayment={selectedPayment}
        installmentAmount={installmentAmount}
        setInstallmentAmount={setInstallmentAmount}
        installmentMethod={installmentMethod}
        setInstallmentMethod={setInstallmentMethod}
        installmentNote={installmentNote}
        setInstallmentNote={setInstallmentNote}
        saving={saving}
        pageError={pageError}
        onClose={closeInstallmentDialog}
        onSave={handleAddInstallment}
      />

      <DeleteDialog
        open={deletePaymentDialogOpen}
        title="Eliminar registro"
        text="¿Seguro que querés eliminar este registro de pago? Esta acción no se puede deshacer."
        previewTitle={paymentToDelete?.projectName}
        previewSubtitle={
          paymentToDelete
            ? `Total acordado: ${formatMoney(
                paymentToDelete.totalAmount,
                getCurrency(paymentToDelete)
              )}`
            : ""
        }
        icon={<RequestQuoteRoundedIcon />}
        onClose={closeDeletePaymentDialog}
        onConfirm={confirmDeletePayment}
      />

      <DeleteDialog
        open={deleteInstallmentDialogOpen}
        title="Eliminar pago"
        text="¿Seguro que querés eliminar este pago recibido?"
        previewTitle={
          installmentToDelete?.installment
            ? formatMoney(
                installmentToDelete.installment.amount,
                getCurrency(installmentToDelete.payment)
              )
            : ""
        }
        previewSubtitle={
          installmentToDelete?.installment
            ? `${
                installmentToDelete.installment.method || "Sin método"
              } · ${formatDate(installmentToDelete.installment.date)}`
            : ""
        }
        icon={<PaymentsRoundedIcon />}
        onClose={closeDeleteInstallmentDialog}
        onConfirm={confirmDeleteInstallment}
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
              ? alpha(theme.palette.primary.main, 0.14)
              : alpha(theme.palette.primary.main, 0.1),
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
              ? alpha(theme.palette.success.main, 0.09)
              : alpha(theme.palette.success.main, 0.07),
          filter: "blur(70px)",
        }}
      />
    </Box>
  );
}

function PageHeader({ onCreate, totalCount, overallProgress }) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        ...getGlassCardStyles(theme),
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
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: { xs: 23, md: 25 } }} />
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
              Pagos
            </Typography>

            <Typography
              sx={{
                mt: 0.8,
                color: theme.palette.app.secondary,
                fontSize: { xs: "0.9rem", md: "0.98rem" },
                lineHeight: 1.65,
                fontWeight: 600,
                maxWidth: 720,
              }}
            >
              Controlá cobros por proyecto, pagos parciales, moneda acordada y
              saldos pendientes desde una vista simple y clara.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.6, flexWrap: "wrap", rowGap: 1 }}
            >
              <HeaderMiniChip label={`${totalCount} registros`} />
              <HeaderMiniChip label={`${overallProgress}% cobrado`} />
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
              px: 2,
              py: 0,
              borderRadius: "14px",
              fontWeight: 900,
              textTransform: "none",
              boxShadow: "none",
              whiteSpace: "nowrap",
              fontSize: "0.88rem",
              alignSelf: { xs: "stretch", sm: "center" },
              "& .MuiButton-startIcon": {
                mr: 0.6,
              },
            }}
          >
            Nuevo registro
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

function SummaryGrid({ summary, formatMoney, overallProgress }) {
  const theme = useTheme();

  const cards = [
    {
      title: "Acordado ARS",
      value: formatMoney(summary.ARS.totalAgreed, "ARS"),
      icon: <RequestQuoteRoundedIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: "Cobrado ARS",
      value: formatMoney(summary.ARS.totalPaid, "ARS"),
      icon: <PriceCheckRoundedIcon />,
      color: theme.palette.success.main,
    },
    {
      title: "Acordado USD",
      value: formatMoney(summary.USD.totalAgreed, "USD"),
      icon: <AttachMoneyRoundedIcon />,
      color: theme.palette.info.main,
    },
    {
      title: "Cobrado USD",
      value: formatMoney(summary.USD.totalPaid, "USD"),
      icon: <CreditScoreRoundedIcon />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: { xs: 1.3, md: 1.8 },
      }}
    >
      {cards.map((item) => (
        <SummaryCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          color={item.color}
        />
      ))}

      <Card
        variant="outlined"
        sx={{
          gridColumn: "1 / -1",
          ...getGlassCardStyles(theme),
          borderRadius: "16px",
          px: { xs: 2.2, md: 2.6 },
          py: { xs: 1.9, md: 2.25 },
          boxShadow: "none",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 1.6, md: 3 }}
          sx={{ width: "100%" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 950 }}>
              Avance general de cobros
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.3, fontSize: 13.5, fontWeight: 650 }}
            >
              {overallProgress}% cobrado sobre el total registrado.
            </Typography>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", md: 430 },
              ml: { xs: 0, md: "auto" },
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                mb: 0.7,
                width: "100%",
                gap: 1.2,
              }}
            >
              <Typography color="text.secondary" sx={{ fontSize: 12, fontWeight: 850 }}>
                Progreso
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 950,
                  minWidth: 42,
                  textAlign: "right",
                }}
              >
                {overallProgress}%
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={overallProgress}
              sx={{
                height: 9,
                borderRadius: 999,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.08)
                    : alpha("#0F172A", 0.08),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                },
              }}
            />
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "16px",
        p: { xs: 1.7, md: 2 },
        boxShadow: "none",
        transition: "0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(color, 0.28),
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.4}>
        <Avatar
          variant="rounded"
          sx={{
            width: { xs: 44, md: 50 },
            height: { xs: 44, md: 50 },
            borderRadius: "12px",
            bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: { xs: 17, md: 20 },
              fontWeight: 950,
              letterSpacing: -0.3,
            }}
          >
            {value}
          </Typography>

          <Typography
            noWrap
            color="text.secondary"
            sx={{
              mt: 0.35,
              fontSize: 13,
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

function FilterPanel({ filter, setFilter, filteredCount, totalCount }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "16px",
        p: { xs: 1.6, md: 2 },
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={1.6}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <FormatListBulletedRoundedIcon />
          </Avatar>

          <Box>
            <Typography sx={{ fontWeight: 950 }}>Filtros de pago</Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.2, fontSize: 13, fontWeight: 650 }}
            >
              {filteredCount} visibles de {totalCount} registros.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {FILTERS.map((item) => {
            const selected = filter === item;
            const color =
              item === "todos"
                ? theme.palette.primary.main
                : getStatusColor(theme, item);

            return (
              <FilterChip
                key={item}
                label={item === "todos" ? "Todos" : getStatusLabel(item)}
                icon={
                  item === "todos" ? (
                    <FormatListBulletedRoundedIcon />
                  ) : (
                    getStatusIcon(item)
                  )
                }
                selected={selected}
                color={color}
                onClick={() => setFilter(item)}
              />
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

function FilterChip({ label, icon, selected, color, onClick }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      clickable
      onClick={onClick}
      sx={{
        height: 38,
        borderRadius: 999,
        border: "1px solid",
        borderColor: selected
          ? alpha(color, theme.palette.mode === "dark" ? 0.34 : 0.22)
          : theme.palette.mode === "dark"
          ? alpha("#FFFFFF", 0.08)
          : alpha("#0F172A", 0.08),
        bgcolor: selected
          ? alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.1)
          : theme.palette.mode === "dark"
          ? alpha("#FFFFFF", 0.04)
          : alpha("#0F172A", 0.035),
        color: selected ? color : "text.secondary",
        fontWeight: 950,
        transition: "0.18s ease",
        "& .MuiChip-icon": {
          color: selected ? color : theme.palette.text.secondary,
        },
        "&:hover": {
          transform: "translateY(-1px)",
          bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.18 : 0.1),
        },
      }}
    />
  );
}

function PaymentCard({
  payment,
  expanded,
  onToggleExpanded,
  onAddInstallment,
  onEdit,
  onDelete,
  onDeleteInstallment,
  formatMoney,
  formatDate,
}) {
  const theme = useTheme();

  const projectColor = payment.projectColor || theme.palette.primary.main;
  const paymentCurrency = getCurrency(payment);
  const currencyInfo = getCurrencyInfo(paymentCurrency);
  const statusColor = getStatusColor(theme, payment.paymentStatus);
  const installments = payment.installments || [];
  const progressPercent = Math.round(payment.progress * 100);

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        borderRadius: "18px",
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.background.paper, 0.84)
            : alpha(theme.palette.background.paper, 0.96),
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.08)
            : alpha("#0F172A", 0.08),
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 18px 38px rgba(0,0,0,0.18)"
            : "0 14px 30px rgba(15,23,42,0.045)",
        transition: "0.2s ease",
        "&:hover": {
          borderColor: alpha(statusColor, 0.45),
          transform: "translateY(-2px)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 22px 48px rgba(0,0,0,0.26)"
              : "0 20px 42px rgba(15,23,42,0.075)",
        },
      }}
    >
      <Box
        onClick={onToggleExpanded}
        sx={{
          position: "relative",
          cursor: "pointer",
          p: { xs: 1.7, md: 2.1 },
          pb: 1.5,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.7} sx={{ flex: 1, minWidth: 0 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: statusColor,
                    color: "#FFFFFF",
                    border: "2px solid",
                    borderColor: "background.paper",
                  }}
                >
                  {getStatusIcon(payment.paymentStatus)}
                </Avatar>
              }
            >
              <ProjectIcon payment={payment} />
            </Badge>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 0.8 }}
              >
                <StatusChip
                  label={getStatusLabel(payment.paymentStatus)}
                  icon={getStatusIcon(payment.paymentStatus)}
                  color={statusColor}
                  compact
                />

                <CurrencyPill currency={paymentCurrency} />
              </Stack>

              <Typography
                noWrap
                sx={{
                  fontSize: { xs: 17, md: 21 },
                  fontWeight: 950,
                  letterSpacing: -0.35,
                }}
              >
                {payment.projectName || "Proyecto sin nombre"}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.55 }}>
                <BusinessCenterRoundedIcon
                  sx={{ fontSize: 17, color: "text.secondary", flexShrink: 0 }}
                />

                <Typography
                  noWrap
                  color="text.secondary"
                  sx={{
                    fontSize: { xs: 13, md: 14.5 },
                    fontWeight: 750,
                  }}
                >
                  Total acordado: {formatMoney(payment.totalAmount, paymentCurrency)}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack
            direction={{ xs: "row", sm: "column" }}
            alignItems={{ xs: "center", sm: "flex-end" }}
            justifyContent={{ xs: "space-between", sm: "center" }}
            spacing={0.8}
            sx={{ minWidth: { sm: 150 } }}
          >
            <Typography
              sx={{
                fontSize: { xs: 24, md: 30 },
                fontWeight: 950,
                letterSpacing: -0.7,
                color: statusColor,
                lineHeight: 1,
              }}
            >
              {progressPercent}%
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.4}>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: 12.5,
                  fontWeight: 850,
                }}
              >
                {expanded ? "Ocultar" : "Ver detalle"}
              </Typography>

              {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </Stack>
          </Stack>
        </Stack>

        <Box sx={{ mt: 2, px: { xs: 1, md: 1.5 } }}>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.08)
                  : alpha("#0F172A", 0.08),
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: getProgressColor(theme, payment.paymentStatus),
              },
            }}
          />
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            position: "relative",
            px: { xs: 2, md: 2.5 },
            pb: { xs: 2, md: 2.5 },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.4}
            sx={{
              borderRadius: "14px",
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.04)
                  : alpha("#0F172A", 0.035),
              border: "1px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? alpha("#FFFFFF", 0.07)
                  : alpha("#0F172A", 0.07),
              p: 1.5,
              mb: 2,
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 42,
                height: 42,
                borderRadius: "10px",
                bgcolor: alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1),
                color: projectColor,
              }}
            >
              {currencyInfo.icon}
            </Avatar>

            <Typography color="text.secondary" sx={{ fontWeight: 650, lineHeight: 1.6 }}>
              Este registro está pactado en{" "}
              <Box component="span" sx={{ color: "text.primary", fontWeight: 950 }}>
                {currencyInfo.label}
              </Box>
              . Los pagos parciales se cargan en la misma moneda.
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 1.5,
            }}
          >
            <AmountBox
              title="Cobrado"
              value={formatMoney(payment.paidAmount, paymentCurrency)}
              icon={<PriceCheckRoundedIcon />}
              color={theme.palette.success.main}
            />

            <AmountBox
              title="Falta"
              value={formatMoney(payment.pendingAmount, paymentCurrency)}
              icon={<AccessTimeRoundedIcon />}
              color={
                payment.pendingAmount > 0
                  ? theme.palette.warning.main
                  : theme.palette.success.main
              }
            />
          </Box>

          {payment.notes ? (
            <Stack
              direction="row"
              alignItems="flex-start"
              spacing={1.2}
              sx={{
                mt: 2,
                borderRadius: "14px",
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.07)
                    : alpha("#0F172A", 0.07),
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.035)
                    : alpha("#0F172A", 0.025),
                p: 1.6,
              }}
            >
              <NoteAltRoundedIcon sx={{ color: "text.secondary" }} />

              <Typography color="text.secondary" sx={{ lineHeight: 1.65, fontWeight: 600 }}>
                {payment.notes}
              </Typography>
            </Stack>
          ) : null}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 2.5, mb: 1.2 }}
          >
            <Typography sx={{ fontWeight: 950 }}>Pagos recibidos</Typography>

            <Chip
              size="small"
              label={`${installments.length} registros`}
              sx={{
                height: 27,
                borderRadius: 999,
                color: "text.secondary",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.055)
                    : alpha("#0F172A", 0.045),
                fontWeight: 850,
              }}
            />
          </Stack>

          {installments.length === 0 ? (
            <Card
              variant="outlined"
              sx={{
                borderRadius: "14px",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.035)
                    : alpha("#0F172A", 0.025),
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.075)
                    : alpha("#0F172A", 0.075),
                boxShadow: "none",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.6 }}>
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "10px",
                    color: "text.secondary",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha("#FFFFFF", 0.055)
                        : alpha("#0F172A", 0.045),
                  }}
                >
                  <PaymentsRoundedIcon />
                </Avatar>

                <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                  Todavía no cargaste pagos parciales.
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Stack spacing={1}>
              {installments.map((item) => (
                <InstallmentItem
                  key={item.id}
                  installment={item}
                  paymentCurrency={paymentCurrency}
                  onDelete={() => onDeleteInstallment(item)}
                  formatMoney={formatMoney}
                  formatDate={formatDate}
                />
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{marginLeft: 2}}
          >
            <Button
              variant="outlined"
              startIcon={<PaymentsRoundedIcon />}
              onClick={onAddInstallment}
              sx={{
                minHeight: 44,
                borderRadius: 999,
                color: "success.main",
                borderColor: alpha(theme.palette.success.main, 0.32),
                bgcolor: alpha(theme.palette.success.main, 0.08),
                fontWeight: 950,
                textTransform: "none",
                "&:hover": {
                  borderColor: "success.main",
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                },
              }}
            >
              Agregar pago
            </Button>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Tooltip title="Editar">
                <IconButton
                  onClick={onEdit}
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha("#FFFFFF", 0.06)
                        : alpha(theme.palette.primary.main, 0.08),
                    color: "primary.main",
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
                    width: 42,
                    height: 42,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: "error.main",
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
      </Collapse>
    </Card>
  );
}

function ProjectIcon({ payment }) {
  const theme = useTheme();

  const projectColor = payment.projectColor || theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: { xs: 52, md: 64 },
        height: { xs: 52, md: 64 },
        flexShrink: 0,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, projectColor),
        bgcolor: getProjectIconBackground(theme, projectColor),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(projectColor, 0.13)}`,
      }}
    >
      {payment.projectLogoUrl ? (
        <Box
          component="img"
          src={payment.projectLogoUrl}
          alt={payment.projectName || "Proyecto"}
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
            fontSize: { xs: 21, md: 27 },
            fontWeight: 950,
          }}
        >
          {payment.projectName?.charAt(0)?.toUpperCase() || "P"}
        </Typography>
      )}
    </Box>
  );
}

function AmountBox({ title, value, icon, color }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "14px",
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.075)
            : alpha("#0F172A", 0.075),
        boxShadow: "none",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.6 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            borderRadius: "11px",
            bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
            color,
          }}
        >
          {icon}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: { xs: 16.5, md: 19 },
              fontWeight: 950,
              letterSpacing: -0.25,
            }}
          >
            {value}
          </Typography>

          <Typography
            noWrap
            color="text.secondary"
            sx={{
              mt: 0.2,
              fontSize: 13,
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

function InstallmentItem({
  installment,
  paymentCurrency,
  onDelete,
  formatMoney,
  formatDate,
}) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "14px",
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.035)
            : alpha("#0F172A", 0.025),
        borderColor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.075)
            : alpha("#0F172A", 0.075),
        boxShadow: "none",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.6 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 43,
            height: 43,
            borderRadius: "11px",
            bgcolor: alpha(theme.palette.success.main, 0.12),
            color: "success.main",
          }}
        >
          <PaymentsRoundedIcon />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 950 }}>
            {formatMoney(installment.amount, paymentCurrency)}
          </Typography>

          <Typography noWrap color="text.secondary" sx={{ mt: 0.3, fontWeight: 700 }}>
            {installment.method || "Sin método"} · {formatDate(installment.date)}
          </Typography>

          {installment.note ? (
            <Typography
              color="text.secondary"
              sx={{
                mt: 0.4,
                fontSize: 14,
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              {installment.note}
            </Typography>
          ) : null}
        </Box>

        <Tooltip title="Eliminar pago">
          <IconButton
            onClick={onDelete}
            sx={{
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: "error.main",
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.18),
              },
            }}
          >
            <DeleteRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Card>
  );
}

function StatusChip({ label, icon, color, compact = false }) {
  const theme = useTheme();

  return (
    <Chip
      icon={icon}
      label={label}
      size={compact ? "small" : "medium"}
      sx={{
        height: compact ? 27 : { xs: 31, md: 36 },
        borderRadius: 999,
        bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
        color,
        border: "1px solid",
        borderColor: alpha(color, theme.palette.mode === "dark" ? 0.26 : 0.15),
        fontWeight: 950,
        "& .MuiChip-icon": {
          color,
        },
      }}
    />
  );
}

function CurrencyPill({ currency }) {
  const theme = useTheme();
  const info = getCurrencyInfo(currency);

  return (
    <Chip
      icon={info.icon}
      label={info.shortLabel}
      size="small"
      sx={{
        height: 27,
        borderRadius: 999,
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha("#FFFFFF", 0.055)
            : alpha("#0F172A", 0.045),
        color: "primary.main",
        fontWeight: 900,
        "& .MuiChip-icon": {
          color: theme.palette.primary.main,
        },
      }}
    />
  );
}

function EmptyState({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "18px",
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
            borderRadius: "15px",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            mb: 2.2,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.16),
          }}
        >
          <PaymentsRoundedIcon sx={{ fontSize: { xs: 34, md: 42 } }} />
        </Avatar>

        <Typography
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 950,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          No hay pagos para mostrar
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
          Cargá un proyecto y su monto total acordado para empezar a controlar
          cobros y pagos parciales.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 2.6,
            borderRadius: "12px",
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Nuevo registro
        </Button>
      </Stack>
    </Card>
  );
}

function PaymentFormDialog({
  open,
  editingPayment,
  projects,
  selectedProject,
  projectId,
  setProjectId,
  totalAmount,
  setTotalAmount,
  currency,
  setCurrency,
  notes,
  setNotes,
  saving,
  pageError,
  onClose,
  onSave,
}) {
  const theme = useTheme();
  const currencyInfo = getCurrencyInfo(currency);

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
                  borderRadius: "12px",
                  color: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, 0.16),
                }}
              >
                {editingPayment ? <EditRoundedIcon /> : <AddRoundedIcon />}
              </Avatar>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.35 }}>
                  {editingPayment ? "Editar registro" : "Nuevo registro"}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.4, fontWeight: 600, lineHeight: 1.5 }}
                >
                  Elegí el proyecto, moneda y monto total acordado.
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

        <Divider />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: { xs: 2.4, md: 3 } }}>
          <Stack spacing={2.4}>
            {pageError ? (
              <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            ) : null}

            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                Primero necesitás crear un proyecto para poder cargar pagos.
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
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1.2}
                        sx={{
                          width: "100%",
                          minHeight: 28,
                        }}
                      >
                        <Box
                          sx={{
                            width: 11,
                            height: 11,
                            borderRadius: 999,
                            bgcolor: project.color || theme.palette.primary.main,
                            boxShadow: `0 0 0 4px ${alpha(
                              project.color || theme.palette.primary.main,
                              0.1
                            )}`,
                            flexShrink: 0,
                            alignSelf: "center",
                            transform: "translateY(0px)",
                          }}
                        />

                        <Typography
                          component="span"
                          noWrap
                          sx={{
                            lineHeight: 1.2,
                            fontWeight: 700,
                          }}
                        >
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
                  borderRadius: "14px",
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

            <Box>
              <Typography sx={{ fontWeight: 950, mb: 1.2 }}>Moneda</Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                value={currency}
                onChange={(_, value) => {
                  if (value) setCurrency(value);
                }}
                disabled={saving}
                sx={{
                  gap: 1,
                  "& .MuiToggleButtonGroup-grouped": {
                    margin: 0,
                    border: "1px solid !important",
                    borderColor:
                      theme.palette.mode === "dark"
                        ? `${alpha("#FFFFFF", 0.09)} !important`
                        : `${alpha("#0F172A", 0.08)} !important`,
                    borderRadius: "14px !important",
                  },
                  "& .MuiToggleButton-root": {
                    py: 1.35,
                    fontWeight: 950,
                    textTransform: "none",
                    color: "text.secondary",
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha("#FFFFFF", 0.035)
                        : alpha("#0F172A", 0.025),
                    "&.Mui-selected": {
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: `${alpha(theme.palette.primary.main, 0.28)} !important`,
                    },
                  },
                }}
              >
                {CURRENCIES.map((item) => (
                  <ToggleButton
                    key={item.value}
                    value={item.value}
                    sx={{ minHeight: 72 }}
                  >
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      spacing={0.7}
                      sx={{ width: "100%", textAlign: "center" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          "& svg": { fontSize: 24 },
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Typography
                        component="span"
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 900,
                          lineHeight: 1.1,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Stack>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <TextField
              label={`Monto total acordado en ${currencyInfo.shortLabel}`}
              type="number"
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value)}
              fullWidth
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
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
                  borderRadius: "12px",
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
              borderRadius: "12px",
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || projects.length === 0}
            startIcon={editingPayment ? <EditRoundedIcon /> : <AddRoundedIcon />}
            sx={{
              minHeight: 45,
              px: 2.4,
              borderRadius: "12px",
              fontWeight: 950,
              textTransform: "none",
            }}
          >
            {saving
              ? "Guardando..."
              : editingPayment
              ? "Guardar cambios"
              : "Guardar registro"}
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
        borderRadius: "12px",
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

function InstallmentFormDialog({
  open,
  selectedPayment,
  installmentAmount,
  setInstallmentAmount,
  installmentMethod,
  setInstallmentMethod,
  installmentNote,
  setInstallmentNote,
  saving,
  pageError,
  onClose,
  onSave,
}) {
  const theme = useTheme();

  const currencyInfo = selectedPayment
    ? getCurrencyInfo(getCurrency(selectedPayment))
    : getCurrencyInfo("ARS");

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
                  borderRadius: "12px",
                  color: "success.main",
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.success.main, 0.16),
                }}
              >
                <PaymentsRoundedIcon />
              </Avatar>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: -0.35 }}>
                  Agregar pago
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mt: 0.4, fontWeight: 600, lineHeight: 1.5 }}
                >
                  {selectedPayment?.projectName || "Registro seleccionado"}
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

        <Divider />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: { xs: 2.4, md: 3 } }}>
          <Stack spacing={2.4}>
            {pageError ? (
              <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            ) : null}

            <Alert
              severity="info"
              icon={currencyInfo.icon}
              sx={{
                borderRadius: "14px",
                fontWeight: 700,
              }}
            >
              Este pago se carga en {currencyInfo.label}.
            </Alert>

            <TextField
              label="Monto pagado"
              type="number"
              value={installmentAmount}
              onChange={(event) => setInstallmentAmount(event.target.value)}
              fullWidth
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            <Box>
              <Typography sx={{ fontWeight: 950, mb: 1.2 }}>
                Método de pago
              </Typography>

              <Stack direction="row" flexWrap="wrap" gap={1}>
                {PAYMENT_METHODS.map((method) => {
                  const selected = installmentMethod === method;

                  return (
                    <Chip
                      key={method}
                      clickable
                      icon={
                        selected ? (
                          <CheckCircleRoundedIcon />
                        ) : (
                          <RadioButtonUncheckedRoundedIcon />
                        )
                      }
                      label={method}
                      onClick={() => setInstallmentMethod(method)}
                      sx={{
                        height: 38,
                        borderRadius: 999,
                        border: "1px solid",
                        borderColor: selected
                          ? alpha(theme.palette.primary.main, 0.28)
                          : theme.palette.mode === "dark"
                          ? alpha("#FFFFFF", 0.08)
                          : alpha("#0F172A", 0.08),
                        bgcolor: selected
                          ? alpha(theme.palette.primary.main, 0.1)
                          : theme.palette.mode === "dark"
                          ? alpha("#FFFFFF", 0.035)
                          : alpha("#0F172A", 0.025),
                        color: selected ? "primary.main" : "text.secondary",
                        fontWeight: 950,
                        "& .MuiChip-icon": {
                          color: selected ? "primary.main" : "text.secondary",
                        },
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            <TextField
              label="Nota"
              value={installmentNote}
              onChange={(event) => setInstallmentNote(event.target.value)}
              fullWidth
              multiline
              minRows={3}
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
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
              borderRadius: "12px",
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={<PaymentsRoundedIcon />}
            sx={{
              minHeight: 45,
              px: 2.4,
              borderRadius: "12px",
              fontWeight: 950,
              textTransform: "none",
            }}
          >
            {saving ? "Guardando..." : "Guardar pago"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function DeleteDialog({
  open,
  title,
  text,
  previewTitle,
  previewSubtitle,
  icon,
  onClose,
  onConfirm,
}) {
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
                "& svg": {
                  fontSize: 28,
                },
              }}
            >
              {icon || <DeleteRoundedIcon />}
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
                {title}
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
                {text}
              </Typography>
            </Box>
          </Stack>

          {previewTitle ? (
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
                {previewTitle}
              </Typography>

              {previewSubtitle ? (
                <Typography
                  sx={{
                    mt: 0.4,
                    color: theme.palette.app.secondary,
                    fontWeight: 700,
                    textAlign: "center",
                  }}
                >
                  {previewSubtitle}
                </Typography>
              ) : null}
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

function SummarySkeleton() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: { xs: 1.3, md: 1.8 },
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <Skeleton
          key={item}
          variant="rounded"
          height={88}
          sx={{ borderRadius: 3.5 }}
        />
      ))}

      <Skeleton
        variant="rounded"
        height={94}
        sx={{
          gridColumn: "1 / -1",
          borderRadius: "16px",
        }}
      />
    </Box>
  );
}

function PaymentsSkeleton() {
  const theme = useTheme();

  return (
    <Stack spacing={1.7}>
      {[1, 2, 3].map((item) => (
        <Card
          key={item}
          variant="outlined"
          sx={{
            borderRadius: "18px",
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
                width={64}
                height={64}
                sx={{ borderRadius: 2.7 }}
              />

              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Skeleton
                    variant="rounded"
                    width={95}
                    height={27}
                    sx={{ borderRadius: 999 }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={70}
                    height={27}
                    sx={{ borderRadius: 999 }}
                  />
                </Stack>

                <Skeleton variant="text" width="70%" height={30} />
                <Skeleton variant="text" width="48%" height={22} />
              </Box>

              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Skeleton variant="text" width={80} height={38} />
                <Skeleton
                  variant="rounded"
                  width={76}
                  height={28}
                  sx={{ mt: 1, borderRadius: 999 }}
                />
              </Box>
            </Stack>

            <Skeleton
              variant="rounded"
              width="100%"
              height={10}
              sx={{ mt: 2, borderRadius: 999 }}
            />
          </Box>
        </Card>
      ))}
    </Stack>
  );
}