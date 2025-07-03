'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState } from 'react';
import { cognitoConfirm } from '@/app/_helpers/registerHelper';
import { useSearchParams } from 'next/navigation'
// import axios from 'axios';
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

function randomIntFromInterval(min: number, max: number) { 
    return Math.floor(Math.random() * (max - min + 1)) + min; 
} 

async function submitUserCollectible(email:string) {
  const randomInt = randomIntFromInterval(1, 14);
  await fetch(`/api/db/user?email=${email}`, {
            method: 'GET'
  }).then(async (response) => {
    const data = await response.json();
    const userId = data.userId;
    await fetch(`/api/db/userCollectible`, {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                collectibleId: randomInt,
                mint: userId,
    })
    }).catch((error) => {
        return error;
    })
  })
}

export default function Form() {
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    const searchParams = useSearchParams();
    const getEmail = searchParams.get('email') || 'no email';
    // const getPass = searchParams.get('password');
    const router = useRouter();
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setShowError(false);
        const formData = new FormData(e.currentTarget);
        const confCode = formData.get('confirmCode')?.toString() || 'no code';
        // const cookieResponse = await fetch('/api/cookies');
        // const data = await cookieResponse.json();
        // console.log(data);
        await cognitoConfirm(getEmail, confCode)
        .then( async (response) => {
            console.log(response);
            const check = await submitUserCollectible(getEmail);
            console.log(JSON.stringify(check));
            await signIn("credentials", {
                    username: getEmail,
                    redirect: false,
                }).then((loginResponse) => {
                    console.log('login response:')
                    console.log(loginResponse);
                    if(!loginResponse?.error){
                        router.push("/")
                        router.refresh();
                    }
                }).catch((error) => {
                    console.log(error);
                    setLoading(false);
                    setShowError(true);
                })
        }).catch((error) => {
            console.log(error);
            setLoading(false);
            setShowError(true);
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className='mx-auto max-w-sm border-0 shadow-none sm:border sm:shadow-sm mt-8'>
            <CardHeader>
                <CardTitle className='text-xl'>Email bestätigen</CardTitle>
                <CardDescription>Bitte gebe den Bestätigungscode aus der Email ein um deinen Account zu erstellen und dir deine Chance auf ein Treffen mit Jürgen Klopp zu sichern.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='grid gap-4'>
                <div className='grid gap-2'>
                <Label htmlFor='confirmCode'>Bestätigungscode</Label>
                <Input id='confirmCode' name='confirmCode' placeholder='12345' />
                </div>
                {!loading &&
                    <Button type="submit">Jetzt sammeln!</Button>
                }
                {!!loading &&
                    <Button disabled>
                        <Loader2 className="animate-spin" /> 
                        Bitte warten
                        </Button>
                }
                {!!showError &&
                    <p className="text-red-600 flex justify-center items-center">
                       Error beim Anmelden
                    </p>
                }
                </div>
            </CardContent>
            </Card>
        </form>
    )

}
