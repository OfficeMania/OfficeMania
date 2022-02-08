import express, { Router } from "express";

const router: Router = Router();

setupRouter();

export function getAdminRouter(): Router {
    return router;
}

function setupRouter(): void {
    //router.use("/users", getAdminUsersRouter()); //TODO
    //router.use("/config", getAdminConfigRouter()); //TODO
    router.use("/config", express.static("admin/config.html"));
    router.use("/", express.static("admin"));
}
