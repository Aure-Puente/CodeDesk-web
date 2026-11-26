// ProjectAvatar:
import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
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
  const [loaded, setLoaded] = useState(null);
  const [failed, setFailed] = useState(null);
  const showLogo = Boolean(logoUrl) && failed !== logoUrl;
  const loading = showLogo && loaded !== logoUrl;
  const spinner = Math.min(26, Math.max(12, Math.round(base * 0.36)));

  const handleLoad = () => setLoaded(logoUrl);

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
        position: "relative",
        boxShadow: shadow
          ? isDark(theme)
            ? "0 12px 24px rgba(0,0,0,0.24)"
            : `0 12px 24px ${alpha(color, 0.13)}`
          : "none",
        ...sx,
      }}
    >
      {showLogo ? (
        <>
          <Box
            component="img"
            src={logoUrl}
            alt={name || "Proyecto"}
            onLoad={handleLoad}
            onError={() => setFailed(logoUrl)}
            ref={(node) => {
              if (node?.complete && node.naturalWidth && loaded !== logoUrl) handleLoad();
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: loading ? 0 : 1,
              transition: "opacity 0.22s ease",
            }}
          />
          {loading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                backgroundColor: theme.palette.app.surfaceSoft,
                backgroundImage: `linear-gradient(${alpha(color, isDark(theme) ? 0.16 : 0.1)}, ${alpha(color, isDark(theme) ? 0.16 : 0.1)})`,
              }}
            >
              <CircularProgress size={spinner} thickness={4.5} sx={{ color }} />
            </Box>
          )}
        </>
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
