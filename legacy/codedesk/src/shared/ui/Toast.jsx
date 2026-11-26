//Toast:
import { useCallback, useState } from "react";
import { Box, IconButton, Snackbar, Typography } from "@mui/material";
import { alpha, keyframes, useTheme } from "@mui/material/styles";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback(
    (message, options = {}) =>
      setToast({ message, severity: "success", ...options, key: Date.now() }),
    [],
  );
  return [toast, showToast, () => setToast(null)];
};

const ICONS = {
  success: <CheckCircleRoundedIcon />,
  warning: <WarningRoundedIcon />,
  error: <ErrorRoundedIcon />,
  info: <InfoRoundedIcon />,
};

const shrink = keyframes`from { transform: scaleX(1); } to { transform: scaleX(0); }`;

const Toast = ({ toast, onClose }) => {
  const theme = useTheme();
  const severity = toast?.severity || "success";
  const color = theme.palette[severity]?.main || theme.palette.primary.main;
  const duration = toast?.duration ?? 3500;
  const dark = theme.palette.mode === "dark";

  return (
    <Snackbar
      key={toast?.key}
      open={Boolean(toast)}
      autoHideDuration={duration}
      onClose={(_, reason) => reason !== "clickaway" && onClose()}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{
        bottom: { xs: 16, sm: 24 },
        left: { md: "calc(50% + 124px)", lg: "calc(50% + 132px)" },
      }}
    >
      <Box
        role="status"
        sx={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          minWidth: { xs: "calc(100vw - 32px)", sm: 340 },
          maxWidth: 460,
          pl: 1.25,
          pr: 0.75,
          py: 1,
          borderRadius: "16px",
          bgcolor: theme.palette.app.surface,
          border: `1px solid ${alpha(color, dark ? 0.35 : 0.25)}`,
          boxShadow: dark
            ? `0 18px 40px rgba(0,0,0,0.55), 0 0 0 1px ${alpha(color, 0.08)}`
            : `0 18px 40px ${alpha("#0F172A", 0.16)}`,
          "&:hover .toast-progress": { animationPlayState: "paused" },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            flexShrink: 0,
            borderRadius: "11px",
            display: "grid",
            placeItems: "center",
            color,
            bgcolor: alpha(color, dark ? 0.18 : 0.12),
            "& svg": { fontSize: 20 },
          }}
        >
          {ICONS[severity] || ICONS.info}
        </Box>

        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            color: theme.palette.app.text,
            fontSize: "0.86rem",
            fontWeight: 700,
            lineHeight: 1.4,
          }}
        >
          {toast?.message}
        </Typography>

        {toast?.actionLabel && (
          <Box
            component="button"
            type="button"
            onClick={() => {
              toast.onAction?.();
              onClose();
            }}
            sx={{
              all: "unset",
              cursor: "pointer",
              px: 1.2,
              py: 0.6,
              borderRadius: "10px",
              fontSize: "0.8rem",
              fontWeight: 850,
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, dark ? 0.16 : 0.1),
              transition: "background-color 0.15s ease",
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, dark ? 0.26 : 0.18) },
            }}
          >
            {toast.actionLabel}
          </Box>
        )}

        <IconButton
          size="small"
          aria-label="Cerrar"
          onClick={onClose}
          sx={{ color: theme.palette.app.secondary, "& svg": { fontSize: 18 } }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <Box
          className="toast-progress"
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            bgcolor: alpha(color, 0.7),
            transformOrigin: "left",
            animation: `${shrink} ${duration}ms linear forwards`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none", opacity: 0 },
          }}
        />
      </Box>
    </Snackbar>
  );
};

export default Toast;
