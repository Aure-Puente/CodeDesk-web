//TaskCard:
import { useState } from "react";
import {
  Box,
  Card,
  Checkbox,
  Collapse,
  Divider,
  IconButton,
  InputBase,
  LinearProgress,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ChecklistRoundedIcon from "@mui/icons-material/ChecklistRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import VerticalAlignTopRoundedIcon from "@mui/icons-material/VerticalAlignTopRounded";
import { ProjectAvatar, Stack, getCardStyles, getSoftBackground, softTint } from "../../shared/ui";
import {
  PRIORITIES,
  PRIORITY,
  STATUSES,
  getChecklist,
  getChecklistProgress,
  getDueColor,
  getDueInfo,
  getPriorityColor,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
} from "./taskUtils";

export const MetaPill = ({ icon, label, color }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.4}
      sx={{
        flexShrink: 0,
        height: 22,
        px: 0.75,
        borderRadius: "7px",
        color,
        bgcolor: softTint(theme, color, 0.1, 0.16),
        "& svg": { fontSize: 13 },
      }}
    >
      {icon}
      <Typography
        sx={{ fontSize: "0.7rem", fontWeight: 800, color: "inherit", whiteSpace: "nowrap" }}
      >
        {label}
      </Typography>
    </Stack>
  );
};

export const TaskChips = ({ task, showStatus = true }) => {
  const theme = useTheme();
  const due = getDueInfo(task);
  const priority = PRIORITY[task.priority];

  return (
    <Stack direction="row" alignItems="center" sx={{ flexWrap: "wrap", gap: 0.6 }}>
      {showStatus && (
        <MetaPill
          icon={getStatusIcon(task.status)}
          label={getStatusLabel(task.status)}
          color={getStatusColor(theme, task.status)}
        />
      )}
      {priority && (
        <MetaPill icon={<FlagRoundedIcon />} label={priority.label} color={priority.color(theme)} />
      )}
      {due && (
        <MetaPill
          icon={<EventRoundedIcon />}
          label={due.label}
          color={getDueColor(theme, due.tone)}
        />
      )}
    </Stack>
  );
};

export const ChecklistProgress = ({ checklist, height = 5 }) => {
  const theme = useTheme();
  const { total, done, percent, allDone } = getChecklistProgress(checklist);
  if (!total) return null;

  const color = allDone ? theme.palette.success.main : theme.palette.info.main;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          flex: 1,
          height,
          borderRadius: 999,
          backgroundColor: alpha(theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A", 0.07),
          "& .MuiLinearProgress-bar": { borderRadius: 999, backgroundColor: color },
        }}
      />
      <Typography
        sx={{
          color: allDone ? color : theme.palette.app.secondary,
          fontSize: "0.72rem",
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {done}/{total}
      </Typography>
    </Stack>
  );
};

export const ChecklistItems = ({ checklist, onToggle, limit, dense = false }) => {
  const theme = useTheme();
  if (!checklist.length) return null;

  const compact = Boolean(limit);
  const ordered = compact
    ? [...checklist.filter((item) => !item.done), ...checklist.filter((item) => item.done)]
    : checklist;
  const visible = compact ? ordered.slice(0, limit) : ordered;
  const hidden = checklist.length - visible.length;

  return (
    <Stack spacing={dense ? 0 : 0.25}>
      {visible.map((item) => (
        <Stack
          key={item.id}
          direction="row"
          alignItems={compact ? "center" : "flex-start"}
          spacing={0.25}
          title={compact ? item.text : undefined}
          role="checkbox"
          aria-checked={Boolean(item.done)}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.(item.id);
          }}
          sx={{
            borderRadius: "8px",
            pr: 0.75,
            cursor: onToggle ? "pointer" : "default",
            transition: "background-color 0.15s ease",
            "&:hover": onToggle ? { backgroundColor: getSoftBackground(theme) } : undefined,
          }}
        >
          <Checkbox
            size="small"
            checked={Boolean(item.done)}
            tabIndex={-1}
            disableRipple
            sx={{
              p: dense ? 0.4 : 0.6,
              color: alpha(theme.palette.app.secondary, 0.7),
              "& svg": { fontSize: dense ? 17 : 19 },
              "&.Mui-checked": { color: theme.palette.success.main },
            }}
          />
          <Typography
            sx={{
              pt: compact ? 0 : dense ? 0.45 : 0.6,
              minWidth: 0,
              color: item.done ? theme.palette.app.secondary : theme.palette.app.text,
              fontSize: dense ? "0.8rem" : "0.88rem",
              fontWeight: item.done ? 500 : 600,
              textDecoration: item.done ? "line-through" : "none",
              opacity: item.done ? 0.7 : 1,
              lineHeight: 1.4,
              ...(compact
                ? { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
                : { overflowWrap: "anywhere" }),
            }}
          >
            {item.text}
          </Typography>
        </Stack>
      ))}

      {hidden > 0 && (
        <Typography
          sx={{
            pl: 1,
            pt: 0.25,
            color: theme.palette.app.secondary,
            fontSize: "0.74rem",
            fontWeight: 700,
          }}
        >
          + {hidden} ítem{hidden === 1 ? "" : "s"} más
        </Typography>
      )}
    </Stack>
  );
};

