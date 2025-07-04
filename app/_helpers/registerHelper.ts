import { 
    signUp, 
    confirmSignUp, 
    signIn, 
    confirmSignIn,
    fetchAuthSession,
    resendSignUpCode
    // AuthFlowType has been removed from the import as it's not exported
} from 'aws-amplify/auth';

// --- Registration Functions using Amplify ---

export function cognitoRegister(email: string, password: string) {
    return signUp({
        username: email,
        password,
        options: {
            userAttributes: { email }
        }
    });
}

export function cognitoConfirm(email: string, confirmCode: string) {
    return confirmSignUp({ username: email, confirmationCode: confirmCode });
}

export function cognitoResendConfirmation(email: string) {
    return resendSignUpCode({ username: email });
}
// --- Email Login Functions using Amplify ---

export async function cognitoInitiateEmailLogin(email: string) {
    // The fix is to use the string literal 'CUSTOM_AUTH' directly.
    const { nextStep } = await signIn({ 
        username: email,
        options: {
            authFlowType: 'CUSTOM_WITHOUT_SRP'
        }
    });

    if (nextStep.signInStep !== 'CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE') {
        throw new Error(`Unexpected sign-in step: ${nextStep.signInStep}`);
    }
}

export async function cognitoCompleteEmailLogin(code: string) {
    const { isSignedIn } = await confirmSignIn({ challengeResponse: code });
    if (isSignedIn) {
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("Could not retrieve ID token from session.");
        }
        return idToken;
    }
    throw new Error("Sign in was not completed successfully.");
}