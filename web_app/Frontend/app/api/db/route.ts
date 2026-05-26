import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Route RETRAIN_MODELS to the dedicated /api/retrain endpoint
        if (body.action === 'RETRAIN_MODELS') {
            const res = await fetch("http://127.0.0.1:8000/api/retrain", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
            return NextResponse.json(data, { status: res.status });
        }

        // Forward all other actions to the Python FastAPI /api/db backend
        const res = await fetch("http://127.0.0.1:8000/api/db", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("Failed to proxy database request to backend:", err);
        return NextResponse.json(
            { success: false, error: "Backend database service unavailable" },
            { status: 502 }
        );
    }
}
