import { NextResponse } from "next/server";
import { authenticatedApiCall } from "../../../_helpers/api_helper";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ownerId = searchParams.get("userId");
        const collectibles = await authenticatedApiCall('/UserCollectible/getUserCollectiblesByOwnerId', 'GET', { ownerId });
        return NextResponse.json(collectibles);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to fetch user collectibles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, collectibleId, mint } = await request.json();
        const result = await authenticatedApiCall('/UserCollectible/createUserCollectible', 'POST', undefined, {
            ownerId: userId,
            collectibleId,
            mint
        });
        return NextResponse.json(result);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to create user collectible" }, { status: 500 });
    }
}