'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { cognitoRegister, generateId } from '@/app/_helpers/registerHelpers';

 function randomIntFromInterval(min: number, max: number) { 
    return Math.floor(Math.random() * (max - min + 1)) + min; 
 }

 async function getUserIdWithRetry(email:string) {
  let retries = 5;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  while (retries > 0) {
    try {
      const res = await fetch(`/api/db/user?email=${email}`, {
            method: 'GET'
      })
      if (!res.ok) {
        throw new Error('API GET function failed');
      }
      const data = await res.json();
      console.log('API GET response:', data);
      return data;
    } catch (error) {
      console.log(`Error calling API GET, retrying... ${error}`);
      retries--;
      if (retries === 0) {
        throw new Error('Failed to invoke API GET after several attempts');
      }
      // Wait for a few seconds before retrying
      await delay(500); // Wait for 5 seconds
    }
  }
}

async function submitUserCollectible(email:string) {
  const randomInt = randomIntFromInterval(1, 14);
  await getUserIdWithRetry(email)
  .then(async (response) => {
    const userId = response.userId;
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
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState(false);
    
    // In app/(auth)/register/form.tsx

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setShowError(false);
    const formData = new FormData(e.currentTarget);
    const pw = generateId(25);
    const formEmail = formData.get('email') as string;

    try {
        await cognitoRegister(formEmail, pw);
        console.log("Cognito registration successful and user auto-confirmed.");

        const loginResponse = await signIn("credentials", {
            username: formEmail,
            password: pw,
            redirect: false,
        });

        if (loginResponse?.error) {
            throw new Error("Login failed after registration.");
        }
        console.log("Sign-in successful.");

        await submitUserCollectible(formEmail);
        console.log("User collectible submitted.");

        router.push("/");
        router.refresh();

    } catch (error) {
        console.error("Registration process failed:", error);
        setLoading(false);
        setShowError(true);
    }
};
    return (
        <form onSubmit={handleSubmit}>
            <Card className=' pt-0 mx-auto max-w-sm border-0 shadow-none mt-8'>
            <CardHeader>
                <CardDescription className="flex justify-center items-center">Jezt anmelden und Gewinnchance sichern.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='grid gap-4'>
                <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' name='email' autoComplete='on' placeholder='m@example.com' required />
                </div>
                <div className='grid gap-2'>
                <div className="flex items-center space-x-2">
                    <Checkbox defaultChecked id="nlBox" name="nlBox">
                    </Checkbox>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="nlBox">
                        Ich möchte den Kloppocar-Newsletter abonnieren
                    </label>
		        </div>
                </div>
                {!loading &&
                    <Button type="submit">Jetzt anmelden</Button>
                }
                {!!loading &&
                    <Button disabled>
                        <Loader2 className="animate-spin" /> 
                        Bitte warten
                        </Button>
                }
                {!!showError &&
                    <p className="text-red-600 flex justify-center items-center">
                        Diese E-Mail-Adresse ist bereits registriert.
                    </p>
                }
                </div>
            </CardContent>
            </Card>
        </form>
    )

}
