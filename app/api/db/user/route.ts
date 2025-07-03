import { NextResponse } from "next/server";
import { authenticatedApiCall } from "../../../_helpers/api_helper";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");
        const user = await authenticatedApiCall('/User/getUserByEmail', 'GET', { email });
        return NextResponse.json(user);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { username, authToken } = await request.json();
        const result = await authenticatedApiCall('/User/updateUserByUsername', 'PATCH', undefined, { username, authToken });
        return NextResponse.json(result);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}