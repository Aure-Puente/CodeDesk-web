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
import Collapse from "@mui/material/Collapse";
import Skeleton from "@mui/material/Skeleton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import Badge from "@mui/material/Badge";
import { alpha, useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import StickyNote2RoundedIcon from "@mui/icons-material/StickyNote2Rounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";

//JSX:
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

function getNotePreview(note) {
  const text = String(note?.content || "").trim();

  if (!text) return "Esta nota todavía no tiene contenido.";

  return text;
}

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function Notas() {
  const theme = useTheme();
  const { user } = useAuth();

  const [notes, setNotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingNote, setEditingNote] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState("");

  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("todos");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", user.uid)
    );

    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", user.uid)
    );

    const unsubscribeNotes = onSnapshot(
      notesQuery,
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

        setNotes(data);
        setLoading(false);
      },
      (error) => {
        console.log(error);
        setNotes([]);
        setLoading(false);
        setPageError("No se pudieron cargar las notas.");
      }
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

    return () => {
      unsubscribeNotes();
      unsubscribeProjects();
    };
  }, [user]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === projectId) || null;
  }, [projects, projectId]);

  const selectedFilterProject = useMemo(() => {
    if (filterProject === "todos") {
      return {
        id: "todos",
        name: "Todos los proyectos",
        color: theme.palette.primary.main,
        logoUrl: null,
      };
    }

    if (filterProject === "sinProyecto") {
      return {
        id: "sinProyecto",
        name: "Sin proyecto",
        color: theme.palette.text.secondary,
        logoUrl: null,
      };
    }

    const project = projects.find((item) => item.id === filterProject);

    return {
      id: project?.id || "todos",
      name: project?.name || "Proyecto",
      color: project?.color || theme.palette.primary.main,
      logoUrl: project?.logoUrl || null,
    };
  }, [filterProject, projects, theme]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (search.trim()) count += 1;
    if (filterProject !== "todos") count += 1;

    return count;
  }, [search, filterProject]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesProject =
        filterProject === "todos"
          ? true
          : filterProject === "sinProyecto"
          ? !note.projectId
          : note.projectId === filterProject;

      const text = `${note.title || ""} ${note.content || ""} ${
        note.projectName || ""
      }`.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      return matchesProject && matchesSearch;
    });
  }, [notes, filterProject, search]);

  const stats = useMemo(() => {
    const total = notes.length;
    const withProject = notes.filter((note) => note.projectId).length;
    const withoutProject = total - withProject;
    const totalWords = notes.reduce((acc, note) => acc + countWords(note.content), 0);

    return {
      total,
      withProject,
      withoutProject,
      totalWords,
    };
  }, [notes]);

  function resetForm() {
    setEditingNote(null);
    setTitle("");
    setContent("");
    setProjectId("");
    setPageError("");
  }

  function openCreateDialog() {
    resetForm();
    setNoteDialogOpen(true);
  }

  function openEditDialog(note) {
    setEditingNote(note);
    setTitle(note.title || "");
    setContent(note.content || "");
    setProjectId(note.projectId || "");
    setPageError("");
    setNoteDialogOpen(true);
  }

  function closeNoteDialog() {
    resetForm();
    setNoteDialogOpen(false);
  }

  function openDetailDialog(note) {
    setSelectedNote(note);
    setDetailDialogOpen(true);
  }

  function closeDetailDialog() {
    setSelectedNote(null);
    setDetailDialogOpen(false);
  }

  function openEditFromDetail() {
    if (!selectedNote) return;

    const note = selectedNote;

    closeDetailDialog();

    setTimeout(() => {
      openEditDialog(note);
    }, 120);
  }

  function openDeleteDialog(note) {
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setNoteToDelete(null);
    setDeleteDialogOpen(false);
  }

  async function handleSaveNote(event) {
    event?.preventDefault();

    if (!title.trim() && !content.trim()) {
      setPageError("Escribí un título o contenido.");
      return;
    }

    try {
      setSaving(true);
      setPageError("");
      setPageSuccess("");

      const selectedProject = projects.find((project) => project.id === projectId);

      const payload = {
        userId: user.uid,
        title: title.trim(),
        content: content.trim(),
        category: "General",
        projectId: projectId || null,
        projectName: selectedProject?.name || null,
        projectColor: selectedProject?.color || null,
        projectLogoUrl: selectedProject?.logoUrl || null,
        updatedAt: serverTimestamp(),
      };

      if (editingNote) {
        await updateDoc(doc(db, "notes", editingNote.id), payload);
      } else {
        await addDoc(collection(db, "notes"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      closeNoteDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo guardar la nota.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteNote() {
    if (!noteToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "notes", noteToDelete.id));

      if (selectedNote?.id === noteToDelete.id) {
        closeDetailDialog();
      }

      closeDeleteDialog();
    } catch (error) {
      console.log(error);
      setPageError("No se pudo eliminar la nota.");
    }
  }

  async function copyNote(note) {
    const text = `${note.title || ""}\n\n${note.content || ""}`.trim();

    if (!text) {
      setPageError("Esta nota no tiene contenido para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setPageSuccess("La nota fue copiada al portapapeles.");

      setTimeout(() => {
        setPageSuccess("");
      }, 2200);
    } catch (error) {
      console.log(error);
      setPageError("No se pudo copiar la nota.");
    }
  }

  function resetFilters() {
    setSearch("");
    setFilterProject("todos");
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        pb: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.3, md: 3 }}>
        <PageHeader onCreate={openCreateDialog} stats={stats} />

        {pageError ? (
          <Alert
            severity="error"
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: alpha(theme.palette.error.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageError}
          </Alert>
        ) : null}

        {pageSuccess ? (
          <Alert
            severity="success"
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.2),
              fontWeight: 700,
            }}
          >
            {pageSuccess}
          </Alert>
        ) : null}

        <StatsGrid stats={stats} />

        <FiltersCard
          search={search}
          setSearch={setSearch}
          filterProject={filterProject}
          setFilterProject={setFilterProject}
          projects={projects}
          visibleCount={filteredNotes.length}
          totalCount={notes.length}
          onResetFilters={resetFilters}
        />

        <ListHeader loading={loading} filteredCount={filteredNotes.length} />

        {loading ? (
          <NotesSkeleton />
        ) : filteredNotes.length === 0 ? (
          <EmptyState onCreate={openCreateDialog} />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, 1fr)",
              },
              gap: { xs: 1.6, md: 2 },
            }}
          >
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onOpenDetail={() => openDetailDialog(note)}
                onCopy={() => copyNote(note)}
                onEdit={() => openEditDialog(note)}
                onDelete={() => openDeleteDialog(note)}
              />
            ))}
          </Box>
        )}
      </Stack>

      <NoteFormDialog
        open={noteDialogOpen}
        editingNote={editingNote}
        title={title}
        setTitle={setTitle}
        content={content}
        setContent={setContent}
        projectId={projectId}
        setProjectId={setProjectId}
        selectedProject={selectedProject}
        projects={projects}
        saving={saving}
        pageError={pageError}
        onClose={closeNoteDialog}
        onSave={handleSaveNote}
      />

      <NoteDetailDialog
        open={detailDialogOpen}
        selectedNote={selectedNote}
        onClose={closeDetailDialog}
        onEdit={openEditFromDetail}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        noteToDelete={noteToDelete}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteNote}
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
              ? alpha(theme.palette.info.main, 0.1)
              : alpha(theme.palette.info.main, 0.08),
          filter: "blur(70px)",
        }}
      />
    </Box>
  );
}

