"use client";

import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Link from "next/link";

export default function NavBar() {
  // Example default scheme code
  const defaultSchemeCode = "118834"; // replace with any valid scheme code

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar sx={{ gap: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Mutual Fund Explorer
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" component={Link} href="/">
            Home
          </Button>
          <Button color="inherit" component={Link} href="/funds">
            Funds
          </Button>
          <Button
            color="inherit"
            component={Link}
            href={`/scheme/${defaultSchemeCode}`}
          >
            Scheme Details
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
