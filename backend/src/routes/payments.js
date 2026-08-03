import { authenticate } from "../middleware/auth.js";

const EXCHANGE_RATES = {
    USD: 1,
    NGN: 1550,
    GHS: 12.5,
    KES: 155,
    ZAR: 18.5,
    GBP: 0.79,
    EUR: 0.92
};

const PAYSTACK_CURRENCY_MAP = {
    USD: "USD",
    NGN: "NGN",
    GHS: "GHS",
    GBP: "GBP",
    EUR: "EUR",
    KES: "NGN",
    ZAR: "NGN"
};

export async function initializePayment(request, env) {
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
        const paystackCurrency = PAYSTACK_CURRENCY_MAP[currency] || "USD";
        const rate = EXCHANGE_RATES[currency] || 1;
        const amountLocal = amount * rate;

        let paystackAmount;
        if (currency === "GHS") {
            paystackAmount = Math.round(amountLocal * 100);
        } else if (currency === "NGN") {
            paystackAmount = Math.round(amountLocal);
        } else {
            paystackAmount = Math.round(amountLocal * 100);
        }

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
                    amount_usd: amount,
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
            const currency = result.data.currency || "NGN";
            const rawAmount = result.data.amount;

            if (currency === "NGN") {
                amountInUSD = rawAmount / 1550;
            } else if (currency === "GHS") {
                amountInUSD = rawAmount / 100 / 12.5;
            } else if (currency === "GBP") {
                amountInUSD = rawAmount / 100 / 0.79;
            } else if (currency === "EUR") {
                amountInUSD = rawAmount / 100 / 0.92;
            } else {
                amountInUSD = rawAmount / 100;
            }
        }

        amountInUSD = Math.round(amountInUSD * 100) / 100;

        await env.DB.prepare(
            "INSERT INTO transactions (user_id, reference, amount, status, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(
            auth.user.id,
            reference,
            amountInUSD,
            "success",
            new Date().toISOString()
        ).run();

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
