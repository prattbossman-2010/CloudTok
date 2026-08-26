import { authenticate } from "../middleware/auth.js";

async function ensurePaymentTables(env) {
    try { await env.DB.prepare("CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, reference TEXT UNIQUE, amount REAL, currency TEXT, amount_usd REAL, status TEXT, method TEXT, provider_reference TEXT, created_at TEXT DEFAULT (datetime('now')))").run(); } catch(e) {}
    try { await env.DB.prepare("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 0").run(); } catch(e) {}
}

const FALLBACK_RATES = {
    USD: 1,
    NGN: 1550,
    GHS: 12.5,
    KES: 155,
    ZAR: 18.5,
    GBP: 0.79,
    EUR: 0.92
};

let rateCache = { rates: { ...FALLBACK_RATES }, lastFetched: 0 };
const RATE_CACHE_TTL = 60 * 60 * 1000;

async function fetchLiveRates() {
    const now = Date.now();
    if (rateCache.rates && now - rateCache.lastFetched < RATE_CACHE_TTL) {
        return rateCache.rates;
    }
    try {
        const resp = await fetch("https://open.er-api.com/v6/latest/USD");
        const data = await resp.json();
        if (data && data.rates) {
            const fresh = { USD: 1 };
            for (const code of Object.keys(FALLBACK_RATES)) {
                if (code === "USD") continue;
                fresh[code] = data.rates[code] ? (1 / data.rates[code]) : FALLBACK_RATES[code];
            }
            rateCache = { rates: fresh, lastFetched: now };
            return fresh;
        }
    } catch (e) {}
    return rateCache.rates;
}

function toPaystackAmount(currency, localAmount) {
    if (currency === "NGN") return Math.round(localAmount);
    return Math.round(localAmount * 100);
}

export function getPaystackConfig(request, env) {
  const publicKey = env.PAYSTACK_PUBLIC_KEY || "";
  return Response.json({ publicKey });
}

export async function initializePayment(request, env) {
    await ensurePaymentTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { email, amount, currency, description } = body;

    if (!email || !amount) {
        return Response.json({ error: "Email and amount required" }, { status: 400 });
    }

    const secretKey = env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return Response.json({ error: "Paystack not configured" }, { status: 500 });
    }

    try {
        const rates = await fetchLiveRates();
        const paystackCurrency = (currency === "KES" || currency === "ZAR") ? "USD" : (currency || "USD");
        const rate = rates[currency] || 1;
        const amountUSD = amount / rate;
        const paystackAmount = toPaystackAmount(paystackCurrency, paystackCurrency === "USD" ? amountUSD : amount);

        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                amount: paystackAmount,
                currency: paystackCurrency,
                description: description || "CloudTok Wallet Funding",
                metadata: {
                    user_id: auth.user.id,
                    username: auth.user.username,
                    amount_usd: Math.round(amountUSD * 100) / 100,
                    original_currency: currency
                }
            })
        });

        const result = await response.json();

        if (!result.status) {
            return Response.json({ error: result.message || "Payment initialization failed" }, { status: 400 });
        }

        return Response.json({
            success: true,
            authorization_url: result.data.authorization_url,
            access_code: result.data.access_code,
            reference: result.data.reference
        });

    } catch (error) {
        return Response.json({ error: "Payment service unavailable" }, { status: 500 });
    }
}

