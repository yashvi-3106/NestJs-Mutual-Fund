"use client";

import { Container, Box, Typography, Button, Grid, Card, CardContent } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Container sx={{ py: 6 }}>
      {/* Hero */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h3" gutterBottom>
          Discover Mutual Funds with Confidence
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
          Mutual Fund Explorer helps you search schemes, view detailed metadata, analyze historical NAV,
          and run SIP calculations to understand potential outcomes. Start exploring the Indian mutual fund universe today.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" component={Link} href="/funds">
            Explore Funds
          </Button>
        </Box>
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
