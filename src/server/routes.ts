import express, { Express } from "express";
import { getAuthRouter, setupAuth } from "./routes/auth";
import { getApiRouter } from "./routes/api";
import { ensureHasRole, Role } from "./database/entity/user";
import { getAdminRouter } from "./routes/admin";
import { getCacheRouter } from "./routes/cache";

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
        ensureLoggedInOr404(),
        getApiRouter(),
    );
    app.use("/auth", getAuthRouter());
    app.use("/cache", getCacheRouter());
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

export function ensureLoggedInOr404(): express.RequestHandler {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.sendStatus(401);
        }
        next();
    };
}
