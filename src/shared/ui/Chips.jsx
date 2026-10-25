// Chips:
import { Button, Chip, IconButton, Tooltip } from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Stack from "./Stack";
import { alpha, useTheme } from "@mui/material/styles";
import { softTint } from "./styles";

export const TintChip = ({ label, icon, color, height = 27, sx }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={{
        height,
        borderRadius: "999px",
        color: c,
        backgroundColor: softTint(theme, c, 0.09, 0.15),
        border: `1px solid ${alpha(c, 0.18)}`,
        fontWeight: 850,
        "& .MuiChip-icon": { color: c, fontSize: 17 },
        ...sx,
      }}
    />
  );
};

export const IconAction = ({ title, color, onClick, size = 40, disabled, children }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          aria-label={title}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.(event);
          }}
          sx={{
            width: size,
            height: size,
            color: c,
            backgroundColor: alpha(c, 0.11),
            "&:hover": { backgroundColor: alpha(c, 0.17) },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export const EditDeleteActions = ({ onEdit, onDelete, size = 40 }) => {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={1}>
      <IconAction title="Editar" onClick={onEdit} size={size}>
        <EditRoundedIcon />
      </IconAction>
      <IconAction title="Eliminar" color={theme.palette.error.main} onClick={onDelete} size={size}>
        <DeleteRoundedIcon />
      </IconAction>
    </Stack>
  );
};

export const SoftButton = ({ children, sx, ...props }) => {
  const theme = useTheme();
  const c = theme.palette.primary.main;

  return (
    <Button
      variant="outlined"
      sx={{
        minHeight: 40,
        px: 1.8,
        borderRadius: "14px",
        color: c,
        borderColor: alpha(c, 0.28),
        bgcolor: softTint(theme, c, 0.055, 0.08),
        fontWeight: 900,
        whiteSpace: "nowrap",
        "&:hover": { borderColor: c, bgcolor: softTint(theme, c, 0.1, 0.14) },
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};
