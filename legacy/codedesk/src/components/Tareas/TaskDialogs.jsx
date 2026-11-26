//TaskDialogs:
import { Box, Button, Checkbox, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import FolderOffRoundedIcon from "@mui/icons-material/FolderOffRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  AppDialog,
  DateField,
  FormDialog,
  ProjectAvatar,
  ProjectSelect,
  Stack,
  getSoftBackground,
  roundedFieldSx,
  softTint,
} from "../../shared/ui";
import { ChecklistItems, ChecklistProgress, InlineChecklistAdd, TaskChips } from "./TaskCard";
import {
  DEFAULT_STATUS,
  PRIORITIES,
  PRIORITY,
  STATUSES,
  getChecklist,
  getChecklistProgress,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  textToChecklistItems,
} from "./taskUtils";

const FieldLabel = ({ children }) => {
  const theme = useTheme();
  return (
    <Typography
      sx={{ mb: 0.8, color: theme.palette.app.secondary, fontSize: "0.78rem", fontWeight: 700 }}
    >
      {children}
    </Typography>
  );
};

const OptionRow = ({ label, value, onChange, options, disabled }) => {
  const theme = useTheme();

  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
          gap: 0.6,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value;
          const c = option.color || theme.palette.primary.main;
          return (
            <Box
              key={option.value || "none"}
              component="button"
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                minWidth: 0,
                height: 38,
                px: 0.75,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                borderRadius: "10px",
                cursor: disabled ? "default" : "pointer",
                fontSize: "0.78rem",
                fontWeight: selected ? 800 : 650,
                color: selected ? c : theme.palette.app.secondary,
                bgcolor: selected ? softTint(theme, c, 0.1, 0.16) : getSoftBackground(theme),
                border: `1.5px solid ${selected ? alpha(c, 0.5) : theme.palette.app.borderSoft}`,
                transition: "all 0.16s ease",
                "& svg": { fontSize: 15, flexShrink: 0 },
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
};

const SortableChecklistRow = ({ item, saving, onChange, onRemove }) => {
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <Stack
      ref={setNodeRef}
      direction="row"
      alignItems="center"
      spacing={0.25}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      sx={{
        pr: 0.25,
        borderRadius: "10px",
        backgroundColor: isDragging ? theme.palette.app.surface : "transparent",
        boxShadow: isDragging ? "0 10px 30px rgba(15,23,42,0.18)" : "none",
        position: "relative",
        zIndex: isDragging ? 2 : "auto",
        "&:hover": { bgcolor: theme.palette.app.surface },
        "&:hover .row-remove": { opacity: 1 },
      }}
    >
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        aria-label="Reordenar ítem"
        sx={{ cursor: "grab", touchAction: "none", color: theme.palette.app.secondary, p: 0.3 }}
      >
        <DragIndicatorRoundedIcon sx={{ fontSize: 17 }} />
      </IconButton>

      <Checkbox
        size="small"
        checked={Boolean(item.done)}
        onChange={() => onChange({ done: !item.done })}
        disabled={saving}
        sx={{
          p: 0.5,
          "& svg": { fontSize: 19 },
          "&.Mui-checked": { color: theme.palette.success.main },
        }}
      />

      <TextField
        value={item.text}
        onChange={(event) => onChange({ text: event.target.value })}
        onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
        variant="standard"
        fullWidth
        disabled={saving}
        slotProps={{
          input: {
            disableUnderline: true,
            sx: {
              fontSize: "0.88rem",
              fontWeight: 600,
              textDecoration: item.done ? "line-through" : "none",
              color: item.done ? theme.palette.app.secondary : theme.palette.app.text,
            },
          },
        }}
      />

      <Tooltip title="Quitar ítem">
        <IconButton
          size="small"
          className="row-remove"
          onClick={onRemove}
          disabled={saving}
          sx={{ color: theme.palette.app.secondary, opacity: { xs: 1, md: 0.5 } }}
        >
          <CloseRoundedIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const ChecklistEditor = ({ checklist, setChecklist, draft, setDraft, saving }) => {
  const theme = useTheme();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { done, total } = getChecklistProgress(checklist);

  const addItems = (text = draft) => {
    const items = textToChecklistItems(text);
    if (!items.length) return;
    setChecklist([...checklist, ...items]);
    setDraft("");
  };

  const updateItem = (id, changes) =>
    setChecklist(checklist.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = checklist.findIndex((item) => item.id === active.id);
    const to = checklist.findIndex((item) => item.id === over.id);
    setChecklist(arrayMove(checklist, from, to));
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        p: 1.4,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <ChecklistRoundedIcon sx={{ fontSize: 19, color: theme.palette.primary.main }} />
          <Typography sx={{ color: theme.palette.app.text, fontSize: "0.9rem", fontWeight: 800 }}>
            Checklist
          </Typography>
        </Stack>
      </Stack>

      {total > 0 && (
        <Box sx={{ mb: 1 }}>
          <ChecklistProgress checklist={checklist} />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          maxHeight: { md: "clamp(140px, 34vh, 320px)" },
          overflowY: "auto",
          mx: -0.5,
          px: 0.5,
        }}
      >
        {total > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={checklist.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={0.25}>
                {checklist.map((item) => (
                  <SortableChecklistRow
                    key={item.id}
                    item={item}
                    saving={saving}
                    onChange={(changes) => updateItem(item.id, changes)}
                    onRemove={() => setChecklist(checklist.filter((row) => row.id !== item.id))}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        ) : (
          <Typography
            sx={{
              py: 2,
              textAlign: "center",
              color: theme.palette.app.secondary,
              fontSize: "0.8rem",
              fontWeight: 550,
              lineHeight: 1.5,
            }}
          >
            Dividí la tarea en pasos chicos.
            <br />
            Podés pegar una lista y se crea un ítem por línea.
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
        <TextField
          size="small"
          placeholder="Agregar ítem y presionar Enter"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              addItems();
            }
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (!/\r?\n/.test(pasted.trim())) return;
            event.preventDefault();
            addItems(`${draft}\n${pasted}`);
          }}
          fullWidth
          disabled={saving}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              backgroundColor: theme.palette.app.surface,
              fontSize: "0.88rem",
            },
          }}
        />
        <Button
          variant="contained"
          disableElevation
          onClick={() => addItems()}
          disabled={saving || !draft.trim()}
          aria-label="Agregar ítem"
          sx={{ minWidth: 0, height: 40, px: 1.2, borderRadius: "10px", flexShrink: 0 }}
        >
          <AddRoundedIcon />
        </Button>
      </Stack>
    </Box>
  );
};

// ---- Formulario de alta/edición ----
export const TaskFormDialog = ({
  open,
  editingTask,
  form,
  setField,
  projects,
  saving,
  error,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const hasChecklist = form.checklist.length > 0 || form.draft.trim();

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      onSubmit={onSave}
      saving={saving}
      error={error}
      maxWidth="md"
      icon={editingTask ? <EditRoundedIcon /> : <TaskAltRoundedIcon />}
      iconColor={getStatusColor(theme, editingTask ? form.status : DEFAULT_STATUS)}
      title={editingTask ? "Editar tarea" : "Nueva tarea"}
      subtitle={
        editingTask
          ? "Cambiá los datos, el estado o el checklist."
          : "Se crea como En progreso. Podés sumarle un checklist de pasos."
      }
      submitIcon={editingTask ? <EditRoundedIcon /> : <AddRoundedIcon />}
      submitLabel={editingTask ? "Guardar cambios" : "Guardar tarea"}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" },
          gap: { xs: 2, md: 2.5 },
          alignItems: "stretch",
        }}
      >
        <Stack spacing={1.75}>
          <TextField
            label="Título"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            fullWidth
            disabled={saving}
            autoFocus
            helperText={
              hasChecklist && !form.title.trim()
                ? "Opcional: si lo dejás vacío se usa el nombre del proyecto."
                : undefined
            }
            sx={roundedFieldSx("12px")}
          />
          <TextField
            label="Descripción"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            disabled={saving}
            sx={roundedFieldSx("12px")}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(0, 1fr)" },
              gap: 1.5,
            }}
          >
            <Box>
              <ProjectSelect
                projects={projects}
                value={form.projectId}
                onChange={(value) => setField("projectId", value)}
                disabled={saving}
                emptyLabel="Sin proyecto"
                showPreview={false}
              />
            </Box>
            <DateField
              label="Fecha límite"
              value={form.dueDate}
              onChange={(value) => setField("dueDate", value)}
              disabled={saving}
            />
          </Box>
          <OptionRow
            label="Prioridad"
            value={form.priority}
            onChange={(value) => setField("priority", value)}
            disabled={saving}
            options={[
              ...PRIORITIES.map((key) => ({
                value: key,
                label: PRIORITY[key].label,
                icon: <FlagRoundedIcon />,
                color: PRIORITY[key].color(theme),
              })),
              { value: "", label: "Sin prioridad", color: theme.palette.app.secondary },
            ]}
          />
          {editingTask && (
            <OptionRow
              label="Estado"
              value={form.status}
              onChange={(value) => setField("status", value)}
              disabled={saving}
              options={STATUSES.map((status) => ({
                value: status,
                label: getStatusLabel(status),
                icon: getStatusIcon(status),
                color: getStatusColor(theme, status),
              }))}
            />
          )}
        </Stack>

        <ChecklistEditor
          checklist={form.checklist}
          setChecklist={(value) => setField("checklist", value)}
          draft={form.draft}
          setDraft={(value) => setField("draft", value)}
          saving={saving}
        />
      </Box>
    </FormDialog>
  );
};