function PageHeader({ onCreate, stats }) {
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
            <StickyNote2RoundedIcon sx={{ fontSize: { xs: 23, md: 25 } }} />
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
              Notas
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
              Guardá ideas, bugs, comandos, recordatorios y apuntes rápidos
              vinculados a tus proyectos.
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.6, flexWrap: "wrap", rowGap: 1 }}
            >
              <HeaderMiniChip label={`${stats.total} notas`} />
              <HeaderMiniChip label={`${stats.withProject} con proyecto`} />
              <HeaderMiniChip label={`${stats.totalWords} palabras`} />
            </Stack>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            height: 42,
            px: 2,
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
            whiteSpace: "nowrap",
            fontSize: "0.88rem",
            alignSelf: { xs: "stretch", sm: "center" },
            "& .MuiButton-startIcon": {
              mr: 0.65,
            },
          }}
        >
          Nueva nota
        </Button>
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

function StatsGrid({ stats }) {
  const theme = useTheme();

  const items = [
    {
      label: "Notas",
      value: stats.total,
      icon: <DashboardRoundedIcon />,
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
      icon: <RadioButtonUncheckedRoundedIcon />,
      color: theme.palette.text.secondary,
    },
    {
      label: "Palabras",
      value: stats.totalWords,
      icon: <ArticleRoundedIcon />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr 1fr",
          md: "repeat(4, 1fr)",
        },
        gap: { xs: 1.3, md: 1.8 },
      }}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          variant="outlined"
          sx={{
            ...getGlassCardStyles(theme),
            borderRadius: 3.5,
            p: { xs: 1.7, md: 2.1 },
            boxShadow: "none",
            transition: "0.2s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              borderColor: alpha(item.color, 0.28),
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: { xs: 40, md: 46 },
                height: { xs: 40, md: 46 },
                borderRadius: 2.1,
                color: item.color,
                bgcolor: alpha(
                  item.color,
                  theme.palette.mode === "dark" ? 0.16 : 0.1
                ),
              }}
            >
              {item.icon}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: 25, md: 32 },
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: -0.7,
                }}
              >
                {item.value}
              </Typography>

              <Typography
                noWrap
                color="text.secondary"
                sx={{
                  mt: 0.65,
                  fontSize: { xs: 12.5, md: 13.5 },
                  fontWeight: 900,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

function FiltersCard({
  search,
  setSearch,
  filterProject,
  setFilterProject,
  projects,
  visibleCount,
  totalCount,
  onResetFilters,
}) {
  const theme = useTheme();

  const hasFilters = search.trim() || filterProject !== "todos";

  return (
    <Card
      elevation={0}
      sx={{
        ...getGlassCardStyles(theme),
        p: { xs: 1.6, md: 2 },
        boxShadow: "none",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={1.6}
      >
        <Stack direction="row" alignItems="center" spacing={1.2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 42,
              height: 42,
              borderRadius: "15px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
            }}
          >
            <FilterAltRoundedIcon />
          </Avatar>

          <Box>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 900,
                fontSize: "0.98rem",
              }}
            >
              Filtros
            </Typography>

            <Typography
              sx={{
                mt: 0.2,
                color: theme.palette.app.secondary,
                fontSize: "0.82rem",
                fontWeight: 650,
              }}
            >
              {visibleCount} visibles de {totalCount} notas.
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TextField
            placeholder="Buscar notas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            sx={{
              width: { xs: "100%", md: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: getSoftBackground(theme),
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 230 } }}>
            <InputLabel>Proyecto</InputLabel>
            <Select
              label="Proyecto"
              value={filterProject}
              onChange={(event) => setFilterProject(event.target.value)}
              sx={{
                borderRadius: "14px",
                backgroundColor: getSoftBackground(theme),
              }}
            >
              <MenuItem value="todos">Todos los proyectos</MenuItem>
              <MenuItem value="sinProyecto">Sin proyecto</MenuItem>

              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        mt: "-1px",
                        borderRadius: 999,
                        bgcolor: project.color || "primary.main",
                        boxShadow: `0 0 0 4px ${alpha(
                          project.color || theme.palette.primary.main,
                          0.1
                        )}`,
                        flexShrink: 0,
                      }}
                    />

                    <Typography component="span" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {project.name}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters ? (
            <Button
              variant="outlined"
              startIcon={<FilterAltOffRoundedIcon />}
              onClick={onResetFilters}
              sx={{
                height: 40,
                borderRadius: "14px",
                fontWeight: 900,
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
            >
              Limpiar
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}

function ProjectTinyPreview({ project, alwaysVisible = false }) {
  const theme = useTheme();

  return (
    <Avatar
      variant="rounded"
      src={project?.logoUrl || undefined}
      sx={{
        display: alwaysVisible ? "flex" : { xs: "none", sm: "flex" },
        width: 38,
        height: 38,
        borderRadius: 2,
        bgcolor: getProjectIconBackground(theme, project?.color),
        color: project?.color || "primary.main",
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, project?.color),
        fontWeight: 950,
      }}
    >
      {project?.name?.charAt(0)?.toUpperCase() || <FolderRoundedIcon />}
    </Avatar>
  );
}

function ListHeader({ loading, filteredCount }) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ px: { xs: 0.2, md: 0.4 } }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "12px",
            color: theme.palette.primary.main,
            bgcolor: theme.palette.app.primarySoft,
          }}
        >
          <StickyNote2RoundedIcon sx={{ fontSize: 18 }} />
        </Avatar>

        <Box>
          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: 12, md: 13 },
              fontWeight: 950,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            {loading ? "Cargando notas" : `${filteredCount} notas visibles`}
          </Typography>

          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: 12.5,
              fontWeight: 650,
            }}
          >
            Ordenadas por creación más reciente.
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}

