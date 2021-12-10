export const version: number = 1;

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

export const loadingCat = $<HTMLCanvasElement>("loading-cat");
export const loadingScreen = $<HTMLCanvasElement>("loading-screen");
export const panelButtonsInteraction = $<HTMLDivElement>("panel-buttons-interaction");
export const helpFooter = $<HTMLDivElement>("help-footer");
export const muteButton = $<HTMLButtonElement>("button-mute-audio");
export const camButton = $<HTMLButtonElement>("button-mute-video");
export const shareButton = $<HTMLButtonElement>("button-share-video");
export const settingsModal = $<HTMLDivElement>("settings-modal");
export const welcomeModal = $<HTMLDivElement>("welcome-modal");
export const settingsButton = $<HTMLButtonElement>("button-settings");
export const helpModal = $<HTMLDivElement>("help-modal");
export const helpButton = $<HTMLButtonElement>("button-help");
export const usersButton = $<HTMLButtonElement>("button-users");
export const textchatButton = $<HTMLButtonElement>("button-textchat");
export const textchatSendButton = $<HTMLButtonElement>("button-send");
export const textchatContainer = $<HTMLUListElement>("textchat-container");
export const textchatBar = $<HTMLDivElement>("messages-bar");
export const textchatMenuButton = $<HTMLButtonElement>("button-chat-menu");
export const textchatCreateButton = $<HTMLButtonElement>("button-create-chat");
export const textchatSelect = $<HTMLSelectElement>("select-textchat");
export const textchatArea = $<HTMLTextAreaElement>("typing-field");
export const interactiveBarChess = $<HTMLDivElement>("interactive-bar-chess");
export const chessExportButton = $<HTMLButtonElement>("button-chess-export");
export const chessImportButton = $<HTMLButtonElement>("button-chess-import");
export const settingsOkButton = $<HTMLButtonElement>("button-settings-ok");
export const settingsCancelButton = $<HTMLButtonElement>("button-settings-cancel");
export const settingsApplyButton = $<HTMLButtonElement>("button-settings-apply");
export const usernameInput = $<HTMLInputElement>("input-settings-username");
export const usernameInputWelcome = $<HTMLInputElement>("input-welcome-username");
export const welcomeOkButton = $<HTMLButtonElement>("button-welcome-ok");
export const characterSelect = $<HTMLSelectElement>("character-select");
export const characterPreview = $<HTMLSelectElement>("character-preview");
export const helpExitButton = $<HTMLSelectElement>("button-help-ok");
export const interactiveCanvas = $<HTMLCanvasElement>("interactive");
export const canvas = $<HTMLCanvasElement>("canvas");
export const background = $<HTMLCanvasElement>("background");
export const doors = $<HTMLCanvasElement>("doors");
export const saveButton = $<HTMLButtonElement>("button-whiteboard-save");
export const clearButton = $<HTMLButtonElement>("button-whiteboard-clear");
export const eraserButton = $<HTMLButtonElement>("button-whiteboard-eraser");
export const penButton = $<HTMLButtonElement>("button-whiteboard-pen");
export const size5Button = $<HTMLButtonElement>("button-whiteboard-size5");
export const size10Button = $<HTMLButtonElement>("button-whiteboard-size10");