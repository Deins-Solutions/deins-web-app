import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
import * as jose from 'jose';
import { JSONWebKeySet } from 'jose';

// --- Type Augmentation for NextAuth ---
interface ExtendedUser extends User {
  idToken?: string;
}

interface ExtendedToken extends JWT {
  idToken?: string;
}

export interface ExtendedSession extends Session {
  idToken?: string;
}

// --- Cognito Configuration ---
const cognitoRegion = process.env.COGNITO_REGION;
const userPoolId = process.env.USER_POOL_ID;
const jwksUrl = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
let jwksCache: JSONWebKeySet | null = null;

async function getJwks() {
    if (jwksCache) {
        return jwksCache;
    }
    try {
        const response = await fetch(jwksUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch JWKS. Status: ${response.status}`);
        }
        jwksCache = await response.json();
        return jwksCache;
    } catch (error) {
        console.error("Error fetching or parsing JWKS:", error);
        jwksCache = null; // Clear cache on error to allow for retries
        throw error;
    }
}


// --- AuthOptions Definition ---
// This object is now defined here, in a non-route file.
export const authOptions: NextAuthOptions = {
    secret: process.env.AUTH_SECRET,
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials) return null;
                const cognitoClient = new CognitoIdentityProviderClient({ region: cognitoRegion });
                const params = {
                    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                    ClientId: process.env.CLIENT_ID!,
                    AuthParameters: {
                        USERNAME: credentials.username,
                        PASSWORD: credentials.password,
                    },
                };
                try {
                    const response = await cognitoClient.send(new InitiateAuthCommand(params));
                    if (response.AuthenticationResult?.IdToken) {
                        return { 
                            id: credentials.username, 
                            name: credentials.username, 
                            email: credentials.username,
                            idToken: response.AuthenticationResult.IdToken 
                        };
                    }
                    return null;
                } catch (error) {
                    console.log(error);
                    return null;
                }
            }
        }),
        CredentialsProvider({
            id: "cognito-token",
            name: "Cognito Token",
            credentials: {
                idToken: { label: "ID Token", type: "text" },
            },
            authorize: async (credentials) => {
                if (!credentials?.idToken) return null;
                 try {
                    const localJwks = await getJwks();
                    if (!localJwks) {
                        throw new Error("Could not retrieve JWKS for token validation.");
                    }

                    const JWKS = jose.createLocalJWKSet(localJwks);

                    const { payload } = await jose.jwtVerify(credentials.idToken, JWKS, {
                        issuer: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}`,
                        clockTolerance: "30 seconds"
                    });

                    if (payload && typeof payload.email === 'string') {
                         return { 
                             id: payload.sub!, 
                             name: payload.email, 
                             email: payload.email,
                             idToken: credentials.idToken
                        };
                    }
                    throw new Error("Token is valid but payload is missing email.");
                } catch (error) {
                    console.error("Token validation error:", error);
                    if (error instanceof Error) {
                        throw new Error(`Token validation failed: ${error.message}`);
                    }
                    throw new Error("An unknown token validation error occurred.");
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }: { token: ExtendedToken, user?: ExtendedUser }) {
            if (user) {
                token.idToken = user.idToken;
            }
            return token;
        },
        async session({ session, token }: { session: ExtendedSession, token: ExtendedToken }) {
            session.idToken = token.idToken;
            return session;
        }
    },
    pages: {
        signIn: "/register"
    },
};