// ---- Detalle ----
export const TaskDetailDialog = ({
  open,
  task,
  onClose,
  onEdit,
  onDelete,
  onToggleDone,
  onToggleChecklistItem,
  onAddChecklist,
}) => {
  const theme = useTheme();
  if (!task) return null;

  const isDone = task.status === "completada";
  const checklist = getChecklist(task);
  const doneColor = isDone ? theme.palette.warning.main : theme.palette.success.main;
  const buttonSx = { minHeight: 40, px: 1.6, borderRadius: "12px", fontWeight: 750 };
  const sectionTitle = {
    mb: 0.75,
    fontSize: "0.72rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.palette.app.secondary,
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      header={
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {task.projectId ? (
              <ProjectAvatar item={task} size={20} fontSize={10} sx={{ border: "none" }} />
            ) : (
              <FolderOffRoundedIcon sx={{ fontSize: 17, color: theme.palette.app.secondary }} />
            )}
            <Typography
              noWrap
              sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.app.secondary }}
            >
              {task.projectName || "Tarea personal"}
            </Typography>
          </Stack>
          <Typography
            sx={{
              mt: 0.6,
              color: theme.palette.app.text,
              fontSize: "1.15rem",
              lineHeight: 1.3,
              fontWeight: 850,
              letterSpacing: "-0.3px",
              textDecoration: isDone ? "line-through" : "none",
              overflowWrap: "anywhere",
            }}
          >
            {task.title || "Tarea sin título"}
          </Typography>
          <Box sx={{ mt: 0.9 }}>
            <TaskChips task={task} />
          </Box>
        </Box>
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
          <Button
            onClick={onToggleDone}
            startIcon={isDone ? <RestoreRoundedIcon /> : <CheckCircleRoundedIcon />}
            sx={{
              ...buttonSx,
              color: doneColor,
              backgroundColor: softTint(theme, doneColor, 0.1, 0.14),
              "&:hover": { backgroundColor: softTint(theme, doneColor, 0.16, 0.2) },
            }}
          >
            {isDone ? "Reabrir" : "Completar"}
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
      <Stack spacing={2.25}>
        {task.description && (
          <Box>
            <Typography sx={sectionTitle}>Descripción</Typography>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontSize: "0.9rem",
                lineHeight: 1.65,
                fontWeight: 500,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {task.description}
            </Typography>
          </Box>
        )}

        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={sectionTitle}>Checklist</Typography>
          </Stack>
          <Box
            sx={{
              p: 1.25,
              borderRadius: "14px",
              border: `1px solid ${theme.palette.app.borderSoft}`,
              bgcolor: getSoftBackground(theme),
            }}
          >
            {checklist.length > 0 ? (
              <>
                <Box sx={{ px: 0.5, mb: 0.75 }}>
                  <ChecklistProgress checklist={checklist} height={6} />
                </Box>
                <ChecklistItems checklist={checklist} onToggle={onToggleChecklistItem} />
              </>
            ) : (
              <Typography
                sx={{
                  px: 0.5,
                  py: 0.5,
                  color: theme.palette.app.secondary,
                  fontSize: "0.84rem",
                  fontWeight: 550,
                }}
              >
                Esta tarea no tiene checklist todavía.
              </Typography>
            )}
            {!isDone && <InlineChecklistAdd onAdd={onAddChecklist} />}
          </Box>
          {getChecklistProgress(checklist).allDone && isDone && (
            <Typography
              sx={{
                mt: 1,
                color: theme.palette.success.main,
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Completaste todos los ítems: la tarea se marcó como completada.
            </Typography>
          )}
        </Box>
      </Stack>
    </AppDialog>
  );
};
