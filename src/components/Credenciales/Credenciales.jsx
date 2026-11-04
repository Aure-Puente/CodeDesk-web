//Credenciales:
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AlternateEmailRoundedIcon from "@mui/icons-material/AlternateEmailRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byCreatedDesc, byName } from "../../shared/hooks/useUserCollection";
import { copyToClipboard, getShortUrl, normalizeUrl, projectFields } from "../../shared/utils";
import {
  VAULT_VERSION,
  createVault,
  decryptJson,
  encryptJson,
  getPasswordStrength,
  recoverVault,
  unlockVault,
} from "../../shared/utils/vault";
import {
  AppDialog,
  DeleteDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  FormDialog,
  IconAction,
  PageAlert,
  PageHeader,
  PageShell,
  ProjectAvatar,
  ProjectSelect,
  SearchField,
  Section,
  Stack,
  StatsGrid,
  Toast,
  getCardStyles,
  getSoftBackground,
  getSoftFadeSx,
  projectFilterOptions,
  roundedFieldSx,
  softTint,
  useToast,
} from "../../shared/ui";

const EMPTY_FORM = {
  projectId: "",
  prodUrl: "",
  prodEmail: "",
  prodPassword: "",
  localEmail: "",
  localPassword: "",
  notes: "",
};

const LOCK_AFTER = 5 * 60 * 1000;
const CLEAR_CLIPBOARD_AFTER = 30 * 1000;
const MIN_MASTER_LENGTH = 10;
const STRENGTH = [
  { label: "Muy débil", color: "error" },
  { label: "Débil", color: "error" },
  { label: "Aceptable", color: "warning" },
  { label: "Buena", color: "info" },
  { label: "Fuerte", color: "success" },
];

const hasProductionData = (c) =>
  c?.hasProduction ??
  Boolean(c?.production?.email || c?.production?.password || c?.production?.url);
const hasLocalData = (c) => c?.hasLocal ?? Boolean(c?.local?.email || c?.local?.password);

const validateMaster = (password, confirm) => {
  if (password.length < MIN_MASTER_LENGTH)
    return `La contraseña maestra necesita al menos ${MIN_MASTER_LENGTH} caracteres.`;
  if (getPasswordStrength(password) < 2)
    return "Usá una contraseña más fuerte: mezclá letras, números y símbolos.";
  if (password !== confirm) return "Las contraseñas no coinciden.";
  return "";
};

const formatShortDate = (ts) => {
  const date = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : null);
  return date
    ? new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" })
        .format(date)
        .replace(/ de /g, " ")
        .replace(".", "")
    : null;
};

const matchesSearch = (c, query) =>
  !query ||
  [c.projectName, c.production?.email, c.production?.url, c.local?.email, c.notes]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));