function NoteCard({ note, onOpenDetail, onCopy, onEdit, onDelete }) {
  const theme = useTheme();

  const noteColor = note.projectColor || theme.palette.primary.main;
  const words = countWords(note.content);

  return (
    <Card
      elevation={0}
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: "22px",
        overflow: "hidden",
        transition: "all 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: alpha(noteColor, 0.32),
        },
      }}
    >
      <Box sx={{ p: { xs: 1.7, md: 2 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.6}>
          <Box onClick={onOpenDetail} sx={{ cursor: "pointer" }}>
            <ProjectBadge item={note} size={62} />
          </Box>

          <Box
            onClick={onOpenDetail}
            sx={{
              flex: 1,
              minWidth: 0,
              cursor: "pointer",
            }}
          >
            <Stack direction="row" flexWrap="wrap" gap={0.8} sx={{ mb: 0.65 }}>
              <Chip
                size="small"
                icon={<StickyNote2RoundedIcon />}
                label={`${words} palabras`}
                sx={{
                  height: 27,
                  borderRadius: "999px",
                  color: theme.palette.primary.main,
                  bgcolor: alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.16 : 0.09
                  ),
                  border: `1px solid ${alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.25 : 0.16
                  )}`,
                  fontWeight: 900,
                  "& .MuiChip-icon": {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            </Stack>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: "1.05rem", md: "1.18rem" },
                fontWeight: 950,
                letterSpacing: "-0.25px",
                lineHeight: 1.25,
              }}
            >
              {note.title || "Sin título"}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 0.65 }}>
              <BusinessCenterRoundedIcon
                sx={{ fontSize: 16, color: theme.palette.app.secondary, flexShrink: 0 }}
              />

              <Typography
                noWrap
                sx={{
                  color: theme.palette.app.secondary,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  minWidth: 0,
                }}
              >
                {note.projectName || "Sin proyecto"}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Box
          onClick={onOpenDetail}
          sx={{
            mt: 1.7,
            borderRadius: "18px",
            border: `1px solid ${theme.palette.app.borderSoft}`,
            backgroundColor: getSoftBackground(theme),
            p: 1.6,
            cursor: "pointer",
          }}
        >
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: { xs: "0.88rem", md: "0.95rem" },
              lineHeight: 1.65,
              fontWeight: 550,
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
            }}
          >
            {getNotePreview(note)}
          </Typography>
        </Box>

        <Divider sx={{ my: 1.7, borderColor: theme.palette.app.borderSoft }} />

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            width: "100%",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ContentCopyRoundedIcon />}
            onClick={onCopy}
            sx={{
              minHeight: 40,
              borderRadius: "999px",
              fontWeight: 950,
              textTransform: "none",
              flexShrink: 0,
            }}
          >
            Copiar
          </Button>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="flex-end"
            sx={{
              ml: "auto",
            }}
          >
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
    </Card>
  );
}

