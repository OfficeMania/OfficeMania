function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

export const loadingScreen = $<HTMLCanvasElement>("loading-screen");
export const panelButtonsInteraction = $<HTMLDivElement>("panel-buttons-interaction");
export const helpFooter = $<HTMLDivElement>("help-footer");
export const muteButton = $<HTMLButtonElement>("button-mute-audio");
export const camButton = $<HTMLButtonElement>("button-mute-video");
export const shareButton = $<HTMLButtonElement>("button-share-video");
export const settingsModal = $<HTMLDivElement>("settings-modal");
export const settingsButton = $<HTMLButtonElement>("button-settings");
export const helpModal = $<HTMLDivElement>("help-modal");
export const helpButton = $<HTMLButtonElement>("button-help");
export const usersButton = $<HTMLButtonElement>("button-users");
export const settingsOkButton = $<HTMLButtonElement>("button-settings-ok");
export const settingsCancelButton = $<HTMLButtonElement>("button-settings-cancel");
export const settingsApplyButton = $<HTMLButtonElement>("button-settings-apply");
export const usernameInput = $<HTMLInputElement>("input-settings-username");
export const characterSelect = $<HTMLSelectElement>("character-select");
export const characterPreview = $<HTMLSelectElement>("character-preview");
export const helpExitButton = $<HTMLSelectElement>("button-help-ok");
export const interactiveCanvas = $<HTMLCanvasElement>("interactive");
export const canvas = $<HTMLCanvasElement>("canvas");
export const background = $<HTMLCanvasElement>("background");
