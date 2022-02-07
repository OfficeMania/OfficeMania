export {};

const enableLogin: HTMLInputElement = <HTMLInputElement>document.getElementById("config-enable-login");
const enableSignup: HTMLInputElement = <HTMLInputElement>document.getElementById("config-enable-signup");
const needsLogin: HTMLInputElement[] = Array.from(document.getElementsByClassName("group-needs-login")) as HTMLInputElement[];
const needsSignup: HTMLInputElement[] = Array.from(document.getElementsByClassName("group-needs-signup")) as HTMLInputElement[];

enableLogin.addEventListener("click", () => {
    for (const element of needsLogin) {
        element.disabled = !enableLogin.checked;
    }
});

enableSignup.addEventListener("click", () => {
    for (const element of needsSignup) {
        element.disabled = !enableSignup.checked;
    }
});