export default function Credenciales() {
  const theme = useTheme();
  const { user } = useAuth();
  const [projects] = useUserCollection("projects", { sort: byName });
  const [credentials, loading, loadError] = useUserCollection("credentials", {
    sort: byCreatedDesc,
    errorMessage: "No se pudieron cargar las credenciales.",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [filterProject, setFilterProject] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const [vault, setVault] = useState(undefined);
  const [dataKey, setDataKey] = useState(null);
  const [vaultDialog, setVaultDialog] = useState(null);
  const [pending, setPending] = useState(null);
  const [newVault, setNewVault] = useState(null);
  const clipboardTimer = useRef(null);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => setVault(snapshot.data()?.vault || null),
      (error) => {
        console.error(error);
        setVault(null);
        setPageError("No se pudo cargar la configuración de seguridad.");
      },
    );
  }, [user?.uid]);

  const lock = useCallback(() => {
    setDataKey(null);
    setSelected(null);
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }, []);

  useEffect(() => {
    if (!dataKey) return undefined;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(lock, LOCK_AFTER);
    };
    const events = ["pointerdown", "keydown", "scroll", "mousemove"];
    events.forEach((name) => window.addEventListener(name, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, reset));
    };
  }, [dataKey, lock]);

  useEffect(() => () => clearTimeout(clipboardTimer.current), []);

  const items = useMemo(
    () =>
      credentials.map((c) => {
        if (!c.secret) return { ...c, locked: false };
        if (!dataKey) return { ...c, locked: true };
        try {
          return { ...c, ...decryptJson(dataKey, c.secret), locked: false };
        } catch (error) {
          console.error(error);
          return { ...c, locked: true, broken: true };
        }
      }),
    [credentials, dataKey],
  );

  const requireUnlock = (action) => {
    if (dataKey) return action.run?.();
    setPending(action);
    setVaultDialog(vault ? "unlock" : "setup");
  };

  const env = {
    production: {
      label: "Producción",
      icon: <CloudQueueRoundedIcon />,
      color: theme.palette.info.main,
    },
    local: { label: "Local", icon: <LaptopRoundedIcon />, color: theme.palette.warning.main },
  };

  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      items.filter(
        (c) =>
          (filterProject === "todos" || c.projectId === filterProject) && matchesSearch(c, query),
      ),
    [items, filterProject, query],
  );
  const hasFilters = filterProject !== "todos" || Boolean(query);
  const resetFilters = () => {
    setFilterProject("todos");
    setSearch("");
  };

  const stats = useMemo(
    () => ({
      production: credentials.filter(hasProductionData).length,
      local: credentials.filter(hasLocalData).length,
      projects: new Set(credentials.map((c) => c.projectId).filter(Boolean)).size,
    }),
    [credentials],
  );

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const openForm = (credential = null) => {
    setEditing(credential);
    setForm(
      credential
        ? {
            projectId: credential.projectId || "",
            prodUrl: credential.production?.url || "",
            prodEmail: credential.production?.email || "",
            prodPassword: credential.production?.password || "",
            localEmail: credential.local?.email || "",
            localPassword: credential.local?.password || "",
            notes: credential.notes || "",
          }
        : EMPTY_FORM,
    );
    setFormError("");
    setFormOpen(true);
  };

  useEffect(() => {
    if (!dataKey || !pending) return;
    const action = pending;
    setPending(null);
    if (action.type === "new") return openForm();
    const item = items.find((c) => c.id === action.id);
    if (!item || item.locked) return;
    if (action.type === "open") setSelected(item);
    else openForm(item);
  }, [dataKey, pending, items]);

  const copyValue = async (value, label) => {
    if (!value)
      return showToast(`No hay ${label.toLowerCase()} para copiar.`, { severity: "warning" });
    const copied = await copyToClipboard(value);
    clearTimeout(clipboardTimer.current);
    if (copied && label === "Contraseña") {
      clipboardTimer.current = setTimeout(() => copyToClipboard(""), CLEAR_CLIPBOARD_AFTER);
    }
    showToast(
      copied
        ? label === "Contraseña"
          ? "Contraseña copiada. Se borra del portapapeles en 30 segundos."
          : `${label} copiado al portapapeles.`
        : "No se pudo copiar el dato.",
      { severity: copied ? "success" : "error" },
    );
  };

  const handleCreateVault = async (password) => {
    const created = await createVault(password);
    await setDoc(doc(db, "users", user.uid), { vault: created.vault }, { merge: true });
    setNewVault(created);
    setVaultDialog("recovery");
  };

  const handleUnlock = async (password) => {
    setDataKey(await unlockVault(vault, password));
    setVaultDialog(null);
  };

  const handleRecover = async (code, password) => {
    const recovered = await recoverVault(vault, code, password);
    await setDoc(doc(db, "users", user.uid), { vault: recovered.vault }, { merge: true });
    setDataKey(recovered.dataKey);
    setVaultDialog(null);
    showToast("Listo, tu nueva contraseña maestra ya está activa.");
  };

  const finishSetup = () => {
    setDataKey(newVault.dataKey);
    setNewVault(null);
    setVaultDialog(null);
    showToast("Bóveda creada. Tus credenciales se guardan cifradas.");
  };

  const closeVaultDialog = () => {
    setVaultDialog(null);
    setPending(null);
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (!form.projectId) return setFormError("Seleccioná un proyecto.");
    if (!dataKey) return setFormError("La bóveda se bloqueó. Desbloqueala para guardar.");

    const secret = {
      production: {
        email: form.prodEmail.trim(),
        password: form.prodPassword.trim(),
        url: form.prodUrl.trim(),
      },
      local: { email: form.localEmail.trim(), password: form.localPassword.trim() },
      notes: form.notes.trim(),
    };
    const payload = {
      userId: user.uid,
      ...projectFields(projects.find((project) => project.id === form.projectId)),
      v: VAULT_VERSION,
      secret: encryptJson(dataKey, secret),
      hasProduction: hasProductionData(secret),
      hasLocal: hasLocalData(secret),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");
      if (editing)
        await updateDoc(doc(db, "credentials", editing.id), {
          ...payload,
          production: deleteField(),
          local: deleteField(),
          notes: deleteField(),
        });
      else
        await addDoc(collection(db, "credentials"), { ...payload, createdAt: serverTimestamp() });
      setFormOpen(false);
      showToast(editing ? "Credencial actualizada." : "Credencial guardada.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudieron guardar las credenciales.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "credentials", toDelete.id));
      if (selected?.id === toDelete.id) setSelected(null);
      setToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudieron eliminar las credenciales.");
    }
  };

  const locked = Boolean(vault) && !dataKey;

  return (
    <PageShell
      loading={loading || vault === undefined}
      after={
        <>
          <FormDialog
            open={formOpen}
            onClose={() => !saving && setFormOpen(false)}
            onSubmit={handleSave}
            saving={saving}
            error={formError}
            maxWidth="md"
            icon={editing ? <EditRoundedIcon /> : <KeyRoundedIcon />}
            title={editing ? "Editar credencial" : "Nueva credencial"}
            subtitle="Accesos de producción y local para un proyecto."
            submitIcon={editing ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editing ? "Guardar cambios" : "Guardar credencial"}
            submitDisabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: "14px", fontWeight: 650 }}>
                Primero necesitás crear un proyecto para guardar credenciales.
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

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 1.75,
                alignItems: "start",
              }}
            >
              <EnvPanel {...env.production} subtitle="Deploy, hosting o panel online.">
                <IconField
                  label="URL"
                  icon={<LinkRoundedIcon />}
                  placeholder="https://..."
                  value={form.prodUrl}
                  onChange={setField("prodUrl")}
                  disabled={saving}
                />
                <IconField
                  label="Email / usuario"
                  icon={<AlternateEmailRoundedIcon />}
                  value={form.prodEmail}
                  onChange={setField("prodEmail")}
                  disabled={saving}
                />
                <IconField
                  label="Contraseña"
                  password
                  value={form.prodPassword}
                  onChange={setField("prodPassword")}
                  disabled={saving}
                />
              </EnvPanel>

              <EnvPanel {...env.local} subtitle="Entorno de desarrollo o pruebas.">
                <IconField
                  label="Email / usuario"
                  icon={<AlternateEmailRoundedIcon />}
                  value={form.localEmail}
                  onChange={setField("localEmail")}
                  disabled={saving}
                />
                <IconField
                  label="Contraseña"
                  password
                  value={form.localPassword}
                  onChange={setField("localPassword")}
                  disabled={saving}
                />
              </EnvPanel>
            </Box>

            <TextField
              label="Notas"
              placeholder="Roles, 2FA, dónde se renueva el acceso..."
              value={form.notes}
              onChange={setField("notes")}
              fullWidth
              multiline
              minRows={2}
              size="small"
              disabled={saving}
              sx={roundedFieldSx("12px")}
            />
          </FormDialog>

          <CredentialDetailDialog
            credential={selected}
            env={env}
            onClose={() => setSelected(null)}
            onEdit={() => {
              const credential = selected;
              setSelected(null);
              openForm(credential);
            }}
            onDelete={() => setToDelete(selected)}
            onCopy={copyValue}
          />

          <DeleteDialog
            open={Boolean(toDelete)}
            title="Eliminar credencial"
            previewTitle={toDelete?.projectName || "Proyecto sin nombre"}
            previewSubtitle="Se eliminarán los accesos de producción y local."
            onClose={() => setToDelete(null)}
            onConfirm={confirmDelete}
          />

          <MasterSetupDialog
            open={vaultDialog === "setup"}
            onClose={closeVaultDialog}
            onSubmit={handleCreateVault}
          />

          <RecoveryCodeDialog
            open={vaultDialog === "recovery"}
            code={newVault?.recoveryCode}
            onCopy={(value) => copyValue(value, "Clave de recuperación")}
            onDone={finishSetup}
          />

          <UnlockDialog
            open={vaultDialog === "unlock"}
            onClose={closeVaultDialog}
            onSubmit={handleUnlock}
            onForgot={() => setVaultDialog("recover")}
          />

          <RecoverDialog
            open={vaultDialog === "recover"}
            onClose={closeVaultDialog}
            onSubmit={handleRecover}
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<ShieldRoundedIcon />}
          title="Credenciales"
          description="Accesos por proyecto para producción y local, listos para copiar."
          actionLabel="Nueva credencial"
          onAction={() => requireUnlock({ type: "new", run: () => openForm() })}
        />
      </Section>

      <Section delay={40}>
        <VaultBar
          vault={vault}
          locked={locked}
          onSetup={() => setVaultDialog("setup")}
          onUnlock={() => setVaultDialog("unlock")}
          onLock={lock}
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      <Section delay={80}>
        <StatsGrid
          items={[
            {
              label: "Credenciales",
              value: credentials.length,
              icon: <KeyRoundedIcon />,
              color: theme.palette.primary.main,
            },
            {
              label: "Producción",
              value: stats.production,
              icon: env.production.icon,
              color: env.production.color,
            },
            { label: "Local", value: stats.local, icon: env.local.icon, color: env.local.color },
            {
              label: "Proyectos",
              value: stats.projects,
              icon: <FolderRoundedIcon />,
              color: theme.palette.success.main,
            },
          ]}
        />
      </Section>

      {credentials.length > 0 && (
        <Section delay={140}>
          <FilterBar
            title="Credenciales guardadas"
            subtitle={`${filtered.length} de ${credentials.length} visibles`}
            onReset={hasFilters ? resetFilters : undefined}
          >
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder={locked ? "Buscar proyecto..." : "Buscar proyecto, email o URL..."}
              width={280}
            />
            <FilterSelect
              label="Proyecto"
              value={filterProject}
              onChange={setFilterProject}
              minWidth={230}
            >
              {projectFilterOptions(projects, { withoutProject: false })}
            </FilterSelect>
          </FilterBar>
        </Section>
      )}

      <Section delay={200}>
        {credentials.length === 0 ? (
          <EmptyState
            icon={<KeyRoundedIcon />}
            title="Todavía no guardaste credenciales"
            text="Cargá los accesos de cada proyecto (producción y local) y copialos con un clic cuando los necesites."
            actionLabel="Nueva credencial"
            onAction={() => requireUnlock({ type: "new", run: () => openForm() })}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchOffRoundedIcon />}
            title="Sin resultados"
            text="Ninguna credencial coincide con la búsqueda o el proyecto elegido."
            actionLabel="Limpiar filtros"
            actionIcon={<FolderRoundedIcon />}
            onAction={resetFilters}
          />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" },
              gap: { xs: 1.5, md: 1.75 },
            }}
          >
            {filtered.map((credential, index) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                env={env}
                delay={index * 45}
                onOpen={() =>
                  credential.locked
                    ? requireUnlock({ type: "open", id: credential.id })
                    : setSelected(credential)
                }
                onCopy={copyValue}
              />
            ))}
          </Box>
        )}
      </Section>
    </PageShell>
  );
}

