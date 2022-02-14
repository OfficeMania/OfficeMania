import { Router } from "express";
import { getApiUsersRouter } from "./api/users";
import { getApiConfigsRouter } from "./api/configs";
import { ensureHasRole, Role } from "../database/entity/user";

const router: Router = Router();

setupRouter();

export function getApiRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.use("/users", ensureHasRole(Role.ADMIN), getApiUsersRouter());
    router.use("/configs", ensureHasRole(Role.ADMIN), getApiConfigsRouter());
    router.get("/test", (req, res) => res.sendStatus(200));
}
