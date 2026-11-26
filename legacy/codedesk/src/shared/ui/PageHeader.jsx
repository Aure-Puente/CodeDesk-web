//PageHeader:
import { Avatar, Box, Button, Card, Chip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Stack from "./Stack";
import { getCardStyles, getSoftBackground } from "./styles";

export const HeaderMiniChip = ({ label }) => {
  const theme = useTheme();

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: 26,
        borderRadius: "999px",
        fontSize: "0.76rem",
        backgroundColor: getSoftBackground(theme),
        border: `1px solid ${theme.palette.app.borderSoft}`,
        color: theme.palette.app.secondary,
        fontWeight: 800,
      }}
    />
  );
};

export const PrimaryButton = ({ children, icon = <AddRoundedIcon />, sx, ...props }) => (
  <Button
    variant="contained"
    startIcon={icon}
    sx={{
      height: 40,
      px: 1.7,
      borderRadius: "12px",
      fontWeight: 800,
      boxShadow: "none",
      whiteSpace: "nowrap",
      fontSize: "0.84rem",
      "& .MuiButton-startIcon": { mr: 0.55 },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Button>
);

const PageHeader = ({ icon, title, description, chips = [], actionLabel, onAction, actions }) => {
  const theme = useTheme();

  return (
    <Card elevation={0} sx={{ ...getCardStyles(theme, "22px"), p: { xs: 2, sm: 2.25, md: 2.5 } }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2, lg: 3 }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.6} sx={{ flex: 1, minWidth: 0 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: { xs: 40, md: 44 },
              height: { xs: 40, md: 44 },
              mt: 0.1,
              borderRadius: "14px",
              color: theme.palette.primary.main,
              backgroundColor: theme.palette.app.primarySoft,
              border: `1px solid ${theme.palette.app.borderSoft}`,
              "& svg": { fontSize: { xs: 21, md: 23 } },
            }}
          >
            {icon}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: theme.palette.app.text,
                fontWeight: 850,
                letterSpacing: "-0.4px",
                fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.55rem" },
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,
                color: theme.palette.app.secondary,
                fontSize: { xs: "0.85rem", md: "0.9rem" },
                lineHeight: 1.55,
                fontWeight: 600,
                maxWidth: 700,
              }}
            >
              {description}
            </Typography>

            {chips.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.25, flexWrap: "wrap", rowGap: 1 }}>
                {chips.map((label) => (
                  <HeaderMiniChip key={label} label={label} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>

        {actions ??
          (actionLabel && (
            <PrimaryButton onClick={onAction} sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
              {actionLabel}
            </PrimaryButton>
          ))}
      </Stack>
    </Card>
  );
};

export default PageHeader;
