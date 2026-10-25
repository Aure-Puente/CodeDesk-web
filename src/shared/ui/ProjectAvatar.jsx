// ProjectAvatar:
import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { getProjectIconBackground, getProjectIconBorder, isDark } from "./styles";

export const getProjectInfo = (item) => ({
  name: item?.projectName ?? item?.name ?? "",
  color: item?.projectColor || item?.color || null,
  logoUrl: item?.projectLogoUrl || item?.logoUrl || null,
});

const ProjectAvatar = ({ item, size = 52, radius, fontSize, shadow = false, fallback, sx }) => {
  const theme = useTheme();
  const { name, color: rawColor, logoUrl } = getProjectInfo(item);
  const color = rawColor || theme.palette.primary.main;
  const letter = name?.charAt(0)?.toUpperCase();
  const base = typeof size === "number" ? size : size.md;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius:
          radius ??
          `${base < 32 ? Math.round(base * 0.3) : Math.max(14, Math.round(base / 3.3))}px`,
        border: `1px solid ${getProjectIconBorder(theme, color)}`,
        backgroundColor: getProjectIconBackground(theme, color),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: shadow
          ? isDark(theme)
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(color, 0.13)}`
          : "none",
        ...sx,
      }}
    >
      {logoUrl ? (
        <Box
          component="img"
          src={logoUrl}
          alt={name || "Proyecto"}
          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : letter ? (
        <Typography
          sx={{ color, fontSize: fontSize ?? base * 0.4, fontWeight: 950, lineHeight: 1 }}
        >
          {letter}
        </Typography>
      ) : (
        (fallback ?? <FolderRoundedIcon sx={{ color, fontSize: base * 0.5 }} />)
      )}
    </Box>
  );
};

export default ProjectAvatar;
