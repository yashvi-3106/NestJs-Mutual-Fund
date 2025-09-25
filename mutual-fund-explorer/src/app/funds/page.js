"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Pagination,
  Stack,
  InputAdornment,
  Chip,
  Box,
  Button,
  CardActionArea,
  Menu,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useTheme } from "@mui/material/styles";
import BrandedLoader from "@/components/BrandedLoader";
import { ThemeControllerContext } from "@/components/ThemeProviderClient";

const PAGE_SIZE = 30;

export default function FundsPage() {
  const theme = useTheme();
  const { primaryColor, setPrimaryColor } = React.useContext(ThemeControllerContext);
  const [colorAnchor, setColorAnchor] = useState(null);
  const colorOpen = Boolean(colorAnchor);
  const handleOpenColor = (e) => setColorAnchor(e.currentTarget);
  const handleCloseColor = () => setColorAnchor(null);
  const [schemes, setSchemes] = useState([]);
  const [metadataMap, setMetadataMap] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch the list of schemes
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch("/api/mf");
        const data = await res.json();
        setSchemes(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchemes();
  }, []);

  // Fetch metadata for schemes on the current page
  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const currentSchemes = schemes.slice(start, end);

      const promises = currentSchemes.map(async (scheme) => {
        if (!metadataMap[scheme.schemeCode]) {
          try {
            const res = await fetch(`/api/scheme/${scheme.schemeCode}`);
            const data = await res.json();
            return [scheme.schemeCode, data.metadata];
          } catch (err) {
            return [scheme.schemeCode, null];
          }
        } else {
          return [scheme.schemeCode, metadataMap[scheme.schemeCode]];
        }
      });

      const results = await Promise.all(promises);
      const newMap = { ...metadataMap };
      results.forEach(([code, meta]) => {
        newMap[code] = meta;
      });
      setMetadataMap(newMap);
      setLoading(false);
    };

    if (schemes.length > 0) fetchMetadata();
  }, [schemes, page]);

  // Filter schemes by search
  const filteredSchemes = schemes
    .filter((scheme) =>
      scheme.schemeName.toLowerCase().includes(search.toLowerCase())
    )
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) return <BrandedLoader label="Fetching funds and metadata..." />;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={800}>Explore Funds</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Search schemes"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            )}}
            sx={{ minWidth: { xs: "100%", md: 360 } }}
          />
          <Button variant="outlined" onClick={handleOpenColor} startIcon={<AutoAwesomeRoundedIcon />} sx={{
            minWidth: 220,
            justifyContent: "flex-start",
          }}>
            Theme color
            <Box sx={{ ml: 1, width: 18, height: 18, borderRadius: "50%", bgcolor: primaryColor, border: "1px solid", borderColor: theme.palette.divider }} />
          </Button>
          <Menu anchorEl={colorAnchor} open={colorOpen} onClose={handleCloseColor} keepMounted>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Pick any color</Typography>
              <Box sx={{ mt: 1 }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => { setPrimaryColor(e.target.value); }}
                  style={{ width: 180, height: 36, border: "none", background: "transparent", cursor: "pointer" }}
                />
              </Box>
            </Box>
          </Menu>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        {filteredSchemes.map((scheme) => {
          const meta = metadataMap[scheme.schemeCode];
          return (
            <Grid item xs={12} sm={6} md={4} key={scheme.schemeCode}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
                  borderTop: `3px solid ${theme.palette.primary.main}`,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                <CardActionArea component={Link} href={`/scheme/${scheme.schemeCode}`} sx={{ height: "100%", alignItems: "stretch", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ width: "100%" }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <AutoAwesomeRoundedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {scheme.schemeName}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Chip size="small" label={`#${scheme.schemeCode}`} variant="outlined" />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={meta?.fundHouse || "Unknown house"} color="primary" variant="outlined" />
                        <Chip size="small" label={meta?.schemeType || "N/A"} variant="outlined" />
                        <Chip size="small" label={meta?.schemeCategory || "N/A"} variant="outlined" />
                      </Stack>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Pagination
          color="primary"
          count={Math.ceil(
            schemes.filter((scheme) =>
              scheme.schemeName.toLowerCase().includes(search.toLowerCase())
            ).length / PAGE_SIZE
          )}
          page={page}
          onChange={handlePageChange}
        />
      </Box>
    </Box>
  );
}
