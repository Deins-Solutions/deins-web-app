import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL;

async function makeDirectApiCall(token: string, endpoint: string, params?: Record<string, unknown>) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL environment variable is not set.");
    }
    if (!token) {
        throw new Error("Authentication token is missing.");
    }

    try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            params: params
        });
        return response.data;
    } catch (error) {
        console.error(`Direct API call to ${endpoint} failed:`, error);
        throw error; // Re-throw to be handled by the caller
    }
}

// Specific API functions using the helper
export const getUserFromApi = (token: string, email: string) => 
    makeDirectApiCall(token, '/User/getUserByEmail', { email });

export const getUserCollectiblesFromApi = (token: string, userId: string) => 
    makeDirectApiCall(token, '/UserCollectible/getUserCollectiblesByOwnerId', { ownerId: userId });

export const getCollectibleFromApi = (token: string, collectibleId: string) => 
    makeDirectApiCall(token, '/Collectible/getCollectibleByCollectibleId', { collectibleId });