function ProjectBadge({ item, size = 52 }) {
  const theme = useTheme();

  const color = item.projectColor || theme.palette.primary.main;
  const logoUrl = item.projectLogoUrl;

  return (
    <Box
      sx={{
        width: { xs: size - 10, md: size },
        height: { xs: size - 10, md: size },
        flexShrink: 0,
        borderRadius: `${size / 3}px`,
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, color),
        bgcolor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(color, 0.13)}`,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={item.projectName || "Proyecto"}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : item.projectName ? (
        <Typography
          sx={{
            color,
            fontSize: { xs: 22, md: 30 },
            fontWeight: 950,
          }}
        >
          {item.projectName.charAt(0).toUpperCase()}
        </Typography>
      ) : (
        <NotesRoundedIcon
          sx={{
            color: theme.palette.primary.main,
            fontSize: { xs: 28, md: 34 },
          }}
        />
      )}
    </Box>
  );
}

function ProjectSmallIcon({ color, logoUrl, letter, icon, size = "normal" }) {
  const theme = useTheme();

  const boxSize = size === "detail" ? 72 : 48;

  return (
    <Box
      sx={{
        width: { xs: boxSize - 8, md: boxSize },
        height: { xs: boxSize - 8, md: boxSize },
        flexShrink: 0,
        borderRadius: size === "detail" ? 3.2 : 2.3,
        border: "1px solid",
        borderColor: getProjectIconBorder(theme, color),
        bgcolor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(color, 0.13)}`,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt="Proyecto"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : letter ? (
        <Typography
          sx={{
            color,
            fontSize: size === "detail" ? 30 : 22,
            fontWeight: 950,
          }}
        >
          {letter}
        </Typography>
      ) : (
        icon
      )}
    </Box>
  );
}

