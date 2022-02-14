import { Router } from "express";
import { ConfigEntry } from "../../database/entity/config-entry";
import { getValueOrDefault } from "../../config";
import { convertOrNull } from "../../../common";
import { createOrUpdate } from "../../database/database";
import { getManager } from "typeorm";

const router: Router = Router();

setupRouter();

export function getApiConfigsRouter(): Router {
    return router;
}

function setupRouter(): void {
    router.get("/", async (req, res) => {
        const key = req.query.key;
        if (!key) {
            return ConfigEntry.find()
                .then(configEntries => res.send(configEntries))
                .catch(reason => res.status(500).send(reason));
        }
        const value: string | undefined = await getValueOrDefault(String(key));
        if (value === undefined) {
            return res.sendStatus(404);
        }
        return res.send({ key, value });
    });
    router.put("/", (req, res) => {
        const key: string | undefined = req.query.key ? String(req.query.key) : undefined;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        const type: number | undefined = req.query.type ? Number(req.query.type) : undefined;
        if (!type) {
            return res.status(500).send("Missing query parameter 'type'");
        }
        const value: string | null = convertOrNull(req.query.value, String);
        console.debug(`PUT    "${key}" => "${value}"`);
        createOrUpdate(getManager(), ConfigEntry, { key, type, value })
            .then(configEntry => res.send(configEntry))
            .catch(reason => res.status(500).send(reason));
    });
    router.patch("/", (req, res) => {
        const key: string | undefined = req.query.key ? String(req.query.key) : undefined;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        const type: number | undefined = req.query.type ? Number(req.query.type) : undefined;
        const value: string | null = convertOrNull(req.query.value, String);
        console.debug(`PATCH  "${key}" => "${value}"`);
        createOrUpdate(getManager(), ConfigEntry, { key, type, value })
            .then(configEntry => res.send(configEntry))
            .catch(reason => res.status(500).send(reason));
    });
    router.delete("/", (req, res) => {
        const key = req.query.key;
        if (!key) {
            return res.status(500).send("Missing query parameter 'key'");
        }
        console.debug(`DELETE "${key}"`);
        ConfigEntry.findOne(String(key))
            .then(configEntry =>
                configEntry ? configEntry.remove().then(value => res.send(value)) : res.sendStatus(404),
            )
            .catch(reason => res.status(500).send(reason));
    });
}
