'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { AuthError } from '@/app/_helpers/authErrors';
import { AuthMode } from '../hooks/useAuthForm';

interface RegisterFormProps {
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    loading: boolean;
    error: AuthError;
    setMode: (mode: AuthMode) => void;
    resetForm: () => void;
}

export default function RegisterForm({ onSubmit, loading, error, setMode, resetForm }: RegisterFormProps) {
    return (
        <form onSubmit={onSubmit}>
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
                        <Button disabled className="w-full">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Bitte warten
                        </Button>
                    ) : (
                        <Button type="submit" className="w-full">Jetzt anmelden</Button>
                    )}
                    {!!error && <p className="text-red-600 text-sm text-center">{error}</p>}
                </div>
                <div className='mt-4 text-center text-sm'>
                    Sie haben bereits ein Konto?{' '}
                    <Button variant="link" type="button" onClick={() => { resetForm(); setMode('login-email'); }}>
                        Klicken Sie hier
                    </Button>
                </div>
            </CardContent>
        </form>
    );
}