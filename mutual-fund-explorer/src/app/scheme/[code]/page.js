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
} from "@mui/material";

import { LineChart } from "@mui/x-charts/LineChart";
import { parseISO, addMonths, addWeeks, addYears, differenceInYears, subYears } from "date-fns";

export default function SchemeDetailPage({ params }) {
  const { code } = use(params);
  const [metadata, setMetadata] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [returnsRows, setReturnsRows] = useState([]);
  const [sipAmount, setSipAmount] = useState(5000);
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2023-12-31");
  const [sipResult, setSipResult] = useState(null);

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

  if (!metadata) return <Typography>Loading...</Typography>;

  // NAV last 1 year based on latest available NAV date (deterministic for SSR/CSR)
  const latestDate = navHistory.length ? parseISO(navHistory[navHistory.length - 1].date) : null;
  const oneYearAgo = latestDate ? subYears(latestDate, 1) : null;
  const points = oneYearAgo ? navHistory.filter((n) => parseISO(n.date) >= oneYearAgo) : [];
  const x = points.map((p) => p.date);
  const y = points.map((p) => Number(p.nav));

  return (
    <Container sx={{ mt: 4 }}>
      {/* Metadata */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5">{metadata.schemeName}</Typography>
          <Typography>Fund House: {metadata.fundHouse}</Typography>
          <Typography>Category: {metadata.schemeCategory}</Typography>
          <Typography>Scheme Type: {metadata.schemeType}</Typography>
          <Typography>ISIN Growth: {metadata.isinGrowth || "N/A"}</Typography>
          <Typography>ISIN Dividend: {metadata.isinDividend || "N/A"}</Typography>
        </CardContent>
      </Card>

      {/* NAV Chart (last 1 year) */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            NAV (Last 1 Year)
          </Typography>
          <NoSsr>
            <LineChart xAxis={[{ scaleType: "point", data: x }]} series={[{ data: y, label: "NAV" }]} height={300} />
          </NoSsr>
        </CardContent>
      </Card>

      {/* Pre-computed Returns */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pre-computed Returns
          </Typography>
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

      {/* SIP Calculator */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            SIP Calculator
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="SIP Amount"
                type="number"
                fullWidth
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Frequency" select fullWidth value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <Button variant="contained" onClick={handleCalculateSIP}>
            Calculate Returns
          </Button>

          {sipResult && !sipResult.needsReview && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography>Total Invested: ₹{sipResult.totalInvested}</Typography>
                <Typography>Current Value: ₹{sipResult.currentValue}</Typography>
                <Typography>Absolute Return: {sipResult.absoluteReturn}%</Typography>
                <Typography>Annualized Return: {sipResult.annualizedReturn}%</Typography>
                <NoSsr>
                  <LineChart
                    xAxis={[{ scaleType: "point", data: sipResult.chart.labels }]}
                    series={[{ data: sipResult.chart.values, label: "Investment Value" }]}
                    height={300}
                  />
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
    </Container>
  );
}
