'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { cognitoRegister, cognitoConfirm } from '@/app/_helpers/registerHelpers';

// --- Helper Functions ---
function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getUserIdWithRetry(email: string) {
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

async function submitUserCollectible(email: string) {
    const randomInt = randomIntFromInterval(1, 14);
    const response = await getUserIdWithRetry(email);
    const userId = response.userId;
    await fetch(`/api/db/userCollectible`, {
        method: 'POST',
        body: JSON.stringify({
            userId: userId,
            collectibleId: randomInt,
            mint: userId,
        })
    });
}

// --- Main Form Component ---
export default function Form() {
    const router = useRouter();

    // State for the main registration form
    const [loading, setLoading] = useState(false);
    const [showError, setShowError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // To hold password for sign-in

    // State for the confirmation modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [modalError, setModalError] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    // Handles the INITIAL registration (email and password submission)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setShowError('');
        const formData = new FormData(e.currentTarget);
        const formEmail = formData.get('email') as string;
        const formPassword = formData.get('password') as string;
        const formConfirmPassword = formData.get('confirmPassword') as string;

        // --- Password validation ---
        if (formPassword !== formConfirmPassword) {
            setShowError("Die Passwörter stimmen nicht überein.");
            setLoading(false);
            return;
        }
        // You can add more password strength requirements here if needed

        try {
            // Register user in Cognito with their chosen password
            await cognitoRegister(formEmail, formPassword);

            // On success, store email and password for the confirmation step
            setEmail(formEmail);
            setPassword(formPassword); // Store the password for the signIn call
            setLoading(false);
            setIsModalOpen(true);
        } catch (error) {
            console.log(error);
            if (error instanceof Error && error.name === 'UsernameExistsException') {
                setShowError('Diese E-Mail-Adresse ist bereits registriert.');
            } else {
                setShowError('Ein unerwarteter Fehler ist aufgetreten.');
            }
            setLoading(false);
        }
    }

    // Handles the SECOND step (confirmation code submission in the modal)
    const handleConfirm = async () => {
        setIsConfirming(true);
        setModalError('');

        try {
            // 1. Confirm the user in Cognito
            await cognitoConfirm(email, confirmationCode);

            // 2. Sign the user in using the password from the first step
            const loginResponse = await signIn("credentials", {
                username: email,
                password: password, // Use the stored password
                redirect: false,
            });

            if (loginResponse?.error) {
                throw new Error("Login failed after confirmation.");
            }

            // 3. Assign a collectible
            await submitUserCollectible(email);

            // 4. Success! Close modal and redirect.
            setIsModalOpen(false);
            router.push("/");
            router.refresh();

        } catch (error) {
            console.log(error);
            if (error instanceof Error && error.name === 'CodeMismatchException') {
                setModalError('Der eingegebene Code ist falsch. Bitte versuchen Sie es erneut.');
            } else {
                setModalError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
            }
            setIsConfirming(false);
        }
    };

    const handleBack = () => {
        setIsAlertOpen(true);
    };

    const handleStartOver = () => {
        setIsModalOpen(false);
        setIsAlertOpen(false);
        // Reset all relevant states
        setEmail('');
        setPassword(''); // Also reset the stored password
        setConfirmationCode('');
        setModalError('');
        setShowError('');
    };

    return (
        <>
            {/* --- MAIN REGISTRATION FORM --- */}
            <form onSubmit={handleSubmit}>
                <Card className='pt-0 mx-auto max-w-sm border-0 shadow-none mt-8'>
                    <CardHeader>
                        <CardDescription className="flex justify-center items-center">Jetzt anmelden und Gewinnchance sichern.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid gap-4'>
                            <div className='grid gap-2'>
                                <Label htmlFor='email'>Email</Label>
                                <Input id='email' name='email' type='email' autoComplete='on' placeholder='m@example.com' required />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='password'>Passwort</Label>
                                <Input id='password' name='password' type='password' required />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='confirmPassword'>Passwort bestätigen</Label>
                                <Input id='confirmPassword' name='confirmPassword' type='password' required />
                            </div>
                            <div className='grid gap-2'>
                                <div className="flex items-center space-x-2">
                                    <Checkbox defaultChecked id="nlBox" name="nlBox" />
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="nlBox">
                                        Ich möchte den Kloppocar-Newsletter abonnieren
                                    </label>
                                </div>
                            </div>
                            {!loading && <Button type="submit">Jetzt anmelden</Button>}
                            {!!loading && <Button disabled><Loader2 className="animate-spin" /> Bitte warten</Button>}
                            {!!showError && <p className="text-red-600 text-sm flex justify-center items-center">{showError}</p>}
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* --- CONFIRMATION CODE MODAL --- */}
            <Dialog open={isModalOpen}>
                <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Email bestätigen</DialogTitle>
                        <DialogDescription>
                            Wir haben einen Code an {email} gesendet. Bitte geben Sie ihn unten ein, um Ihre Registrierung abzuschließen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="code" className="text-right">Code</Label>
                            <Input
                                id="code"
                                value={confirmationCode}
                                onChange={(e) => setConfirmationCode(e.target.value)}
                                className="col-span-3"
                                placeholder='123456'
                            />
                        </div>
                        {!!modalError && <p className="text-red-600 text-sm col-span-4 text-center">{modalError}</p>}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleBack} disabled={isConfirming}>Zurück</Button>
                        {!isConfirming && <Button onClick={handleConfirm}>Bestätigen und Registrieren</Button>}
                        {!!isConfirming && <Button disabled><Loader2 className="animate-spin" /> Bestätigen...</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- "ARE YOU SURE?" ALERT DIALOG --- */}
            <AlertDialog open={isAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Wenn Sie zurückgehen, müssen Sie den Registrierungsprozess von vorne beginnen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStartOver}>Von vorne beginnen</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
