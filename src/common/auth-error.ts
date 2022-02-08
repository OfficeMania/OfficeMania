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
    LOGIN_IS_DISABLED,
    LOGIN_VIA_CREDENTIALS_IS_DISABLED,
    LOGIN_VIA_INVITE_CODE_IS_DISABLED,
    UNKNOWN_LOGIN_METHOD,
    USERNAME_INVALID,
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
        case AuthError.LOGIN_IS_DISABLED:
            return "Login is disabled";
        case AuthError.LOGIN_VIA_CREDENTIALS_IS_DISABLED:
            return "Login via Credentials is disabled";
        case AuthError.LOGIN_VIA_INVITE_CODE_IS_DISABLED:
            return "Login via Invite Code is disabled";
        case AuthError.UNKNOWN_LOGIN_METHOD:
            return "Unknown Login Method";
        case AuthError.USERNAME_INVALID:
            return "Username invalid";
    }
}
