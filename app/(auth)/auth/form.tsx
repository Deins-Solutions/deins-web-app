'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthForm } from './hooks/useAuthForm';
import RegisterForm from './components/RegisterForm';
import LoginPasswordForm from './components/LoginPasswordForm';
import LoginEmailForm from './components/LoginEmailForm';
import ConfirmationModal from './components/ConfirmationModal';

export default function AuthForm() {
    const {
        mode,
        setMode,
        loading,
        error,
        email,
        isModalOpen,
        isConfirming,
        confirmationCode,
        setConfirmationCode,
        modalError,
        isAlertOpen,
        setIsAlertOpen,
        handleRegisterSubmit,
        handlePasswordLoginSubmit,
        handleEmailLoginSubmit,
        handleConfirm,
        handleBackFromModal,
        handleStartOver,
        resetFormState
    } = useAuthForm();

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
                        {mode === 'register' && 'Jetzt anmelden und erste Sammelkarte zu sichern.'}
                        {mode === 'login-password' && 'Melden Sie sich bei Ihrem Konto an.'}
                        {mode === 'login-email' && 'Erhalten Sie einen Code per E-Mail, um sich anzumelden.'}
                    </CardDescription>
                </CardHeader>
                
                <div style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.6 : 1 }}>
                    {mode === 'register' && (
                        <RegisterForm 
                            onSubmit={handleRegisterSubmit}
                            loading={loading}
                            error={error}
                            setMode={setMode}
                            resetForm={resetFormState}
                        />
                    )}
                    {mode === 'login-password' && (
                        <LoginPasswordForm 
                            onSubmit={handlePasswordLoginSubmit}
                            loading={loading}
                            error={error}
                            setMode={setMode}
                            resetForm={resetFormState}
                        />
                    )}
                    {mode === 'login-email' && (
                        <LoginEmailForm 
                            onSubmit={handleEmailLoginSubmit}
                            loading={loading}
                            error={error}
                            setMode={setMode}
                            resetForm={resetFormState}
                        />
                    )}
                </div>
            </Card>

            <ConfirmationModal 
                isOpen={isModalOpen}
                isConfirming={isConfirming}
                email={email}
                code={confirmationCode}
                setCode={setConfirmationCode}
                error={modalError}
                onConfirm={handleConfirm}
                onBack={handleBackFromModal}
                isAlertOpen={isAlertOpen}
                setIsAlertOpen={setIsAlertOpen}
                onStartOver={handleStartOver}
            />
        </>
    )
}