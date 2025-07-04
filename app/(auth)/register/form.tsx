'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FormEvent, useState } from 'react';
import { signIn as nextAuthSignIn } from 'next-auth/react'
import { useRouter } from 'next/navigation';
import { 
    cognitoRegister, 
    cognitoConfirm, 
    cognitoInitiateEmailLogin, 
    cognitoCompleteEmailLogin 
} from '@/app/_helpers/registerHelper';
import { signOut } from 'aws-amplify/auth';

// --- Helper Functions ---
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


export default function AuthForm() {
    const router = useRouter();
    const [mode, setMode] = useState<'register' | 'login-password' | 'login-email'>('register');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'register' | 'login'>('register');
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [modalError, setModalError] = useState('');
    
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    
    const resetFormState = () => {
        setLoading(false);
        setError('');
        setEmail('');
        setPassword('');
        setIsModalOpen(false);
        setIsConfirming(false);
        setConfirmationCode('');
        setModalError('');
    };

    const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const formEmail = formData.get('email') as string;
        const formPassword = formData.get('password') as string;
        const formConfirmPassword = formData.get('confirmPassword') as string;

        if (formPassword !== formConfirmPassword) {
            setError("Die Passwörter stimmen nicht überein.");
            setLoading(false);
            return;
        }

        try {
            await cognitoRegister(formEmail, formPassword);
            setEmail(formEmail);
            setPassword(formPassword);
            setModalMode('register');
            setIsModalOpen(true);
        } catch (err) {
            if (err instanceof Error && err.name === 'UsernameExistsException') {
                setError('Diese E-Mail-Adresse ist bereits registriert.');
            } else {
                setError('Ein unerwarteter Fehler ist aufgetreten.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const formEmail = formData.get('email') as string;
        const formPassword = formData.get('password') as string;

        const result = await nextAuthSignIn('credentials', {
            username: formEmail,
            password: formPassword,
            redirect: false,
        });

        if (result?.error) {
            setError('Falsche E-Mail oder falsches Passwort.');
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    const handleEmailLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const formData = new FormData(e.currentTarget);
        const formEmail = formData.get('email') as string;

        try {
            await cognitoInitiateEmailLogin(formEmail);
            setEmail(formEmail);
            setModalMode('login');
            setIsModalOpen(true);
        } catch (err) {
            // Check for the specific stale session error
            if (err instanceof Error && err.name === 'UserAlreadyAuthenticatedException') {
                console.log("Stale Amplify session detected. Signing out and retrying...");
                try {
                    // Sign out to clear the local Amplify session
                    await signOut();
                    // Retry the login attempt
                    await cognitoInitiateEmailLogin(formEmail);
                    setEmail(formEmail);
                    setModalMode('login');
                    setIsModalOpen(true);
                } catch (retryErr) {
                    console.error("Retry attempt failed:", retryErr);
                    setError('Ein Fehler ist nach dem Zurücksetzen der Sitzung aufgetreten.');
                }
            } else if (err instanceof Error && err.name === 'UserNotFoundException') {
                setError('Kein Konto mit dieser E-Mail-Adresse gefunden.');
            } else {
                console.error("Email Login Error:", err);
                setError('Ein unerwarteter Fehler ist aufgetreten.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setIsConfirming(true);
        setModalError('');
    
        try {
            if (modalMode === 'register') {
                await cognitoConfirm(email, confirmationCode);
                setIsModalOpen(false);
                setLoading(true);
                
                const loginResponse = await nextAuthSignIn("credentials", {
                    username: email,
                    password: password,
                    redirect: false,
                });
                if (loginResponse?.error) throw new Error("Login failed after confirmation.");
                await submitUserCollectible(email);
            } else { // modalMode === 'login'
                const idToken = await cognitoCompleteEmailLogin(confirmationCode);
                setIsModalOpen(false);
                setLoading(true);
                const loginResponse = await nextAuthSignIn("cognito-token", {
                    idToken: idToken,
                    redirect: false,
                });
                if (loginResponse?.error) throw new Error("Token-based login failed.");
            }
            router.push("/");
            router.refresh();
    
        } catch (error) {
            setLoading(false);
            setIsConfirming(false);
            setIsModalOpen(true);
            console.log(error);
            if (error instanceof Error && error.name === 'CodeMismatchException') {
                setModalError('Der eingegebene Code ist falsch. Bitte versuchen Sie es erneut.');
            } else {
                setModalError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
            }
            setIsConfirming(false);
        }
    };

    const handleBackFromModal = () => setIsAlertOpen(true);
    const handleStartOver = () => {
        setIsModalOpen(false);
        setIsAlertOpen(false);
        resetFormState();
    };

    // --- RENDER LOGIC ---
    const renderRegisterForm = () => (
        <form onSubmit={handleRegisterSubmit}>
            <CardContent>
                <div className='grid gap-4'>
                    <div className='grid gap-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input id='email' name='email' type='email' autoComplete='email' placeholder='m@example.com' required />
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
                            <label className="text-sm font-medium leading-none" htmlFor="nlBox">
                                Ich möchte den Kloppocar-Newsletter abonnieren
                            </label>
                        </div>
                    </div>
                    {loading ? (
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Bitte warten
                        </Button>
                    ) : (
                        <Button type="submit">Jetzt anmelden</Button>
                    )}
                    {!!error && <p className="text-red-600 text-sm text-center">{error}</p>}
                </div>
                <div className='mt-4 text-center text-sm'>
                    Sie haben bereits ein Konto?{' '}
                    <Button variant="link" type="button" onClick={() => { resetFormState(); setMode('login-email'); }}>
                        Klicken Sie hier
                    </Button>
                </div>
            </CardContent>
        </form>
    );

    const renderLoginPasswordForm = () => (
        <form onSubmit={handlePasswordLoginSubmit}>
            <CardContent>
                <div className='grid gap-4'>
                    <div className='grid gap-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input id='email' name='email' type='email' autoComplete='email' placeholder='m@example.com' required />
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='password'>Passwort</Label>
                        <Input id='password' name='password' type='password' required />
                    </div>
                    {loading ? (
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Bitte warten
                        </Button>
                    ) : (
                        <Button type="submit">Login mit Passwort</Button>
                    )}
                    {!!error && <p className="text-red-600 text-sm text-center">{error}</p>}
                </div>
                 <div className='mt-2 text-center text-sm'>
                    <Button variant="link" type="button" onClick={() => { resetFormState(); setMode('login-email'); }}>
                        Login mit Email-Code
                    </Button>
                </div>
                <div className='mt-1 text-center text-sm'>
                    Haben noch kein Konto?{' '}
                    <Button variant="link" type="button" onClick={() => { resetFormState(); setMode('register'); }}>
                        Klicken Sie hier
                    </Button>
                </div>
            </CardContent>
        </form>
    );

    const renderLoginEmailForm = () => (
         <form onSubmit={handleEmailLoginSubmit}>
            <CardContent>
                <div className='grid gap-4'>
                    <div className='grid gap-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input id='email' name='email' type='email' autoComplete='email' placeholder='m@example.com' required />
                    </div>
                    {loading ? (
                        <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Bitte warten
                        </Button>
                    ) : (
                        <Button type="submit">Sende Login-Code</Button>
                    )}
                    {!!error && <p className="text-red-600 text-sm text-center">{error}</p>}
                </div>
                 <div className='mt-2 text-center text-sm'>
                    <Button variant="link" type="button" onClick={() => { resetFormState(); setMode('login-password'); }}>
                        Login mit Passwort
                    </Button>
                </div>
                <div className='mt-1 text-center text-sm'>
                    Haben noch kein Konto?{' '}
                    <Button variant="link" type="button" onClick={() => { resetFormState(); setMode('register'); }}>
                        Klicken Sie hier
                    </Button>
                </div>
            </CardContent>
        </form>
    );

    return (
        <>
            <Card className='pt-0 mx-auto max-w-sm border-0 shadow-none mt-8'>
                <CardHeader>
                    <CardTitle className="text-2xl text-center">
                        {mode === 'register' && 'Account erstellen'}
                        {mode === 'login-password' && 'Login'}
                        {mode === 'login-email' && 'Login'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {mode === 'register' && 'Jetzt anmelden und Gewinnchance sichern.'}
                        {mode === 'login-password' && 'Melden Sie sich bei Ihrem Konto an.'}
                        {mode === 'login-email' && 'Erhalten Sie einen Code per E-Mail, um sich anzumelden.'}
                    </CardDescription>
                </CardHeader>
                {mode === 'register' && renderRegisterForm()}
                {mode === 'login-password' && renderLoginPasswordForm()}
                {mode === 'login-email' && renderLoginEmailForm()}
            </Card>
            <Dialog open={isModalOpen}>
                <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Bestätigungscode eingeben</DialogTitle>
                        <DialogDescription>
                            Wir haben einen Code an {email} gesendet. Bitte geben Sie ihn unten ein.
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
                        <Button variant="outline" onClick={handleBackFromModal} disabled={isConfirming}>Zurück</Button>
                        {!isConfirming && <Button onClick={handleConfirm}>Bestätigen</Button>}
                        {!!isConfirming && <Button disabled><Loader2 className="animate-spin" /> Bestätigen...</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Wenn Sie zurückgehen, wird der aktuelle Vorgang abgebrochen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStartOver}>Fortfahren</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}