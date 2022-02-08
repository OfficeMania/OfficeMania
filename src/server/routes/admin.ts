import express, { Router } from "express";

const router: Router = Router();

setupRouter();

export function getAdminRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.use("/config", express.static("admin/config.html"));
    //router.use("/invites", express.static("admin/invites.html")); //TODO
    router.use("/monitor", express.static("admin/monitor.html"));
    router.use("/users", express.static("admin/users.html")); //TODO Edit Users in a Modal
}
