//Tareas:
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Box, InputBase, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../context/AuthContext";
import useUserCollection, { byName } from "../../shared/hooks/useUserCollection";
import { projectFields } from "../../shared/utils";
import {
  DeleteDialog,
  EmptyState,
  FilterBar,
  FilterSelect,
  PageAlert,
  PageHeader,
  PageShell,
  PrimaryButton,
  SearchField,
  Section,
  Stack,
  Toast,
  getSoftBackground,
  matchesProjectFilter,
  projectFilterOptions,
  softTint,
  useToast,
} from "../../shared/ui";
import TaskCard, { TaskCardView } from "./TaskCard";
import { TaskDetailDialog, TaskFormDialog } from "./TaskDialogs";
import {
  BOARD_COLUMNS,
  DEFAULT_STATUS,
  DONE_PREVIEW,
  getChecklist,
  getChecklistProgress,
  getStatusColor,
  getStatusLabel,
  getStatusRank,
  isOverdue,
  matchesTaskSearch,
  sortTasks,
  textToChecklistItems,
} from "./taskUtils";

const EMPTY_FORM = {
  title: "",
  description: "",
  status: DEFAULT_STATUS,
  projectId: "",
  priority: "",
  dueDate: "",
  checklist: [],
  draft: "",
};
const VIEW_KEY = "codedesk_tasks_view";
const LIST_FILTERS = [
  { value: "activas", label: "Activas" },
  { value: "todas", label: "Todas" },
  { value: "completada", label: "Completadas" },
];

const taskRef = (id) => doc(db, "tasks", id);

const uniqueOrders = (values) =>
  [...values]
    .sort((a, b) => a - b)
    .reduce(
      (acc, value) => [...acc, acc.length && value <= acc.at(-1) ? acc.at(-1) + 0.001 : value],
      [],
    );
const readView = () => {
  try {
    return localStorage.getItem(VIEW_KEY) || "board";
  } catch {
    return "board";
  }
};

