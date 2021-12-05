import { Express, Router } from "express";
import passport from "passport";
import { DISABLE_SIGNUP, IS_DEV, LDAP_OPTIONS } from "./config";
import path from "path";
import connectionEnsureLogin from "connect-ensure-login";
import { createUser, findUserByUsername } from "./user";

export const router: Router = Router();

export function setupAuth(app: Express): void {
    if (IS_DEV) {
        app.use((req, res, next) => {
            req.isAuthenticated = () => true;
            next();
        });
    }
    app.post(
        "/auth/login",
        passport.authenticate(LDAP_OPTIONS ? "ldapauth" : "local", {
            successRedirect: "/",
            failureRedirect: "/auth/login",
            failureFlash: true,
        })
    );
    app.get("/auth/login.css", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.css")));
    app.get("/auth/login", (req, res) => res.sendFile(path.join(process.cwd(), "public", "login.html")));

    if (!DISABLE_SIGNUP) {
        app.post("/auth/signup", connectionEnsureLogin.ensureLoggedOut(), (req, res, next) => {
            const username: string = req.body.username;
            const password: string[] = req.body.password;
            if (password.length !== 2 || password[0] !== password[1]) {
                return res.redirect("/auth/login");
            }
            findUserByUsername(username).then(user => {
                if (user) {
                    return;
                }
                return createUser(username, password[0]);
            });
            return res.redirect("/auth/login");
        });
        app.get("/auth/signup", (req, res) => res.sendFile(path.join(process.cwd(), "public", "signup.html")));
    }

    app.get("/auth/logout", (req, res) => {
        req.logout();
        res.redirect("/");
    });

    //app.use("/auth", router);
}
