import { Router } from "express";
import {
    getLoginInfo,
    IS_DEV,
    isLoginEnabled,
    isLoginViaCredentialsAllowed,
    isLoginViaInviteCodeAllowed,
    LDAP_OPTIONS,
} from "../../config";
import passport from "passport";
import path from "path";
import { AuthError, authErrorToString, InviteCodeToken } from "../../../common";
import { InviteCode } from "../../database/entity/invite-code";
import { generateInviteCodeToken } from "../auth";

const router: Router = Router();

setupRouter();

export function getAuthLoginRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.post("/", async (req, res, next) => {
        if (!(await isLoginEnabled())) {
            return res.status(500).send({
                error: AuthError.LOGIN_IS_DISABLED,
                errorMessage: authErrorToString(AuthError.LOGIN_IS_DISABLED),
            });
        }
        const loggingInViaCredentials: boolean = req.body["password"] !== undefined;
        const loggingInViaInviteCode: boolean = req.body["invite-code"] !== undefined;
        const allowLoginViaCredentials: boolean = await isLoginViaCredentialsAllowed();
        const allowLoginViaInviteCode: boolean = await isLoginViaInviteCodeAllowed();
        if (loggingInViaCredentials && !allowLoginViaCredentials) {
            return res.status(500).send({
                error: AuthError.LOGIN_VIA_CREDENTIALS_IS_DISABLED,
                errorMessage: authErrorToString(AuthError.LOGIN_VIA_CREDENTIALS_IS_DISABLED),
            });
        }
        if (loggingInViaInviteCode && !allowLoginViaInviteCode) {
            return res.status(500).send({
                error: AuthError.LOGIN_VIA_INVITE_CODE_IS_DISABLED,
                errorMessage: authErrorToString(AuthError.LOGIN_VIA_INVITE_CODE_IS_DISABLED),
            });
        }
        if (loggingInViaInviteCode) {
            const inviteCodeString: string = req.body["invite-code"];
            const inviteCode: InviteCode | undefined = await InviteCode.findOne({ where: { code: inviteCodeString } });
            if (!inviteCode) {
                return res.status(500).send({
                    error: AuthError.INVALID_INVITE_CODE,
                    errorMessage: authErrorToString(AuthError.INVALID_INVITE_CODE),
                });
            }
            if (inviteCode.usagesLeft === 0) {
                return res.status(500).send({
                    error: AuthError.INVITE_CODE_EXPIRED,
                    errorMessage: authErrorToString(AuthError.INVITE_CODE_EXPIRED),
                });
            }
            if (inviteCode.expiration && (inviteCode.expiration.getTime() < new Date().getTime())) {
                return res.status(500).send({
                    error: AuthError.INVITE_CODE_EXPIRED,
                    errorMessage: authErrorToString(AuthError.INVITE_CODE_EXPIRED),
                });
            }
            inviteCode.usages++;
            if (inviteCode.usagesLeft > 0) {
                inviteCode.usagesLeft--;
            }
            await inviteCode.save();
            const inviteCodeToken: InviteCodeToken = generateInviteCodeToken();
            req.session.inviteCodeToken = inviteCodeToken.token;
            return res.send({ user: true });
        }
        if (!loggingInViaCredentials) {
            return res.status(500).send({
                error: AuthError.UNKNOWN_LOGIN_METHOD,
                errorMessage: authErrorToString(AuthError.UNKNOWN_LOGIN_METHOD),
            });
        }
        passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", (error, user, info) => {
            if (error) {
                return res.status(500).send({
                    error: AuthError.UNKNOWN,
                    errorMessage: IS_DEV ? JSON.stringify(error) : authErrorToString(AuthError.UNKNOWN),
                });
            }
            if (!user) {
                return res.status(500).send({
                    error: AuthError.INVALID_CREDENTIALS,
                    errorMessage: authErrorToString(AuthError.INVALID_CREDENTIALS),
                });
            }
            req.logIn(user, function(error) {
                if (error) {
                    return res.status(500).send({
                        error: AuthError.UNKNOWN,
                        errorMessage: IS_DEV ? JSON.stringify(error) : authErrorToString(AuthError.UNKNOWN),
                    });
                }
                return res.send({ user });
            });
        })(req, res, next);
    });
    router.get("/", async (req, res) => {
            if (!(await isLoginEnabled())) {
                return res.redirect("/");
            }
            res.sendFile(path.join(process.cwd(), "public", "login.html"));
        },
    );
    router.get("/info", async (req, res) => res.send(await getLoginInfo()));
}