const Tareas = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [tasks, loading, loadError, setTasks] = useUserCollection("tasks", {
    sort: sortTasks,
    errorMessage: "No se pudieron cargar las tareas.",
  });
  const [projects] = useUserCollection("projects", { sort: byName });

  const [view, setView] = useState(readView);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTask, setEditingTask] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("todos");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [listFilter, setListFilter] = useState("activas");
  const [showAllDone, setShowAllDone] = useState(false);

  const [drag, setDrag] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [toast, showToast, closeToast] = useToast();

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const changeView = (next) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
    }
  };

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null;
  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks]);

  const query = search.trim().toLowerCase();
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          matchesProjectFilter(task, filterProject) &&
          matchesTaskSearch(task, query) &&
          (!onlyOverdue || isOverdue(task)),
      ),
    [tasks, filterProject, query, onlyOverdue],
  );
  const hasFilters = filterProject !== "todos" || Boolean(query) || onlyOverdue;
  const resetFilters = () => {
    setFilterProject("todos");
    setSearch("");
    setOnlyOverdue(false);
  };

  const listTasks = useMemo(
    () =>
      visibleTasks
        .filter(
          (task) =>
            listFilter === "todas" ||
            (listFilter === "activas" ? task.status !== "completada" : task.status === listFilter),
        )
        .sort((a, b) => getStatusRank(a.status) - getStatusRank(b.status) || sortTasks(a, b)),
    [visibleTasks, listFilter],
  );

  const getEdgeOrder = (edge) => {
    const orders = tasks.map((task) => task.order ?? 0);
    if (!orders.length) return 1;
    return edge === "first" ? Math.min(...orders) - 1 : Math.max(...orders) + 1;
  };

  // ---- Formulario ----
  const openForm = (task = null) => {
    setEditingTask(task);
    setForm(
      task
        ? {
            ...EMPTY_FORM,
            title: task.title || "",
            description: task.description || "",
            status: task.status || DEFAULT_STATUS,
            projectId: task.projectId || "",
            priority: task.priority || "",
            dueDate: task.dueDate || "",
            checklist: getChecklist(task),
          }
        : {
            ...EMPTY_FORM,
            projectId: projects.some((p) => p.id === filterProject) ? filterProject : "",
          },
    );
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingTask(null);
  };

  const createTask = (data) =>
    addDoc(collection(db, "tasks"), {
      description: "",
      priority: null,
      dueDate: null,
      checklist: [],
      ...data,
      status: DEFAULT_STATUS,
      userId: user.uid,
      order: getEdgeOrder("first"),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  const handleSaveTask = async (event) => {
    event?.preventDefault();

    const checklist = [
      ...form.checklist
        .map((item) => ({ ...item, text: String(item.text || "").trim() }))
        .filter((item) => item.text),
      ...textToChecklistItems(form.draft),
    ];
    const project = projects.find((item) => item.id === form.projectId) || null;

    const title =
      form.title.trim() ||
      (checklist.length ? (project ? `Tareas de ${project.name}` : "Lista de tareas") : "");

    if (!title) {
      setFormError("La tarea necesita un título o al menos un ítem en el checklist.");
      return;
    }

    const payload = {
      title,
      description: form.description.trim(),
      priority: form.priority || null,
      dueDate: form.dueDate || null,
      checklist,
      ...projectFields(project),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      setFormError("");
      if (editingTask)
        await updateDoc(taskRef(editingTask.id), { ...payload, status: form.status });
      else await createTask(payload);
      setFormOpen(false);
      setEditingTask(null);
      showToast(editingTask ? "Tarea actualizada." : "Tarea creada.");
    } catch (error) {
      console.error(error);
      setFormError("No se pudo guardar la tarea.");
    } finally {
      setSaving(false);
    }
  };

  const quickAdd = async (text) => {
    const project = projects.find((item) => item.id === filterProject) || null;
    try {
      await createTask({ title: text.trim(), ...projectFields(project) });
    } catch (error) {
      console.error(error);
      setPageError("No se pudo crear la tarea.");
    }
  };

  // ---- Acciones ----
  const updateTask = async (task, changes, errorMessage = "No se pudo actualizar la tarea.") => {
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, ...changes } : item)),
    );

    try {
      await updateDoc(taskRef(task.id), { ...changes, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error(error);
      setPageError(errorMessage);
    }
  };

  const setStatus = (task, status) =>
    updateTask(task, {
      status,
      ...(status !== task.status && { order: getEdgeOrder("first") }),
    });

  const toggleDone = (task) =>
    setStatus(task, task.status === "completada" ? DEFAULT_STATUS : "completada");

  const toggleChecklistItem = (task, itemId) => {
    const checklist = getChecklist(task).map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    const { allDone } = getChecklistProgress(checklist);
    const changes = { checklist };

    if (allDone && task.status !== "completada") {
      Object.assign(changes, { status: "completada", order: getEdgeOrder("first") });
      showToast(`"${task.title}" se completó.`, {
        actionLabel: "Deshacer",
        onAction: () => updateTask(task, { status: task.status, order: task.order ?? 0 }),
        duration: 5000,
      });
    } else if (!allDone && task.status === "completada") {
      changes.status = DEFAULT_STATUS;
    }

    updateTask(task, changes, "No se pudo actualizar el checklist.");
  };

  const addChecklistItems = (task, text) => {
    const items = textToChecklistItems(text);
    if (!items.length) return;
    updateTask(
      task,
      { checklist: [...getChecklist(task), ...items] },
      "No se pudo agregar el ítem.",
    );
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete?.id) return;

    try {
      setDeleting(true);
      await deleteDoc(taskRef(taskToDelete.id));
      if (selectedTaskId === taskToDelete.id) setSelectedTaskId(null);
      setTaskToDelete(null);
    } catch (error) {
      console.error(error);
      setPageError("No se pudo eliminar la tarea.");
    } finally {
      setDeleting(false);
    }
  };

  const persist = async (changed) => {
    if (!changed.length) return;
    const byId = new Map(changed.map((item) => [item.id, item]));
    setTasks((current) =>
      current.map((task) => (byId.has(task.id) ? { ...task, ...byId.get(task.id) } : task)),
    );
    try {
      const batch = writeBatch(db);
      changed.forEach(({ id, ...fields }) =>
        batch.update(taskRef(id), { ...fields, updatedAt: serverTimestamp() }),
      );
      await batch.commit();
    } catch (error) {
      console.error(error);
      setPageError("No se pudo guardar el nuevo orden.");
    }
  };

  // ---- Lista: reordenar ----
  const handleListDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = listTasks.findIndex((task) => task.id === active.id);
    const newIndex = listTasks.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    if (listTasks[oldIndex].status !== listTasks[newIndex].status) return;

    const moved = arrayMove(listTasks, oldIndex, newIndex);
    const pool = uniqueOrders(listTasks.map((task) => task.order ?? 0));
    persist(
      moved
        .map((task, index) => ({ id: task.id, order: pool[index] }))
        .filter((item, index) => item.order !== (moved[index].order ?? 0)),
    );
  };

  // ---- Tablero: arrastrar dentro de una columna o entre columnas ----
  const boardTasks = drag?.tasks || visibleTasks;
  const columnTasks = (status) =>
    boardTasks.filter((task) => task.status === status).sort(sortTasks);

  const handleDragStart = ({ active }) => setDrag({ activeId: active.id, tasks: visibleTasks });

  const handleDragOver = ({ active, over }) => {
    if (!over || !drag) return;
    const overStatus = over.data.current?.status;
    const current = drag.tasks.find((task) => task.id === active.id);
    if (!overStatus || !current || current.status === overStatus) return;

    const overTask =
      over.data.current?.type === "task" ? drag.tasks.find((t) => t.id === over.id) : null;
    const columnOrders = drag.tasks.filter((t) => t.status === overStatus).map((t) => t.order ?? 0);
    const order = overTask
      ? (overTask.order ?? 0) - 0.5
      : (columnOrders.length ? Math.max(...columnOrders) : 0) + 1;

    setDrag({
      ...drag,
      tasks: drag.tasks.map((task) =>
        task.id === active.id ? { ...task, status: overStatus, order } : task,
      ),
    });
  };

  const handleDragEnd = ({ active, over }) => {
    const local = drag?.tasks;
    setDrag(null);
    if (!over || !local) return;

    const moving = local.find((task) => task.id === active.id);
    let column = local.filter((task) => task.status === moving.status).sort(sortTasks);
    if (over.data.current?.type === "task" && over.id !== active.id) {
      const from = column.findIndex((task) => task.id === active.id);
      const to = column.findIndex((task) => task.id === over.id);
      if (from >= 0 && to >= 0) column = arrayMove(column, from, to);
    }

    const original = new Map(tasks.map((task) => [task.id, task]));
    const pool = uniqueOrders(column.map((task) => original.get(task.id)?.order ?? 0));

    const changed = column
      .map((task, index) => {
        const before = original.get(task.id);
        const next = { id: task.id, order: pool[index] };
        if (before.status !== task.status) next.status = task.status;
        return next;
      })
      .filter((item) => item.status || item.order !== (original.get(item.id)?.order ?? 0));

    persist(changed);
    if (moving.status === "completada" && original.get(moving.id)?.status !== "completada")
      showToast(`"${moving.title}" se completó.`);
  };

  const cardHandlers = (task) => ({
    onOpen: () => setSelectedTaskId(task.id),
    onEdit: () => openForm(task),
    onDelete: () => setTaskToDelete(task),
    onToggleDone: () => toggleDone(task),
    onToggleChecklistItem: (itemId) => toggleChecklistItem(task, itemId),
    onAddChecklist: (text) => addChecklistItems(task, text),
    onSetPriority: (priority) => updateTask(task, { priority }),
    onSetStatus: (status) => setStatus(task, status),
    onMoveTop: () => updateTask(task, { order: getEdgeOrder("first") }),
  });

  const activeTask = drag ? drag.tasks.find((task) => task.id === drag.activeId) : null;
  const noResults = hasFilters && visibleTasks.length === 0;

  return (
    <PageShell
      loading={loading}
      after={
        <>
          <TaskFormDialog
            open={formOpen}
            editingTask={editingTask}
            form={form}
            setField={setField}
            projects={projects}
            saving={saving}
            error={formError}
            onClose={closeForm}
            onSave={handleSaveTask}
          />

          <TaskDetailDialog
            open={Boolean(selectedTask)}
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
            onEdit={() => {
              const task = selectedTask;
              setSelectedTaskId(null);
              openForm(task);
            }}
            onDelete={() => setTaskToDelete(selectedTask)}
            onToggleDone={() => toggleDone(selectedTask)}
            onToggleChecklistItem={(itemId) => toggleChecklistItem(selectedTask, itemId)}
            onAddChecklist={(text) => addChecklistItems(selectedTask, text)}
          />

          <DeleteDialog
            open={Boolean(taskToDelete)}
            title="Eliminar tarea"
            previewTitle={taskToDelete?.title}
            previewSubtitle={taskToDelete?.projectName || "Tarea personal"}
            deleting={deleting}
            onClose={() => setTaskToDelete(null)}
            onConfirm={confirmDeleteTask}
          />

          <Toast toast={toast} onClose={closeToast} />
        </>
      }
    >
      <Section>
        <PageHeader
          icon={<AssignmentRoundedIcon />}
          title="Tareas"
          description="Arrastrá para priorizar o cambiar de estado y tildá los pasos desde la tarjeta."
          actions={
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ alignSelf: { xs: "stretch", sm: "center" } }}
            >
              <ViewToggle value={view} onChange={changeView} />
              <PrimaryButton onClick={() => openForm()} sx={{ flex: { xs: 1, sm: "none" } }}>
                Nueva tarea
              </PrimaryButton>
            </Stack>
          }
        />
      </Section>

      <PageAlert message={pageError || loadError} onClose={() => setPageError("")} />

      {tasks.length === 0 ? (
        <Section delay={70}>
          <EmptyState
            icon={<TaskAltRoundedIcon />}
            title="Todavía no tenés tareas"
            text="Creá tu primera tarea. Podés sumarle un checklist con los pasos y tildarlos a medida que avanzás."
            actionLabel="Nueva tarea"
            onAction={() => openForm()}
          />
        </Section>
      ) : (
        <>
          <Section delay={70}>
            <FilterBar
              title={view === "board" ? "Tablero" : "Lista"}
              subtitle={`${visibleTasks.length} de ${tasks.length} tareas${overdueCount ? ` · ${overdueCount} vencida${overdueCount === 1 ? "" : "s"}` : ""}`}
              onReset={hasFilters ? resetFilters : undefined}
            >
              {view === "list" && (
                <Stack direction="row" sx={{ gap: 0.75, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                  {LIST_FILTERS.map((item) => (
                    <ToggleChip
                      key={item.value}
                      label={item.label}
                      selected={listFilter === item.value}
                      onClick={() => setListFilter(item.value)}
                    />
                  ))}
                </Stack>
              )}
              {overdueCount > 0 && (
                <ToggleChip
                  label={`Vencidas · ${overdueCount}`}
                  icon={<EventBusyRoundedIcon />}
                  color={theme.palette.error.main}
                  selected={onlyOverdue}
                  onClick={() => setOnlyOverdue(!onlyOverdue)}
                />
              )}
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar tareas..."
                width={190}
              />
              <FilterSelect
                label="Proyecto"
                value={filterProject}
                onChange={setFilterProject}
                minWidth={200}
              >
                {projectFilterOptions(projects)}
              </FilterSelect>
            </FilterBar>
          </Section>

          <Section delay={130}>
            {noResults ? (
              <EmptyState
                icon={<SearchOffRoundedIcon />}
                title="Sin resultados"
                text="Ninguna tarea coincide con la búsqueda o los filtros elegidos."
                actionLabel="Limpiar filtros"
                actionIcon={<FilterAltOffRoundedIcon />}
                onAction={resetFilters}
              />
            ) : view === "board" ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setDrag(null)}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: `repeat(${BOARD_COLUMNS.length}, 84%)`,
                      sm: `repeat(${BOARD_COLUMNS.length}, 270px)`,
                      lg: `repeat(${BOARD_COLUMNS.length}, minmax(232px, 1fr))`,
                    },
                    gap: 1.5,
                    alignItems: "start",
                    overflowX: "auto",
                    scrollSnapType: { xs: "x mandatory", lg: "none" },
                    pb: 1,
                    mx: { xs: -2, sm: 0 },
                    px: { xs: 2, sm: 0 },
                  }}
                >
                  {BOARD_COLUMNS.map((status) => {
                    const list = columnTasks(status);
                    const limited =
                      status === "completada" && !showAllDone && !drag
                        ? list.slice(0, DONE_PREVIEW)
                        : list;
                    return (
                      <BoardColumn
                        key={status}
                        status={status}
                        count={list.length}
                        onQuickAdd={status === DEFAULT_STATUS ? quickAdd : undefined}
                        footer={
                          status === "completada" && !drag && list.length > DONE_PREVIEW ? (
                            <ShowMore
                              label={
                                showAllDone
                                  ? "Mostrar menos"
                                  : `Ver ${list.length - limited.length} más`
                              }
                              onClick={() => setShowAllDone(!showAllDone)}
                            />
                          ) : null
                        }
                      >
                        <SortableContext
                          items={limited.map((task) => task.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {limited.map((task) => (
                            <TaskCard key={task.id} task={task} {...cardHandlers(task)} />
                          ))}
                        </SortableContext>
                      </BoardColumn>
                    );
                  })}
                </Box>

                {createPortal(
                  <DragOverlay dropAnimation={{ duration: 180 }}>
                    {activeTask ? <TaskCardView task={activeTask} overlay /> : null}
                  </DragOverlay>,
                  document.body,
                )}
              </DndContext>
            ) : (
              <Stack spacing={1.25}>
                <QuickAdd onAdd={quickAdd} />
                {listTasks.length === 0 ? (
                  <EmptyState
                    icon={<TaskAltRoundedIcon />}
                    title={listFilter === "completada" ? "Sin tareas completadas" : "Todo al día"}
                    text={
                      listFilter === "completada"
                        ? "Cuando completes tareas van a aparecer acá."
                        : "No tenés tareas activas con estos filtros."
                    }
                  />
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleListDragEnd}
                  >
                    {BOARD_COLUMNS.map((status) => {
                      const group = listTasks.filter((task) => task.status === status);
                      if (!group.length) return null;
                      return (
                        <Box key={status} sx={{ pt: 0.75 }}>
                          <ListGroupHeader status={status} count={group.length} />
                          <SortableContext
                            items={group.map((task) => task.id)}
                            strategy={rectSortingStrategy}
                          >
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "minmax(0, 1fr)",
                                  lg: "repeat(2, minmax(0, 1fr))",
                                },
                                alignItems: "start",
                                gap: 1,
                              }}
                            >
                              {group.map((task) => (
                                <TaskCard key={task.id} task={task} {...cardHandlers(task)} />
                              ))}
                            </Box>
                          </SortableContext>
                        </Box>
                      );
                    })}
                  </DndContext>
                )}
              </Stack>
            )}
          </Section>
        </>
      )}
    </PageShell>
  );
};

