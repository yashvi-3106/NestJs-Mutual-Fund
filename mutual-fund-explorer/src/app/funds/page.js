"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  Pagination,
} from "@mui/material";

const PAGE_SIZE = 30;

export default function FundsPage() {
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

  if (loading) return <CircularProgress />;

  return (
    <div style={{ padding: 20 }}>
      <TextField
        label="Search Schemes"
        variant="outlined"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <Grid container spacing={2}>
        {filteredSchemes.map((scheme) => {
          const meta = metadataMap[scheme.schemeCode];
          return (
            <Grid item xs={12} sm={6} md={4} key={scheme.schemeCode}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{scheme.schemeName}</Typography>
                  <Typography variant="body2">
                    Fund House: {meta?.fundHouse || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Type: {meta?.schemeType || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Category: {meta?.schemeCategory || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Code: {scheme.schemeCode}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
        <Pagination
          count={Math.ceil(
            schemes.filter((scheme) =>
              scheme.schemeName.toLowerCase().includes(search.toLowerCase())
            ).length / PAGE_SIZE
          )}
          page={page}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
}
