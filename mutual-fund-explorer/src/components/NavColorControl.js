"use client";

import React from "react";
import { Box, IconButton, Tooltip, useTheme, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import ColorLensRoundedIcon from "@mui/icons-material/ColorLensRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { ThemeControllerContext } from "./ThemeProviderClient";

const swatches = ["#6C47FF", "#00BFA6", "#E91E63", "#FF8A00", "#2D7DFF", "#8E24AA"]; 

export default function NavColorControl() {
  const { primaryColor, setPrimaryColor, mode, toggleMode } = React.useContext(ThemeControllerContext);
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const open = Boolean(anchorEl);
  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title="Theme">
        <IconButton color="inherit" onClick={handleOpen} aria-label="choose theme">
          <ColorLensRoundedIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
        <IconButton color="inherit" onClick={toggleMode} aria-label="toggle mode">
          {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} keepMounted>
        {swatches.map((c) => (
          <MenuItem key={c} onClick={() => { setPrimaryColor(c); handleClose(); }}>
            <ListItemIcon>
              <Box sx={{ width: 18, height: 18, bgcolor: c, borderRadius: "50%", border: "1px solid", borderColor: theme.palette.divider }} />
            </ListItemIcon>
            <ListItemText primary={c} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}


