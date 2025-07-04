import { NextAuthOptions, User, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { CognitoIdentityProviderClient, InitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
import * as jose from 'jose';

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
const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));

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
                    // THE FIX: Add issuer and audience validation for security.
                    // This ensures the token was issued by your user pool for your app client.
                    const { payload } = await jose.jwtVerify(credentials.idToken, JWKS, {
                        issuer: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${userPoolId}`,
                        audience: process.env.CLIENT_ID!,
                    });

                    if (payload && typeof payload.email === 'string') {
                         return { 
                             id: payload.sub!, 
                             name: payload.email, 
                             email: payload.email,
                             idToken: credentials.idToken
                        };
                    }
                    return null;
                } catch (error) {
                    // Add detailed logging to see the exact validation error
                    console.error("Token validation error:", error);
                    return null;
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