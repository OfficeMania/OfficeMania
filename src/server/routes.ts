import express, { Express } from "express";
import { getAuthRouter, setupAuth } from "./routes/auth";
import { getApiRouter } from "./routes/api";
import { ensureHasRole, Role } from "./database/entity/user";
import { getAdminRouter } from "./routes/admin";
import { getCacheRouter } from "./routes/cache";
import fs from "fs";
import path from "path";

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
    setupVersion(app);
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

function setupVersion(app: Express): void {
    const headPath: string = path.join(process.cwd(), ".git", "HEAD");
    const refPattern: RegExp = /ref: (.+)/;
    const hashPattern: RegExp = /([0-9a-fA-F]+)/;
    let head: string | undefined = undefined;
    if (fs.existsSync(headPath)) {
        let headContent: string = fs.readFileSync(headPath).toString();
        const refMatch: RegExpMatchArray = headContent.match(refPattern);
        if (refMatch && refMatch.length > 0) {
            const refPath: string = path.join(process.cwd(), ".git", refMatch[1]);
            if (fs.existsSync(refPath)) {
                headContent = fs.readFileSync(refPath).toString();
            } else {
                headContent = "";
                console.warn(`File "${refPath}" does not exist`);
            }
        }
        const hashMatch: RegExpMatchArray = headContent.match(hashPattern);
        if (hashMatch && hashMatch.length > 0) {
            head = hashMatch[1];
        }
    } else {
        console.warn(`File "${headPath}" does not exist`);
    }
    app.use("/version", (req, res) => {
        if (!head) {
            return res.status(404).send({});
        }
        res.send({ head, repo: process.env.GIT_REPO });
    });
}
