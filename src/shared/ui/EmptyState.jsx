//EmptuState:
import { Box, Card, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Stack from "./Stack";
import { PrimaryButton } from "./PageHeader";
import { getSoftFadeSx, isDark } from "./styles";

const EmptyState = ({ icon, title, text, actionLabel, onAction, actionIcon }) => {
  const theme = useTheme();
  const c = theme.palette.primary.main;

  return (
    <Card
      elevation={0}
      sx={{
        ...getSoftFadeSx(40),
        position: "relative",
        overflow: "hidden",
        borderRadius: "22px",
        border: `1.5px dashed ${alpha(c, isDark(theme) ? 0.28 : 0.22)}`,
        backgroundColor: theme.palette.app.surface,
        backgroundImage: `radial-gradient(420px 200px at 50% 0%, ${alpha(c, isDark(theme) ? 0.12 : 0.07)}, transparent 70%)`,
      }}
    >
      <Stack
        alignItems="center"
        sx={{
          px: { xs: 2.5, md: 4 },
          py: { xs: 4, md: "clamp(32px, 6vh, 56px)" },
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            mb: 2,
            width: 64,
            height: 64,
            borderRadius: "20px",
            display: "grid",
            placeItems: "center",
            color: c,
            background: `linear-gradient(145deg, ${alpha(c, 0.16)}, ${alpha(c, 0.06)})`,
            border: `1px solid ${alpha(c, 0.22)}`,
            boxShadow: `0 0 0 8px ${alpha(c, 0.05)}, 0 0 0 16px ${alpha(c, 0.03)}`,
            "& svg": { fontSize: 30 },
          }}
        >
          {icon}
        </Box>

        <Typography
          sx={{
            mt: 1,
            color: theme.palette.app.text,
            fontSize: { xs: "1.08rem", md: "1.2rem" },
            fontWeight: 850,
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            mb: actionLabel ? 2.25 : 0,
            maxWidth: 460,
            color: theme.palette.app.secondary,
            fontSize: "0.88rem",
            lineHeight: 1.6,
            fontWeight: 550,
          }}
        >
          {text}
        </Typography>

        {actionLabel && (
          <PrimaryButton onClick={onAction} {...(actionIcon ? { icon: actionIcon } : {})}>
            {actionLabel}
          </PrimaryButton>
        )}
      </Stack>
    </Card>
  );
};

export default EmptyState;