/* ---------- Piezas de la vista ---------- */

function ListGroupHeader({ status, count }) {
  const theme = useTheme();
  const color = getStatusColor(theme, status);

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, px: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
      <Typography sx={{ fontSize: "0.82rem", fontWeight: 850, color: theme.palette.app.text }}>
        {getStatusLabel(status)}
      </Typography>
      <Box
        sx={{
          px: 0.8,
          borderRadius: "7px",
          fontSize: "0.72rem",
          fontWeight: 850,
          color,
          bgcolor: softTint(theme, color, 0.12, 0.18),
        }}
      >
        {count}
      </Box>
    </Stack>
  );
}

function ViewToggle({ value, onChange }) {
  const theme = useTheme();
  const options = [
    { value: "board", label: "Tablero", icon: <ViewKanbanRoundedIcon /> },
    { value: "list", label: "Lista", icon: <ViewListRoundedIcon /> },
  ];

  return (
    <Stack
      direction="row"
      sx={{
        p: 0.4,
        gap: 0.4,
        height: 40,
        borderRadius: "12px",
        bgcolor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            sx={{
              all: "unset",
              display: "flex",
              alignItems: "center",
              gap: 0.6,
              px: 1.2,
              borderRadius: "9px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: selected ? 800 : 650,
              color: selected ? theme.palette.primary.main : theme.palette.app.secondary,
              bgcolor: selected ? theme.palette.app.surface : "transparent",
              boxShadow: selected ? "0 2px 8px rgba(15,23,42,0.08)" : "none",
              transition: "all 0.16s ease",
              "& svg": { fontSize: 18 },
            }}
          >
            {option.icon}
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {option.label}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function ToggleChip({ label, icon, selected, color, onClick }) {
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
        px: 1.3,
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        borderRadius: "10px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontSize: "0.8rem",
        fontWeight: selected ? 800 : 650,
        color: selected ? c : theme.palette.app.secondary,
        bgcolor: selected ? softTint(theme, c, 0.1, 0.18) : getSoftBackground(theme),
        border: `1px solid ${selected ? alpha(c, 0.35) : theme.palette.app.borderSoft}`,
        transition: "all 0.16s ease",
        "& svg": { fontSize: 16 },
        "&:hover": { bgcolor: softTint(theme, c, 0.1, 0.18) },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

function QuickAdd({ onAdd, dense = false }) {
  const theme = useTheme();
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      sx={{
        px: 1,
        height: dense ? 40 : 46,
        borderRadius: "12px",
        border: `1.5px dashed ${alpha(theme.palette.primary.main, 0.35)}`,
        bgcolor: theme.palette.app.surface,
        transition: "all 0.16s ease",
        "&:focus-within": {
          borderStyle: "solid",
          borderColor: alpha(theme.palette.primary.main, 0.6),
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
        },
      }}
    >
      <AddRoundedIcon sx={{ fontSize: 19, color: theme.palette.primary.main }} />
      <InputBase
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") setText("");
        }}
        placeholder="Agregar tarea rápida y Enter..."
        slotProps={{ input: { "aria-label": "Agregar tarea rápida" } }}
        sx={{ flex: 1, fontSize: dense ? "0.84rem" : "0.9rem", fontWeight: 600 }}
      />
      {text.trim() && (
        <Typography
          sx={{ fontSize: "0.7rem", fontWeight: 700, color: theme.palette.app.secondary }}
        >
          Enter ↵
        </Typography>
      )}
    </Stack>
  );
}

function ShowMore({ label, onClick }) {
  const theme = useTheme();
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        all: "unset",
        display: "block",
        textAlign: "center",
        py: 0.75,
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "0.78rem",
        fontWeight: 750,
        color: theme.palette.app.secondary,
        "&:hover": { color: theme.palette.primary.main, bgcolor: theme.palette.app.primarySoft },
      }}
    >
      {label}
    </Box>
  );
}