function EmptyState({ onCreate }) {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        ...getGlassCardStyles(theme),
        borderRadius: 4,
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
            borderRadius: 3.2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            mb: 2.2,
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.16),
          }}
        >
          <NoteAddRoundedIcon sx={{ fontSize: { xs: 34, md: 42 } }} />
        </Avatar>

        <Typography
          sx={{
            fontSize: { xs: 22, md: 28 },
            fontWeight: 950,
            letterSpacing: -0.5,
            textAlign: "center",
          }}
        >
          Sin notas para mostrar
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
          Agregá una nota rápida para ideas, bugs, comandos útiles o recordatorios
          de tus proyectos.
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onCreate}
          sx={{
            minHeight: 48,
            px: 2.6,
            borderRadius: 2.8,
            fontWeight: 950,
            textTransform: "none",
          }}
        >
          Nueva nota
        </Button>
      </Stack>
    </Card>
  );
}

function NoteFormDialog({
  open,
  editingNote,
  title,
  setTitle,
  content,
  setContent,
  projectId,
  setProjectId,
  selectedProject,
  projects,
  saving,
  pageError,
  onClose,
  onSave,
}) {
  const theme = useTheme();

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
            pt: 2.4,
            pb: 2,
            pr: 7,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              variant="rounded"
              sx={{
                width: 50,
                height: 50,
                borderRadius: "16px",
                color: theme.palette.primary.main,
                backgroundColor: theme.palette.app.primarySoft,
                border: `1px solid ${theme.palette.app.borderSoft}`,
              }}
            >
              {editingNote ? <EditRoundedIcon /> : <AddRoundedIcon />}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  color: theme.palette.app.text,
                  fontSize: "1.25rem",
                  fontWeight: 950,
                }}
              >
                {editingNote ? "Editar nota" : "Nueva nota"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: theme.palette.app.secondary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                }}
              >
                Guardá una idea, comando, bug o recordatorio rápido.
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
        </DialogTitle>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.4 }}>
          <Stack spacing={2}>
            {pageError ? (
              <Alert severity="error" sx={{ borderRadius: "14px", fontWeight: 700 }}>
                {pageError}
              </Alert>
            ) : null}

            <TextField
              label="Título"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              fullWidth
              disabled={saving}
              autoFocus
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Proyecto relacionado</InputLabel>

              <Select
                label="Proyecto relacionado"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={saving}
                sx={{ borderRadius: "14px" }}
              >
                <MenuItem value="">Sin proyecto</MenuItem>

                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Stack direction="row" alignItems="center" spacing={1.2}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          mt: "-1px",
                          borderRadius: 999,
                          bgcolor: project.color || "primary.main",
                          boxShadow: `0 0 0 4px ${alpha(
                            project.color || theme.palette.primary.main,
                            0.1
                          )}`,
                          flexShrink: 0,
                        }}
                      />

                      <Typography component="span" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {project.name}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedProject ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.3}
                sx={{
                  borderRadius: "18px",
                  border: `1px solid ${theme.palette.app.borderSoft}`,
                  backgroundColor: getSoftBackground(theme),
                  p: 1.4,
                }}
              >
                <ProjectPreviewIcon project={selectedProject} />

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: theme.palette.app.text, fontWeight: 950 }}>
                    {selectedProject.name}
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      mt: 0.2,
                      color: theme.palette.app.secondary,
                      fontSize: 13,
                      fontWeight: 650,
                    }}
                  >
                    Proyecto seleccionado
                  </Typography>
                </Box>
              </Stack>
            ) : null}

            <TextField
              label="Contenido"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              fullWidth
              multiline
              minRows={9}
              disabled={saving}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "14px",
                },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

        <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2 }}>
          <Button
            onClick={onClose}
            disabled={saving}
            sx={{
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 850,
            }}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={editingNote ? <EditRoundedIcon /> : <AddRoundedIcon />}
            sx={{
              minHeight: 42,
              px: 2.2,
              borderRadius: "14px",
              textTransform: "none",
              fontWeight: 900,
              boxShadow: "none",
            }}
          >
            {saving
              ? "Guardando..."
              : editingNote
              ? "Guardar cambios"
              : "Guardar nota"}
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
        borderRadius: 2.2,
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

