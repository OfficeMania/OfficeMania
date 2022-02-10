import { Router } from "express";
import path from "path";
import fs from "fs";
import * as url from "url";

const fetch = require("node-fetch");

const router: Router = Router();

setupRouter().catch(reason => console.error(reason));

export function getCacheRouter(): Router {
    return router;
}

async function setupRouter(): Promise<void> {
    await setupCache("https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
    await setupCache("https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js");
    await setupCache("https://use.fontawesome.com/releases/v5.15.4/css/all.css", true);
}

async function setupCache(source: url.URL | string, recursive = false, maxAge = 86400000): Promise<void> {
    if (typeof source === "string") {
        source = new url.URL(source);
    }
    const nameRaw: string = source.host + source.pathname;
    const nameSanitized: string = nameRaw.replace(/[^a-z0-9.\-@/]/gi, "_");
    router.get(`/${nameSanitized}`, (req, res) => {
        if (!fs.existsSync(filePath)) {
            return res.redirect(source.toString());
        }
        res.sendFile(filePath, { maxAge });
    });
    if (recursive) {
        setupRecursiveRedirect(source);
    }
    const filePath: string = path.join(process.cwd(), "cache", nameSanitized);
    const parentPath: string = filePath.substring(0, Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")));
    if (!fs.existsSync(parentPath)) {
        fs.mkdirSync(parentPath, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        const data: string | undefined = await fetch(source)
            .then(response => response.text())
            .catch(reason => console.error(`Failed to cache ${nameSanitized} from ${source}`, reason));
        if (data) {
            fs.writeFileSync(filePath, data);
            console.debug(`Cached ${nameSanitized} ${data.length / 1000} KB from ${source}`);
        }
    }
}

function setupRecursiveRedirect(source: url.URL): void {
    const prefix: string = `/${source.host}/`;
    const prefixLength: number = prefix.length;
    router.get(prefix + "*", (req, res) => {
        const subPath: string = req.url.substring(prefixLength);
        return res.redirect(`${source.protocol}//${source.host}/${subPath}`);
    });
}
