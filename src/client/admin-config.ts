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

const buttonConfigApply: HTMLButtonElement = $("button-config-apply");
const buttonConfigReset: HTMLButtonElement = $("button-config-reset");

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

buttonConfigReset.addEventListener("click", () => load());

const apiEndpoint = "/api";
const configEndpoint = apiEndpoint + "/config";

function loadValue(key: string): Promise<string | undefined> {
    return fetch(`${configEndpoint}?key=${key}`).then(response => response.json()).then(response => response.value).catch(reason => console.warn(reason));
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
    await Promise.all([loadEnableLogin(), loadRequireLogin(), loadAllowLoginViaInviteCode(), loadEnableSignup(), loadRequireInviteCodeForSignup()])
    updateGroups();
}

function apply(): void {
    //TODO Apply Settings
}

load().catch(reason => console.error(reason));
