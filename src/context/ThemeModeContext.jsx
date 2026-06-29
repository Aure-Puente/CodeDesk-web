//Importaciones:
import React, { createContext, useContext, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getAppTheme } from "../theme/theme";
import "@fontsource/inter";

//JSX:
const ThemeModeContext = createContext(null);

export const ThemeModeProvider = ({ children }) => {
    const savedMode = localStorage.getItem("themeMode") || "light";
    const [mode, setMode] = useState(savedMode);

    const theme = useMemo(() => getAppTheme(mode), [mode]);

    const toggleThemeMode = () => {
        setMode((prevMode) => {
        const nextMode = prevMode === "light" ? "dark" : "light";
        localStorage.setItem("themeMode", nextMode);
        return nextMode;
        });
    };

    const setThemeMode = (newMode) => {
        localStorage.setItem("themeMode", newMode);
        setMode(newMode);
    };

    const value = useMemo(
        () => ({
        mode,
        isDark: mode === "dark",
        toggleThemeMode,
        setThemeMode,
        }),
        [mode]
    );

    return (
        <ThemeModeContext.Provider value={value}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
        </ThemeModeContext.Provider>
    );
    };

    export const useThemeMode = () => {
    const context = useContext(ThemeModeContext);

    if (!context) {
        throw new Error("useThemeMode debe usarse dentro de ThemeModeProvider");
    }

    return context;
};