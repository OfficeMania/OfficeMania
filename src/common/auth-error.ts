export enum AuthError {
    UNKNOWN = -1,
    NO_ERROR,
    USERNAME_TAKEN,
    USER_CREATION_FAILED,
    PASSWORDS_MISMATCH,
    INVALID_CREDENTIALS,
    INVITE_CODE_REQUIRED,
    INVALID_INVITE_CODE,
    INVITE_CODE_EXPIRED,
}

export function authErrorToString(error: AuthError): string {
    switch (error) {
        default:
        case AuthError.UNKNOWN:
            return "Unknown Error";
        case AuthError.NO_ERROR:
            return undefined;
        case AuthError.USERNAME_TAKEN:
            return "The Username is already taken";
        case AuthError.USER_CREATION_FAILED:
            return "User creation failed";
        case AuthError.PASSWORDS_MISMATCH:
            return "Passwords do not match";
        case AuthError.INVALID_CREDENTIALS:
            return "Invalid Credentials";
        case AuthError.INVITE_CODE_REQUIRED:
            return "Invite Code required";
        case AuthError.INVALID_INVITE_CODE:
            return "Invalid Invite Code";
        case AuthError.INVITE_CODE_EXPIRED:
            return "Invite Code expired";
    }
}
