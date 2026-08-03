import { authenticate } from "../middleware/auth.js";

export async function initializePayment(request, env) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { email, amount, description } = body;

    if (!email || !amount) {
        return Response.json({ error: "Email and amount required" }, { status: 400 });
    }

    const secretKey = env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
        return Response.json({ error: "Paystack not configured" }, { status: 500 });
    }

    try {
        const response = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secretKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100),
                description: description || "CloudTok Wallet Funding",
                metadata: {
                    user_id: auth.user.id,
                    username: auth.user.username
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

        const amountInNaira = result.data.amount / 100;

        await env.DB.prepare(
            "INSERT INTO transactions (user_id, reference, amount, status, created_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(
            auth.user.id,
            reference,
            amountInNaira,
            "success",
            new Date().toISOString()
        ).run();

        return Response.json({
            success: true,
            amount: amountInNaira,
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