export async function verifyPayment(request, env) {
    await ensurePaymentTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { reference } = body;

    if (!reference) {
        return Response.json({ error: "Reference required" }, { status: 400 });
    }

    const secretKey = env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return Response.json({ error: "Paystack not configured" }, { status: 500 });
    }

    try {
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`
            }
        });

        const result = await response.json();

        if (!result.status || result.data.status !== "success") {
            return Response.json({ success: false, error: "Payment not successful" });
        }

        let amountInUSD;
        const metadata = result.data.metadata || {};
        const customFields = metadata.custom_fields || [];
        const usdAmountField = customFields.find(f => f.variable_name === "usd_amount");

        if (usdAmountField && parseFloat(usdAmountField.value) > 0) {
            amountInUSD = parseFloat(usdAmountField.value);
        } else {
            const payCurrency = result.data.currency || "USD";
            const rawAmount = result.data.amount;
            const rates = await fetchLiveRates();

            if (payCurrency === "NGN") {
                amountInUSD = rawAmount / rates.NGN;
            } else if (payCurrency === "GHS") {
                amountInUSD = rawAmount / 100 / rates.GHS;
            } else if (payCurrency === "GBP") {
                amountInUSD = rawAmount / 100 / rates.GBP;
            } else if (payCurrency === "EUR") {
                amountInUSD = rawAmount / 100 / rates.EUR;
            } else {
                amountInUSD = rawAmount / 100;
            }
        }

        amountInUSD = Math.round(amountInUSD * 100) / 100;

        const { results: existing } = await env.DB.prepare(
            "SELECT id FROM transactions WHERE reference = ?"
        ).bind(reference).all();

        if(existing && existing.length > 0){
            return Response.json({ success: true, amount: amountInUSD, reference, message: "Already verified" });
        }

        await env.DB.prepare(
            "INSERT INTO transactions (user_id, reference, amount, status, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(
            auth.user.id,
            reference,
            amountInUSD,
            "success",
            new Date().toISOString()
        ).run();

        await env.DB.prepare(
            "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?"
        ).bind(amountInUSD, auth.user.id).run();

        return Response.json({
            success: true,
            amount: amountInUSD,
            reference
        });

    } catch (error) {
        return Response.json({ error: "Verification failed" }, { status: 500 });
    }
}

export async function getTransactions(request, env) {
    await ensurePaymentTables(env);
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    try {
        const { results } = await env.DB.prepare(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
        ).bind(auth.user.id).all();

        return Response.json({ transactions: results });
    } catch (e) {
        return Response.json({ transactions: [] });
    }
}

export async function handlePaystackWebhook(request, env) {
    await ensurePaymentTables(env);

    let body;
    try { body = await request.json(); } catch (e) {
        return new Response("Invalid body", { status: 400 });
    }

    const secretKey = env.PAYSTACK_SECRET_KEY;

    const hash = await (async () => {
        try {
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                "raw", encoder.encode(secretKey),
                { name: "HMAC", hash: "SHA-512" },
                false, ["sign"]
            );
            const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(body)));
            return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
        } catch (e) { return ""; }
    })();

    const signature = request.headers.get("x-paystack-signature");
    if (signature && hash && signature !== hash) {
        return new Response("Invalid signature", { status: 400 });
    }

    if (body.event !== "charge.success") {
        return new Response("OK", { status: 200 });
    }

    const ref = body.data?.reference;
    if (!ref) return new Response("OK", { status: 200 });

    try {
        const { results: existing } = await env.DB.prepare(
            "SELECT id FROM transactions WHERE reference = ?"
        ).bind(ref).all();

        if (existing && existing.length > 0) {
            return new Response("Already processed", { status: 200 });
        }

        const metadata = body.data?.metadata || {};
        const customFields = metadata.custom_fields || [];
        const usdField = customFields.find(f => f.variable_name === "usd_amount");
        const userId = metadata.user_id;

        if (!userId) return new Response("OK", { status: 200 });

        let amountInUSD;
        if (usdField && parseFloat(usdField.value) > 0) {
            amountInUSD = parseFloat(usdField.value);
        } else {
            const payCurrency = body.data?.currency || "USD";
            const rawAmount = body.data?.amount || 0;
            const rates = await fetchLiveRates();
            if (payCurrency === "NGN") amountInUSD = rawAmount / rates.NGN;
            else if (payCurrency === "GHS") amountInUSD = rawAmount / 100 / rates.GHS;
            else if (payCurrency === "GBP") amountInUSD = rawAmount / 100 / rates.GBP;
            else if (payCurrency === "EUR") amountInUSD = rawAmount / 100 / rates.EUR;
            else amountInUSD = rawAmount / 100;
        }

        amountInUSD = Math.round(amountInUSD * 100) / 100;

        await env.DB.prepare(
            "INSERT INTO transactions (user_id, reference, amount, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(userId, ref, amountInUSD, "success", "paystack_webhook", new Date().toISOString()).run();

        await env.DB.prepare(
            "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE id = ?"
        ).bind(amountInUSD, userId).run();

    } catch (e) {}

    return new Response("OK", { status: 200 });
}

export async function getExchangeRates(request, env) {
    const rates = await fetchLiveRates();
    return Response.json({ rates, source: rateCache.lastFetched > 0 ? "live" : "fallback" });
}