export const InlineChecklistAdd = ({ onAdd, dense = false }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const stop = (event) => event.stopPropagation();
  const submit = () => {
    if (text.trim()) onAdd(text);
    setText("");
  };

  if (!open)
    return (
      <Box
        component="button"
        type="button"
        onPointerDown={stop}
        onClick={(event) => {
          stop(event);
          setOpen(true);
        }}
        sx={{
          all: "unset",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.4,
          mt: 0.25,
          px: 0.75,
          py: 0.3,
          borderRadius: "7px",
          cursor: "pointer",
          fontSize: dense ? "0.75rem" : "0.82rem",
          fontWeight: 700,
          color: theme.palette.app.secondary,
          "& svg": { fontSize: dense ? 15 : 17 },
          "&:hover": { color: theme.palette.primary.main, bgcolor: theme.palette.app.primarySoft },
        }}
      >
        <AddRoundedIcon />
        Agregar ítem
      </Box>
    );

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      onPointerDown={stop}
      onClick={stop}
      sx={{ mt: 0.5 }}
    >
      <InputBase
        autoFocus
        value={text}
        placeholder="Nuevo ítem..."
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") setOpen(false);
        }}
        onBlur={() => {
          if (!text.trim()) setOpen(false);
        }}
        sx={{
          flex: 1,
          height: dense ? 30 : 36,
          px: 1,
          borderRadius: "8px",
          fontSize: dense ? "0.8rem" : "0.88rem",
          bgcolor: theme.palette.app.surface,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      />
      <IconButton
        size="small"
        aria-label="Agregar ítem"
        onMouseDown={(event) => event.preventDefault()}
        onClick={submit}
        sx={{ color: theme.palette.primary.main }}
      >
        <CheckRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};

export const DoneToggle = ({ done, onToggle, size = 20 }) => {
  const theme = useTheme();
  const color = theme.palette.success.main;

  return (
    <Tooltip title={done ? "Reabrir tarea" : "Marcar completada"}>
      <Box
        component="button"
        type="button"
        aria-label={done ? "Reabrir tarea" : "Marcar completada"}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        sx={{
          all: "unset",
          flexShrink: 0,
          width: size,
          height: size,
          mt: "1px",
          borderRadius: "50%",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          color: done ? "#fff" : "transparent",
          bgcolor: done ? color : "transparent",
          border: `2px solid ${done ? color : alpha(theme.palette.app.secondary, 0.5)}`,
          transition: "all 0.16s ease",
          "& svg": { fontSize: size * 0.7 },
          "&:hover": { borderColor: color, color: done ? "#fff" : color },
        }}
      >
        <CheckRoundedIcon />
      </Box>
    </Tooltip>
  );
};

const TaskMenu = ({ task, onEdit, onOpen, onDelete, onSetPriority, onSetStatus, onMoveTop }) => {
  const theme = useTheme();
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);
  const run = (fn) => () => {
    close();
    fn?.();
  };
  const sectionSx = {
    px: 1.5,
    pt: 0.75,
    pb: 0.5,
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.palette.app.secondary,
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label="Más acciones"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          width: 26,
          height: 26,
          borderRadius: "8px",
          color: theme.palette.app.secondary,
          "&:hover": { bgcolor: getSoftBackground(theme) },
        }}
      >
        <MoreHorizRoundedIcon sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 220,
              borderRadius: "14px",
              backgroundImage: "none",
              border: `1px solid ${theme.palette.app.borderSoft}`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? "0 18px 50px rgba(0,0,0,0.5)"
                  : "0 18px 50px rgba(15,23,42,0.14)",
              "& .MuiList-root": { p: 0.6 },
              "& .MuiMenuItem-root": { borderRadius: "9px", fontSize: "0.85rem", minHeight: 36 },
              "& .MuiListItemIcon-root": { minWidth: 30, "& svg": { fontSize: 18 } },
            },
          },
        }}
      >
        <MenuItem onClick={run(onOpen)}>
          <ListItemIcon>
            <OpenInFullRoundedIcon />
          </ListItemIcon>
          Ver detalle
        </MenuItem>
        <MenuItem onClick={run(onEdit)}>
          <ListItemIcon>
            <EditRoundedIcon />
          </ListItemIcon>
          Editar
        </MenuItem>
        {getChecklist(task).length === 0 && task.status !== "completada" && (
          <MenuItem onClick={run(onOpen)}>
            <ListItemIcon>
              <ChecklistRoundedIcon />
            </ListItemIcon>
            Agregar checklist
          </MenuItem>
        )}
        <MenuItem onClick={run(onMoveTop)}>
          <ListItemIcon>
            <VerticalAlignTopRoundedIcon />
          </ListItemIcon>
          Mover al principio
        </MenuItem>

        <Typography sx={sectionSx}>Prioridad</Typography>
        <Stack direction="row" spacing={0.5} sx={{ px: 1, pb: 0.75 }}>
          {[...PRIORITIES, ""].map((key) => {
            const selected = (task.priority || "") === key;
            const color = key ? PRIORITY[key].color(theme) : theme.palette.app.secondary;
            return (
              <Box
                key={key || "none"}
                component="button"
                type="button"
                onClick={run(() => onSetPriority(key || null))}
                sx={{
                  all: "unset",
                  flex: 1,
                  textAlign: "center",
                  py: 0.5,
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  color,
                  bgcolor: selected ? softTint(theme, color, 0.14, 0.2) : "transparent",
                  border: `1px solid ${selected ? alpha(color, 0.4) : theme.palette.app.borderSoft}`,
                  "&:hover": { bgcolor: softTint(theme, color, 0.1, 0.16) },
                }}
              >
                {key ? PRIORITY[key].label : "—"}
              </Box>
            );
          })}
        </Stack>

        <Typography sx={sectionSx}>Mover a</Typography>
        {STATUSES.filter((status) => status !== task.status).map((status) => (
          <MenuItem key={status} onClick={run(() => onSetStatus(status))}>
            <ListItemIcon sx={{ color: getStatusColor(theme, status) }}>
              {getStatusIcon(status)}
            </ListItemIcon>
            {getStatusLabel(status)}
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={run(onDelete)} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteRoundedIcon />
          </ListItemIcon>
          Eliminar
        </MenuItem>
      </Menu>
    </>
  );
};

const CompactIndicators = ({ task, checklist, isDone }) => {
  const theme = useTheme();
  const due = getDueInfo(task);
  const { total, done, allDone } = getChecklistProgress(checklist);
  const dueColor = due && getDueColor(theme, due.tone);
  const showDue = due && !isDone && (due.tone === "overdue" || due.tone === "today");

  return (
    <>
      {showDue && (
        <Tooltip title={due.label}>
          <EventRoundedIcon sx={{ fontSize: 15, color: dueColor }} />
        </Tooltip>
      )}
      {total > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.3}
          sx={{
            flexShrink: 0,
            height: 20,
            px: 0.6,
            borderRadius: "6px",
            fontSize: "0.68rem",
            fontWeight: 800,
            color: allDone ? theme.palette.success.main : theme.palette.app.secondary,
            bgcolor: getSoftBackground(theme),
            "& svg": { fontSize: 13 },
          }}
        >
          <ChecklistRoundedIcon />
          <span>
            {done}/{total}
          </span>
        </Stack>
      )}
    </>
  );
};

