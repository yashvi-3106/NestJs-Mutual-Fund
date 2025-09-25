"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Container, Grid, Card, CardContent, Typography, Autocomplete, TextField, Chip, Stack, Table, TableHead, TableRow, TableCell, TableBody, NoSsr } from "@mui/material";
import { LineChart, ScatterChart } from "@mui/x-charts";
import { parseISO, subYears } from "date-fns";

export default function ComparePage() {
  const [allSchemes, setAllSchemes] = useState([]);
  const [selected, setSelected] = useState([]);
  const [metaMap, setMetaMap] = useState({});
  const [navMap, setNavMap] = useState({});

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/mf");
      const d = await r.json();
      setAllSchemes(d);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const codes = selected.map((s) => s.schemeCode);
      const promises = codes.map(async (code) => {
        if (metaMap[code] && navMap[code]) return;
        const r = await fetch(`/api/scheme/${code}`);
        const d = await r.json();
        return [code, d.metadata, d.navHistory];
      });
      const results = await Promise.all(promises);
      const nextMeta = { ...metaMap };
      const nextNav = { ...navMap };
      results?.forEach((triple) => {
        if (!triple) return;
        const [code, meta, nav] = triple;
        nextMeta[code] = meta;
        nextNav[code] = nav || [];
      });
      setMetaMap(nextMeta);
      setNavMap(nextNav);
    })();
  }, [selected]);

  const lastYearDates = useMemo(() => {
    if (!selected.length) return [];
    const any = navMap[selected[0]?.schemeCode] || [];
    const latest = any.length ? parseISO(any[any.length - 1].date) : null;
    if (!latest) return [];
    const from = subYears(latest, 1);
    return (any || []).filter((n) => parseISO(n.date) >= from).map((n) => n.date);
  }, [selected, navMap]);

  const series = useMemo(() => {
    return selected.map((s) => {
      const nav = (navMap[s.schemeCode] || []).filter((n) => lastYearDates.includes(n.date));
      return { id: s.schemeCode, data: nav.map((n) => Number(n.nav)), label: s.schemeName };
    });
  }, [selected, navMap, lastYearDates]);

  const returnsRows = useMemo(() => {
    return selected.map((s) => {
      const m = metaMap[s.schemeCode];
      return {
        code: s.schemeCode,
        name: s.schemeName,
        fundHouse: m?.fundHouse,
        type: m?.schemeType,
        category: m?.schemeCategory,
      };
    });
  }, [selected, metaMap]);

  const riskReturn = useMemo(() => {
    return selected.map((s) => {
      const nav = (navMap[s.schemeCode] || []).slice(-260).map((n) => Number(n.nav));
      const rets = [];
      for (let i = 1; i < nav.length; i++) {
        const r = (nav[i] - nav[i - 1]) / (nav[i - 1] || 1);
        if (isFinite(r)) rets.push(r);
      }
      const avg = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
      const vol = Math.sqrt(rets.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (rets.length || 1));
      return { x: vol * 100, y: avg * 100, id: s.schemeCode, label: s.schemeName };
    });
  }, [selected, navMap]);

  return (
    <Container sx={{ mt: 4 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Fund Comparison</Typography>
          <Autocomplete
            multiple
            options={allSchemes}
            value={selected}
            onChange={(_, val) => setSelected(val)}
            getOptionLabel={(o) => o.schemeName}
            isOptionEqualToValue={(o, v) => o.schemeCode === v.schemeCode}
            filterSelectedOptions
            renderOption={(props, option) => (
              <li {...props} key={option.schemeCode}>
                {option.schemeName}
              </li>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return <Chip key={option.schemeCode} {...chipProps} label={option.schemeName} />;
              })
            }
            renderInput={(params) => <TextField {...params} label="Select schemes" placeholder="Type to search..." />}
          />
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>NAV Trends (Last Year)</Typography>
              <NoSsr>
                <LineChart xAxis={[{ scaleType: "point", data: lastYearDates }]} series={series} height={320} />
              </NoSsr>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk vs Return</Typography>
              <NoSsr>
                <ScatterChart
                  xAxis={[{ label: "Volatility (%)" }]}
                  yAxis={[{ label: "Avg Return (%)" }]}
                  series={[{ data: riskReturn.map((p) => ({ x: p.x, y: p.y, id: p.id })) }]}
                  height={320}
                />
              </NoSsr>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Metadata Snapshot</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scheme</TableCell>
                <TableCell>Fund House</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnsRows.map((r) => (
                <TableRow key={r.code}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.fundHouse}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Container>
  );
}


