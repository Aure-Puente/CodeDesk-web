//Proyectos:
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  Alert,
  Box,
  Button,
  Card,
  InputAdornment,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { HexColorPicker } from "react-colorful";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FolderOffRoundedIcon from "@mui/icons-material/FolderOffRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import MonitorRoundedIcon from "@mui/icons-material/MonitorRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PauseCircleRoundedIcon from "@mui/icons-material/PauseCircleRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import WorkspacesRoundedIcon from "@mui/icons-material/WorkspacesRounded";
import { db, storage } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection from "../../shared/hooks/useUserCollection";
import { formatMoney, getShortUrl, normalizeUrl, withPaymentInfo } from "../../shared/utils";
import {
  AppDialog,
  DeleteDialog,
  EmptyState,
  FilterBar,
  FormDialog,
  IconAction,
  PageAlert,
  PageHeader,
  PageShell,
  ProjectAvatar,
  SearchField,
  Section,
  Stack,
  StatsGrid,
  Toast,
  getCardStyles,
  getProjectIconBackground,
  getProjectIconBorder,
  getSoftBackground,
  getSoftFadeSx,
  roundedFieldSx,
  softTint,
  useToast,
} from "../../shared/ui";
import { getChecklist, getStatusLabel as getTaskStatusLabel } from "../Tareas/taskUtils";

const PRESET_COLORS = [
  "#2563EB",
  "#0891B2",
  "#0F766E",
  "#16A34A",
  "#65A30D",
  "#CA8A04",
  "#EA580C",
  "#DC2626",
  "#DB2777",
  "#9333EA",
  "#4F46E5",
  "#475569",
];
const HEX_RE = /^#[0-9a-f]{6}$/i;

const STATUS = {
  activo: {
    label: "Activo",
    plural: "Activos",
    icon: <RocketLaunchRoundedIcon />,
    color: (t) => t.palette.info.main,
    order: 1,
  },
  pausado: {
    label: "Pausado",
    plural: "Pausados",
    icon: <PauseCircleRoundedIcon />,
    color: (t) => t.palette.warning.main,
    order: 2,
  },
  finalizado: {
    label: "Finalizado",
    plural: "Finalizados",
    icon: <CheckCircleRoundedIcon />,
    color: (t) => t.palette.success.main,
    order: 3,
  },
};
const getStatus = (status) => STATUS[status] || STATUS.activo;

const PROJECT_TYPES = [
  { value: "mobile", label: "Mobile", icon: <SmartphoneRoundedIcon /> },
  { value: "web", label: "Web", icon: <MonitorRoundedIcon /> },
  { value: "both", label: "Web + Mobile", icon: <DevicesRoundedIcon /> },
];
const getProjectType = (value) =>
  PROJECT_TYPES.find((type) => type.value === value) || PROJECT_TYPES[1];

const LINKED = [
  {
    key: "tasks",
    collection: "tasks",
    label: "Tareas",
    fem: true,
    icon: <FormatListBulletedRoundedIcon />,
  },
  { key: "notes", collection: "notes", label: "Notas", fem: true, icon: <NotesRoundedIcon /> },
  { key: "links", collection: "projectLinks", label: "Enlaces", icon: <LinkRoundedIcon /> },
  {
    key: "credentials",
    collection: "credentials",
    label: "Credenciales",
    fem: true,
    icon: <KeyRoundedIcon />,
  },
  {
    key: "databases",
    collection: "databasesInfo",
    label: "Bases de datos",
    short: "Bases",
    fem: true,
    icon: <StorageRoundedIcon />,
  },
  { key: "payments", collection: "payments", label: "Pagos", icon: <PaymentsRoundedIcon /> },
];
const emptyRelated = () => Object.fromEntries(LINKED.map((l) => [l.key, []]));

const EMPTY_FORM = {
  name: "",
  client: "",
  description: "",
  color: PRESET_COLORS[0],
  status: "activo",
  projectType: "web",
};

const byStatusThenDate = (a, b) =>
  getStatus(a.status).order - getStatus(b.status).order ||
  (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);

