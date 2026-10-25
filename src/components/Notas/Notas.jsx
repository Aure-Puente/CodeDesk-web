//Notas:
import { useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Box, Button, Card, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import FolderOffRoundedIcon from "@mui/icons-material/FolderOffRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byCreatedDesc, byName } from "../../shared/hooks/useUserCollection";
import { copyToClipboard, projectFields } from "../../shared/utils";
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
  matchesProjectFilter,
  projectFilterOptions,
  roundedFieldSx,
  useToast,
} from "../../shared/ui";

const EMPTY_FORM = { title: "", content: "", projectId: "" };
const WEEK = 7 * 24 * 60 * 60;

const countWords = (text) =>
  String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const toDate = (ts) => ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : null);
const formatShortDate = (ts) => {
  const date = toDate(ts);
  if (!date) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  })
    .format(date)
    .replace(/ de /g, " ")
    .replace(".", "");
};
const noteDate = (note) => note.updatedAt || note.createdAt;

export default function Notas() {
  const theme = useTheme();
  const { user } = useAuth();
  const [notes, loading, loadError] = useUserCollection("notes", {
    sort: byCreatedDesc,
    errorMessage: "No se pudieron cargar las notas.",
  });
  const [projects] = useUserCollection("projects", { sort: byName });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingNote, setEditingNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("todos");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notes.filter(
      (note) =>
        matchesProjectFilter(note, filterProject) &&
        `${note.title || ""} ${note.content || ""} ${note.projectName || ""}`
          .toLowerCase()
          .includes(term),
    );
  }, [notes, filterProject, search]);

  const stats = useMemo(() => {
    const withProject = notes.filter((note) => note.projectId).length;
    const since = Date.now() / 1000 - WEEK;

    return {
      total: notes.length,
      withProject,
      withoutProject: notes.length - withProject,
      thisWeek: notes.filter((note) => (toDate(noteDate(note))?.getTime() ?? 0) / 1000 >= since)
        .length,
    };
  }, [notes]);

  const openForm = (note = null) => {
    setEditingNote(note);
    setForm(
      note
        ? { title: note.title || "", content: note.content || "", projectId: note.projectId || "" }
        : EMPTY_FORM,
    );
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingNote(null);
  };

  const handleSaveNote = async (event) => {
    event?.preventDefault();

    if (!form.title.trim() && !form.content.trim()) {
      setFormError("Escribí un título o contenido.");
      return;
    }

    const payload = {
      userId: user.uid,
      title: form.title.trim(),
      content: form.content.trim(),
      category: "General",
      ...projectFields(projects.find((project) => project.id === form.projectId)),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");

      if (editingNote) await updateDoc(doc(db, "notes", editingNote.id), payload);
      else await addDoc(collection(db, "notes"), { ...payload, createdAt: serverTimestamp() });

      setFormOpen(false);
      setEditingNote(null);
      showToast(editingNote ? "Nota actualizada." : "Nota creada.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudo guardar la nota.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "notes", noteToDelete.id));
      if (selectedNote?.id === noteToDelete.id) setSelectedNote(null);
      setNoteToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar la nota.");
    }
  };

  const copyNote = async (note) => {
    const text = `${note.title || ""}\n\n${note.content || ""}`.trim();
    if (!text)
      return showToast("Esta nota no tiene contenido para copiar.", { severity: "warning" });

    const copied = await copyToClipboard(text);
    showToast(copied ? "La nota fue copiada al portapapeles." : "No se pudo copiar la nota.", {
      severity: copied ? "success" : "error",
    });
  };

  const hasFilters = Boolean(search.trim()) || filterProject !== "todos";
  const resetFilters = () => {
    setSearch("");
    setFilterProject("todos");
  };
  const words = countWords(form.content);

  return (
    <PageShell
      loading={loading}
      after={
        <>
          <FormDialog
            open={formOpen}
            onClose={closeForm}
            onSubmit={handleSaveNote}
            saving={saving}
            error={formError}
            maxWidth="md"
            icon={editingNote ? <EditRoundedIcon /> : <StickyNote2RoundedIcon />}
            title={editingNote ? "Editar nota" : "Nueva nota"}
            subtitle="Una idea, comando, bug o recordatorio rápido."
            submitIcon={editingNote ? <EditRoundedIcon /> : <AddRoundedIcon />}
            submitLabel={editingNote ? "Guardar cambios" : "Guardar nota"}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1.4fr 1fr" },
                gap: 1.75,
              }}
            >
              <TextField
                label="Título"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                fullWidth
                disabled={saving}
                autoFocus
                sx={roundedFieldSx("12px")}
              />
              <Box>
                <ProjectSelect
                  label="Proyecto"
                  projects={projects}
                  value={form.projectId}
                  onChange={(projectId) => setForm({ ...form, projectId })}
                  disabled={saving}
                  emptyLabel="Sin proyecto"
                  showPreview={false}
                />
              </Box>
            </Box>
            <TextField
              label="Contenido"
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey))
                  handleSaveNote(event);
              }}
              fullWidth
              multiline
              minRows={8}
              maxRows={16}
              disabled={saving}
              placeholder="Escribí lo que quieras recordar..."
              helperText={`${words} ${words === 1 ? "palabra" : "palabras"} · Ctrl + Enter para guardar`}
              sx={{
                ...roundedFieldSx("12px"),
                "& textarea": { lineHeight: 1.6, fontSize: "0.92rem" },
                "& .MuiFormHelperText-root": { textAlign: "right", mr: 0.5 },
              }}
            />
          </FormDialog>

          <NoteDetailDialog
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
            onCopy={() => copyNote(selectedNote)}
            onDelete={() => setNoteToDelete(selectedNote)}
            onEdit={() => {
              const note = selectedNote;
              setSelectedNote(null);
              openForm(note);
            }}
          />

          <DeleteDialog
            open={Boolean(noteToDelete)}
            title="Eliminar nota"
            previewTitle={noteToDelete?.title || "Sin título"}
            previewSubtitle={noteToDelete?.projectName || "Sin proyecto"}
            onClose={() => setNoteToDelete(null)}
            onConfirm={confirmDeleteNote}
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<StickyNote2RoundedIcon />}
          title="Notas"
          description="Ideas, bugs, comandos y recordatorios rápidos, vinculados a tus proyectos."
          actionLabel="Nueva nota"
          onAction={() => openForm()}
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      <Section delay={70}>
        <StatsGrid
          items={[
            {
              label: "Notas",
              value: stats.total,
              icon: <StickyNote2RoundedIcon />,
              color: theme.palette.primary.main,
            },
            {
              label: "Con proyecto",
              value: stats.withProject,
              icon: <FolderRoundedIcon />,
              color: theme.palette.info.main,
            },
            {
              label: "Sin proyecto",
              value: stats.withoutProject,
              icon: <FolderOffRoundedIcon />,
              color: theme.palette.text.secondary,
            },
            {
              label: "Esta semana",
              value: stats.thisWeek,
              icon: <EventRoundedIcon />,
              color: theme.palette.success.main,
            },
          ]}
        />
      </Section>

      {notes.length === 0 ? (
        <Section delay={140}>
          <EmptyState
            icon={<NoteAddRoundedIcon />}
            title="Todavía no tenés notas"
            text="Anotá ideas, bugs, comandos útiles o recordatorios. Podés vincular cada nota a un proyecto."
            actionLabel="Nueva nota"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={120}>
            <FilterBar
              title="Tus notas"
              subtitle={`${filteredNotes.length} de ${notes.length} visibles`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar notas..."
                width={280}
              />
              <FilterSelect
                label="Proyecto"
                value={filterProject}
                onChange={setFilterProject}
                minWidth={230}
              >
                {projectFilterOptions(projects)}
              </FilterSelect>
            </FilterBar>
          </Section>

          <Section delay={180}>
            {filteredNotes.length === 0 ? (
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title="Sin resultados"
                text="Ninguna nota coincide con la búsqueda o el proyecto elegido."
                actionLabel="Limpiar filtros"
                actionIcon={<FilterAltOffRoundedIcon />}
                onAction={resetFilters}
              />
            ) : (
              <Box sx={{ columnCount: { xs: 1, md: 2, xl: 3 }, columnGap: { xs: 1.5, md: 1.75 } }}>
                {filteredNotes.map((note, index) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    delay={index * 45}
                    onOpen={() => setSelectedNote(note)}
                    onCopy={() => copyNote(note)}
                    onEdit={() => openForm(note)}
                    onDelete={() => setNoteToDelete(note)}
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

function NoteProject({ note, size = 20 }) {
  const theme = useTheme();

  return (
    <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
      {note.projectName ? (
        <ProjectAvatar item={note} size={size} fontSize={size * 0.5} sx={{ border: "none" }} />
      ) : (
        <FolderOffRoundedIcon sx={{ fontSize: size * 0.85, color: theme.palette.app.secondary }} />
      )}
      <Typography
        noWrap
        sx={{ color: theme.palette.app.secondary, fontSize: "0.76rem", fontWeight: 700 }}
      >
        {note.projectName || "Sin proyecto"}
      </Typography>
    </Stack>
  );
}

function NoteCard({ note, delay, onOpen, onCopy, onEdit, onDelete }) {
  const theme = useTheme();
  const noteColor = note.projectId ? note.projectColor || theme.palette.primary.main : "#94A3B8";
  const content = String(note.content || "").trim();

  return (
    <Card
      elevation={0}
      onClick={onOpen}
      sx={{
        ...getCardStyles(theme, "18px"),
        ...getSoftFadeSx(delay),
        breakInside: "avoid",
        mb: { xs: 1.5, md: 1.75 },
        position: "relative",
        p: { xs: 1.6, md: 1.75 },
        pt: { xs: 1.8, md: 1.95 },
        cursor: "pointer",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          background: `linear-gradient(90deg, ${noteColor}, ${alpha(noteColor, 0.15)})`,
        },
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(noteColor, 0.4),
          boxShadow: `0 14px 34px ${alpha(noteColor, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
        },
        "&:hover .note-actions": { opacity: 1 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <NoteProject note={note} />
        <Typography
          noWrap
          sx={{
            flexShrink: 0,
            color: theme.palette.app.secondary,
            fontSize: "0.72rem",
            fontWeight: 600,
          }}
        >
          {formatShortDate(noteDate(note))}
        </Typography>
      </Stack>

      <Typography
        sx={{
          mt: 1,
          color: theme.palette.app.text,
          fontSize: "0.98rem",
          fontWeight: 800,
          letterSpacing: "-0.2px",
          lineHeight: 1.3,
          overflowWrap: "anywhere",
        }}
      >
        {note.title || "Sin título"}
      </Typography>

      {content && (
        <Typography
          sx={{
            mt: 0.6,
            color: theme.palette.app.secondary,
            fontSize: "0.84rem",
            lineHeight: 1.6,
            fontWeight: 500,
            display: "-webkit-box",
            WebkitLineClamp: 6,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {content}
        </Typography>
      )}

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={0.5}
        className="note-actions"
        sx={{ mt: 1.25, opacity: { xs: 1, md: 0.7 }, transition: "opacity 0.18s ease" }}
      >
        <IconAction title="Copiar" size={30} color={theme.palette.app.secondary} onClick={onCopy}>
          <ContentCopyRoundedIcon sx={{ fontSize: 15 }} />
        </IconAction>
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

function NoteDetailDialog({ note, onClose, onEdit, onCopy, onDelete }) {
  const theme = useTheme();
  if (!note) return null;

  const words = countWords(note.content);
  const date = formatShortDate(noteDate(note));
  const buttonSx = { minHeight: 40, px: 1.6, borderRadius: "12px", fontWeight: 750 };

  return (
    <AppDialog
      open
      onClose={onClose}
      maxWidth="md"
      header={
        <Box sx={{ minWidth: 0 }}>
          <NoteProject note={note} size={22} />
          <Typography
            sx={{
              mt: 0.8,
              color: theme.palette.app.text,
              fontSize: "1.15rem",
              fontWeight: 850,
              letterSpacing: "-0.3px",
              lineHeight: 1.3,
              overflowWrap: "anywhere",
            }}
          >
            {note.title || "Sin título"}
          </Typography>
          <Typography
            sx={{
              mt: 0.3,
              color: theme.palette.app.secondary,
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            {[date && `Actualizada ${date}`, `${words} ${words === 1 ? "palabra" : "palabras"}`]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        </Box>
      }
      actions={
        <>
          <Button
            onClick={onDelete}
            color="error"
            startIcon={<DeleteRoundedIcon />}
            sx={{ ...buttonSx, mr: "auto" }}
          >
            Eliminar
          </Button>
          <Button onClick={onCopy} startIcon={<ContentCopyRoundedIcon />} sx={buttonSx}>
            Copiar
          </Button>
          <Button
            variant="contained"
            onClick={onEdit}
            startIcon={<EditRoundedIcon />}
            sx={{ ...buttonSx, fontWeight: 800, boxShadow: "none" }}
          >
            Editar nota
          </Button>
        </>
      }
    >
      <Box
        sx={{
          borderRadius: "14px",
          border: `1px solid ${theme.palette.app.borderSoft}`,
          backgroundColor: getSoftBackground(theme),
          px: 2,
          py: 1.75,
        }}
      >
        <Typography
          sx={{
            color: note.content?.trim() ? theme.palette.app.text : theme.palette.app.secondary,
            fontSize: "0.92rem",
            lineHeight: 1.7,
            fontWeight: 500,
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {note.content?.trim() ? note.content : "Esta nota no tiene contenido."}
        </Typography>
      </Box>
    </AppDialog>
  );
}
