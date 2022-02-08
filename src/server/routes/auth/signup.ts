import { Router } from "express";
import { IS_DEV, isInviteCodeRequiredForSignup, isSignupDisabled } from "../../config";
import { InviteCode } from "../../database/entity/invite-code";
import { createUser, User } from "../../database/entity/user";
import path from "path";
import { AuthError, authErrorToString } from "../../../common";

const router: Router = Router();

setupRouter();

export function getAuthSignupRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.post("/", async (req, res) => {
        if (await isSignupDisabled()) {
            return res.sendStatus(404);
        }
        const username: string = req.body.username;
        const password: string[] = req.body.password;
        const inviteCodeString: string | undefined = req.body["invite-code"];
        if (password.length !== 2 || password[0] !== password[1]) {
            return res.status(500).send({
                error: AuthError.PASSWORDS_MISMATCH,
                errorMessage: authErrorToString(AuthError.PASSWORDS_MISMATCH),
            });
        }
        if ((await isInviteCodeRequiredForSignup()) && !inviteCodeString) {
            return res.status(500).send({
                error: AuthError.INVITE_CODE_REQUIRED,
                errorMessage: authErrorToString(AuthError.INVITE_CODE_REQUIRED),
            });
        } else if (inviteCodeString) {
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
            inviteCode.usages++;
            if (inviteCode.usagesLeft > 0) {
                inviteCode.usagesLeft--;
            }
            await inviteCode.save();
        }
        User.findOne({ where: { username } })
            .then(user => {
                if (user) {
                    return { user: undefined, error: AuthError.USERNAME_TAKEN };
                }
                return createUser(username, password[0]).then(user => ({ user })).catch(reason => {
                    console.error(reason);
                    return {
                        user: undefined,
                        error: AuthError.USER_CREATION_FAILED,
                        errorMessage: IS_DEV ? JSON.stringify(reason) : authErrorToString(AuthError.USER_CREATION_FAILED),
                    };
                });
            })
            .then((wrapper: { user?: User, error?: AuthError, errorMessage?: string }) => {
                const user: User | undefined = wrapper.user;
                const error: AuthError | undefined = wrapper.error;
                const errorMessage: string | undefined = wrapper.errorMessage;
                if (error) {
                    return res.status(500).send({ error, errorMessage: errorMessage ?? authErrorToString(error) });
                }
                if (user) {
                    return res.send({ user });
                } else {
                    res.status(500).send({
                        error: AuthError.UNKNOWN,
                        errorMessage: authErrorToString(AuthError.UNKNOWN),
                    });
                }
            })
            .catch(reason => {
                console.error(reason);
                res.status(500).send({
                    error: AuthError.UNKNOWN,
                    errorMessage: IS_DEV ? JSON.stringify(reason) : authErrorToString(AuthError.UNKNOWN),
                });
            });
    });
    router.get("/", async (req, res) => {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.redirect("/");
        }
        if (await isSignupDisabled()) {
            return res.redirect("/auth/login");
        }
        res.sendFile(path.join(process.cwd(), "public", "signup.html"));
    });
}
