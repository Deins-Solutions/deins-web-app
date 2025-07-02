import { NextResponse } from "next/server";
import axios, { AxiosError } from 'axios';

    export async function GET() {
        try {
            // validate here (zod)
            const projectResponse = await axios.get(`https://tfsqezucvlwdw6wyjoktbonezi0fatic.lambda-url.eu-central-1.on.aws/Project/getProjectByProjectId?projectId=1`)
            const project = projectResponse.data;
            console.log(project);
            return NextResponse.json({ message: 'success'});
        }
        catch (e) {
            console.log({ e });
            const err = e as AxiosError;
            return NextResponse.json({ message: e }, {status: err.status, statusText: "invalid database call"});
        }    
    };