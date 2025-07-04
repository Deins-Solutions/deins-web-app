export async function getUserIdWithRetry(email: string) {
    let retries = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    while (retries > 0) {
        try {
            const res = await fetch(`/api/db/user?email=${email}`, { method: 'GET' });
            if (!res.ok) {
                throw new Error('API GET function failed');
            }
            const data = await res.json();
            return data;
        } catch (error) {
            console.log(`Error calling API GET, retrying... ${error}`);
            retries--;
            if (retries === 0) {
                throw new Error('Failed to invoke API GET after several attempts');
            }
            await delay(500);
        }
    }
}

export async function submitUserCollectible(email: string) {
    const randomInt = Math.floor(Math.random() * (14)) + 1;
    const user = await getUserIdWithRetry(email);
    if (!user || !user.userId) {
        console.error("Could not retrieve user ID to submit collectible.");
        return;
    }
    const userId = user.userId;
    await fetch(`/api/db/userCollectible`, {
        method: 'POST',
        body: JSON.stringify({
            userId: userId,
            collectibleId: randomInt,
            mint: userId,
        })
    });
}