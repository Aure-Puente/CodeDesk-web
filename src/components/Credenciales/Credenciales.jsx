//Credenciales:
import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  Alert,
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
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
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LaptopRoundedIcon from "@mui/icons-material/LaptopRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
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

const hasProductionData = (c) =>
  Boolean(c?.production?.email || c?.production?.password || c?.production?.url);
const hasLocalData = (c) => Boolean(c?.local?.email || c?.local?.password);

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
      credentials.filter(
        (c) =>
          (filterProject === "todos" || c.projectId === filterProject) && matchesSearch(c, query),
      ),
    [credentials, filterProject, query],
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

  const copyValue = async (value, label) => {
    if (!value)
      return showToast(`No hay ${label.toLowerCase()} para copiar.`, { severity: "warning" });
    const copied = await copyToClipboard(value);
    showToast(copied ? `${label} copiado al portapapeles.` : "No se pudo copiar el dato.", {
      severity: copied ? "success" : "error",
    });
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (!form.projectId) return setFormError("Seleccioná un proyecto.");

    const payload = {
      userId: user.uid,
      ...projectFields(projects.find((project) => project.id === form.projectId)),
      production: {
        email: form.prodEmail.trim(),
        password: form.prodPassword.trim(),
        url: form.prodUrl.trim(),
      },
      local: { email: form.localEmail.trim(), password: form.localPassword.trim() },
      notes: form.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");
      if (editing) await updateDoc(doc(db, "credentials", editing.id), payload);
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

  return (
    <PageShell
      loading={loading}
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
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
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
          onAction={() => openForm()}
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
              placeholder="Buscar proyecto, email o URL..."
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
            onAction={() => openForm()}
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
                onOpen={() => setSelected(credential)}
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
        <ArrowForwardRoundedIcon
          className="card-arrow"
          sx={{ fontSize: 19, color: theme.palette.app.secondary, transition: "all 0.18s ease" }}
        />
      </Stack>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        <EnvLine
          {...env.production}
          data={credential.production}
          value={credential.production?.email || getShortUrl(credential.production?.url)}
          hasData={hasProductionData(credential)}
          onCopy={onCopy}
        />
        <EnvLine
          {...env.local}
          data={credential.local}
          value={credential.local?.email}
          hasData={hasLocalData(credential)}
          onCopy={onCopy}
        />
      </Stack>
    </Card>
  );
}

function EnvLine({ label, icon, color, data, value, hasData, onCopy }) {
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
          {hasData ? value || "Sin usuario" : "Sin datos cargados"}
        </Typography>
      </Box>
      {hasData && (
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
