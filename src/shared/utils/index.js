//Index
export const projectFields = (project) => ({
  projectId: project?.id || null,
  projectName: project?.name || null,
  projectColor: project?.color || null,
  projectLogoUrl: project?.logoUrl || null,
});

export const normalizeUrl = (value) => {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
};

export const getShortUrl = (value) => {
  const clean = String(value || "").trim();
  if (!clean) return "Sin enlace";

  try {
    const url = new URL(normalizeUrl(clean));
    const path = url.pathname && url.pathname !== "/" ? url.pathname : "";
    return `${url.hostname}${path}${url.search || ""}`;
  } catch {
    return clean.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
};

export const getPaidAmount = (payment) =>
  (payment?.installments || []).reduce((total, item) => total + Number(item?.amount || 0), 0);

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    return true;
  } catch {
    return false;
  }
};

// ---- Pagos ----
export const formatMoney = (value, currency = "ARS") =>
  `${currency === "USD" ? "US$" : "$"}${Number(value || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;

export const formatDate = (date) => {
  const parsed = new Date(date);
  return date && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString("es-AR") : "Sin fecha";
};

export const getPaymentStatus = (payment) => {
  const total = Number(payment?.totalAmount || 0);
  const paid = getPaidAmount(payment);
  if (total > 0 && paid >= total) return "pagado";
  if (paid > 0) return "parcial";
  return "no_pagado";
};

export const withPaymentInfo = (payment) => {
  const total = Number(payment.totalAmount || 0);
  const paid = getPaidAmount(payment);

  return {
    ...payment,
    currency: payment.currency || "ARS",
    paidAmount: paid,
    pendingAmount: Math.max(total - paid, 0),
    progress: total > 0 ? Math.min(paid / total, 1) : 0,
    paymentStatus: getPaymentStatus(payment),
  };
};
