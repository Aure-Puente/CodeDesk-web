// Styes:
import { alpha, keyframes } from "@mui/material/styles";

export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const softFadeIn = keyframes`
  from { opacity: 0; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
`;

export const getFadeInSx = (delay = 0) => ({
  opacity: 0,
  animation: `${fadeInUp} 420ms ease forwards`,
  animationDelay: `${delay}ms`,
});

export const getSoftFadeSx = (delay = 0) => ({
  opacity: 0,
  animation: `${softFadeIn} 380ms ease forwards`,
  animationDelay: `${delay}ms`,
});

export const hexToRgba = (hex, opacity = 1) => {
  const clean = String(hex || "").replace("#", "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));

  if ([r, g, b].some(Number.isNaN)) return `rgba(37, 99, 235, ${opacity})`;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const isDark = (theme) => theme.palette.mode === "dark";

export const getCardStyles = (theme, radius = "24px") => ({
  borderRadius: radius,
  border: `1px solid ${theme.palette.app.borderSoft}`,
  backgroundColor: theme.palette.app.surface,
  backgroundImage: "none",
  boxShadow: isDark(theme)
    ? "0 18px 48px rgba(0, 0, 0, 0.16)"
    : "0 16px 42px rgba(15, 23, 42, 0.045)",
});

export const getSoftBackground = (theme) =>
  isDark(theme) ? alpha("#FFFFFF", 0.035) : alpha("#0F172A", 0.025);

export const getProjectIconBackground = (theme, color) =>
  isDark(theme) ? alpha("#F8FAFC", 0.94) : hexToRgba(color || theme.palette.primary.main, 0.1);

export const getProjectIconBorder = (theme, color) =>
  hexToRgba(color || theme.palette.primary.main, isDark(theme) ? 0.38 : 0.18);

export const softTint = (theme, color, light = 0.1, dark = 0.16) =>
  alpha(color, isDark(theme) ? dark : light);

export const getDialogPaperSx = (theme) => ({
  borderRadius: "24px",
  backgroundColor: theme.palette.app.surface,
  backgroundImage: "none",
  border: `1px solid ${theme.palette.app.borderSoft}`,
  boxShadow: isDark(theme) ? "0 28px 90px rgba(0,0,0,0.55)" : "0 28px 80px rgba(15,23,42,0.18)",
});

export const getMenuProps = (theme) => ({
  slotProps: {
    paper: {
      sx: {
        mt: 0.75,
        maxHeight: 340,
        borderRadius: "14px",
        backgroundImage: "none",
        backgroundColor: theme.palette.app.surface,
        border: `1px solid ${theme.palette.app.borderSoft}`,
        boxShadow: isDark(theme)
          ? "0 18px 50px rgba(0,0,0,0.5)"
          : "0 18px 50px rgba(15,23,42,0.14)",
        "& .MuiList-root": { p: 0.6 },
        "& .MuiMenuItem-root": { borderRadius: "10px", minHeight: 40, fontSize: "0.9rem" },
      },
    },
  },
});

export const roundedFieldSx = (radius = "14px") => ({
  "& .MuiOutlinedInput-root": { borderRadius: radius },
});
