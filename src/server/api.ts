import { Router } from "express";
import { ensureHasRole, Role, User } from "./database/entity/user";
import { createOrUpdate } from "./database/database";
import { ConfigEntry } from "./database/entity/config-entry";
import { getManager } from "typeorm";

const router: Router = Router();

setupRouter();

export function getApiRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.get("/test", (req, res) => res.sendStatus(200));
    router.get("/user/:id", ensureHasRole(Role.ADMIN), (req, res) => {
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
    router.get("/config", ensureHasRole(Role.ADMIN), (req, res) => {
        const key = req.query.key;
        if (!key) {
            return ConfigEntry.find()
                .then(configEntries => res.send(configEntries))
                .catch(reason => res.status(500).send(reason));
        }
        ConfigEntry.findOne(String(key))
            .then(configEntry => (configEntry ? res.send(configEntry) : res.sendStatus(404)))
            .catch(reason => res.status(500).send(reason));
    });
    router.put("/config", ensureHasRole(Role.ADMIN), (req, res) => {
        const key: string | undefined = req.query.key ? String(req.query.key) : undefined;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        const type: number | undefined = req.query.type ? Number(req.query.type) : undefined;
        if (!type) {
            return res.status(500).send("Missing query parameter 'type'");
        }
        const value: string | null = req.query.value ? String(req.query.value) : null;
        createOrUpdate(getManager(), ConfigEntry, { key, type, value })
            .then(configEntry => res.send(configEntry))
            .catch(reason => res.status(500).send(reason));
    });
    router.patch("/config", ensureHasRole(Role.ADMIN), (req, res) => {
        const key: string | undefined = req.query.key ? String(req.query.key) : undefined;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        const type: number | undefined = req.query.type ? Number(req.query.type) : undefined;
        const value: string | null = req.query.value ? String(req.query.value) : null;
        createOrUpdate(getManager(), ConfigEntry, { key, type, value })
            .then(configEntry => res.send(configEntry))
            .catch(reason => res.status(500).send(reason));
    });
    router.delete("/config", ensureHasRole(Role.ADMIN), (req, res) => {
        const key = req.query.key;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        ConfigEntry.findOne(String(key))
            .then(configEntry =>
                configEntry ? configEntry.remove().then(value => res.send(value)) : res.sendStatus(404)
            )
            .catch(reason => res.status(500).send(reason));
    });
}
