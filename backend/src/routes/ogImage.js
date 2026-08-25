export async function generateOGImage(request, env) {
  const url = new URL(request.url);
  const videoId = url.searchParams.get("id");
  const title = url.searchParams.get("title") || "CloudTok Video";
  const username = url.searchParams.get("user") || "";
  const views = url.searchParams.get("views") || "0";
  const likes = url.searchParams.get("likes") || "0";

  const safeTitle = title.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const safeUser = username.replace(/&/g,"&amp;").replace(/</g,"&lt;");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a0a1a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ff2d55"/>
      <stop offset="100%" stop-color="#ff6b8a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="6" fill="url(#accent)"/>
  <circle cx="100" cy="120" r="50" fill="#ff2d55" opacity="0.15"/>
  <circle cx="1100" cy="500" r="80" fill="#ff2d55" opacity="0.08"/>
  <text x="100" y="200" font-family="Arial,sans-serif" font-size="72" font-weight="800" fill="#ffffff">${safeTitle.length > 40 ? safeTitle.substring(0,40)+"..." : safeTitle}</text>
  <text x="100" y="280" font-family="Arial,sans-serif" font-size="32" fill="#ff2d55">@${safeUser}</text>
  <text x="100" y="360" font-family="Arial,sans-serif" font-size="24" fill="rgba(255,255,255,0.5)">${views} views · ${likes} likes</text>
  <rect x="100" y="440" width="200" height="60" rx="30" fill="url(#accent)"/>
  <text x="200" y="480" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">Watch Now</text>
  <text x="100" y="580" font-family="Arial,sans-serif" font-size="22" fill="rgba(255,255,255,0.3)">CloudTok — Share Videos, Connect with the World</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*"
    }
  });
}