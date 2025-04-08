import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "localhost:8000";

export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    console.log("✅ Entrato nella API route");
    console.log("📦 urlParam:", urlParam);

    if (!urlParam) {
        console.log("❌ Nessun parametro URL");
        return new NextResponse("Missing URL parameter", { status: 400 });
    }

    const remoteUrl = `${API_BASE_URL}/commonapp/media/${urlParam}`;
    console.log("🌐 remoteUrl:", remoteUrl);

    try {
        const response = await fetch(remoteUrl);
        console.log("🔁 fetch status:", response.status);

        if (!response.ok) {
            return new NextResponse("Failed to fetch remote image", { status: 500 });
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const buffer = await response.arrayBuffer();

        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (error: any) {
        console.error("❗ Errore fetch:", error);
        return new NextResponse("Error fetching image", { status: 500 });
    }
}
