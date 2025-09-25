"use client";

import { Container, Box, Typography, Button, Grid, Card, CardContent, Stack, TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import React from "react";
import { ThemeControllerContext } from "@/components/ThemeProviderClient";

export default function Home() {
  const theme = useTheme();
  const { primaryColor, setPrimaryColor } = React.useContext(ThemeControllerContext);
  return (
    <Container sx={{ py: 6 }}>
      {/* Hero */}
      <Box sx={{ textAlign: "center", mb: 6, background: `linear-gradient(180deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`, borderRadius: 4, p: { xs: 3, md: 6 }, border: "1px solid", borderColor: theme.palette.divider }}>
        <Typography variant="h3" gutterBottom sx={{ backgroundImage: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`, WebkitBackgroundClip: "text", color: "transparent" }}>
          Discover Mutual Funds with Confidence
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
          Mutual Fund Explorer helps you search schemes, view detailed metadata, analyze historical NAV,
          and run SIP calculations to understand potential outcomes. Start exploring the Indian mutual fund universe today.
        </Typography>
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }} justifyContent="center" sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" component={Link} href="/funds">
            Explore Funds
          </Button>
          <TextField size="small" type="text" label="Pick a primary color (hex)" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} sx={{ minWidth: 260 }} />
        </Stack>
      </Box>

      {/* Features */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Search & Filter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quickly find schemes by name and navigate to in-depth details for each fund.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Returns & NAV
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View precomputed returns across periods and visualize last-year NAV trends.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                SIP Calculator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Simulate SIP investments over time with configurable frequency and dates.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