function NoteDetailDialog({ open, selectedNote, onClose, onEdit }) {
  const theme = useTheme();

  const detailProjectColor =
    selectedNote?.projectColor || theme.palette.primary.main;

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogTitle
        sx={{
          position: "relative",
          px: { xs: 2.2, md: 3 },
          pt: 2.4,
          pb: 2,
          pr: 7,
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.6}>
          <ProjectSmallIcon
            color={detailProjectColor}
            logoUrl={selectedNote?.projectLogoUrl}
            letter={selectedNote?.projectName?.charAt(0)?.toUpperCase()}
            icon={
              <NotesRoundedIcon
                sx={{
                  color: detailProjectColor,
                  fontSize: 30,
                }}
              />
            }
            size="detail"
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              sx={{
                color: theme.palette.app.secondary,
                fontSize: 14,
                fontWeight: 850,
                mb: 0.7,
              }}
            >
              {selectedNote?.projectName || "Sin proyecto"}
            </Typography>

            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: { xs: 23, md: 29 },
                fontWeight: 950,
                letterSpacing: -0.5,
                lineHeight: 1.2,
              }}
            >
              {selectedNote?.title || "Sin título"}
            </Typography>

            <Chip
              size="small"
              icon={<ArticleRoundedIcon />}
              label={`${countWords(selectedNote?.content)} palabras`}
              sx={{
                mt: 1.3,
                height: 28,
                borderRadius: 999,
                color: detailProjectColor,
                bgcolor: alpha(
                  detailProjectColor,
                  theme.palette.mode === "dark" ? 0.16 : 0.09
                ),
                fontWeight: 900,
                "& .MuiChip-icon": {
                  color: detailProjectColor,
                },
              }}
            />
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
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
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <DialogContent sx={{ px: { xs: 2.2, md: 3 }, py: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.3 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "12px",
              bgcolor: theme.palette.app.primarySoft,
              color: theme.palette.primary.main,
            }}
          >
            <NotesRoundedIcon sx={{ fontSize: 18 }} />
          </Avatar>

          <Typography
            sx={{
              color: theme.palette.app.text,
              fontSize: 13,
              fontWeight: 950,
              textTransform: "uppercase",
              letterSpacing: 0.45,
            }}
          >
            Contenido
          </Typography>
        </Stack>

        <Box
          sx={{
            borderRadius: "18px",
            border: `1px solid ${theme.palette.app.borderSoft}`,
            backgroundColor: getSoftBackground(theme),
            px: 2,
            py: 1.8,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.app.secondary,
              fontSize: { xs: 15, md: 16.5 },
              lineHeight: 1.75,
              fontWeight: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {selectedNote?.content?.trim()
              ? selectedNote.content
              : "Esta nota no tiene contenido."}
          </Typography>
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: theme.palette.app.borderSoft }} />

      <DialogActions sx={{ px: { xs: 2.2, md: 3 }, py: 2.2 }}>
        <Button
          variant="outlined"
          onClick={onEdit}
          startIcon={<EditRoundedIcon />}
          sx={{
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
          }}
        >
          Editar nota
        </Button>

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            borderRadius: "14px",
            fontWeight: 900,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ open, noteToDelete, onClose, onConfirm }) {
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
                color: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.11),
                border: "1px solid",
                borderColor: alpha(theme.palette.error.main, 0.2),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <DeleteRoundedIcon sx={{ fontSize: 28, display: "block" }} />
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
                Eliminar nota
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
                Esta acción no se puede deshacer.
              </Typography>
            </Box>
          </Stack>

          {noteToDelete ? (
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
                {noteToDelete.title || "Sin título"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.35,
                  color: theme.palette.app.secondary,
                  fontWeight: 700,
                  textAlign: "center",
                  fontSize: "0.84rem",
                }}
              >
                {noteToDelete.projectName || "Sin proyecto"}
              </Typography>
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

function NotesSkeleton() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "repeat(2, 1fr)",
        },
        gap: { xs: 1.6, md: 2 },
      }}
    >
      {[1, 2, 3, 4].map((item) => (
        <Card
          key={item}
          variant="outlined"
          sx={{
            borderRadius: 4,
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
                width={70}
                height={70}
                sx={{ borderRadius: 3 }}
              />

              <Box sx={{ flex: 1 }}>
                <Skeleton
                  variant="rounded"
                  width={110}
                  height={27}
                  sx={{ borderRadius: 999, mb: 1 }}
                />
                <Skeleton variant="text" width="78%" height={30} />
                <Skeleton variant="text" width="44%" height={22} />
              </Box>
            </Stack>

            <Box
              sx={{
                mt: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha("#FFFFFF", 0.075)
                    : alpha("#0F172A", 0.075),
                p: 1.7,
              }}
            >
              <Skeleton variant="text" width="94%" height={22} />
              <Skeleton variant="text" width="82%" height={22} />
              <Skeleton variant="text" width="58%" height={22} />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" justifyContent="space-between">
              <Skeleton
                variant="rounded"
                width={100}
                height={40}
                sx={{ borderRadius: 999 }}
              />

              <Stack direction="row" spacing={1}>
                <Skeleton variant="circular" width={42} height={42} />
                <Skeleton variant="circular" width={42} height={42} />
              </Stack>
            </Stack>
          </Box>
        </Card>
      ))}
    </Box>
  );
}