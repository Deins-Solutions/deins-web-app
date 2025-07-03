import { 
    signUp, 
    confirmSignUp, 
    signIn, 
    confirmSignIn,
    fetchAuthSession
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


// --- Email Login Functions using Amplify ---

/**
 * Initiates the custom authentication flow for email-based login using Amplify.
 * @param email The user's email address.
 * @returns A promise that resolves when the custom challenge has been initiated.
 */
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

/**
 * Completes the custom authentication flow by sending the verification code.
 * @param code The code from the email.
 * @returns A promise that resolves with the user's ID token upon successful login.
 */
export async function cognitoCompleteEmailLogin(code: string) {
    // The state is managed internally by Amplify after the initial signIn call.
    const { isSignedIn } = await confirmSignIn({ challengeResponse: code });
    if (isSignedIn) {
        // After confirming, fetch the session to get the tokens.
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken?.toString();
        if (!idToken) {
            throw new Error("Could not retrieve ID token from session.");
        }
        return idToken;
    }
    throw new Error("Sign in was not completed successfully.");
}