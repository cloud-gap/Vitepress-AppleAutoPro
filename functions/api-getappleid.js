export async function onRequest(context) {
  const { request, env } = context;

  // ====== 配置项（都可在 Cloudflare Pages 里设置环境变量覆盖） ======
  const apiUrl = env.API_URL; // 你已有
  const accessKey = env.ACCESS_KEY || ""; // 新增：访问口令（强烈建议设置）
  const windowSeconds = Number(env.RATE_WINDOW_SECONDS || 60); // 限流窗口，默认 60 秒
  const maxPerWindow = Number(env.RATE_MAX_PER_WINDOW || 30);  // 每窗口最多请求数，默认 30 次/分钟
  const allowOrigin = env.ALLOWED_ORIGIN || new URL(request.url).origin; // 只允许你站点来源

  // ====== 处理 CORS 预检 ======
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request, allowOrigin),
    });
  }

  // ====== 简单来源限制（拦掉大多数跨站扫描） ======
  const origin = request.headers.get("Origin") || "";
  const referer = request.headers.get("Referer") || "";
  const fromSite =
    (origin && origin === allowOrigin) ||
    (referer && referer.startsWith(allowOrigin));

  // ====== 口令校验（支持 header 或 query） ======
  const url = new URL(request.url);
  const keyFromHeader = request.headers.get("x-access-key") || "";
  const keyFromQuery = url.searchParams.get("key") || "";
  const authed = !!accessKey && (keyFromHeader === accessKey || keyFromQuery === accessKey);

  // 没有通过口令、又不是来自本站页面：直接拒绝
  // （避免别人从别处/脚本直接扫）
  if (!authed && !fromSite) {
    return new Response(JSON.stringify({ ok: false, msg: "Forbidden" }), {
      status: 403,
      headers: {
        ...corsHeaders(request, allowOrigin),
        "Content-Type": "application/json",
      },
    });
  }

  // ====== IP 限流（用 Cache 做计数，轻量可用） ======
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "unknown";

  const limited = await rateLimit(ip, windowSeconds, maxPerWindow);
  if (limited.blocked) {
    return new Response(
      JSON.stringify({
        ok: false,
        msg: `Rate limit exceeded. Try again later.`,
        retry_after_seconds: limited.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders(request, allowOrigin),
          "Content-Type": "application/json",
          "Retry-After": String(limited.retryAfter),
        },
      }
    );
  }

  // ====== 拉取真实后端数据 ======
  try {
    const resp = await fetch(apiUrl, { cf: { cacheTtl: 0, cacheEverything: false } });
    const data = await resp.json();

    // 未授权：返回“脱敏数据”，不给账号/密码（防被扫到）
    if (!authed) {
      return new Response(JSON.stringify(maskData(data)), {
        status: 200,
        headers: {
          ...corsHeaders(request, allowOrigin),
          "Content-Type": "application/json",
        },
      });
    }

    // 已授权：正常返回全部
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders(request, allowOrigin),
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, msg: "Error fetching data" }), {
      status: 500,
      headers: {
        ...corsHeaders(request, allowOrigin),
        "Content-Type": "application/json",
      },
    });
  }
}

function corsHeaders(request, allowOrigin) {
  // 同源请求一般不需要 CORS，但加上也不坏；跨域则只放行 allowOrigin
  const origin = request.headers.get("Origin") || allowOrigin;
  const setOrigin = origin === allowOrigin ? origin : allowOrigin;

  return {
    "Access-Control-Allow-Origin": setOrigin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Access-Key",
    "Access-Control-Max-Age": "86400",
  };
}

function maskData(data) {
  // 兼容你目前结构：{ msg, accounts: [...] }
  const safe = { ...data };
  if (Array.isArray(safe.accounts)) {
    safe.accounts = safe.accounts.map((a) => ({
      ...a,
      username: "", // 不下发
      password: "", // 不下发
      message: a?.message || "需要口令后才能获取账号密码",
    }));
  }
  safe.msg = safe.msg || "OK";
  safe.need_key = true;
  return safe;
}

async function rateLimit(ip, windowSeconds, maxPerWindow) {
  // 用 cache 存计数（注意：这不是金融级精确，但能挡住大多数刷子）
  const cache = caches.default;
  const keyUrl = `https://rate.limit.local/${encodeURIComponent(ip)}`;
  const keyReq = new Request(keyUrl);

  const now = Math.floor(Date.now() / 1000);

  let count = 0;
  let resetAt = now + windowSeconds;

  const cached = await cache.match(keyReq);
  if (cached) {
    try {
      const j = await cached.json();
      count = Number(j.count || 0);
      resetAt = Number(j.resetAt || resetAt);
    } catch {}
  }

  if (now >= resetAt) {
    count = 0;
    resetAt = now + windowSeconds;
  }

  count += 1;

  const remaining = Math.max(0, maxPerWindow - count);
  const retryAfter = Math.max(1, resetAt - now);

  // 写回 cache
  await cache.put(
    keyReq,
    new Response(JSON.stringify({ count, resetAt }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `max-age=${windowSeconds}`,
      },
    })
  );

  if (count > maxPerWindow) {
    return { blocked: true, retryAfter, remaining: 0 };
  }
  return { blocked: false, retryAfter: 0, remaining };
}
