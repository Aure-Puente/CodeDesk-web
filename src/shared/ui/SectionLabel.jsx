//SectionLabel:
import { Avatar, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Stack from "./Stack";

const SectionLabel = ({ icon, title, subtitle, action }) => {
  const theme = useTheme();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
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
            "& svg": { fontSize: 18 },
          }}
        >
          {icon}
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
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{ color: theme.palette.app.secondary, fontSize: 12.5, fontWeight: 650 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>

      {action}
    </Stack>
  );
};

export default SectionLabel;
