import {
	CognitoUserPool,
    CognitoUser,
	CognitoUserAttribute,
    AuthenticationDetails,
    CookieStorage
} from 'amazon-cognito-identity-js';

const poolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;

const poolData = {
    UserPoolId: poolId || '',
    ClientId: clientId || '',
    Storage: new CookieStorage({ domain: process.env.NODE_ENV === 'development' ? 'localhost' : '.your-production-domain.com', secure: true })
};

const userPool = new CognitoUserPool(poolData);

// --- Type Extension for CognitoUser ---
// This interface extends the default CognitoUser to include the Session property,
// which is added dynamically during the custom auth flow but is missing from the base type definitions.
interface CognitoUserWithSession extends CognitoUser {
    Session?: string;
}


// --- Existing Registration Functions ---

export function cognitoRegister(email: string, password: string): Promise<CognitoUser> {
    const attributeList: CognitoUserAttribute[] = [];
    return new Promise((resolve, reject) => {
        userPool.signUp(email, password, attributeList, [], (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result?.user) {
                return resolve(result.user);
            }
            return reject(new Error('User registration failed.'));
        });
    });
}

export function cognitoConfirm(email: string, confirmCode: string): Promise<string> {
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(confirmCode, true, (err, result) => {
            if (err) {
                return reject(err);
            }
            return resolve(result as string);
        });
    });
}

// --- NEW Email Login Functions ---

/**
 * Initiates the custom authentication flow for email-based login.
 * @param email The user's email address.
 * @returns A promise that resolves with the Cognito session string needed for the next step.
 */
export function cognitoInitiateEmailLogin(email: string): Promise<string> {
    const cognitoUser: CognitoUserWithSession = new CognitoUser({ Username: email, Pool: userPool });
    const authenticationDetails = new AuthenticationDetails({ Username: email });

    return new Promise((resolve, reject) => {
        cognitoUser.initiateAuth(authenticationDetails, {
            onSuccess: () => {
                // This shouldn't happen in a custom flow, but reject if it does.
                reject(new Error('Password-based success in custom auth flow.'));
            },
            onFailure: (err) => {
                reject(err);
            },
            customChallenge: () => {
                // The Session property is populated on the cognitoUser object by initiateAuth.
                // We use our extended type to safely access it.
                if (cognitoUser.Session) {
                    resolve(cognitoUser.Session);
                } else {
                    reject(new Error("Cognito session not found after challenge."));
                }
            },
        });
    });
}

/**
 * Completes the custom authentication flow by sending the verification code.
 * @param email The user's email.
 * @param code The code from the email.
 * @param session The session string from the initiateAuth step.
 * @returns A promise that resolves with the user's ID token upon successful login.
 */
export function cognitoCompleteEmailLogin(email: string, code: string, session: string): Promise<string> {
    const cognitoUser: CognitoUserWithSession = new CognitoUser({ Username: email, Pool: userPool });
    // Restore the session from the previous step by directly setting the property.
    cognitoUser.Session = session; 

    return new Promise((resolve, reject) => {
        cognitoUser.sendCustomChallengeAnswer(code, {
            onSuccess: (result) => {
                const idToken = result.getIdToken().getJwtToken();
                resolve(idToken);
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
}
