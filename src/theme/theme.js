//Theme
import { createTheme } from "@mui/material/styles";

const lightColors = {
    primary: "#2563EB",
    primarySoft: "rgba(37, 99, 235, 0.08)",

    text: "#0F172A",
    secondary: "#64748B",
    muted: "#94A3B8",

    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceSoft: "#F1F5F9",

    outline: "#E2E8F0",
    borderSoft: "rgba(15, 23, 42, 0.08)",

    success: "#16A34A",
    successSoft: "rgba(22, 163, 74, 0.10)",

    warning: "#D97706",
    warningSoft: "rgba(217, 119, 6, 0.10)",

    danger: "#DC2626",
    dangerSoft: "rgba(220, 38, 38, 0.08)",

    info: "#2563EB",
    infoSoft: "rgba(37, 99, 235, 0.10)",

    paused: "#64748B",
    pausedSoft: "rgba(100, 116, 139, 0.10)",
    };

    const darkColors = {
    primary: "#60A5FA",
    primarySoft: "rgba(96, 165, 250, 0.14)",

    text: "#F8FAFC",
    secondary: "#94A3B8",
    muted: "#64748B",

    background: "#020617",
    surface: "#0F172A",
    surfaceSoft: "#111827",

    outline: "#1E293B",
    borderSoft: "rgba(255, 255, 255, 0.08)",

    success: "#22C55E",
    successSoft: "rgba(34, 197, 94, 0.16)",

    warning: "#F59E0B",
    warningSoft: "rgba(245, 158, 11, 0.16)",

    danger: "#F87171",
    dangerSoft: "rgba(248, 113, 113, 0.16)",

    info: "#60A5FA",
    infoSoft: "rgba(96, 165, 250, 0.16)",

    paused: "#94A3B8",
    pausedSoft: "rgba(148, 163, 184, 0.14)",
    };

    export const getAppTheme = (mode = "light") => {
    const isDark = mode === "dark";
    const appColors = isDark ? darkColors : lightColors;

    return createTheme({
        palette: {
        mode,

        primary: {
            main: appColors.primary,
        },

        success: {
            main: appColors.success,
        },

        warning: {
            main: appColors.warning,
        },

        error: {
            main: appColors.danger,
        },

        info: {
            main: appColors.info,
        },

        background: {
            default: appColors.background,
            paper: appColors.surface,
        },

        text: {
            primary: appColors.text,
            secondary: appColors.secondary,
        },

        divider: appColors.borderSoft,

        app: appColors,
        },

        typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        button: {
            textTransform: "none",
            fontWeight: 700,
        },
        },

        shape: {
        borderRadius: 16,
        },

        components: {
        MuiCssBaseline: {
            styleOverrides: {
            "*": {
                boxSizing: "border-box",
            },

            html: {
                width: "100%",
                minHeight: "100%",
                margin: 0,
                padding: 0,
            },

            body: {
                width: "100%",
                minHeight: "100%",
                margin: 0,
                padding: 0,
                backgroundColor: appColors.background,
                color: appColors.text,
                overscrollBehavior: "none",
            },

            "#root": {
                width: "100%",
                minHeight: "100vh",
            },

            "::-webkit-scrollbar": {
                width: "8px",
                height: "8px",
            },

            "::-webkit-scrollbar-track": {
                background: isDark ? "#020617" : "#F8FAFC",
            },

            "::-webkit-scrollbar-thumb": {
                background: isDark ? "#334155" : "#CBD5E1",
                borderRadius: "999px",
            },

            "::-webkit-scrollbar-thumb:hover": {
                background: isDark ? "#475569" : "#94A3B8",
            },
            },
        },

        MuiPaper: {
            styleOverrides: {
            root: {
                backgroundImage: "none",
            },
            },
        },

        MuiButton: {
            styleOverrides: {
            root: {
                borderRadius: "14px",
                boxShadow: "none",
            },
            },
        },

        MuiChip: {
            styleOverrides: {
            root: {
                fontWeight: 700,
            },
            },
        },
        },
    });
};