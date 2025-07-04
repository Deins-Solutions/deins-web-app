import { ReactNode } from 'react';

// A type for our error messages, allowing for strings or React components (for links)
export type AuthError = ReactNode | string;

// An object to hold common, reusable error messages
export const AuthErrors: { [key: string]: AuthError } = {
    DEFAULT: 'Ein unerwarteter Fehler ist aufgetreten.',
    USER_NOT_FOUND: 'Es existiert kein Benutzerkonto mit dieser E-Mail.',
    USER_EXISTS: 'Diese E-Mail-Adresse ist bereits registriert.',
    CODE_MISMATCH: 'Der eingegebene Code ist falsch. Bitte versuchen Sie es erneut.',
    PASSWORD_NO_MATCH: 'Die Passwörter stimmen nicht überein.',
    LOGIN_FAILED: 'Falsche E-Mail oder falsches Passwort.',
    SESSION_RESET: 'Ein Fehler ist nach dem Zurücksetzen der Sitzung aufgetreten.',
};
