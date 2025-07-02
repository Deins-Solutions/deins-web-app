import { NextResponse } from "next/server";
import axios, { AxiosError } from 'axios';

            export async function GET(request: Request) {
                try {
                    const { searchParams } = new URL(request.url);
                    const userId = searchParams.get("userId");
                    // validate here (zod)
                    const userResponse = await axios.get(`https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/UserCollectible/getUserCollectiblesByOwnerId?ownerId=${userId}`)
                    const collectibleId = userResponse.data[0].collectibleId;
                    console.log(userResponse.data[0].collectibleId);
                    return NextResponse.json({ message: 'success', collectibleId: collectibleId });
                }
                catch (e)
                 {
                    console.log({ e });
                    const err = e as AxiosError;
                    return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            };

            export async function POST(request: Request) {
                try {
                    const { userId, collectibleId, mint } = await request.json();
                    // validate here (zod)
                    axios.post('https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/UserCollectible/createUserCollectible', {
                        "ownerId": userId,
                        "collectibleId": collectibleId,
                        "mint": mint
                  })
                  return NextResponse.json({ message: 'success' });
                }
                catch (e)
                 {
                    console.log({ e });
                    const err = e as AxiosError;
                    return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            }