import axios, { AxiosRequestConfig, Method } from 'axios';
import { getServerSession } from "next-auth/next";
import { Session as NextAuthSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface ExtendedSession extends NextAuthSession {
    idToken?: string;
}

const API_BASE_URL = process.env.API_BASE_URL;
export async function authenticatedApiCall(
    endpoint: string,
    method: Method,
    params?: Record<string, unknown>,
    body?: Record<string, unknown>
) {
    // Retrieve the server-side session to get the token
    const session: ExtendedSession | null = await getServerSession(authOptions);
    const token = session?.idToken;

    if (!token) {
        throw new Error("Not authenticated");
    }

    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL environment variable is not set.");
    }

    const config: AxiosRequestConfig = {
        method: method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        params: params,
        data: body,
    };

    try {
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`API call failed for ${method} ${endpoint}:`, error);
        // Re-throw the error to be handled by the calling route
        throw error;
    }
}