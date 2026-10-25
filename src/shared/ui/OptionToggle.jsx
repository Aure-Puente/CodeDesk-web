// OptionToggle:
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { getSoftBackground, softTint } from "./styles";

const OptionToggle = ({ label, value, onChange, options, color, disabled }) => {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;

  return (
    <Box>
      {label && (
        <Typography sx={{ color: theme.palette.app.text, fontWeight: 900, mb: 1.1 }}>
          {label}
        </Typography>
      )}
      <ToggleButtonGroup
        exclusive
        fullWidth
        value={value}
        onChange={(_, next) => next && onChange(next)}
        disabled={disabled}
        sx={{
          gap: 1,
          "& .MuiToggleButtonGroup-grouped": {
            m: 0,
            border: `1px solid ${theme.palette.app.borderSoft} !important`,
            borderRadius: "16px !important",
          },
          "& .MuiToggleButton-root": {
            minHeight: 74,
            flexDirection: "column",
            gap: 0.7,
            fontSize: "0.82rem",
            fontWeight: 900,
            lineHeight: 1.1,
            color: theme.palette.app.secondary,
            backgroundColor: getSoftBackground(theme),
            "& svg": { fontSize: 24 },
            "&.Mui-selected": {
              color: c,
              backgroundColor: softTint(theme, c),
              borderColor: `${alpha(c, 0.28)} !important`,
            },
            "&.Mui-selected:hover": { backgroundColor: softTint(theme, c, 0.14, 0.2) },
          },
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.icon}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default OptionToggle;
