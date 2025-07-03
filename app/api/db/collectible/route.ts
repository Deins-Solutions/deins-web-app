import { NextResponse } from "next/server";
import { authenticatedApiCall } from "../../../_helpers/api_helper";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const collectibleId = searchParams.get("collectibleId");
        const collectible = await authenticatedApiCall('/Collectible/getCollectibleByCollectibleId', 'GET', { collectibleId });
        return NextResponse.json(collectible);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to fetch collectible" }, { status: 500 });
    }
}