const getTaskProgress = (tasks) => {
  const items = tasks.flatMap((task) => {
    const checklist = getChecklist(task);
    return checklist.length ? checklist.map((item) => item.done) : [task.status === "completada"];
  });
  const done = items.filter(Boolean).length;
  return {
    done,
    total: items.length,
    percent: items.length ? Math.round((done / items.length) * 100) : 0,
  };
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

export default function Proyectos() {
  const theme = useTheme();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [projects, loading, loadError] = useUserCollection("projects", {
    sort: byStatusThenDate,
    errorMessage: "No se pudieron cargar los proyectos.",
  });
  const [tasks] = useUserCollection("tasks");
  const [notes] = useUserCollection("notes");
  const [links] = useUserCollection("projectLinks");
  const [credentials] = useUserCollection("credentials");
  const [databases] = useUserCollection("databasesInfo");
  const [payments] = useUserCollection("payments");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [logo, setLogo] = useState({ file: null, preview: null, current: null });
  const [detailId, setDetailId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  useEffect(() => () => logo.preview && URL.revokeObjectURL(logo.preview), [logo.preview]);

  const relatedByProject = useMemo(() => {
    const linked = { tasks, notes, links, credentials, databases, payments };
    const map = {};
    LINKED.forEach(({ key }) =>
      linked[key].forEach((item) => {
        if (!item.projectId) return;
        map[item.projectId] ||= emptyRelated();
        map[item.projectId][key].push(item);
      }),
    );
    return map;
  }, [tasks, notes, links, credentials, databases, payments]);

  const getRelated = (projectId) => relatedByProject[projectId] || emptyRelated();

  const stats = useMemo(() => {
    const count = (status) => projects.filter((project) => project.status === status).length;
    return { activo: count("activo"), pausado: count("pausado"), finalizado: count("finalizado") };
  }, [projects]);

  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      projects.filter(
        (project) =>
          (filter === "todos" || getStatus(project.status) === STATUS[filter]) &&
          (!query ||
            `${project.name || ""} ${project.client || ""} ${project.description || ""}`
              .toLowerCase()
              .includes(query)),
      ),
    [projects, filter, query],
  );
  const hasFilters = filter !== "todos" || Boolean(query);
  const resetFilters = () => {
    setFilter("todos");
    setSearch("");
  };

  const detailProject = projects.find((project) => project.id === detailId) || null;

  const openForm = (project = null) => {
    setEditing(project);
    setForm(
      project
        ? {
            name: project.name || "",
            client: project.client || "",
            description: project.description || "",
            color: HEX_RE.test(project.color || "") ? project.color : PRESET_COLORS[0],
            status: STATUS[project.status] ? project.status : "activo",
            projectType: project.projectType || "web",
          }
        : EMPTY_FORM,
    );
    setLogo({ file: null, preview: null, current: project?.logoUrl || null });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormError("");
    setFormOpen(true);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) return setFormError("Elegí un archivo de imagen.");
    setLogo((current) => ({ ...current, file, preview: URL.createObjectURL(file) }));
  };

  const removeLogo = () => {
    setLogo({ file: null, preview: null, current: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadLogo = async (projectId) => {
    if (!logo.file) return logo.current || null;
    const extension = logo.file.name?.split(".")?.pop() || "jpg";
    const logoRef = ref(
      storage,
      `projectLogos/${user.uid}/${projectId}-${Date.now()}.${extension}`,
    );
    await uploadBytes(logoRef, logo.file);
    return getDownloadURL(logoRef);
  };

  const syncLinkedDocs = async (projectId, fields) => {
    const refs = LINKED.flatMap(({ key, collection: name }) =>
      (relatedByProject[projectId]?.[key] || []).map((item) => doc(db, name, item.id)),
    );
    for (let i = 0; i < refs.length; i += 450) {
      const batch = writeBatch(db);
      refs.slice(i, i + 450).forEach((docRef) => batch.update(docRef, fields));
      await batch.commit();
    }
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (!form.name.trim()) return setFormError("El proyecto necesita un nombre.");
    if (!HEX_RE.test(form.color)) return setFormError("El color tiene que ser un HEX válido.");

    const data = {
      name: form.name.trim(),
      client: form.client.trim(),
      description: form.description.trim(),
      color: form.color.toUpperCase(),
      status: form.status,
      projectType: form.projectType,
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");

      if (editing) {
        const logoUrl = await uploadLogo(editing.id);
        await updateDoc(doc(db, "projects", editing.id), { ...data, logoUrl });
        if (
          data.name !== editing.name ||
          data.color !== editing.color ||
          logoUrl !== (editing.logoUrl || null)
        ) {
          await syncLinkedDocs(editing.id, {
            projectName: data.name,
            projectColor: data.color,
            projectLogoUrl: logoUrl,
          });
        }
      } else {
        const created = await addDoc(collection(db, "projects"), {
          ...data,
          userId: user.uid,
          logoUrl: null,
          createdAt: serverTimestamp(),
        });
        const logoUrl = await uploadLogo(created.id);
        if (logoUrl) await updateDoc(created, { logoUrl, updatedAt: serverTimestamp() });
      }

      setFormOpen(false);
      showToast(editing ? "Proyecto actualizado." : "Proyecto creado.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "projects", toDelete.id));
      if (detailId === toDelete.id) setDetailId(null);
      setToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar el proyecto.");
    }
  };

  const deleteRelatedCount = toDelete
    ? LINKED.reduce((acc, { key }) => acc + getRelated(toDelete.id)[key].length, 0)
    : 0;
  const visibleLogo = logo.preview || logo.current;

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
            icon={editing ? <EditRoundedIcon /> : <WorkspacesRoundedIcon />}
            title={editing ? "Editar proyecto" : "Nuevo proyecto"}
            subtitle="Datos, logo, tipo, estado y color del proyecto."
            submitIcon={editing ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editing ? "Guardar cambios" : "Guardar proyecto"}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleLogoChange}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.05fr) minmax(0, 1fr)" },
                gap: { xs: 2, md: 2.5 },
                alignItems: "start",
              }}
            >
              {/* Columna izquierda: identidad del proyecto */}
              <Stack spacing={1.75}>
                <LogoPicker
                  logo={visibleLogo}
                  color={form.color}
                  name={form.name}
                  disabled={saving}
                  onPick={() => fileInputRef.current?.click()}
                  onRemove={removeLogo}
                />
                <TextField
                  label="Nombre del proyecto"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  fullWidth
                  disabled={saving}
                  autoFocus
                  sx={roundedFieldSx("12px")}
                />
                <TextField
                  label="Cliente"
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  fullWidth
                  disabled={saving}
                  sx={roundedFieldSx("12px")}
                />
                <TextField
                  label="Descripción"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  disabled={saving}
                  sx={roundedFieldSx("12px")}
                />
              </Stack>

              {/* Columna derecha: clasificación y color */}
              <Stack spacing={2}>
                <Segmented
                  label="Tipo de proyecto"
                  value={form.projectType}
                  onChange={(projectType) => setForm({ ...form, projectType })}
                  options={PROJECT_TYPES}
                  disabled={saving}
                />
                <Segmented
                  label="Estado"
                  value={form.status}
                  onChange={(status) => setForm({ ...form, status })}
                  options={Object.entries(STATUS).map(([value, info]) => ({
                    value,
                    label: info.label,
                    icon: info.icon,
                    color: info.color(theme),
                  }))}
                  disabled={saving}
                />
                <ColorField
                  value={form.color}
                  onChange={(color) => setForm({ ...form, color })}
                  disabled={saving}
                />
              </Stack>
            </Box>
          </FormDialog>

          <ProjectDetailDialog
            project={detailProject}
            related={detailProject ? getRelated(detailProject.id) : null}
            onClose={() => setDetailId(null)}
            onEdit={() => {
              const project = detailProject;
              setDetailId(null);
              openForm(project);
            }}
            onDelete={() => setToDelete(detailProject)}
          />

          <DeleteDialog
            open={Boolean(toDelete)}
            title="Eliminar proyecto"
            onClose={() => setToDelete(null)}
            onConfirm={confirmDelete}
            preview={
              toDelete && (
                <>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.1}
                    sx={{ textAlign: "left" }}
                  >
                    <ProjectAvatar item={toDelete} size={34} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 750, fontSize: "0.88rem" }}>
                        {toDelete.name || "Proyecto sin nombre"}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          color: theme.palette.app.secondary,
                          fontWeight: 600,
                          fontSize: "0.76rem",
                        }}
                      >
                        {toDelete.client || "Sin cliente"}
                      </Typography>
                    </Box>
                  </Stack>
                  {deleteRelatedCount > 0 && (
                    <Alert
                      severity="warning"
                      sx={{ mt: 1.2, borderRadius: "12px", fontWeight: 600, textAlign: "left" }}
                    >
                      Tiene {deleteRelatedCount} elementos vinculados (tareas, notas, pagos…). No se
                      borran: quedan guardados con el nombre del proyecto.
                    </Alert>
                  )}
                </>
              )
            }
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<WorkspacesRoundedIcon />}
          title="Proyectos"
          description="Clientes, logos, tareas, pagos y recursos de cada desarrollo en un solo lugar."
          actionLabel="Nuevo proyecto"
          onAction={() => openForm()}
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      {projects.length === 0 ? (
        <Section delay={70}>
          <EmptyState
            icon={<FolderOffRoundedIcon />}
            title="Todavía no tenés proyectos"
            text="Creá tu primer proyecto con su logo y color. Después vas a poder vincularle tareas, notas, pagos y accesos."
            actionLabel="Nuevo proyecto"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={70}>
            <StatsGrid
              items={[
                {
                  label: "Proyectos",
                  value: projects.length,
                  icon: <WorkspacesRoundedIcon />,
                  color: theme.palette.primary.main,
                },
                ...Object.entries(STATUS).map(([key, info]) => ({
                  label: info.plural,
                  value: stats[key],
                  icon: info.icon,
                  color: info.color(theme),
                })),
              ]}
            />
          </Section>

          <Section delay={130}>
            <FilterBar
              title="Proyectos cargados"
              subtitle={`${filtered.length} de ${projects.length} visibles`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              <Stack direction="row" flexWrap="wrap" sx={{ gap: 0.8 }}>
                {[["todos", { label: "Todos" }], ...Object.entries(STATUS)].map(([key, info]) => (
                  <FilterChip
                    key={key}
                    label={info.label}
                    selected={filter === key}
                    color={info.color?.(theme)}
                    onClick={() => setFilter(key)}
                  />
                ))}
              </Stack>
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar proyecto o cliente..."
                width={240}
              />
            </FilterBar>
          </Section>

          <Section delay={190}>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title="Sin resultados"
                text="Ningún proyecto coincide con el estado o la búsqueda elegida."
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
                {filtered.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    delay={index * 45}
                    related={getRelated(project.id)}
                    onOpen={() => setDetailId(project.id)}
                    onEdit={() => openForm(project)}
                    onDelete={() => setToDelete(project)}
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

/* ---------- Formulario ---------- */

function FieldLabel({ children }) {
  const theme = useTheme();
  return (
    <Typography
      sx={{ mb: 0.9, color: theme.palette.app.secondary, fontSize: "0.78rem", fontWeight: 700 }}
    >
      {children}
    </Typography>
  );
}

function LogoPicker({ logo, color, name, disabled, onPick, onRemove }) {
  const theme = useTheme();
  const c = HEX_RE.test(color) ? color : theme.palette.primary.main;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.25,
        borderRadius: "16px",
        border: `1.5px dashed ${alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.4 : 0.3)}`,
        bgcolor: softTint(theme, theme.palette.primary.main, 0.04, 0.06),
      }}
    >
      <Box
        onClick={disabled ? undefined : onPick}
        sx={{
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: "18px",
          overflow: "hidden",
          cursor: disabled ? "default" : "pointer",
          display: "grid",
          placeItems: "center",
          position: "relative",
          color: c,
          bgcolor: getProjectIconBackground(theme, c),
          border: `1px solid ${getProjectIconBorder(theme, c)}`,
          "&:hover .logo-overlay": { opacity: 1 },
        }}
      >
        {logo ? (
          <Box
            component="img"
            src={logo}
            alt="Logo del proyecto"
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : name.trim() ? (
          <Typography sx={{ color: c, fontSize: "1.8rem", fontWeight: 900 }}>
            {name.trim().charAt(0).toUpperCase()}
          </Typography>
        ) : (
          <ImageRoundedIcon sx={{ fontSize: 30 }} />
        )}
        <Box
          className="logo-overlay"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            bgcolor: "rgba(2,6,23,0.5)",
            opacity: 0,
            transition: "opacity 0.18s ease",
          }}
        >
          <CloudUploadRoundedIcon />
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 800, color: theme.palette.app.text }}>
          Logo del proyecto
        </Typography>
        <Typography
          sx={{ fontSize: "0.75rem", fontWeight: 550, color: theme.palette.app.secondary }}
        >
          Opcional · imagen cuadrada PNG o JPG
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 0.9 }}>
          <Button
            size="small"
            startIcon={<CloudUploadRoundedIcon />}
            onClick={onPick}
            disabled={disabled}
            sx={{
              height: 30,
              px: 1.2,
              borderRadius: "9px",
              fontWeight: 750,
              fontSize: "0.78rem",
              color: theme.palette.primary.main,
              bgcolor: softTint(theme, theme.palette.primary.main, 0.1, 0.16),
              "&:hover": { bgcolor: softTint(theme, theme.palette.primary.main, 0.16, 0.24) },
            }}
          >
            {logo ? "Cambiar" : "Subir logo"}
          </Button>
          {logo && (
            <Button
              size="small"
              onClick={onRemove}
              disabled={disabled}
              sx={{
                height: 30,
                px: 1.2,
                borderRadius: "9px",
                fontWeight: 700,
                fontSize: "0.78rem",
                color: theme.palette.app.secondary,
                "&:hover": {
                  color: theme.palette.error.main,
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              Quitar
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}

function Segmented({ label, value, onChange, options, disabled }) {
  const theme = useTheme();

  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          gap: 0.75,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value;
          const c = option.color || theme.palette.primary.main;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                minWidth: 0,
                height: 42,
                px: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                borderRadius: "11px",
                cursor: disabled ? "default" : "pointer",
                fontSize: "0.8rem",
                fontWeight: selected ? 800 : 650,
                color: selected ? c : theme.palette.app.secondary,
                bgcolor: selected ? softTint(theme, c, 0.1, 0.16) : getSoftBackground(theme),
                border: `1.5px solid ${selected ? alpha(c, 0.5) : theme.palette.app.borderSoft}`,
                transition: "all 0.16s ease",
                "& svg": { fontSize: 17, flexShrink: 0 },
                "&:hover": { borderColor: alpha(c, 0.4) },
                "&:focus-visible": { boxShadow: `0 0 0 3px ${alpha(c, 0.2)}` },
              }}
            >
              {option.icon}
              <Box
                component="span"
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {option.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ColorField({ value, onChange, disabled }) {
  const theme = useTheme();
  const [draft, setDraft] = useState(value);
  const valid = HEX_RE.test(value);

  useEffect(() => setDraft(value), [value]);

  const handleDraft = (text) => {
    const next = `#${text.replace(/[^0-9a-f]/gi, "").slice(0, 6)}`.toUpperCase();
    setDraft(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  return (
    <Box>
      <FieldLabel>Color principal</FieldLabel>
      <Box
        sx={{
          p: 1.25,
          borderRadius: "16px",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          bgcolor: getSoftBackground(theme),
          pointerEvents: disabled ? "none" : "auto",
          opacity: disabled ? 0.6 : 1,
          "& .react-colorful": { width: "100%", height: 132 },
          "& .react-colorful__saturation": { borderRadius: "11px 11px 0 0", borderBottom: "none" },
          "& .react-colorful__hue": { height: 14, borderRadius: "0 0 11px 11px" },
          "& .react-colorful__pointer": { width: 20, height: 20, borderWidth: 3 },
          "& .react-colorful__hue-pointer": { width: 14, height: 20, borderRadius: "6px" },
        }}
      >
        <HexColorPicker
          color={valid ? value : "#2563EB"}
          onChange={(c) => onChange(c.toUpperCase())}
        />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: "10px",
              bgcolor: valid ? value : "transparent",
              border: `1px solid ${theme.palette.app.borderSoft}`,
              boxShadow: valid ? `0 6px 16px ${alpha(value, 0.35)}` : "none",
            }}
          />
          <TextField
            size="small"
            label="HEX"
            value={draft}
            onChange={(e) => handleDraft(e.target.value)}
            onBlur={() => setDraft(value)}
            error={!HEX_RE.test(draft)}
            fullWidth
            slotProps={{
              htmlInput: {
                maxLength: 7,
                spellCheck: false,
                style: {
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  letterSpacing: "0.05em",
                },
              },
              input: {
                startAdornment: <InputAdornment position="start" sx={{ mr: 0.25 }} />,
              },
            }}
            sx={{
              ...roundedFieldSx("10px"),
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: theme.palette.app.surface,
              },
            }}
          />
        </Stack>

        <Box
          sx={{
            mt: 1.1,
            display: "grid",
            gridTemplateColumns: `repeat(${PRESET_COLORS.length}, minmax(0, 1fr))`,
            gap: 0.6,
          }}
        >
          {PRESET_COLORS.map((color) => {
            const selected = value.toUpperCase() === color;
            return (
              <Tooltip key={color} title={color} arrow>
                <Box
                  component="button"
                  type="button"
                  aria-label={`Color ${color}`}
                  onClick={() => onChange(color)}
                  sx={{
                    all: "unset",
                    aspectRatio: "1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    bgcolor: color,
                    display: "grid",
                    placeItems: "center",
                    color: "#fff",
                    boxShadow: selected
                      ? `0 0 0 2px ${theme.palette.app.surface}, 0 0 0 4px ${color}`
                      : "none",
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "scale(1.1)" },
                    "& svg": { fontSize: 14 },
                  }}
                >
                  {selected && <CheckRoundedIcon />}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

/* ---------- Lista ---------- */

function FilterChip({ label, selected, color, onClick }) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Box
      component="button"
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      sx={{
        all: "unset",
        boxSizing: "border-box",
        height: 34,
        px: 1.4,
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.8rem",
        fontWeight: selected ? 800 : 650,
        color: selected ? c : theme.palette.app.secondary,
        bgcolor: selected ? softTint(theme, c, 0.1, 0.18) : getSoftBackground(theme),
        border: `1px solid ${selected ? alpha(c, 0.35) : theme.palette.app.borderSoft}`,
        transition: "all 0.16s ease",
        "&:hover": { bgcolor: softTint(theme, c, 0.1, 0.18) },
      }}
    >
      {color && <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: c }} />}
      {label}
    </Box>
  );
}

function StatusPill({ status }) {
  const theme = useTheme();
  const info = getStatus(status);
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

function ProgressRow({ progress, label = "Tareas" }) {
  const theme = useTheme();
  const color = progress.percent === 100 ? theme.palette.success.main : theme.palette.info.main;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
        <Stack direction="row" alignItems="center" spacing={0.6}>
          <ChecklistRoundedIcon sx={{ fontSize: 16, color }} />
          <Typography
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 700 }}
          >
            {label}
          </Typography>
        </Stack>
        <Typography sx={{ color: theme.palette.app.text, fontSize: "0.75rem", fontWeight: 800 }}>
          {progress.total
            ? `${progress.done}/${progress.total} · ${progress.percent}%`
            : "Sin tareas"}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress.percent}
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

function ProjectCard({ project, related, delay, onOpen, onEdit, onDelete }) {
  const theme = useTheme();
  const projectColor = project.color || theme.palette.primary.main;
  const type = getProjectType(project.projectType);
  const counters = LINKED.filter(({ key }) => related[key].length > 0);

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        position: "relative",
        p: { xs: 1.6, md: 1.75 },
        pt: { xs: 1.8, md: 1.95 },
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          background: `linear-gradient(90deg, ${projectColor}, ${alpha(projectColor, 0.15)})`,
        },
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(projectColor, 0.4),
          boxShadow: `0 14px 34px ${alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
        "&:hover .card-arrow": { color: theme.palette.primary.main, transform: "translateX(2px)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.3}>
        <ProjectAvatar item={project} size={44} />
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
            {project.name || "Proyecto sin nombre"}
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ color: theme.palette.app.secondary, minWidth: 0, "& svg": { fontSize: 14 } }}
          >
            {type.icon}
            <Typography noWrap sx={{ fontSize: "0.75rem", fontWeight: 600, color: "inherit" }}>
              {type.label} · {project.client || "Sin cliente"}
            </Typography>
          </Stack>
        </Box>
        <StatusPill status={project.status} />
      </Stack>

      <Typography
        sx={{
          mt: 1.2,
          color: theme.palette.app.secondary,
          fontSize: "0.82rem",
          lineHeight: 1.55,
          fontWeight: 500,
          minHeight: "2.55em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          opacity: project.description ? 1 : 0.65,
        }}
      >
        {project.description || "Sin descripción."}
      </Typography>

      <Box sx={{ mt: 1.3 }}>
        <ProgressRow progress={getTaskProgress(related.tasks)} />
      </Box>

      <Box sx={{ flex: 1, minHeight: 14 }} />
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          gap: 1.2,
          pt: 1.2,
          borderTop: `1px solid ${theme.palette.app.borderSoft}`,
          color: theme.palette.app.secondary,
        }}
      >
        {counters.length ? (
          counters.slice(0, 4).map(({ key, label, icon }) => (
            <Tooltip key={key} title={label}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.4}
                sx={{ "& svg": { fontSize: 15 } }}
              >
                {icon}
                <Typography sx={{ fontSize: "0.76rem", fontWeight: 750, color: "inherit" }}>
                  {related[key].length}
                </Typography>
              </Stack>
            </Tooltip>
          ))
        ) : (
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "inherit" }}>
            Sin elementos vinculados
          </Typography>
        )}
        <Stack direction="row" alignItems="center" spacing={0.4} sx={{ ml: "auto" }}>
          <Typography noWrap sx={{ fontSize: "0.75rem", fontWeight: 700, color: "inherit" }}>
            Ver detalle
          </Typography>
          <ArrowForwardRoundedIcon
            className="card-arrow"
            sx={{ fontSize: 15, transition: "all 0.18s ease" }}
          />
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ ml: 0.5 }}>
          <IconAction title="Editar" size={30} color={theme.palette.info.main} onClick={onEdit}>
            <EditRoundedIcon sx={{ fontSize: 15 }} />
          </IconAction>
          <IconAction
            title="Eliminar"
            size={30}
            color={theme.palette.error.main}
            onClick={onDelete}
          >
            <DeleteRoundedIcon sx={{ fontSize: 15 }} />
          </IconAction>
        </Stack>
      </Stack>
    </Card>
  );
}

/* ---------- Detalle ---------- */

const describe = {
  tasks: (task) => {
    const checklist = getChecklist(task);
    const done = checklist.filter((item) => item.done).length;
    return {
      title: task.title || "Tarea sin título",
      subtitle: [
        getTaskStatusLabel(task.status),
        checklist.length && `Checklist ${done}/${checklist.length}`,
      ]
        .filter(Boolean)
        .join(" · "),
      done: task.status === "completada",
    };
  },
  notes: (note) => ({
    title: note.title || "Nota sin título",
    subtitle: note.content || "Sin contenido",
  }),
  links: (link) => ({
    title: link.notes || (link.type === "App" ? "Aplicación" : "Sitio web"),
    subtitle: getShortUrl(link.url),
    icon: link.type === "App" ? <SmartphoneRoundedIcon /> : <LanguageRoundedIcon />,
    url: link.url,
  }),
  credentials: (c) => ({
    title: c.notes || "Credenciales del proyecto",
    subtitle:
      [
        c.production?.email && `Producción: ${c.production.email}`,
        c.local?.email && `Local: ${c.local.email}`,
      ]
        .filter(Boolean)
        .join(" · ") || "Accesos guardados",
  }),
  databases: (d) => ({
    title: "Firebase Console",
    subtitle: getShortUrl(d.firebaseUrl),
    url: d.firebaseUrl,
  }),
  payments: (p) => {
    const info = withPaymentInfo(p);
    return {
      title: `${formatMoney(info.paidAmount, info.currency)} de ${formatMoney(info.totalAmount, info.currency)}`,
      subtitle: [`${Math.round(info.progress * 100)}% cobrado`, p.notes]
        .filter(Boolean)
        .join(" · "),
    };
  },
};

function ProjectDetailDialog({ project, related, onClose, onEdit, onDelete }) {
  const theme = useTheme();
  const [tab, setTab] = useState("resumen");

  useEffect(() => setTab("resumen"), [project?.id]);
  if (!project) return null;

  const type = getProjectType(project.projectType);
  const created = formatShortDate(project.createdAt);
  const buttonSx = { minHeight: 40, px: 1.6, borderRadius: "12px", fontWeight: 750 };
  const current = LINKED.find((l) => l.key === tab);

  return (
    <AppDialog
      open
      onClose={onClose}
      maxWidth="md"
      contentSx={{ p: 0 }}
      header={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ProjectAvatar item={project} size={50} shadow />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                noWrap
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.15rem",
                  fontWeight: 850,
                  letterSpacing: "-0.3px",
                }}
              >
                {project.name || "Proyecto sin nombre"}
              </Typography>
              <StatusPill status={project.status} />
            </Stack>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mt: 0.3, color: theme.palette.app.secondary, "& svg": { fontSize: 15 } }}
            >
              {type.icon}
              <Typography noWrap sx={{ fontSize: "0.8rem", fontWeight: 600, color: "inherit" }}>
                {[type.label, project.client || "Sin cliente", created && `Creado ${created}`]
                  .filter(Boolean)
                  .join(" · ")}
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
          <Button onClick={onClose} sx={{ ...buttonSx, color: theme.palette.app.secondary }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<EditRoundedIcon />}
            onClick={onEdit}
            sx={{ ...buttonSx, fontWeight: 800, boxShadow: "none" }}
          >
            Editar
          </Button>
        </>
      }
    >
      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          px: { xs: 1, md: 2 },
          minHeight: 46,
          borderBottom: `1px solid ${theme.palette.app.borderSoft}`,
          "& .MuiTab-root": {
            minHeight: 46,
            px: 1.4,
            textTransform: "none",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: theme.palette.app.secondary,
            "& svg": { fontSize: 17 },
          },
          "& .Mui-selected": { fontWeight: 800 },
          "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
        }}
      >
        <Tab value="resumen" label="Resumen" />
        {LINKED.map(({ key, label, short }) => (
          <Tab
            key={key}
            value={key}
            label={
              <Stack direction="row" alignItems="center" spacing={0.6}>
                <span>{short || label}</span>
                <Box
                  component="span"
                  sx={{
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: "6px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    lineHeight: "18px",
                    textAlign: "center",
                    bgcolor: getSoftBackground(theme),
                    border: `1px solid ${theme.palette.app.borderSoft}`,
                  }}
                >
                  {related[key].length}
                </Box>
              </Stack>
            }
          />
        ))}
      </Tabs>

      <Box
        sx={{
          px: { xs: 2, md: 2.75 },
          py: 2.25,
          height: { md: "clamp(260px, 52vh, 460px)" },
          overflowY: "auto",
        }}
      >
        {tab === "resumen" ? (
          <ProjectSummary project={project} related={related} onGo={setTab} />
        ) : related[tab].length === 0 ? (
          <Box
            sx={{
              py: 5,
              textAlign: "center",
              borderRadius: "14px",
              border: `1.5px dashed ${theme.palette.app.borderSoft}`,
              color: theme.palette.app.secondary,
              "& svg": { fontSize: 28, opacity: 0.6 },
            }}
          >
            {current.icon}
            <Typography sx={{ mt: 0.6, fontSize: "0.86rem", fontWeight: 600 }}>
              No hay {current.label.toLowerCase()} {current.fem ? "vinculadas" : "vinculados"} a
              este proyecto.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0.8}>
            {related[tab].map((item) => {
              const info = describe[tab](item);
              return <DetailItem key={item.id} icon={info.icon || current.icon} {...info} />;
            })}
          </Stack>
        )}
      </Box>
    </AppDialog>
  );
}

function ProjectSummary({ project, related, onGo }) {
  const theme = useTheme();
  const progress = getTaskProgress(related.tasks);

  const money = related.payments.map(withPaymentInfo).reduce((acc, p) => {
    acc[p.currency] ||= { agreed: 0, paid: 0 };
    acc[p.currency].agreed += Number(p.totalAmount || 0);
    acc[p.currency].paid += p.paidAmount;
    return acc;
  }, {});

  const sectionTitle = {
    mb: 1,
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.palette.app.secondary,
  };

  return (
    <Stack spacing={2.25}>
      <Box>
        <Typography sx={sectionTitle}>Descripción</Typography>
        <Typography
          sx={{
            color: project.description ? theme.palette.app.text : theme.palette.app.secondary,
            fontSize: "0.9rem",
            lineHeight: 1.65,
            fontWeight: 500,
            whiteSpace: "pre-wrap",
          }}
        >
          {project.description || "Este proyecto todavía no tiene descripción."}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: "14px",
            border: `1px solid ${theme.palette.app.borderSoft}`,
            bgcolor: getSoftBackground(theme),
          }}
        >
          <ProgressRow progress={progress} label="Avance de tareas y checklist" />
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: "14px",
            border: `1px solid ${theme.palette.app.borderSoft}`,
            bgcolor: getSoftBackground(theme),
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ mb: 0.6 }}>
            <PaymentsRoundedIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
            <Typography
              sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 700 }}
            >
              Cobros
            </Typography>
          </Stack>
          {Object.keys(money).length ? (
            Object.entries(money).map(([currency, m]) => (
              <Typography
                key={currency}
                sx={{ fontSize: "0.86rem", fontWeight: 800, color: theme.palette.app.text }}
              >
                {formatMoney(m.paid, currency)}{" "}
                <Box component="span" sx={{ fontWeight: 600, color: theme.palette.app.secondary }}>
                  de {formatMoney(m.agreed, currency)}
                </Box>
              </Typography>
            ))
          ) : (
            <Typography
              sx={{ fontSize: "0.84rem", fontWeight: 600, color: theme.palette.app.secondary }}
            >
              Sin cobros cargados
            </Typography>
          )}
        </Box>
      </Box>

      <Box>
        <Typography sx={sectionTitle}>Resumen del proyecto</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          {LINKED.map(({ key, label, icon }) => (
            <Box
              key={key}
              component="button"
              type="button"
              onClick={() => onGo(key)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 1.1,
                p: 1.1,
                borderRadius: "12px",
                cursor: "pointer",
                border: `1px solid ${theme.palette.app.borderSoft}`,
                bgcolor: theme.palette.app.surface,
                transition: "border-color 0.16s ease",
                "&:hover": { borderColor: alpha(theme.palette.primary.main, 0.4) },
                "&:hover .go-arrow": { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.primary.main,
                  bgcolor: softTint(theme, theme.palette.primary.main, 0.09, 0.16),
                  "& svg": { fontSize: 17 },
                }}
              >
                {icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 850,
                    lineHeight: 1.1,
                    color: theme.palette.app.text,
                  }}
                >
                  {related[key].length}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: "0.72rem", fontWeight: 650, color: theme.palette.app.secondary }}
                >
                  {label}
                </Typography>
              </Box>
              <ArrowForwardRoundedIcon
                className="go-arrow"
                sx={{ fontSize: 15, opacity: 0, color: theme.palette.primary.main }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

function DetailItem({ title, subtitle, icon, url, done }) {
  const theme = useTheme();
  const color = done ? theme.palette.success.main : theme.palette.primary.main;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.2}
      sx={{
        p: 1,
        pl: 1.2,
        borderRadius: "12px",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          color,
          bgcolor: softTint(theme, color, 0.09, 0.16),
          "& svg": { fontSize: 17 },
        }}
      >
        {done ? <CheckCircleRoundedIcon /> : icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            color: theme.palette.app.text,
            fontSize: "0.86rem",
            fontWeight: 750,
            textDecoration: done ? "line-through" : "none",
            opacity: done ? 0.7 : 1,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontWeight: 550, fontSize: "0.76rem" }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {url && (
        <IconAction
          title="Abrir"
          size={30}
          color={theme.palette.app.secondary}
          onClick={() => window.open(normalizeUrl(url), "_blank", "noopener,noreferrer")}
        >
          <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
        </IconAction>
      )}
    </Stack>
  );
}
