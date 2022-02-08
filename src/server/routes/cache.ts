import { Router } from "express";
import path from "path";
import fs from "fs";

const fetch = require("node-fetch");

const router: Router = Router();

setupRouter();

export function getCacheRouter(): Router {
    return router;
}

function setupRouter(): void {
    setup("bootstrap.min.css", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css");
    setup("bootstrap.bundle.min.js", "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js");
    setup("fontawesome/css/all.css", "https://use.fontawesome.com/releases/v5.15.4/css/all.css");
    router.get("/fontawesome/*", (req, res, next) => {
        const subPath: string = req.url.substring("/fontawesome/".length);
        return res.redirect(`https://use.fontawesome.com/releases/v5.15.4/${subPath}`);
    });
}

function setup(name: string, source: string, maxAge = 86400000): void {
    const filePath: string = path.join(process.cwd(), "cache", name);
    const parentPath: string = filePath.substring(0, Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")));
    router.get(`/${name}`, (req, res) => res.sendFile(filePath, { maxAge }));
    if (!fs.existsSync(parentPath)) {
        fs.mkdirSync(parentPath, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fetch(source)
            .then(response => response.text())
            .then(data => {
                fs.writeFileSync(filePath, data);
                console.debug(`Cached ${name} ${data.length / 1000} KB from ${source}`);
            })
            .catch(reason => console.error(`Failed to cache ${name} from ${source}`, reason));
    }
}
