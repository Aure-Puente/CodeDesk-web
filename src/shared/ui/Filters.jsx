//Filter:
import {
  Button,
  Card,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AppsRoundedIcon from "@mui/icons-material/AppsRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FilterAltOffRoundedIcon from "@mui/icons-material/FilterAltOffRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Stack from "./Stack";
import SectionLabel from "./SectionLabel";
import { IconOption, ProjectOption } from "./ProjectSelect";
import { getCardStyles, getMenuProps, getSoftBackground } from "./styles";

export const FilterSelect = ({ label, value, onChange, minWidth = 200, children }) => {
  const theme = useTheme();

  return (
    <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: minWidth } }}>
      <InputLabel>{label}</InputLabel>
      <Select
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        MenuProps={getMenuProps(theme)}
        sx={{
          borderRadius: "12px",
          backgroundColor: getSoftBackground(theme),
          "& .MuiSelect-select": { display: "flex", alignItems: "center", fontSize: "0.9rem" },
        }}
      >
        {children}
      </Select>
    </FormControl>
  );
};

export const projectFilterOptions = (projects, { withoutProject = true } = {}) => [
  <MenuItem key="todos" value="todos">
    <IconOption icon={<AppsRoundedIcon />} label="Todos los proyectos" size={22} />
  </MenuItem>,
  withoutProject && (
    <MenuItem key="sinProyecto" value="sinProyecto">
      <IconOption label="Sin proyecto" size={22} />
    </MenuItem>
  ),
  ...projects.map((project) => (
    <MenuItem key={project.id} value={project.id}>
      <ProjectOption project={project} size={22} />
    </MenuItem>
  )),
];

export const matchesProjectFilter = (item, filter) =>
  filter === "todos" || (filter === "sinProyecto" ? !item.projectId : item.projectId === filter);

export const SearchField = ({ value, onChange, placeholder = "Buscar...", width = 300 }) => {
  const theme = useTheme();

  return (
    <TextField
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      size="small"
      sx={{
        width: { xs: "100%", md: width },
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
          backgroundColor: getSoftBackground(theme),
          fontSize: "0.9rem",
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

const FilterBar = ({ title = "Filtros", subtitle, onReset, children }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ ...getCardStyles(theme, "20px"), p: { xs: 1.5, md: 1.75 } }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
      >
        <SectionLabel icon={<FilterListRoundedIcon />} title={title} subtitle={subtitle} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.2}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ flex: 1, justifyContent: "flex-end" }}
        >
          {children}
          {onReset && (
            <Button
              variant="outlined"
              startIcon={<FilterAltOffRoundedIcon />}
              onClick={onReset}
              sx={{ height: 40, borderRadius: "12px", fontWeight: 800, whiteSpace: "nowrap" }}
            >
              Limpiar
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
};

export default FilterBar;