function BoardColumn({ status, count, onQuickAdd, footer, children }) {
  const theme = useTheme();
  const color = getStatusColor(theme, status);
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { type: "column", status },
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        scrollSnapAlign: "start",
        minWidth: 0,
        p: 1,
        borderRadius: "16px",
        bgcolor: isOver ? softTint(theme, color, 0.07, 0.1) : getSoftBackground(theme),
        border: `1px solid ${isOver ? alpha(color, 0.4) : theme.palette.app.borderSoft}`,
        transition: "background-color 0.16s ease, border-color 0.16s ease",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.9} sx={{ px: 0.75, pt: 0.25, pb: 1 }}>
        <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: color }} />
        <Typography
          sx={{ flex: 1, fontSize: "0.84rem", fontWeight: 800, color: theme.palette.app.text }}
        >
          {getStatusLabel(status)}
        </Typography>
        <Box
          sx={{
            minWidth: 22,
            height: 20,
            px: 0.6,
            borderRadius: "7px",
            display: "grid",
            placeItems: "center",
            fontSize: "0.72rem",
            fontWeight: 800,
            color,
            bgcolor: softTint(theme, color, 0.12, 0.18),
          }}
        >
          {count}
        </Box>
      </Stack>

      {onQuickAdd && (
        <Box sx={{ mb: 1 }}>
          <QuickAdd onAdd={onQuickAdd} dense />
        </Box>
      )}

      <Stack
        spacing={1}
        sx={{
          maxHeight: { md: `calc(100vh - ${onQuickAdd ? 268 : 220}px)` },
          minHeight: 60,
          overflowY: { md: "auto" },
          mx: -0.5,
          px: 0.5,
          pb: 0.25,
          scrollbarWidth: "thin",
          scrollbarColor: "transparent transparent",
          "&:hover": {
            scrollbarColor: `${alpha(theme.palette.app.secondary, 0.35)} transparent`,
          },
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 999,
            background: "transparent",
          },
          "&:hover::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.app.secondary, 0.35),
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(theme.palette.app.secondary, 0.55),
          },
        }}
      >
        {children}
        {count === 0 && (
          <Box
            sx={{
              py: 3,
              textAlign: "center",
              borderRadius: "12px",
              border: `1.5px dashed ${theme.palette.app.borderSoft}`,
              color: theme.palette.app.secondary,
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            Soltá tareas acá
          </Box>
        )}
        {footer}
      </Stack>
    </Box>
  );
}

export default Tareas;
