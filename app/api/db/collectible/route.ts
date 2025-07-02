import { NextResponse } from "next/server";
import axios, { AxiosError } from 'axios';

            export async function GET(request: Request) {
                try {
                    const { searchParams } = new URL(request.url);
                    const collectibleId = searchParams.get("collectibleId");
                    // validate here (zod)
                    const userResponse = await axios.get(`https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/Collectible/getCollectibleByCollectibleId?collectibleId=${collectibleId}`);
                    const objectUrl = userResponse.data.embedRef['url'];
                    console.log(userResponse.data.embedRef['url']);
                    return NextResponse.json({ message: 'success', objectUrl: objectUrl });
                }
                catch (e)
                 {
                    console.log({ e });
                    const err = e as AxiosError;
                    return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            };