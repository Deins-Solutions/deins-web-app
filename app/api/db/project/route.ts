import { NextResponse } from "next/server";
import axios from 'axios';

export async function GET() {
    try {
        const projectResponse = await axios.get(`${process.env.API_BASE_URL}/Project/getProjectByProjectId?projectId=1`);
        return NextResponse.json(projectResponse.data);
    } catch (e) {
        console.log(`error: ${e}`);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}