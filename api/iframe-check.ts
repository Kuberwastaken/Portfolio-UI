// No Next.js types needed – omit unused import to keep file framework‑agnostic.

export const config = {
  runtime: "edge",
};

/**
 * List of domains that should be automatically proxied.
 * Domains should be lowercase and without protocol.
 */
const AUTO_PROXY_DOMAINS = [
  "wikipedia.org",
  "wikimedia.org",
  "wikipedia.com",
  // Add more domains as needed
];

/**
 * Check if a URL's domain matches or is a subdomain of any auto-proxy domain
 */
const shouldAutoProxy = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return AUTO_PROXY_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    // Return false if URL parsing fails
    return false;
  }
};

// Define common browser headers to mimic a real user agent
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', // Use a recent common User-Agent
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/**
 * Edge function that checks if a remote website allows itself to be embedded in an iframe.
 * We look at two common headers:
 *   1. `X-Frame-Options` – if present with values like `deny` or `sameorigin` we treat it as blocked.
 *   2. `Content-Security-Policy` – if it contains a `frame-ancestors` directive that does **not**
 *      include `*` or our own origin, we treat it as blocked.
 *
 * The function returns a small JSON object:
 *   {
 *     allowed: boolean,
 *     reason?: string
 *     title?: string
 *   }
 *
 * On network or other unexpected errors we default to `allowed: true` so that navigation is not
 * blocked accidentally (the front‑end still has its own error handling for actual iframe errors).
 */

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const urlParam = searchParams.get("url");
  let mode = searchParams.get("mode") || "proxy"; // "check" | "proxy" (default)
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!urlParam) {
    return new Response(
      JSON.stringify({ error: "Missing 'url' query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Ensure the URL starts with a protocol for fetch()
  const normalizedUrl = urlParam.startsWith("http")
    ? urlParam
    : `https://${urlParam}`;
    
  // Check if this is an auto-proxy domain
  const isAutoProxyDomain = shouldAutoProxy(normalizedUrl);
  
  // For auto-proxy domains in check mode, return JSON indicating embedding is not allowed
  if (isAutoProxyDomain && mode === "check") {
    return new Response(
      JSON.stringify({ 
        allowed: false, 
        reason: "Auto-proxied domain" 
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  // Force proxy mode for auto-proxy domains
  if (isAutoProxyDomain) {
    mode = "proxy";
  }

  // Build wayback URL directly if year and month are provided
  let targetUrl = normalizedUrl;
  if (year && month) {
    targetUrl = `https://web.archive.org/web/${year}${month}01/${normalizedUrl}`;
    console.log(`[iframe-check] Using Wayback Machine URL: ${targetUrl}`);
    
    // Force proxy mode for wayback content
    mode = "proxy";
  }

  // -------------------------------
  // Helper: perform header‑only check
  // -------------------------------
  const checkSiteEmbeddingAllowed = async () => {
    try {
      const res = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        headers: BROWSER_HEADERS, // Add browser headers
      });

      if (!res.ok) {
          throw new Error(`Upstream fetch failed with status ${res.status}`);
      }

      const xFrameOptions = res.headers.get("x-frame-options") || "";
      const headerCsp = res.headers.get("content-security-policy") || "";
      const contentType = res.headers.get("content-type") || "";

      // Check meta tags and extract title only for HTML content
      let metaCsp = "";
      let pageTitle: string | undefined = undefined; // Initialize title

      if (contentType.includes("text/html")) {
          const html = await res.text();
          // Extract meta CSP
          const metaTagMatch = html.match(
              /<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=["']([^"']*)["'][^>]*>/i
          );
          if (metaTagMatch && metaTagMatch[1]) {
              metaCsp = metaTagMatch[1];
          }
          // Extract title (case-insensitive)
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            // Basic sanitization: decode HTML entities and trim whitespace
            try {
              // Use a simple approach for common entities; full decoding might need a library
              pageTitle = titleMatch[1]
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();
            } catch (e) {
              console.error("Error decoding title:", e);
              pageTitle = titleMatch[1].trim(); // Fallback to raw title
            }
          }
      }

      // Helper to check frame-ancestors directive
      const checkFrameAncestors = (cspString: string): boolean => {
          if (!cspString) return false; // No policy = no restriction
          const directiveMatch = cspString
              .toLowerCase()
              .split(";")
              .map((d) => d.trim())
              .find((d) => d.startsWith("frame-ancestors"));
          if (!directiveMatch) return false; // No frame-ancestors = no restriction from this policy

          const directiveValue = directiveMatch.replace("frame-ancestors", "").trim();
          // If the value is exactly 'none', it's definitely blocked.
          if (directiveValue === "'none'") return true; // Blocked

          // Simplified: if it doesn't contain '*', assume it blocks cross-origin.
          return !directiveValue.includes("*");
      };

      const isBlockedByCsp = (() => {
        // Blocked if *either* header OR meta tag CSP restricts frame-ancestors
        return checkFrameAncestors(headerCsp) || checkFrameAncestors(metaCsp);
      })();

      const isBlockedByXfo = (() => {
        if (!xFrameOptions) return false;
        const value = xFrameOptions.toLowerCase();
        return value.includes("deny") || value.includes("sameorigin");
      })();

      const allowed = !(isBlockedByXfo || isBlockedByCsp);
      // Add meta CSP to reason if relevant
      const finalReason = !allowed
        ? isBlockedByXfo
            ? `X-Frame-Options: ${xFrameOptions}`
            : metaCsp && checkFrameAncestors(metaCsp)
                ? `Content-Security-Policy (meta): ${metaCsp}`
                : `Content-Security-Policy (header): ${headerCsp}`
        : undefined;

      return { allowed, reason: finalReason, title: pageTitle };

    } catch (error) {
        // If fetching upstream headers failed, assume embedding is blocked
        console.error(`[iframe-check] Failed to fetch upstream headers for ${targetUrl}:`, error);
        // No title available on error
        return { allowed: false, reason: `Proxy check failed: ${(error as Error).message}` };
    }
  };

  try {
    // 1. Pure header‑check mode
    if (mode === "check") {
      const result = await checkSiteEmbeddingAllowed();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Proxy mode – stream the upstream resource, removing blocking headers
    // Create an AbortController with timeout for the upstream fetch
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15-second timeout
    
    try {
      const upstreamRes = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: BROWSER_HEADERS, // Add browser headers
      });
      
      clearTimeout(timeout); // Clear timeout on successful fetch
      
      // If the upstream fetch failed (e.g., 403 Forbidden, 404 Not Found), return an error response
      if (!upstreamRes.ok) {
          return new Response(
            JSON.stringify({
              error: true,
              status: upstreamRes.status,
              statusText: upstreamRes.statusText || "File not found",
              type: "http_error",
              message: `The page cannot be found. HTTP ${upstreamRes.status} - ${upstreamRes.statusText || "File not found"}`
            }),
            {
              status: upstreamRes.status,
              headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
              }
            }
          );
      }

      // Clone headers so we can edit them
      const headers = new Headers(upstreamRes.headers);
      const contentType = headers.get("content-type") || "";
      let pageTitle: string | undefined = undefined; // Initialize title for proxy mode

      headers.delete("x-frame-options");
      headers.delete("content-security-policy");
      headers.set(
        "content-security-policy",
        "frame-ancestors *; sandbox allow-scripts allow-forms allow-same-origin allow-popups"
      );
      headers.set("access-control-allow-origin", "*");

      // If it's HTML, inject the <base> tag and click interceptor script
      if (contentType.includes("text/html")) {
          let html = await upstreamRes.text();

          // Extract title before modifying HTML
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
              try {
                pageTitle = titleMatch[1]
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&amp;/g, '&')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .trim();
              } catch (e) {
                console.error("Error decoding title in proxy:", e);
                pageTitle = titleMatch[1].trim(); // Fallback
              }
          }

          // Inject <base> tag right after <head> (case‑insensitive)
          const baseTag = `<base href="${targetUrl}">`;
          // Inject title meta tag if title was extracted
          const titleMetaTag = pageTitle ? `<meta name="page-title" content="${encodeURIComponent(pageTitle)}">` : '';

          // Add font override styles
          const fontOverrideStyles = `
<link rel="stylesheet" href="https://os.ryo.lu/fonts/fonts.css">
<style>img{image-rendering:pixelated!important}body,div,span,p,h1,h2,h3,h4,h5,h6,button,input,select,textarea,[style*="font-family"],[style*="sans-serif"],[style*="SF Pro Text"],[style*="-apple-system"],[style*="BlinkMacSystemFont"],[style*="Segoe UI"],[style*="Roboto"],[style*="Oxygen"],[style*="Ubuntu"],[style*="Cantarell"],[style*="Fira Sans"],[style*="Droid Sans"],[style*="Helvetica Neue"],[style*="Helvetica"],[style*="Arial"],[style*="Verdana"],[style*="Geneva"],[style*="Inter"],[style*="Hiragino Sans"],[style*="Hiragino Kaku Gothic"],[style*="Yu Gothic"],[style*="Meiryo"],[style*="MS PGothic"],[style*="MS Gothic"],[style*="Microsoft YaHei"],[style*="PingFang"],[style*="Noto Sans"],[style*="Source Han Sans"],[style*="WenQuanYi"]{font-family:"Geneva-12","ArkPixel","SerenityOS-Emoji",sans-serif!important}[style*="serif"],[style*="Georgia"],[style*="Times New Roman"],[style*="Times"],[style*="Palatino"],[style*="Bookman"],[style*="Garamond"],[style*="Cambria"],[style*="Constantia"],[style*="Hiragino Mincho"],[style*="Yu Mincho"],[style*="MS Mincho"],[style*="SimSun"],[style*="NSimSun"],[style*="Source Han Serif"],[style*="Noto Serif CJK"]{font-family:"Mondwest","Yu Mincho","Hiragino Mincho Pro","Songii TC","Georgia","Palatino","SerenityOS-Emoji",serif!important}code,pre,[style*="monospace"],[style*="Courier New"],[style*="Courier"],[style*="Lucida Console"],[style*="Monaco"],[style*="Consolas"],[style*="Inconsolata"],[style*="Source Code Pro"],[style*="Menlo"],[style*="Andale Mono"],[style*="Ubuntu Mono"]{font-family:"Monaco","ArkPixel","SerenityOS-Emoji",monospace!important}*{font-family:"Geneva-12","ArkPixel","SerenityOS-Emoji",sans-serif}</style>`;

          const clickInterceptorScript = `
<script>
  document.addEventListener('click', function(event) {
    var targetElement = event.target.closest('a');
    if (targetElement && targetElement.href) {
      event.preventDefault();
      event.stopPropagation();
      try {
        const absoluteUrl = new URL(targetElement.getAttribute('href'), document.baseURI || window.location.href).href;
        window.parent.postMessage({ type: 'iframeNavigation', url: absoluteUrl }, '*');
      } catch (e) { console.error("Error resolving/posting URL:", e); }
    }
  }, true);
</script>
`;
          const headIndex = html.search(/<head[^>]*>/i);
          if (headIndex !== -1) {
              const insertPos = headIndex + html.match(/<head[^>]*>/i)![0].length;
              html = html.slice(0, insertPos) + baseTag + titleMetaTag + fontOverrideStyles + html.slice(insertPos); // Add fontOverrideStyles
          } else {
              // Fallback: Prepend if no <head>
              html = baseTag + titleMetaTag + fontOverrideStyles + html;
          }

          // Inject script right before </body> (case‑insensitive)
          const bodyEndIndex = html.search(/<\/body>/i);
          if (bodyEndIndex !== -1) {
            html = html.slice(0, bodyEndIndex) + clickInterceptorScript + html.slice(bodyEndIndex);
          } else {
            // Fallback: Append script if no </body>
            html += clickInterceptorScript;
          }

          // Add the extracted title to a custom header (URL-encoded)
          if (pageTitle) {
            headers.set("X-Proxied-Page-Title", encodeURIComponent(pageTitle));
          }

          return new Response(html, {
              status: upstreamRes.status,
              headers,
          });
      } else {
          // For non‑HTML content, stream the body directly
          // No title extraction or header needed for non-HTML
          return new Response(upstreamRes.body, {
              status: upstreamRes.status,
              headers,
          });
      }
    } catch (fetchError) {
      clearTimeout(timeout);
      
      // Special handling for timeout or network errors
      console.error(`[iframe-check] Fetch error for ${targetUrl}:`, fetchError);
      
      // Return JSON with error information instead of HTML
      return new Response(
        JSON.stringify({
          error: true,
          type: "connection_error",
          status: 503,
          message: "The page cannot be displayed. Internet Explorer cannot access this website.",
          // Include the target URL in the details for better debugging
          details: `Failed to fetch the requested URL. Reason: ${fetchError instanceof Error ? fetchError.message : 'Connection failed or timed out'}`
        }),
        { 
          status: 503, 
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 