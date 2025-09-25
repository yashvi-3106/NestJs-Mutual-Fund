"use client";

import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";

export const ThemeControllerContext = React.createContext({
  primaryColor: "#6C47FF",
  setPrimaryColor: () => {},
  mode: "light",
  toggleMode: () => {},
});

function buildTheme(primaryColor, mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: primaryColor },
      background: {
        default: mode === "dark" ? "#0b0b10" : "#fafafa",
        paper: mode === "dark" ? "#101018" : "#ffffff",
      },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: "var(--font-geist-sans), Inter, system-ui, Arial",
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 800 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backdropFilter: "saturate(120%) blur(10px)",
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: "1px solid",
            borderColor: mode === "dark" ? "#1f2430" : "#e7e9f0",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  });
}

export default function ThemeProviderClient({ children }) {
  const [primaryColor, setPrimaryColor] = React.useState("#6C47FF");
  const [mode, setMode] = React.useState("light");

  React.useEffect(() => {
    const savedColor = typeof window !== "undefined" && localStorage.getItem("mf-primary");
    const savedMode = typeof window !== "undefined" && localStorage.getItem("mf-mode");
    if (savedColor) setPrimaryColor(savedColor);
    if (savedMode === "light" || savedMode === "dark") setMode(savedMode);
  }, []);

  const handleSetPrimary = React.useCallback((color) => {
    setPrimaryColor(color);
    if (typeof window !== "undefined") localStorage.setItem("mf-primary", color);
  }, []);

  const toggleMode = React.useCallback(() => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      if (typeof window !== "undefined") localStorage.setItem("mf-mode", next);
      return next;
    });
  }, []);

  const theme = React.useMemo(() => buildTheme(primaryColor, mode), [primaryColor, mode]);

  return (
    <ThemeControllerContext.Provider value={{ primaryColor, setPrimaryColor: handleSetPrimary, mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeControllerContext.Provider>
  );
}


