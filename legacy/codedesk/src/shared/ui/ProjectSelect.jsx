//ProjectSelect:
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FolderOffRoundedIcon from "@mui/icons-material/FolderOffRounded";
import Stack from "./Stack";
import ProjectAvatar from "./ProjectAvatar";
import { getMenuProps, getSoftBackground } from "./styles";

export const ColorDot = ({ color, size = 12 }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 999,
        bgcolor: c,
        boxShadow: `0 0 0 4px ${alpha(c, 0.1)}`,
        flexShrink: 0,
      }}
    />
  );
};

export const ProjectOption = ({ project, size = 24 }) => (
  <Stack direction="row" alignItems="center" spacing={1.1} sx={{ minWidth: 0 }}>
    <ProjectAvatar item={project} size={size} fontSize={size * 0.46} sx={{ border: "none" }} />
    <Typography
      component="span"
      noWrap
      sx={{ fontWeight: 700, fontSize: "inherit", lineHeight: 1.2 }}
    >
      {project.name}
    </Typography>
  </Stack>
);

export const IconOption = ({ icon = <FolderOffRoundedIcon />, label, size = 24 }) => {
  const theme = useTheme();

  return (
    <Stack direction="row" alignItems="center" spacing={1.1}>
      <Box
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
          borderRadius: `${Math.round(size * 0.3)}px`,
          display: "grid",
          placeItems: "center",
          color: theme.palette.app.secondary,
          backgroundColor: getSoftBackground(theme),
          border: `1px solid ${theme.palette.app.borderSoft}`,
          "& svg": { fontSize: size * 0.62 },
        }}
      >
        {icon}
      </Box>
      <Typography component="span" sx={{ fontWeight: 700, fontSize: "inherit", lineHeight: 1.2 }}>
        {label}
      </Typography>
    </Stack>
  );
};

export const ProjectPreview = ({ project, caption = "Proyecto seleccionado" }) => {
  const theme = useTheme();
  if (!project) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.2}
      sx={{
        borderRadius: "16px",
        p: 1.2,
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
      }}
    >
      <ProjectAvatar item={project} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ color: theme.palette.app.text, fontWeight: 800, fontSize: "0.92rem" }}
        >
          {project.name}
        </Typography>
        <Typography
          sx={{ color: theme.palette.app.secondary, fontSize: "0.78rem", fontWeight: 600 }}
        >
          {caption}
        </Typography>
      </Box>
    </Stack>
  );
};

const ProjectSelect = ({
  projects,
  value,
  onChange,
  disabled,
  label = "Proyecto",
  emptyLabel,
  showPreview = true,
  caption,
  size,
}) => {
  const theme = useTheme();
  const selected = projects.find((project) => project.id === value);

  return (
    <>
      <FormControl fullWidth size={size} sx={{ minWidth: 0 }}>
        <InputLabel>{label}</InputLabel>
        <Select
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          MenuProps={getMenuProps(theme)}
          sx={{
            borderRadius: "12px",
            "& .MuiSelect-select": { display: "flex", alignItems: "center", minWidth: 0, overflow: "hidden" },
          }}
        >
          {emptyLabel && (
            <MenuItem value="">
              <IconOption label={emptyLabel} />
            </MenuItem>
          )}
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              <ProjectOption project={project} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showPreview && <ProjectPreview project={selected} caption={caption} />}
    </>
  );
};

export default ProjectSelect;
