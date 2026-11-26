//InfoBox:
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Stack from "./Stack";
import { getSoftBackground } from "./styles";

const InfoBox = ({ icon, title, subtitle, clamp, sx, children }) => {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={1.2}
      sx={{
        borderRadius: "18px",
        border: `1px solid ${theme.palette.app.borderSoft}`,
        bgcolor: getSoftBackground(theme),
        p: 1.45,
        "& > svg": { color: theme.palette.app.secondary, fontSize: 20, mt: 0.1, flexShrink: 0 },
        ...sx,
      }}
    >
      {icon}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title && (
          <Typography
            noWrap={!clamp}
            sx={{
              color: theme.palette.app.text,
              fontSize: { xs: "0.84rem", md: "0.9rem" },
              fontWeight: 900,
              ...(clamp && {
                display: "-webkit-box",
                WebkitLineClamp: clamp,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                overflowWrap: "anywhere",
              }),
            }}
          >
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography
            sx={{
              mt: title ? 0.3 : 0,
              color: theme.palette.app.secondary,
              fontSize: "0.78rem",
              fontWeight: 650,
            }}
          >
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </Stack>
  );
};

export default InfoBox;
