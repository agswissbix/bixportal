import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function GET(req: NextRequest) {
    const urlParam = req.nextUrl.searchParams.get("url");
    console.log("✅ Entrato nella API route");
    console.log("📦 urlParam:", urlParam);

    if (!urlParam) {
        console.log("❌ Nessun parametro URL");
        return new NextResponse("Missing URL parameter", { status: 400 });
    }
    
    // 1. Estrai il cookie del tenant in ingresso (se presente)
    const tenantCookie = req.cookies.get("current_tenant");
    const tenantId = tenantCookie?.value;
    console.log("🍪 Tenant ID dal cookie:", tenantId || "Nessun cookie trovato");

    let remoteUrl = `${API_BASE_URL}/commonapp/uploads/${urlParam}`;
    
    if (urlParam.startsWith("commonapp/static")) {
        remoteUrl = `${API_BASE_URL}/commonapp/tempfile/${urlParam}`;
    } 
    
    console.log("🌐 remoteUrl:", remoteUrl);

    const sessionId = req.cookies.get("sessionid")?.value;

    try {

        const cookieHeader = req.headers.get('cookie') || '';
        // 2. Prepara gli headers per Django
        const headersForDjango: HeadersInit = {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Cookie": cookieHeader
        };

        // 3. Se hai trovato il tenant, aggiungilo come header custom
        if (tenantId) {
            headersForDjango["X-Tenant-ID"] = tenantId;
        }

        // 4. Fai la chiamata passando gli headers
        const response = await fetch(remoteUrl, {
            method: "GET",
            headers: headersForDjango,
        });

        console.log("🔁 fetch status:", response.status);

        if (!response.ok) {
            return new NextResponse(`Failed to fetch remote image (Status: ${response.status})`, { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "application/octet-stream";
        const buffer = await response.arrayBuffer();

        // Header per evitare cache lato browser/client/proxy
        return new NextResponse(Buffer.from(buffer), {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Surrogate-Control": "no-store",
            },
        });
    } catch (error: any) {
        console.error("❗ Errore fetch:", error);
        return new NextResponse("Error fetching image", { status: 500 });
    }
}