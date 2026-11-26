//DataBase:
import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Alert, Box, Card, InputAdornment, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloudQueueRoundedIcon from "@mui/icons-material/CloudQueueRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import NoteAltRoundedIcon from "@mui/icons-material/NoteAltRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byCreatedDesc, byName } from "../../shared/hooks/useUserCollection";
import { copyToClipboard, getShortUrl, normalizeUrl, projectFields } from "../../shared/utils";
import {
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
  SoftButton,
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

const EMPTY_FORM = { projectId: "", firebaseUrl: "", notes: "" };
const FIREBASE_COLOR = "#F57C00";
const dbRef = (id) => doc(db, "databasesInfo", id);

const getFirebaseProjectId = (url) => String(url || "").match(/\/project\/([^/?#]+)/)?.[1] || null;

const matchesSearch = (item, query) =>
  !query ||
  [item.projectName, item.firebaseUrl, item.notes]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(query));

export default function DataBase() {
  const theme = useTheme();
  const { user } = useAuth();
  const [projects] = useUserCollection("projects", { sort: byName });
  const [databases, loading, loadError] = useUserCollection("databasesInfo", {
    sort: byCreatedDesc,
    errorMessage: "No se pudieron cargar los enlaces.",
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [filterProject, setFilterProject] = useState("todos");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const query = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      databases.filter(
        (item) =>
          (filterProject === "todos" || item.projectId === filterProject) &&
          matchesSearch(item, query),
      ),
    [databases, filterProject, query],
  );
  const hasFilters = filterProject !== "todos" || Boolean(query);
  const resetFilters = () => {
    setFilterProject("todos");
    setSearch("");
  };

  const stats = useMemo(() => {
    const withDatabase = new Set(databases.map((item) => item.projectId).filter(Boolean)).size;
    return { withDatabase, withoutDatabase: Math.max(projects.length - withDatabase, 0) };
  }, [databases, projects]);

  const duplicate =
    form.projectId &&
    databases.some((item) => item.projectId === form.projectId && item.id !== editing?.id);

  const openForm = (item = null) => {
    setEditing(item);
    setForm(
      item
        ? {
            projectId: item.projectId || "",
            firebaseUrl: item.firebaseUrl || "",
            notes: item.notes || "",
          }
        : EMPTY_FORM,
    );
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => !saving && setFormOpen(false);

  const openFirebaseLink = (item) => {
    const url = normalizeUrl(item.firebaseUrl);
    if (!url) return setPageError("Este proyecto no tiene enlace cargado.");
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyLink = async (item) => {
    const copied = await copyToClipboard(normalizeUrl(item.firebaseUrl));
    showToast(copied ? "Enlace copiado al portapapeles." : "No se pudo copiar el enlace.", {
      severity: copied ? "success" : "error",
    });
  };

  const handleSave = async (event) => {
    event?.preventDefault();
    if (!form.projectId) return setFormError("Seleccioná un proyecto.");
    if (!form.firebaseUrl.trim()) return setFormError("Pegá el enlace de Firebase.");

    const payload = {
      userId: user.uid,
      ...projectFields(projects.find((project) => project.id === form.projectId)),
      firebaseUrl: normalizeUrl(form.firebaseUrl),
      notes: form.notes.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");
      if (editing) await updateDoc(dbRef(editing.id), payload);
      else
        await addDoc(collection(db, "databasesInfo"), { ...payload, createdAt: serverTimestamp() });
      setFormOpen(false);
      showToast(editing ? "Enlace actualizado." : "Enlace guardado.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudo guardar la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(dbRef(toDelete.id));
      setToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar el enlace.");
    }
  };

  return (
    <PageShell
      loading={loading}
      after={
        <>
          <FormDialog
            open={formOpen}
            onClose={closeForm}
            onSubmit={handleSave}
            saving={saving}
            error={formError}
            maxWidth="sm"
            icon={editing ? <EditRoundedIcon /> : <StorageRoundedIcon />}
            iconColor={FIREBASE_COLOR}
            title={editing ? "Editar enlace" : "Nuevo enlace Firebase"}
            subtitle="Acceso directo a la consola de Firebase de un proyecto."
            submitIcon={editing ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editing ? "Guardar cambios" : "Guardar enlace"}
            submitDisabled={projects.length === 0}
          >
            {projects.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: "14px", fontWeight: 650 }}>
                Primero necesitás crear un proyecto para guardar su enlace de Firebase.
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
            {duplicate && (
              <Alert severity="info" sx={{ borderRadius: "14px", fontWeight: 600, py: 0.25 }}>
                Este proyecto ya tiene un enlace guardado. Vas a tener los dos.
              </Alert>
            )}
            <TextField
              label="Enlace de Firebase Console"
              value={form.firebaseUrl}
              onChange={(event) => setForm({ ...form, firebaseUrl: event.target.value })}
              fullWidth
              disabled={saving}
              placeholder="https://console.firebase.google.com/project/..."
              helperText={
                getFirebaseProjectId(form.firebaseUrl)
                  ? `Proyecto de Firebase detectado: ${getFirebaseProjectId(form.firebaseUrl)}`
                  : "Copialo desde la barra del navegador con la consola abierta."
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{ color: FIREBASE_COLOR, "& svg": { fontSize: 20 } }}
                    >
                      <LinkRoundedIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={roundedFieldSx("12px")}
            />
            <TextField
              label="Notas"
              placeholder="Ej: plan Blaze, reglas en modo prueba, colecciones principales..."
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

          <DeleteDialog
            open={Boolean(toDelete)}
            title="Eliminar enlace"
            onClose={() => setToDelete(null)}
            onConfirm={confirmDelete}
            preview={
              toDelete && (
                <Stack direction="row" alignItems="center" spacing={1.1} sx={{ textAlign: "left" }}>
                  <ProjectAvatar item={toDelete} size={34} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 750, fontSize: "0.88rem" }}>
                      {toDelete.projectName || "Proyecto sin nombre"}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        color: theme.palette.app.secondary,
                        fontWeight: 600,
                        fontSize: "0.76rem",
                      }}
                    >
                      {getShortUrl(toDelete.firebaseUrl)}
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
          icon={<StorageRoundedIcon />}
          title="Base de datos"
          description="Accesos directos a Firebase Console por proyecto, con notas rápidas."
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
              value: databases.length,
              icon: <StorageRoundedIcon />,
              color: theme.palette.primary.main,
            },
            {
              label: "Proyectos",
              value: projects.length,
              icon: <FolderRoundedIcon />,
              color: theme.palette.success.main,
            },
            {
              label: "Con Firebase",
              value: stats.withDatabase,
              icon: <CloudQueueRoundedIcon />,
              color: FIREBASE_COLOR,
            },
            {
              label: "Sin enlace",
              value: stats.withoutDatabase,
              icon: <FolderOpenRoundedIcon />,
              color: theme.palette.text.secondary,
            },
          ]}
        />
      </Section>

      {databases.length === 0 ? (
        <Section delay={140}>
          <EmptyState
            icon={<StorageRoundedIcon />}
            title="Todavía no guardaste bases de datos"
            text="Elegí un proyecto y pegá el enlace de su Firebase Console para entrar con un clic cuando lo necesites."
            actionLabel="Nuevo enlace"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={120}>
            <FilterBar
              title="Consolas guardadas"
              subtitle={`${filtered.length} de ${databases.length} visibles`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar proyecto, URL o nota..."
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
            {filtered.length === 0 ? (
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
                {filtered.map((item, index) => (
                  <DatabaseCard
                    key={item.id}
                    item={item}
                    delay={index * 45}
                    onOpen={() => openFirebaseLink(item)}
                    onCopy={() => copyLink(item)}
                    onEdit={() => openForm(item)}
                    onDelete={() => setToDelete(item)}
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

function DatabaseCard({ item, delay, onOpen, onCopy, onEdit, onDelete }) {
  const theme = useTheme();
  const projectColor = item.projectColor || theme.palette.primary.main;
  const firebaseId = getFirebaseProjectId(item.firebaseUrl);

  return (
    <Card
      elevation={0}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        p: { xs: 1.6, md: 1.75 },
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(projectColor, 0.4),
          boxShadow: `0 14px 34px ${alpha(projectColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.3}>
        <ProjectAvatar item={item} size={40} />
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
            {item.projectName || "Proyecto sin nombre"}
          </Typography>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.secondary, fontSize: "0.75rem", fontWeight: 600 }}
          >
            Firebase Console
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <IconAction title="Editar" size={30} color={theme.palette.info.main} onClick={onEdit}>
            <EditRoundedIcon sx={{ fontSize: 16 }} />
          </IconAction>
          <IconAction
            title="Eliminar"
            size={30}
            color={theme.palette.error.main}
            onClick={onDelete}
          >
            <DeleteRoundedIcon sx={{ fontSize: 16 }} />
          </IconAction>
        </Stack>
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.1}
        sx={{
          mt: 1.5,
          pl: 0.9,
          pr: 0.6,
          py: 0.7,
          borderRadius: "12px",
          bgcolor: getSoftBackground(theme),
          border: `1px solid ${theme.palette.app.borderSoft}`,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "9px",
            display: "grid",
            placeItems: "center",
            color: FIREBASE_COLOR,
            bgcolor: softTint(theme, FIREBASE_COLOR, 0.1, 0.18),
            "& svg": { fontSize: 16 },
          }}
        >
          <StorageRoundedIcon />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ color: theme.palette.app.text, fontSize: "0.82rem", fontWeight: 650 }}
          >
            {firebaseId || getShortUrl(item.firebaseUrl)}
          </Typography>
          {firebaseId && (
            <Typography
              noWrap
              sx={{ color: theme.palette.app.secondary, fontSize: "0.72rem", fontWeight: 550 }}
            >
              {getShortUrl(item.firebaseUrl)}
            </Typography>
          )}
        </Box>
        <IconAction
          title="Copiar enlace"
          size={28}
          color={theme.palette.app.secondary}
          onClick={onCopy}
        >
          <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
        </IconAction>
      </Stack>

      {item.notes && (
        <Stack direction="row" alignItems="flex-start" spacing={0.9} sx={{ mt: 1.1, px: 0.4 }}>
          <NoteAltRoundedIcon
            sx={{ mt: 0.15, fontSize: 16, color: theme.palette.app.secondary, flexShrink: 0 }}
          />
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: "0.8rem",
              fontWeight: 550,
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
            }}
          >
            {item.notes}
          </Typography>
        </Stack>
      )}

      <SoftButton
        fullWidth
        startIcon={<OpenInNewRoundedIcon />}
        onClick={onOpen}
        sx={{ mt: 1.4, minHeight: 36, borderRadius: "11px", fontWeight: 800, fontSize: "0.82rem" }}
      >
        Abrir Firebase
      </SoftButton>
    </Card>
  );
}
