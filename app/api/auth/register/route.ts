import { NextResponse } from "next/server";
import {hash} from 'bcrypt';
import axios, { AxiosError } from 'axios';

            export async function POST(request: Request) {
                try {
                    const { email, nlBox, password } = await request.json();
                    // validate here (zod)
                    const nl = nlBox ? nlBox : 'no'
                    const hashedPassword = await hash(password, 10);
                    axios.post('https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/User/createUser', {
                        "email":email,
                        "deviceId": nl,
                        "passwordHashed": hashedPassword,
                        "userType": "unregistered",
                        "username":email,
                  })
                  return NextResponse.json({ message: 'success' });
                }
                catch (e) {
                                        console.log({ e });
                                        const err = e as AxiosError;
                                        return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
                }    
            }