function IconField({ icon, password = false, ...props }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      fullWidth
      size="small"
      type={password && !visible ? "password" : "text"}
      sx={{
        ...roundedFieldSx("12px"),
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
          backgroundColor: theme.palette.app.surface,
        },
        "& .MuiInputAdornment-root svg": { fontSize: 19, color: theme.palette.app.secondary },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              {password ? <PasswordRoundedIcon /> : icon}
            </InputAdornment>
          ),
          endAdornment: password && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setVisible(!visible)}
                edge="end"
                aria-label={visible ? "Ocultar" : "Mostrar"}
              >
                {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...props}
    />
  );
}

function TintIcon({ color, size = 32, children }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: `${Math.round(size * 0.32)}px`,
        display: "grid",
        placeItems: "center",
        color,
        backgroundColor: softTint(theme, color),
        "& svg": { fontSize: size * 0.56 },
      }}
    >
      {children}
    </Box>
  );
}

function EnvPanel({ label, subtitle, icon, color, children, action }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: "16px",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        bgcolor: getSoftBackground(theme),
        p: 1.6,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          background: `linear-gradient(90deg, ${color}, ${alpha(color, 0)})`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <TintIcon color={color}>{icon}</TintIcon>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ color: theme.palette.app.text, fontSize: "0.92rem", fontWeight: 800 }}>
            {label}
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
        {action}
      </Stack>
      <Stack spacing={1.4} sx={{ mt: 1.6 }}>
        {children}
      </Stack>
    </Box>
  );
}

