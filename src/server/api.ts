import { Router } from "express";

const router: Router = Router();

setupRouter();

export function getApiRouter(): Router {
    return router;
}

function setupRouter(): void {
    //TODO
}
