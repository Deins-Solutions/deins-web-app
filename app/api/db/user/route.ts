import { NextResponse } from "next/server";
import axios, { AxiosError } from 'axios';

            export async function GET(request: Request) {
                try {
                    const { searchParams } = new URL(request.url);
                    const email = searchParams.get("email");
                    // validate here (zod)
                    const userResponse = await axios.get(`https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/User/getUserByEmail?email=${email}`)
                    const userId = userResponse.data.userId;
                    console.log(userResponse.data.userId);
                    return NextResponse.json({ message: 'success', userId: userId });
                }
                catch (e)
                 {
                    console.log({ e });
                    const err = e as AxiosError;
                    return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            };

            export async function PATCH(request: Request) {
                try {
                    const { email, token } = await request.json();
                    // validate here (zod)
                    axios.post('https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/User/updateUserByUsername', {
                       "username": email,
                       "authToken": token,
                  })
                  return NextResponse.json({ message: 'success' });
                }
                catch (e)
                 {
                    console.log({ e });
                    const err = e as AxiosError;
                    return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            };