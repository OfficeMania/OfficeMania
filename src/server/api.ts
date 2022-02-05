import { Router } from "express";
import { User } from "./database/entities/user";

const router: Router = Router();

setupRouter();

export function getApiRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.get("/test", (req, res) => res.sendStatus(200));
    router.get("/user/:id", (req, res) => {
        const id: string = req.params.id;
        User.findOne(id)
            .then((user: User) => {
                if (!user) {
                    return res.sendStatus(404);
                }
                res.json({ id: user.id, username: user.username, role: user.role });
            })
            .catch(() => res.sendStatus(500));
    });
}
