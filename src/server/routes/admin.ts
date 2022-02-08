import express, { Router } from "express";

const router: Router = Router();

setupRouter();

export function getAdminRouter(): Router {
    return router;
}

function setupRouter(): void {
    //router.use("/users", getAdminUsersRouter()); //TODO
    //router.use("/config", getAdminConfigRouter()); //TODO
    router.use("/monitor", express.static("admin/monitor.html"));
    router.use("/users", express.static("admin/users.html"));
}