function CredentialCard({ credential, env, delay, onOpen, onCopy }) {
  const theme = useTheme();
  const projectColor = credential.projectColor || theme.palette.primary.main;
  const updated = formatShortDate(credential.updatedAt || credential.createdAt);

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        p: { xs: 1.6, md: 1.75 },
        cursor: "pointer",
        transition: "border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          borderColor: alpha(projectColor, 0.4),
          transform: "translateY(-2px)",
          boxShadow: `0 14px 34px ${alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
        "&:hover .card-arrow": { color: theme.palette.primary.main, transform: "translateX(2px)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.3}>
        <ProjectAvatar item={credential} size={40} />
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
            {credential.projectName || "Proyecto sin nombre"}
          </Typography>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
          >
            {updated ? `Actualizado ${updated}` : "Accesos guardados"}
          </Typography>
        </Box>
        {credential.locked ? (
          <LockRoundedIcon sx={{ fontSize: 18, color: theme.palette.app.secondary }} />
        ) : (
          <ArrowForwardRoundedIcon
            className="card-arrow"
            sx={{ fontSize: 19, color: theme.palette.app.secondary, transition: "all 0.18s ease" }}
          />
        )}
      </Stack>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        <EnvLine
          {...env.production}
          data={credential.production}
          value={credential.production?.email || getShortUrl(credential.production?.url)}
          hasData={hasProductionData(credential)}
          locked={credential.locked}
          onCopy={onCopy}
        />
        <EnvLine
          {...env.local}
          data={credential.local}
          value={credential.local?.email}
          hasData={hasLocalData(credential)}
          locked={credential.locked}
          onCopy={onCopy}
        />
      </Stack>
    </Card>
  );
}

function EnvLine({ label, icon, color, data, value, hasData, locked, onCopy }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.1}
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: "12px",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        opacity: hasData ? 1 : 0.55,
      }}
    >
      <TintIcon color={color} size={28}>
        {icon}
      </TintIcon>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            color,
            fontSize: "0.66rem",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.3,
          }}
        >
          {label}
        </Typography>
        <Typography
          noWrap
          sx={{
            color: hasData ? theme.palette.app.text : theme.palette.app.secondary,
            fontSize: "0.82rem",
            fontWeight: 650,
          }}
        >
          {!hasData
            ? "Sin datos cargados"
            : locked
              ? "•••••••• · bloqueado"
              : value || "Sin usuario"}
        </Typography>
      </Box>
      {hasData && !locked && (
        <Stack direction="row" spacing={0.5}>
          <IconAction
            title="Copiar usuario"
            size={30}
            color={theme.palette.app.secondary}
            disabled={!data?.email}
            onClick={() => onCopy(data?.email, "Usuario")}
          >
            <AlternateEmailRoundedIcon sx={{ fontSize: 16 }} />
          </IconAction>
          <IconAction
            title="Copiar contraseña"
            size={30}
            color={theme.palette.primary.main}
            disabled={!data?.password}
            onClick={() => onCopy(data?.password, "Contraseña")}
          >
            <KeyRoundedIcon sx={{ fontSize: 16 }} />
          </IconAction>
        </Stack>
      )}
    </Stack>
  );
}

function CredentialDetailDialog({ credential, env, onClose, onEdit, onDelete, onCopy }) {
  const theme = useTheme();
  if (!credential) return null;
  const updated = formatShortDate(credential.updatedAt || credential.createdAt);
  const url = credential.production?.url;

  return (
    <AppDialog
      open
      onClose={onClose}
      maxWidth="md"
      header={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ProjectAvatar item={credential} size={46} shadow />
          <Box sx={{ minWidth: 0 }}>
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
              {credential.projectName || "Proyecto sin nombre"}
            </Typography>
            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {updated ? `Credenciales · actualizado ${updated}` : "Credenciales del proyecto"}
            </Typography>
          </Box>
        </Stack>
      }
      actions={
        <>
          <Button
            color="error"
            startIcon={<DeleteRoundedIcon />}
            onClick={onDelete}
            sx={{ mr: "auto", minHeight: 40, px: 1.6, borderRadius: "12px", fontWeight: 750 }}
          >
            Eliminar
          </Button>
          <Button
            variant="contained"
            startIcon={<EditRoundedIcon />}
            onClick={onEdit}
            sx={{
              minHeight: 40,
              px: 2.2,
              borderRadius: "12px",
              fontWeight: 800,
              boxShadow: "none",
            }}
          >
            Editar
          </Button>
        </>
      }
    >
      <Stack spacing={1.75}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 1.75,
            alignItems: "start",
          }}
        >
          <EnvPanel
            {...env.production}
            subtitle="Entorno publicado"
            action={
              url && (
                <Tooltip title="Abrir URL">
                  <IconButton
                    size="small"
                    component="a"
                    href={normalizeUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: env.production.color }}
                  >
                    <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )
            }
          >
            <CopyRow label="URL" value={url} onCopy={onCopy} />
            <CopyRow label="Usuario" value={credential.production?.email} onCopy={onCopy} />
            <CopyRow
              label="Contraseña"
              value={credential.production?.password}
              isPassword
              onCopy={onCopy}
            />
          </EnvPanel>

          <EnvPanel {...env.local} subtitle="Desarrollo y pruebas">
            <CopyRow label="Usuario" value={credential.local?.email} onCopy={onCopy} />
            <CopyRow
              label="Contraseña"
              value={credential.local?.password}
              isPassword
              onCopy={onCopy}
            />
          </EnvPanel>
        </Box>

        {credential.notes && (
          <EnvPanel label="Notas" icon={<NoteAltRoundedIcon />} color={theme.palette.primary.main}>
            <Typography
              sx={{
                mt: -0.4,
                color: theme.palette.app.secondary,
                fontSize: "0.88rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                fontWeight: 550,
              }}
            >
              {credential.notes}
            </Typography>
          </EnvPanel>
        )}
      </Stack>
    </AppDialog>
  );
}

function CopyRow({ label, value, isPassword = false, onCopy }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const hidden = isPassword && value && !visible;
  const smallButton = { width: 30, height: 30, borderRadius: "9px", "& svg": { fontSize: 17 } };

  return (
    <Box>
      <Typography
        sx={{ mb: 0.5, color: theme.palette.app.secondary, fontSize: "0.72rem", fontWeight: 700 }}
      >
        {label}
      </Typography>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          pl: 1.3,
          pr: 0.5,
          height: 40,
          borderRadius: "11px",
          bgcolor: theme.palette.app.surface,
          border: `1px solid ${theme.palette.app.borderSoft}`,
        }}
      >
        <Typography
          noWrap
          sx={{
            flex: 1,
            minWidth: 0,
            color: value ? theme.palette.app.text : theme.palette.app.secondary,
            fontSize: "0.86rem",
            fontWeight: value ? 650 : 500,
            fontFamily:
              isPassword && value ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
            letterSpacing: hidden ? "0.12em" : undefined,
          }}
        >
          {hidden ? "••••••••••" : value || "Sin dato"}
        </Typography>

        {isPassword && value && (
          <Tooltip title={visible ? "Ocultar" : "Mostrar"}>
            <IconButton
              onClick={() => setVisible(!visible)}
              aria-label={visible ? "Ocultar" : "Mostrar"}
              sx={{ ...smallButton, color: theme.palette.app.secondary }}
            >
              {visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
            </IconButton>
          </Tooltip>
        )}
        {value && (
          <Tooltip title="Copiar">
            <IconButton
              onClick={() => onCopy(value, label)}
              aria-label={`Copiar ${label.toLowerCase()}`}
              sx={{
                ...smallButton,
                color: theme.palette.primary.main,
                bgcolor: softTint(theme, theme.palette.primary.main, 0.08, 0.12),
              }}
            >
              <ContentCopyRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

function VaultBar({ vault, locked, onSetup, onUnlock, onLock }) {
  const theme = useTheme();
  const state = !vault
    ? {
        icon: <ShieldRoundedIcon />,
        color: theme.palette.primary.main,
        title: "Protegé tus credenciales",
        text: "Creá una contraseña maestra: tus accesos se cifran en tu dispositivo antes de guardarse.",
        action: (
          <Button
            variant="contained"
            startIcon={<GppGoodRoundedIcon />}
            onClick={onSetup}
            sx={{ minHeight: 40, px: 2, borderRadius: "12px", fontWeight: 800, boxShadow: "none" }}
          >
            Crear contraseña maestra
          </Button>
        ),
      }
    : locked
      ? {
          icon: <LockRoundedIcon />,
          color: theme.palette.warning.main,
          title: "Credenciales bloqueadas",
          text: "Ingresá tu contraseña maestra para ver, copiar y editar los accesos.",
          action: (
            <Button
              variant="contained"
              startIcon={<LockOpenRoundedIcon />}
              onClick={onUnlock}
              sx={{
                minHeight: 40,
                px: 2,
                borderRadius: "12px",
                fontWeight: 800,
                boxShadow: "none",
              }}
            >
              Desbloquear
            </Button>
          ),
        }
      : {
          icon: <LockOpenRoundedIcon />,
          color: theme.palette.success.main,
          title: "Credenciales desbloqueadas",
          text: "Se bloquean solas tras 5 minutos sin uso o al salir de esta sección.",
          action: (
            <Button
              startIcon={<LockRoundedIcon />}
              onClick={onLock}
              sx={{
                minHeight: 40,
                px: 1.8,
                borderRadius: "12px",
                fontWeight: 750,
                border: `1px solid ${theme.palette.app.borderSoft}`,
                color: theme.palette.app.text,
              }}
            >
              Bloquear
            </Button>
          ),
        };

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme, "18px"),
        p: { xs: 1.6, md: 1.75 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: 1.5,
        borderColor: alpha(state.color, 0.3),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.4} sx={{ flex: 1, minWidth: 0 }}>
        <TintIcon color={state.color} size={40}>
          {state.icon}
        </TintIcon>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: theme.palette.app.text, fontSize: "0.95rem", fontWeight: 800 }}>
            {state.title}
          </Typography>
          <Typography
            sx={{ color: theme.palette.app.secondary, fontSize: "0.8rem", fontWeight: 600 }}
          >
            {state.text}
          </Typography>
        </Box>
      </Stack>
      {state.action}
    </Card>
  );
}

function StrengthMeter({ password }) {
  const theme = useTheme();
  if (!password) return null;
  const score = getPasswordStrength(password);
  const level = STRENGTH[score];

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={(score / 4) * 100}
        color={level.color}
        sx={{ height: 6, borderRadius: 999, bgcolor: theme.palette.app.borderSoft }}
      />
      <Typography
        sx={{
          mt: 0.6,
          fontSize: "0.74rem",
          fontWeight: 700,
          color: theme.palette[level.color].main,
        }}
      >
        Seguridad: {level.label}
      </Typography>
    </Box>
  );
}

function useVaultForm(open) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setBusy(false);
      setError("");
    }
  }, [open]);

  const run = async (action, failMessage) => {
    try {
      setBusy(true);
      setError("");
      await action();
    } catch (failure) {
      console.error(failure);
      setError(failMessage);
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, setError, run };
}

function MasterSetupDialog({ open, onClose, onSubmit }) {
  const theme = useTheme();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, setError, run } = useVaultForm(open);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
    }
  }, [open]);

  const submit = (event) => {
    event?.preventDefault();
    const problem = validateMaster(password, confirm);
    if (problem) return setError(problem);
    run(() => onSubmit(password), "No se pudo crear la bóveda. Intentá de nuevo.");
  };

  return (
    <FormDialog
      open={open}
      onClose={() => !busy && onClose()}
      onSubmit={submit}
      saving={busy}
      error={error}
      icon={<GppGoodRoundedIcon />}
      title="Crear contraseña maestra"
      subtitle="Cifra tus credenciales antes de guardarlas."
      submitIcon={<LockRoundedIcon />}
      submitLabel="Crear y proteger"
    >
      <Alert severity="info" sx={{ borderRadius: "14px", fontWeight: 600 }}>
        No se guarda en ningún lado, ni siquiera en tu cuenta. Si la olvidás, solo vas a poder
        recuperar el acceso con la clave de recuperación que te mostramos a continuación.
      </Alert>
      <IconField
        label="Contraseña maestra"
        password
        autoFocus
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={busy}
      />
      <StrengthMeter password={password} />
      <IconField
        label="Repetir contraseña maestra"
        password
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        disabled={busy}
      />
      <Typography sx={{ color: theme.palette.app.secondary, fontSize: "0.76rem", fontWeight: 600 }}>
        Mínimo {MIN_MASTER_LENGTH} caracteres. Una frase larga es más segura y fácil de recordar.
      </Typography>
    </FormDialog>
  );
}

function RecoveryCodeDialog({ open, code, onCopy, onDone }) {
  const theme = useTheme();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) setSaved(false);
  }, [open]);

  return (
    <AppDialog
      open={open}
      locked
      onClose={() => {}}
      icon={<LockResetRoundedIcon />}
      iconColor={theme.palette.warning.main}
      title="Tu clave de recuperación"
      subtitle="Es la única forma de recuperar el acceso si olvidás la contraseña maestra."
      actions={
        <Button
          variant="contained"
          disabled={!saved}
          onClick={onDone}
          sx={{ minHeight: 40, px: 2.2, borderRadius: "12px", fontWeight: 800, boxShadow: "none" }}
        >
          Continuar
        </Button>
      }
    >
      <Stack spacing={1.75}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            p: 1.5,
            borderRadius: "14px",
            border: `1px dashed ${alpha(theme.palette.warning.main, 0.5)}`,
            bgcolor: softTint(theme, theme.palette.warning.main, 0.06, 0.1),
          }}
        >
          <Typography
            sx={{
              flex: 1,
              textAlign: "center",
              color: theme.palette.app.text,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: { xs: "1rem", sm: "1.15rem" },
              fontWeight: 800,
              letterSpacing: "0.08em",
              userSelect: "all",
              overflowWrap: "anywhere",
            }}
          >
            {code}
          </Typography>
          <Tooltip title="Copiar">
            <IconButton onClick={() => onCopy(code)} aria-label="Copiar clave de recuperación">
              <ContentCopyRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
        </Stack>
        <Typography
          sx={{ color: theme.palette.app.secondary, fontSize: "0.84rem", fontWeight: 600 }}
        >
          Anotala en papel o guardala en un lugar seguro fuera de CodeDesk. No la vas a poder ver de
          nuevo.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox checked={saved} onChange={(event) => setSaved(event.target.checked)} />
          }
          label="Ya la guardé en un lugar seguro"
          sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.88rem", fontWeight: 700 } }}
        />
      </Stack>
    </AppDialog>
  );
}

function UnlockDialog({ open, onClose, onSubmit, onForgot }) {
  const [password, setPassword] = useState("");
  const { busy, error, setError, run } = useVaultForm(open);

  useEffect(() => {
    if (open) setPassword("");
  }, [open]);

  const submit = (event) => {
    event?.preventDefault();
    if (!password) return setError("Ingresá tu contraseña maestra.");
    run(() => onSubmit(password), "Contraseña maestra incorrecta.");
  };

  return (
    <FormDialog
      open={open}
      onClose={() => !busy && onClose()}
      onSubmit={submit}
      saving={busy}
      error={error}
      icon={<LockRoundedIcon />}
      title="Desbloquear credenciales"
      subtitle="Ingresá tu contraseña maestra."
      submitIcon={<LockOpenRoundedIcon />}
      submitLabel={busy ? "Verificando..." : "Desbloquear"}
    >
      <IconField
        label="Contraseña maestra"
        password
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={busy}
      />
      <Button
        onClick={onForgot}
        disabled={busy}
        sx={{ alignSelf: "flex-start", px: 0.5, fontWeight: 750, textTransform: "none" }}
      >
        Olvidé mi contraseña maestra
      </Button>
    </FormDialog>
  );
}

function RecoverDialog({ open, onClose, onSubmit }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { busy, error, setError, run } = useVaultForm(open);

  useEffect(() => {
    if (open) {
      setCode("");
      setPassword("");
      setConfirm("");
    }
  }, [open]);

  const submit = (event) => {
    event?.preventDefault();
    if (!code.trim()) return setError("Ingresá tu clave de recuperación.");
    const problem = validateMaster(password, confirm);
    if (problem) return setError(problem);
    run(() => onSubmit(code, password), "La clave de recuperación no es correcta.");
  };

  return (
    <FormDialog
      open={open}
      onClose={() => !busy && onClose()}
      onSubmit={submit}
      saving={busy}
      error={error}
      icon={<LockResetRoundedIcon />}
      title="Recuperar acceso"
      subtitle="Usá tu clave de recuperación y elegí una nueva contraseña maestra."
      submitIcon={<LockResetRoundedIcon />}
      submitLabel="Restablecer"
    >
      <IconField
        label="Clave de recuperación"
        icon={<KeyRoundedIcon />}
        autoFocus
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        disabled={busy}
      />
      <IconField
        label="Nueva contraseña maestra"
        password
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={busy}
      />
      <StrengthMeter password={password} />
      <IconField
        label="Repetir nueva contraseña"
        password
        autoComplete="new-password"
        value={confirm}
        onChange={(event) => setConfirm(event.target.value)}
        disabled={busy}
      />
    </FormDialog>
  );
}
