"use client";

import React, { useState, useEffect, use } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  NoSsr,
  Box,
  Chip,
  Stack,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import BrandedLoader from "@/components/BrandedLoader";
import { useTheme } from "@mui/material/styles";
import { ThemeControllerContext } from "@/components/ThemeProviderClient";

import { LineChart } from "@mui/x-charts/LineChart";
import { parseISO, addMonths, addWeeks, addYears, differenceInYears, subYears } from "date-fns";

export default function SchemeDetailPage({ params }) {
  const { code } = use(params);
  const theme = useTheme();
  const { primaryColor, setPrimaryColor } = React.useContext(ThemeControllerContext);
  const [metadata, setMetadata] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [returnsRows, setReturnsRows] = useState([]);
  const [tab, setTab] = useState(0);
  const [sipAmount, setSipAmount] = useState(5000);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [sipResult, setSipResult] = useState(null);
  const [lumpsumAmount, setLumpsumAmount] = useState(50000);
  const [swpAmount, setSwpAmount] = useState(2000);
  const [swpFrequency, setSwpFrequency] = useState("monthly");
  const [showMA, setShowMA] = useState(false);
  const [maWindow, setMaWindow] = useState(10);

  useEffect(() => {
    let cancelled = false;
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/scheme/${code}`);
        if (!res.ok) throw new Error("Failed to fetch scheme details");
        const data = await res.json();
        if (!cancelled) {
          setMetadata(data.metadata);
          setNavHistory(Array.isArray(data.navHistory) ? data.navHistory : []);
        }
      } catch (e) {
        console.error("/scheme/[code]: failed to load details", e);
      }
    }
    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    async function fetchReturns() {
      try {
        const periods = ["1m", "3m", "6m", "1y"];
        const results = await Promise.all(
          periods.map(async (p) => {
            const r = await fetch(`/api/scheme/${code}/returns?period=${p}`);
            if (!r.ok) return { period: p, needs_review: true };
            const d = await r.json();
            return {
              period: p,
              startDate: d.startDate,
              endDate: d.endDate,
              startNav: d.startNAV,
              endNav: d.endNAV,
              simpleReturn: d.simpleReturn,
              annualizedReturn: d.annualizedReturn,
            };
          })
        );
        if (!cancelled) setReturnsRows(results);
      } catch (e) {
        console.warn("/scheme/[code]: returns fetch failed", e);
        if (!cancelled) setReturnsRows([]);
      }
    }
    if (code) fetchReturns();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleCalculateSIP = () => {
    if (!Array.isArray(navHistory) || navHistory.length === 0) {
      setSipResult({ needsReview: true, reason: "No NAV history available" });
      return;
    }

    const from = parseISO(startDate);
    const to = parseISO(endDate);
    if (isNaN(from) || isNaN(to) || from > to) {
      setSipResult({ needsReview: true, reason: "Invalid date range" });
      return;
    }

    const dates = [];
    let current = from;
    while (current <= to) {
      dates.push(new Date(current));
      if (frequency === "monthly") current = addMonths(current, 1);
      else if (frequency === "weekly") current = addWeeks(current, 1);
      else if (frequency === "yearly") current = addYears(current, 1);
      else break;
    }

    const sortedNav = [...navHistory]
      .filter((n) => n && n.nav != null)
      .sort((a, b) => parseISO(a.date) - parseISO(b.date));

    let totalUnits = 0;
    let totalInvested = 0;
    const labels = [];
    const values = [];

    dates.forEach((d) => {
      const navEntry = [...sortedNav]
        .filter((n) => parseISO(n.date) <= d && Number(n.nav) > 0)
        .pop();
      if (!navEntry) return; // skip if no NAV before/on this date
      const units = sipAmount / Number(navEntry.nav);
      if (!isFinite(units)) return;
      totalUnits += units;
      totalInvested += sipAmount;
      labels.push(d.toISOString().split("T")[0]);
      values.push(parseFloat((totalUnits * Number(navEntry.nav)).toFixed(2)));
    });

    const latestNavEntry = [...sortedNav].filter((n) => Number(n.nav) > 0).pop();
    if (!latestNavEntry || totalInvested <= 0) {
      setSipResult({ needsReview: true, reason: "Insufficient data for calculation" });
      return;
    }

    const finalCurrentValue = totalUnits * Number(latestNavEntry.nav);
    const absoluteReturn = ((finalCurrentValue - totalInvested) / totalInvested) * 100;
    const years = Math.max(differenceInYears(to, from), 0.0001);
    const annualizedReturn = (Math.pow(finalCurrentValue / totalInvested, 1 / years) - 1) * 100;

    setSipResult({
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(finalCurrentValue.toFixed(2)),
      absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      chart: { labels, values },
    });
  };

  if (!metadata) return <BrandedLoader label="Loading scheme details..." />;

  // NAV last 1 year based on latest available NAV date (deterministic for SSR/CSR)
  const latestDate = navHistory.length ? parseISO(navHistory[navHistory.length - 1].date) : null;
  const oneYearAgo = latestDate ? subYears(latestDate, 1) : null;
  const points = oneYearAgo ? navHistory.filter((n) => parseISO(n.date) >= oneYearAgo) : [];
  const x = points.map((p) => p.date);
  const y = points.map((p) => Number(p.nav));

  return (
    <Container sx={{ mt: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={1.2}>
            <Typography variant="h5" fontWeight={800}>{metadata.schemeName}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip size="small" label={metadata.fundHouse} color="primary" variant="outlined" />
              <Chip size="small" label={metadata.schemeCategory} variant="outlined" />
              <Chip size="small" label={metadata.schemeType} variant="outlined" />
              {metadata.isinGrowth && <Chip size="small" label={`ISIN G: ${metadata.isinGrowth}`} variant="outlined" />}
              {metadata.isinDividend && <Chip size="small" label={`ISIN D: ${metadata.isinDividend}`} variant="outlined" />}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Paper sx={{ mb: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Returns" />
          <Tab label="SIP Calculator" />
          <Tab label="Lumpsum" />
          <Tab label="SWP" />
          <Tab label="Strategies Compare" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">NAV (Last 1 Year)</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip size="small" label={showMA ? "MA: ON" : "MA: OFF"} onClick={() => setShowMA((v) => !v)} variant="outlined" />
                    <TextField size="small" label="MA Window" type="number" value={maWindow} onChange={(e)=> setMaWindow(Math.max(2, Number(e.target.value)||10))} sx={{ width: 120 }} />
                  </Stack>
                </Stack>
                <NoSsr>
                  <LineChart
                    xAxis={[{ scaleType: "point", data: x }]}
                    series={[
                      { data: y, label: "NAV", area: true },
                      ...(showMA ? [{ data: movingAverage(y, maWindow), label: `MA(${maWindow})`, color: theme.palette.secondary?.main || theme.palette.text.secondary }] : []),
                    ]}
                    height={320}
                  />
                </NoSsr>
              </CardContent>
            </Card>
          )}
          {tab === 1 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Pre-computed Returns</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Start NAV</TableCell>
                      <TableCell>End NAV</TableCell>
                      <TableCell>Simple Return (%)</TableCell>
                      <TableCell>Annualized Return (%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {returnsRows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.period}</TableCell>
                        <TableCell>{r.startDate || "-"}</TableCell>
                        <TableCell>{r.endDate || "-"}</TableCell>
                        <TableCell>{r.startNav ?? "-"}</TableCell>
                        <TableCell>{r.endNav ?? "-"}</TableCell>
                        <TableCell>{r.simpleReturn ?? "-"}</TableCell>
                        <TableCell>{r.annualizedReturn ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {tab === 2 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>SIP Calculator</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <TextField label="SIP Amount" type="number" fullWidth value={sipAmount} onChange={(e) => setSipAmount(Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Frequency" select fullWidth value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="Start Date" type="date" fullWidth value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField label="End Date" type="date" fullWidth value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
                <Button variant="contained" onClick={handleCalculateSIP}>Calculate Returns</Button>
                {sipResult && !sipResult.needsReview && (
                  <Card sx={{ mt: 3 }}>
                    <CardContent>
                      <Typography>Total Invested: ₹{sipResult.totalInvested}</Typography>
                      <Typography>Current Value: ₹{sipResult.currentValue}</Typography>
                      <Typography>Absolute Return: {sipResult.absoluteReturn}%</Typography>
                      <Typography>Annualized Return: {sipResult.annualizedReturn}%</Typography>
                      <NoSsr>
                        <LineChart xAxis={[{ scaleType: "point", data: sipResult.chart.labels }]} series={[{ data: sipResult.chart.values, label: "Investment Value" }]} height={300} />
                      </NoSsr>
                    </CardContent>
                  </Card>
                )}
                {sipResult && sipResult.needsReview && (
                  <Typography color="error" sx={{ mt: 2 }}>
                    Calculation needs review: {sipResult.reason || "insufficient data"}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
          {tab === 3 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Lumpsum Calculator</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField label="Lumpsum Amount" type="number" fullWidth value={lumpsumAmount} onChange={(e) => setLumpsumAmount(Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Start Date" type="date" fullWidth value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="End Date" type="date" fullWidth value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
                <NoSsr>
                  <LineChart xAxis={[{ scaleType: "point", data: x }]} series={[{ data: simulateLumpsum(navHistory, lumpsumAmount, startDate, endDate), label: "Lumpsum Value", area: true }]} height={300} />
                </NoSsr>
              </CardContent>
            </Card>
          )}
          {tab === 4 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>SWP Calculator</Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
                    <TextField label="Withdrawal Amount" type="number" fullWidth value={swpAmount} onChange={(e) => setSwpAmount(Number(e.target.value))} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Frequency" select fullWidth value={swpFrequency} onChange={(e) => setSwpFrequency(e.target.value)}>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="yearly">Yearly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Start Date" type="date" fullWidth value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
                <NoSsr>
                  <LineChart xAxis={[{ scaleType: "point", data: x }]} series={[{ data: simulateSWP(navHistory, swpAmount, swpFrequency, startDate), label: "Portfolio Value", area: true }]} height={300} />
                </NoSsr>
              </CardContent>
            </Card>
          )}
          {tab === 5 && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>Strategies Compare</Typography>
                <NoSsr>
                  <LineChart
                    xAxis={[{ scaleType: "point", data: x }]}
                    series={[
                      { data: simulateSIPSeries(navHistory, sipAmount, frequency, startDate, endDate), label: "SIP" },
                      { data: simulateLumpsum(navHistory, lumpsumAmount, startDate, endDate), label: "Lumpsum" },
                      { data: simulateSWP(navHistory, swpAmount, swpFrequency, startDate), label: "SWP" },
                    ]}
                    height={320}
                  />
                </NoSsr>
              </CardContent>
            </Card>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

// Utilities
function movingAverage(values, windowSize) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const slice = values.slice(start, i + 1).filter((v) => typeof v === "number" && isFinite(v));
    if (slice.length === 0) out.push(null);
    else out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

function simulateLumpsum(navHistory, amount, startDateStr, endDateStr) {
  if (!Array.isArray(navHistory) || navHistory.length === 0) return [];
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  const sorted = [...navHistory].filter((n) => n && n.nav != null).sort((a, b) => parseISO(a.date) - parseISO(b.date));
  const firstEntry = sorted.find((n) => parseISO(n.date) >= start) || sorted[0];
  if (!firstEntry) return [];
  const units = amount / Number(firstEntry.nav);
  const series = sorted.filter((n) => parseISO(n.date) >= start && parseISO(n.date) <= end).map((n) => parseFloat((units * Number(n.nav)).toFixed(2)));
  return series;
}

function simulateSWP(navHistory, withdrawal, frequency, startDateStr) {
  if (!Array.isArray(navHistory) || navHistory.length === 0) return [];
  const start = parseISO(startDateStr);
  const sorted = [...navHistory].filter((n) => n && n.nav != null).sort((a, b) => parseISO(a.date) - parseISO(b.date));
  const startIndex = sorted.findIndex((n) => parseISO(n.date) >= start);
  if (startIndex < 0) return [];
  let units = 0;
  // Start with investing equal to 12x withdrawal as a baseline corpus
  const initialAmount = withdrawal * 12;
  if (sorted[startIndex]) units = initialAmount / Number(sorted[startIndex].nav);
  const series = [];
  let counter = 0;
  const step = (freq) => (freq === "weekly" ? 7 : freq === "monthly" ? 30 : 365);
  for (let i = startIndex; i < sorted.length; i++) {
    const nav = Number(sorted[i].nav);
    let value = units * nav;
    if (counter % step(frequency) === 0 && i !== startIndex) {
      const withdrawUnits = withdrawal / nav;
      units = Math.max(0, units - withdrawUnits);
      value = units * nav;
    }
    series.push(parseFloat(value.toFixed(2)));
    counter += 1;
  }
  return series;
}

function simulateSIPSeries(navHistory, sipAmount, frequency, startDateStr, endDateStr) {
  if (!Array.isArray(navHistory) || navHistory.length === 0) return [];
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  const sortedNav = [...navHistory]
    .filter((n) => n && n.nav != null)
    .sort((a, b) => parseISO(a.date) - parseISO(b.date));
  const values = [];
  let totalUnits = 0;
  for (let i = 0; i < sortedNav.length; i++) {
    const d = parseISO(sortedNav[i].date);
    if (d < start || d > end) continue;
    const nav = Number(sortedNav[i].nav);
    // invest on period boundaries roughly by day step counts
    const dayIndex = i;
    const shouldInvest = frequency === "weekly" ? dayIndex % 7 === 0 : frequency === "yearly" ? dayIndex % 365 === 0 : dayIndex % 30 === 0;
    if (shouldInvest) totalUnits += sipAmount / nav;
    values.push(parseFloat((totalUnits * nav).toFixed(2)));
  }
  return values;
}
