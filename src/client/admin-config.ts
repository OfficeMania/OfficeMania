export {};

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

const enableLogin: HTMLInputElement = $("config-enable-login");
const requireLogin: HTMLInputElement = $("config-require-login");
const allowLoginViaInviteCode: HTMLInputElement = $("config-allow-login-via-invite-code");
const enableSignup: HTMLInputElement = $("config-enable-signup");
const requireInviteCodeForSignup: HTMLInputElement = $("config-require-invite-code-for-signup");
const needsLogin: HTMLInputElement[] = Array.from(document.getElementsByClassName("group-needs-login")) as HTMLInputElement[];
const needsSignup: HTMLInputElement[] = Array.from(document.getElementsByClassName("group-needs-signup")) as HTMLInputElement[];
const inputElements: HTMLInputElement[] = Array.from(document.getElementsByTagName("input")) as HTMLInputElement[];

const buttonConfigApply: HTMLButtonElement = $("button-config-apply");
const buttonConfigReset: HTMLButtonElement = $("button-config-reset");

const noteUnsavedChanges: HTMLSpanElement = $("note-unsaved-changes");

function updateGroupLogin() {
    for (const element of needsLogin) {
        element.disabled = !enableLogin.checked;
    }
}

function updateGroupSignup() {
    for (const element of needsSignup) {
        element.disabled = !enableSignup.checked;
    }
}

function updateGroups() {
    updateGroupLogin();
    updateGroupSignup();
}

enableLogin.addEventListener("input", () => updateGroupLogin());
enableSignup.addEventListener("input", () => updateGroupSignup());

buttonConfigApply.addEventListener("click", () => apply());
buttonConfigReset.addEventListener("click", () => load());

inputElements.forEach(inputElement => inputElement.addEventListener("input", () => updateCacheState()));

const apiEndpoint = "/api";
const configEndpoint = apiEndpoint + "/config";

let cache: Record<string, string> = {};

function loadValue(key: string): Promise<string | undefined> {
    return fetch(`${configEndpoint}?key=${key}`).then(response => response.json()).then(response => {
        cache[key] = response.value;
        return response.value;
    }).catch(reason => console.warn(reason));
}

async function loadEnableLogin(): Promise<void> {
    enableLogin.checked = await loadValue("ENABLE_LOGIN") === "true";
}

async function loadRequireLogin(): Promise<void> {
    requireLogin.checked = await loadValue("REQUIRE_LOGIN") === "true";
}

async function loadAllowLoginViaInviteCode(): Promise<void> {
    allowLoginViaInviteCode.checked = await loadValue("ALLOW_LOGIN_VIA_INVITE_CODE") === "true";
}

async function loadEnableSignup(): Promise<void> {
    enableSignup.checked = await loadValue("DISABLE_SIGNUP") !== "true";
}

async function loadRequireInviteCodeForSignup(): Promise<void> {
    requireInviteCodeForSignup.checked = await loadValue("REQUIRE_INVITE_CODE_FOR_SIGNUP") === "true";
}

async function load(): Promise<void> {
    cache = {};
    updateCacheState();
    await Promise.all([loadEnableLogin(), loadRequireLogin(), loadAllowLoginViaInviteCode(), loadEnableSignup(), loadRequireInviteCodeForSignup()]);
    updateGroups();
}

function applyValue(key: string, value: string, force = false): Promise<Response | void> {
    if (!force && cache[key] === value) {
        return;
    }
    cache[key] = value;
    return fetch(`${configEndpoint}?key=${key}&value=${value}`, { method: "PATCH" }).catch(reason => console.warn(reason));
}

async function applyEnableLogin(): Promise<void> {
    await applyValue("ENABLE_LOGIN", String(enableLogin.checked));
}

async function applyRequireLogin(): Promise<void> {
    await applyValue("REQUIRE_LOGIN", String(requireLogin.checked));
}

async function applyAllowLoginViaInviteCode(): Promise<void> {
    await applyValue("ALLOW_LOGIN_VIA_INVITE_CODE", String(allowLoginViaInviteCode.checked));
}

async function applyEnableSignup(): Promise<void> {
    await applyValue("DISABLE_SIGNUP", String(!enableSignup.checked));
}

async function applyRequireInviteCodeForSignup(): Promise<void> {
    await applyValue("REQUIRE_INVITE_CODE_FOR_SIGNUP", String(requireInviteCodeForSignup.checked));
}

async function apply(): Promise<void> {
    await Promise.all([applyEnableLogin(), applyRequireLogin(), applyAllowLoginViaInviteCode(), applyEnableSignup(), applyRequireInviteCodeForSignup()]);
    updateCacheState();
}

function areChangesUnsaved(): boolean {
    if (Object.keys(cache).length === 0) {
        return false;
    }
    return cache["ENABLE_LOGIN"] !== String(enableLogin.checked)
        || cache["REQUIRE_LOGIN"] !== String(requireLogin.checked)
        || cache["ALLOW_LOGIN_VIA_INVITE_CODE"] !== String(allowLoginViaInviteCode.checked)
        || cache["DISABLE_SIGNUP"] !== String(!enableSignup.checked)
        || cache["REQUIRE_INVITE_CODE_FOR_SIGNUP"] !== String(requireInviteCodeForSignup.checked);
}

function updateCacheState(): void {
    const changesUnsaved: boolean = areChangesUnsaved();
    noteUnsavedChanges.hidden = !changesUnsaved;
}

load().catch(reason => console.error(reason));
