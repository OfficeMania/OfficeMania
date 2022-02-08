import { Router } from "express";
import { getLoginInfo, IS_DEV, isLoginEnabled, LDAP_OPTIONS } from "../../config";
import passport from "passport";
import path from "path";
import { AuthError, authErrorToString } from "../../../common";

const router: Router = Router();

setupRouter();

export function getAuthLoginRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.post("/", async (req, res, next) => {
        if (!(await isLoginEnabled())) {
            return res.sendStatus(404);
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