export const TaskCardView = ({
  task,
  showStatus = false,
  dragging = false,
  overlay = false,
  expanded = false,
  dragProps,
  onToggleExpand,
  onOpen,
  onEdit,
  onDelete,
  onToggleDone,
  onToggleChecklistItem,
  onAddChecklist,
  onSetPriority,
  onSetStatus,
  onMoveTop,
}) => {
  const theme = useTheme();
  const isDone = task.status === "completada";
  const checklist = getChecklist(task);
  const due = getDueInfo(task);
  const priority = PRIORITY[task.priority];
  const accent = getPriorityColor(theme, task.priority);
  const open = expanded && !overlay;
  const hasMeta = showStatus || priority || due;

  return (
    <Card
      elevation={0}
      onClick={onToggleExpand || onOpen}
      {...dragProps}
      sx={{
        ...getCardStyles(theme, "14px"),
        position: "relative",
        overflow: "hidden",
        p: 1.2,
        pl: 1.5,
        cursor: overlay ? "grabbing" : "pointer",
        touchAction: "manipulation",
        userSelect: "none",
        opacity: dragging ? 0.35 : 1,
        transition: "border-color 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease",
        ...(open && { borderColor: alpha(theme.palette.primary.main, 0.3) }),
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          bgcolor: accent,
        },
        ...(overlay && {
          transform: "rotate(1.5deg)",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 24px 60px rgba(0,0,0,0.55)"
              : "0 24px 50px rgba(15,23,42,0.2)",
          borderColor: alpha(theme.palette.primary.main, 0.45),
        }),
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.35),
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 10px 26px rgba(0,0,0,0.3)"
              : "0 10px 24px rgba(15,23,42,0.08)",
        },
        "&:hover .task-menu": { opacity: 1 },
      }}
    >
      {/* Proyecto + indicadores + menú */}
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.6, minHeight: 26 }}>
        {task.projectId ? (
          <ProjectAvatar item={task} size={18} fontSize={9} sx={{ border: "none" }} />
        ) : null}
        <Typography
          noWrap
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: "0.72rem",
            fontWeight: 700,
            color: theme.palette.app.secondary,
          }}
        >
          {task.projectName || "Personal"}
        </Typography>
        {!open && <CompactIndicators task={task} checklist={checklist} isDone={isDone} />}
        <Box
          className="task-menu"
          sx={{ opacity: { xs: 1, md: overlay ? 1 : 0.55 }, transition: "opacity 0.16s ease" }}
        >
          <TaskMenu
            task={task}
            onEdit={onEdit}
            onOpen={onOpen}
            onDelete={onDelete}
            onSetPriority={onSetPriority}
            onSetStatus={onSetStatus}
            onMoveTop={onMoveTop}
          />
        </Box>
      </Stack>

      {/* Check + título + flecha */}
      <Stack direction="row" alignItems="flex-start" spacing={1}>
        <DoneToggle done={isDone} onToggle={onToggleDone} />
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            color: isDone ? theme.palette.app.secondary : theme.palette.app.text,
            fontSize: "0.9rem",
            fontWeight: 750,
            lineHeight: 1.35,
            textDecoration: isDone ? "line-through" : "none",
            ...(open
              ? { overflowWrap: "anywhere" }
              : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }),
          }}
        >
          {task.title || "Tarea sin título"}
        </Typography>
        {onToggleExpand && (
          <ExpandMoreRoundedIcon
            aria-hidden
            sx={{
              flexShrink: 0,
              mt: "1px",
              fontSize: 20,
              color: theme.palette.app.secondary,
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          />
        )}
      </Stack>

      {/* Detalle desplegable */}
      <Collapse in={open} timeout={200} unmountOnExit>
        <Box sx={{ pl: 3.5, pt: 0.75 }}>
          {task.description && (
            <Typography
              sx={{
                color: theme.palette.app.secondary,
                fontSize: "0.8rem",
                lineHeight: 1.55,
                fontWeight: 500,
                whiteSpace: "pre-line",
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitLineClamp: 6,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {task.description}
            </Typography>
          )}

          {checklist.length > 0 && (
            <Box sx={{ mt: task.description ? 1 : 0, ml: -0.9 }}>
              <Box sx={{ pl: 0.9, pr: 0.25, mb: 0.4 }}>
                <ChecklistProgress checklist={checklist} />
              </Box>
              <ChecklistItems checklist={checklist} onToggle={onToggleChecklistItem} dense />
            </Box>
          )}

          {!isDone && onAddChecklist && (
            <Box sx={{ ml: -0.75, mt: checklist.length ? 0 : 0.25 }}>
              <InlineChecklistAdd onAdd={onAddChecklist} dense />
            </Box>
          )}

          {(hasMeta || onOpen) && (
            <Stack
              direction="row"
              alignItems="center"
              sx={{ mt: 1, flexWrap: "wrap", gap: 0.6 }}
            >
              {showStatus && (
                <MetaPill
                  icon={getStatusIcon(task.status)}
                  label={getStatusLabel(task.status)}
                  color={getStatusColor(theme, task.status)}
                />
              )}
              {priority && !isDone && (
                <MetaPill
                  icon={<FlagRoundedIcon />}
                  label={priority.label}
                  color={priority.color(theme)}
                />
              )}
              {due && !isDone && (
                <MetaPill
                  icon={<EventRoundedIcon />}
                  label={due.label}
                  color={getDueColor(theme, due.tone)}
                />
              )}
              {onOpen && (
                <Box
                  component="button"
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen();
                  }}
                  sx={{
                    all: "unset",
                    ml: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.3,
                    px: 0.75,
                    py: 0.3,
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "0.74rem",
                    fontWeight: 750,
                    color: theme.palette.app.secondary,
                    "& svg": { fontSize: 15 },
                    "&:hover": {
                      color: theme.palette.primary.main,
                      bgcolor: theme.palette.app.primarySoft,
                    },
                  }}
                >
                  <OpenInFullRoundedIcon />
                  Ver detalle
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};

const TaskCard = ({ task, ...props }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
  });

  return (
    <Box
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      sx={{ position: "relative" }}
    >
      <TaskCardView
        task={task}
        dragging={isDragging}
        dragProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </Box>
  );
};

export default TaskCard;
