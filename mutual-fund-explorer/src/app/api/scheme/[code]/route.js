// src/app/api/scheme/[code]/route.js

export const dynamic = "force-dynamic"; // disable static caching

let cache = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request, { params }) {
  const { code } = params;
  const now = Date.now();

  // Check cache
  if (
    cache[code] &&
    cache[code].timestamp &&
    now - cache[code].timestamp < CACHE_DURATION
  ) {
    return new Response(JSON.stringify(cache[code].data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!res.ok) {
      throw new Error("Failed to fetch scheme details");
    }

    const schemeData = await res.json();

    // Extract metadata & NAV history
    const { meta, data } = schemeData;

    const responseData = {
      metadata: {
        schemeName: meta.scheme_name,
        schemeType: meta.scheme_type,
        schemeCategory: meta.scheme_category,
        fundHouse: meta.fund_house,
        isinGrowth: meta.isin_growth,
        isinDividend: meta.isin_div_reinvestment,
      },
      navHistory: data.map((item) => ({
        date: item.date,
        nav: parseFloat(item.nav),
      })),
    };

    // Cache it
    cache[code] = {
      data: responseData,
      timestamp: now,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch scheme details" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
