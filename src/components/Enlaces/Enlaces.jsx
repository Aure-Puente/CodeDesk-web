//Enlaces:
import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Box, Button, Card, InputAdornment, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import SmartphoneRoundedIcon from "@mui/icons-material/SmartphoneRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byName } from "../../shared/hooks/useUserCollection";
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

const LINK_TYPES = {
  Web: {
    icon: <LanguageRoundedIcon />,
    hint: "Página o dominio",
    color: (t) => t.palette.info.main,
  },
  App: {
    icon: <SmartphoneRoundedIcon />,
    hint: "Descarga de aplicación",
    color: (t) => t.palette.success.main,
  },
};
const getType = (type) => LINK_TYPES[type] || LINK_TYPES.Web;
const dateValue = (item) => item.createdAt?.seconds || item.updatedAt?.seconds || 0;
const EMPTY_FORM = { projectId: "", type: "Web", url: "", notes: "" };
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const CARD_PREVIEW = 3; 

const matchesSearch = (link, query) =>
  !query ||
  [link.projectName, link.url, link.notes]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));

export default function Enlaces() {
  const theme = useTheme();
  const { user } = useAuth();
  const [projects] = useUserCollection("projects", { sort: byName });
  const [links, loading, loadError] = useUserCollection("projectLinks", {
    sort: (a, b) => dateValue(b) - dateValue(a),
    errorMessage: "No se pudieron cargar los enlaces.",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [groupKey, setGroupKey] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [filterProject, setFilterProject] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const query = search.trim().toLowerCase();
  const filteredLinks = useMemo(
    () =>
      links.filter(
        (item) =>
          (filterProject === "todos" || item.projectId === filterProject) &&
          matchesSearch(item, query),
      ),
    [links, filterProject, query],
  );
  const hasFilters = filterProject !== "todos" || Boolean(query);
  const resetFilters = () => {
    setFilterProject("todos");
    setSearch("");
  };

  const groups = useMemo(() => {
    const map = new Map();
    filteredLinks.forEach((link) => {
      const key = link.projectId || `project-name-${link.projectName || "sin-proyecto"}`;
      if (!map.has(key))
        map.set(key, {
          key,
          ...link,
          projectName: link.projectName || "Proyecto sin nombre",
          links: [],
        });
      map.get(key).links.push(link);
    });

    return [...map.values()]
      .map((group) => ({
        ...group,
        links: [...group.links].sort(
          (a, b) =>
            String(a.type || "Web").localeCompare(String(b.type || "Web")) ||
            dateValue(b) - dateValue(a),
        ),
      }))
      .sort((a, b) => a.projectName.localeCompare(b.projectName));
  }, [filteredLinks]);

  const openGroup = groups.find((group) => group.key === groupKey) || null;

  const stats = useMemo(
    () => ({
      web: links.filter((item) => (item.type || "Web") === "Web").length,
      app: links.filter((item) => item.type === "App").length,
      projects: new Set(links.map((item) => item.projectId).filter(Boolean)).size,
    }),
    [links],
  );

  const openForm = (link = null, projectId = "") => {
    setEditing(link);
    setForm(
      link
        ? {
            projectId: link.projectId || "",
            type: link.type || "Web",
            url: link.url || "",
            notes: link.notes || "",
          }
        : { ...EMPTY_FORM, projectId },
    );
    setFormError("");
    setFormOpen(true);
  };

  const copyLink = async (value) => {
    const copied = await copyToClipboard(normalizeUrl(value));
    showToast(copied ? "Enlace copiado al portapapeles." : "No se pudo copiar el enlace.", {
      severity: copied ? "success" : "error",
    });
  };

  const openExternal = (value) => {
    const url = normalizeUrl(value);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    const project = projects.find((item) => item.id === form.projectId);
    const url = normalizeUrl(form.url);

    if (!project) return setFormError("Seleccioná un proyecto.");
    try {
      if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error("protocolo");
    } catch {
      return setFormError("Ingresá un enlace válido (por ejemplo https://misitio.com).");
    }

    const payload = {
      userId: user.uid,
      ...projectFields(project),
      type: form.type,
      url,
      notes: form.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");
      if (editing) await updateDoc(doc(db, "projectLinks", editing.id), payload);
      else
        await addDoc(collection(db, "projectLinks"), { ...payload, createdAt: serverTimestamp() });
      setFormOpen(false);
      showToast(editing ? "Enlace actualizado." : "Enlace guardado.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudo guardar el enlace.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteDoc(doc(db, "projectLinks", toDelete.id));
      setToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar el enlace.");
    } finally {
      setDeleting(false);
    }
  };

  const formType = getType(form.type);

  return (
    <PageShell
      loading={loading}
      after={
        <>
          <ProjectLinksDialog
            group={openGroup}
            onClose={() => setGroupKey(null)}
            onAdd={() => {
              setGroupKey(null);
              openForm(null, openGroup?.projectId || "");
            }}
            onOpen={openExternal}
            onCopy={copyLink}
            onEdit={(link) => {
              setGroupKey(null);
              openForm(link);
            }}
            onDelete={setToDelete}
          />

          <FormDialog
            open={formOpen}
            onClose={() => !saving && setFormOpen(false)}
            onSubmit={handleSave}
            saving={saving}
            error={formError}
            maxWidth="sm"
            icon={editing ? <EditRoundedIcon /> : <LinkRoundedIcon />}
            title={editing ? "Editar enlace" : "Nuevo enlace"}
            subtitle="Un sitio web o enlace de descarga dentro de un proyecto."
            submitIcon={editing ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editing ? "Guardar cambios" : "Guardar enlace"}
            submitDisabled={!form.projectId || !form.url.trim()}
          >
            <ProjectSelect
              projects={projects}
              value={form.projectId}
              onChange={(projectId) => setForm({ ...form, projectId })}
              disabled={saving || projects.length === 0}
              showPreview={false}
            />
            <TypePicker
              value={form.type}
              onChange={(type) => setForm({ ...form, type })}
              disabled={saving}
            />
            <TextField
              label={form.type === "App" ? "Enlace de descarga" : "Enlace del sitio web"}
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              fullWidth
              required
              disabled={saving}
              placeholder={
                form.type === "App" ? "https://play.google.com/..." : "https://misitio.com"
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ color: formType.color(theme), "& svg": { fontSize: 20 } }}
                    >
                      {formType.icon}
                    </InputAdornment>
                  ),
                },
              }}
              sx={roundedFieldSx("12px")}
            />
            <TextField
              label="Título o descripción opcional"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              disabled={saving}
              placeholder="Ej: Panel de administración, web pública, app para clientes..."
              slotProps={{ htmlInput: { maxLength: 300 } }}
              helperText={`${form.notes.length}/300`}
              sx={{
                ...roundedFieldSx("12px"),
                "& .MuiFormHelperText-root": { textAlign: "right", mr: 0.5 },
              }}
            />
          </FormDialog>

          <DeleteDialog
            open={Boolean(toDelete)}
            title="Eliminar enlace"
            deleting={deleting}
            onClose={() => setToDelete(null)}
            onConfirm={confirmDelete}
            preview={
              toDelete && (
                <Stack direction="row" alignItems="center" spacing={1.1} sx={{ textAlign: "left" }}>
                  <TypeBadge type={toDelete.type} size={34} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 750, fontSize: "0.88rem" }}>
                      {toDelete.notes?.trim() || getShortUrl(toDelete.url)}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.app.secondary,
                        fontWeight: 600,
                        fontSize: "0.76rem",
                      }}
                    >
                      {toDelete.notes?.trim() ? `${getShortUrl(toDelete.url)} · ` : ""}
                      {toDelete.projectName || "Proyecto sin nombre"}
                    </Typography>
                  </Box>
                </Stack>
              )
            }
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<LinkRoundedIcon />}
          title="Enlaces"
          description="Sitios web y enlaces de descarga de tus apps, agrupados por proyecto."
          actionLabel="Nuevo enlace"
          onAction={() => openForm()}
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      <Section delay={70}>
        <StatsGrid
          items={[
            {
              label: "Enlaces",
              value: links.length,
              icon: <LinkRoundedIcon />,
              color: theme.palette.primary.main,
            },
            {
              label: "Web",
              value: stats.web,
              icon: LINK_TYPES.Web.icon,
              color: LINK_TYPES.Web.color(theme),
            },
            {
              label: "Apps",
              value: stats.app,
              icon: LINK_TYPES.App.icon,
              color: LINK_TYPES.App.color(theme),
            },
            {
              label: "Proyectos",
              value: stats.projects,
              icon: <FolderRoundedIcon />,
              color: theme.palette.warning.main,
            },
          ]}
        />
      </Section>

      {links.length === 0 ? (
        <Section delay={140}>
          <EmptyState
            icon={<LinkRoundedIcon />}
            title="Todavía no guardaste enlaces"
            text="Agregá los dominios de tus webs y los enlaces de descarga de tus apps. Los de un mismo proyecto se agrupan solos."
            actionLabel="Nuevo enlace"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={120}>
            <FilterBar
              title="Enlaces por proyecto"
              subtitle={`${plural(groups.length, "proyecto", "proyectos")} · ${plural(filteredLinks.length, "enlace", "enlaces")}`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar URL, título o proyecto..."
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

          <Section delay={180}>
            {groups.length === 0 ? (
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title="Sin resultados"
                text="Ningún enlace coincide con la búsqueda o el proyecto elegido."
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
                  alignItems: "start",
                }}
              >
                {groups.map((group, index) => (
                  <ProjectLinksCard
                    key={group.key}
                    group={group}
                    delay={index * 45}
                    onOpen={() => setGroupKey(group.key)}
                    onAdd={() => openForm(null, group.projectId)}
                    onOpenLink={openExternal}
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

function TypeBadge({ type, size = 36 }) {
  const theme = useTheme();
  const info = getType(type);
  const color = info.color(theme);

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
        bgcolor: softTint(theme, color, 0.1, 0.18),
        "& svg": { fontSize: size * 0.55 },
      }}
    >
      {info.icon}
    </Box>
  );
}

function TypePicker({ value, onChange, disabled }) {
  const theme = useTheme();

  return (
    <Box>
      <Typography
        sx={{ mb: 0.9, color: theme.palette.app.secondary, fontSize: "0.78rem", fontWeight: 700 }}
      >
        Tipo de enlace
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
        {Object.entries(LINK_TYPES).map(([key, info]) => {
          const selected = value === key;
          const color = info.color(theme);

          return (
            <Box
              key={key}
              component="button"
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(key)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 1.2,
                p: 1.2,
                borderRadius: "14px",
                cursor: disabled ? "default" : "pointer",
                border: `1.5px solid ${selected ? alpha(color, 0.55) : theme.palette.app.borderSoft}`,
                bgcolor: selected ? softTint(theme, color, 0.07, 0.14) : getSoftBackground(theme),
                transition: "all 0.18s ease",
                "&:hover": { borderColor: alpha(color, 0.45) },
                "&:focus-visible": { boxShadow: `0 0 0 3px ${alpha(color, 0.2)}` },
              }}
            >
              <TypeBadge type={key} size={36} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    color: selected ? color : theme.palette.app.text,
                    fontSize: "0.9rem",
                    fontWeight: 800,
                  }}
                >
                  {key}
                </Typography>
                <Typography
                  noWrap
                  sx={{ color: theme.palette.app.secondary, fontSize: "0.74rem", fontWeight: 600 }}
                >
                  {info.hint}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  bgcolor: selected ? color : "transparent",
                  border: `1.5px solid ${selected ? color : alpha(theme.palette.app.secondary, 0.4)}`,
                  "& svg": { fontSize: 14 },
                }}
              >
                {selected && <CheckRoundedIcon />}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function ProjectLinksCard({ group, delay, onOpen, onAdd, onOpenLink }) {
  const theme = useTheme();
  const projectColor = group.projectColor || theme.palette.primary.main;
  const counts = Object.keys(LINK_TYPES)
    .map((type) => [type, group.links.filter((item) => (item.type || "Web") === type).length])
    .filter(([, count]) => count > 0);
  const extra = group.links.length - CARD_PREVIEW;

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        p: { xs: 1.6, md: 1.75 },
        cursor: "pointer",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(projectColor, 0.4),
          boxShadow: `0 14px 34px ${alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.3}>
        <ProjectAvatar item={group} size={40} />
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
            {group.projectName}
          </Typography>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
          >
            {counts.map(([type, count]) => `${count} ${type}`).join(" · ")}
          </Typography>
        </Box>
        <IconAction title="Agregar enlace" onClick={onAdd} size={32}>
          <AddRoundedIcon sx={{ fontSize: 19 }} />
        </IconAction>
      </Stack>

      <Stack spacing={0.75} sx={{ mt: 1.5 }}>
        {group.links.slice(0, CARD_PREVIEW).map((link) => (
          <Stack
            key={link.id}
            direction="row"
            alignItems="center"
            spacing={1.1}
            sx={{
              pl: 0.9,
              pr: 0.6,
              py: 0.7,
              borderRadius: "12px",
              bgcolor: getSoftBackground(theme),
              border: `1px solid ${theme.palette.app.borderSoft}`,
            }}
          >
            <TypeBadge type={link.type} size={28} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ color: theme.palette.app.text, fontSize: "0.82rem", fontWeight: 650 }}
              >
                {link.notes?.trim() || getShortUrl(link.url)}
              </Typography>
              {link.notes?.trim() && (
                <Typography
                  noWrap
                  sx={{ color: theme.palette.app.secondary, fontSize: "0.72rem", fontWeight: 550 }}
                >
                  {getShortUrl(link.url)}
                </Typography>
              )}
            </Box>
            <IconAction
              title="Abrir enlace"
              size={28}
              color={theme.palette.app.secondary}
              onClick={() => onOpenLink(link.url)}
            >
              <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
            </IconAction>
          </Stack>
        ))}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          mt: 1.25,
          color: theme.palette.app.secondary,
          "&:hover": { color: theme.palette.primary.main },
        }}
      >
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "inherit" }}>
          {extra > 0 ? `Ver ${plural(extra, "enlace más", "enlaces más")}` : "Ver y administrar"}
        </Typography>
        <ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />
      </Stack>
    </Card>
  );
}

function ProjectLinksDialog({ group, onClose, onAdd, onOpen, onCopy, onEdit, onDelete }) {
  const theme = useTheme();
  if (!group) return null;

  return (
    <AppDialog
      open
      onClose={onClose}
      maxWidth="sm"
      header={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <ProjectAvatar item={group} size={46} shadow />
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
              {group.projectName}
            </Typography>
            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              {plural(group.links.length, "enlace guardado", "enlaces guardados")}
            </Typography>
          </Box>
        </Stack>
      }
      actions={
        <Stack direction="row" justifyContent="space-between" sx={{ width: "100%" }}>
          <Button
            onClick={onClose}
            sx={{
              minHeight: 40,
              px: 1.8,
              borderRadius: "12px",
              color: theme.palette.app.secondary,
              fontWeight: 750,
            }}
          >
            Cerrar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={onAdd}
            sx={{
              minHeight: 40,
              px: 2.2,
              borderRadius: "12px",
              fontWeight: 800,
              boxShadow: "none",
            }}
          >
            Agregar enlace
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1}>
        {group.links.map((link) => (
          <LinkRow
            key={link.id}
            link={link}
            onOpen={() => onOpen(link.url)}
            onCopy={() => onCopy(link.url)}
            onEdit={() => onEdit(link)}
            onDelete={() => onDelete(link)}
          />
        ))}
      </Stack>
    </AppDialog>
  );
}

function LinkRow({ link, onOpen, onCopy, onEdit, onDelete }) {
  const theme = useTheme();
  const info = getType(link.type);
  const color = info.color(theme);
  const title = link.notes?.trim();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        p: 1.1,
        pl: 1.25,
        borderRadius: "14px",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        bgcolor: getSoftBackground(theme),
        transition: "border-color 0.18s ease",
        "&:hover": { borderColor: alpha(color, 0.35) },
        "&:hover .row-actions": { opacity: 1 },
      }}
    >
      <TypeBadge type={link.type} size={36} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.text, fontSize: "0.88rem", fontWeight: 750 }}
          >
            {title || getShortUrl(link.url)}
          </Typography>
          <Box
            component="span"
            sx={{
              px: 0.7,
              py: 0.1,
              borderRadius: "6px",
              fontSize: "0.64rem",
              fontWeight: 800,
              color,
              bgcolor: softTint(theme, color, 0.1, 0.18),
              flexShrink: 0,
            }}
          >
            {link.type || "Web"}
          </Box>
        </Stack>
        {title && (
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.76rem", fontWeight: 550 }}
          >
            {getShortUrl(link.url)}
          </Typography>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={0.5}
        className="row-actions"
        sx={{ opacity: { xs: 1, md: 0.75 }, transition: "opacity 0.18s ease" }}
      >
        <IconAction
          title="Copiar enlace"
          size={32}
          color={theme.palette.app.secondary}
          onClick={onCopy}
        >
          <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />
        </IconAction>
        <IconAction title="Abrir enlace" size={32} onClick={onOpen}>
          <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
        </IconAction>
        <IconAction
          title="Editar enlace"
          size={32}
          color={theme.palette.info.main}
          onClick={onEdit}
        >
          <EditRoundedIcon sx={{ fontSize: 16 }} />
        </IconAction>
        <IconAction
          title="Eliminar enlace"
          size={32}
          color={theme.palette.error.main}
          onClick={onDelete}
        >
          <DeleteRoundedIcon sx={{ fontSize: 16 }} />
        </IconAction>
      </Stack>
    </Stack>
  );
}
