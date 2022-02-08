import express, { Express } from "express";
import { getAuthRouter, setupAuth } from "./routes/auth";
import { getApiRouter } from "./routes/api";
import { ensureHasRole, Role } from "./database/entity/user";
import { getAdminRouter } from "./routes/admin";

export async function setupRoutes(app: Express): Promise<void> {
    await setupAuth(app);
    app.use(
        "/admin",
        ensureLoggedIn(),
        ensureHasRole(Role.ADMIN),
        getAdminRouter(),
    );
    app.use(
        "/api",
        (req, res, next) => {
            if (!req.isAuthenticated || !req.isAuthenticated()) {
                return res.sendStatus(401);
            }
            next();
        },
        getApiRouter(),
    );
    app.use("/auth", getAuthRouter());
}

export function ensureLoggedIn(setReturnTo = true): express.RequestHandler {
    const pathname = "/auth/login";
    return function(req, res, next) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            if (!setReturnTo) {
                return res.redirect(pathname);
            }
            // @ts-ignore
            const urlParameters = new URLSearchParams({
                returnTo: req.originalUrl || "/",
            });
            return res.redirect(`${pathname}?${urlParameters}`);
        }
        next();
    };
}
