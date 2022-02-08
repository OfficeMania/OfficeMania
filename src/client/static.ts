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
export const settingsButton = $<HTMLButtonElement>("button-settings");
export const adminConfigButton = $<HTMLButtonElement>("button-admin-config");
export const welcomeModal = $<HTMLDivElement>("welcome-modal");
export const helpButton = $<HTMLButtonElement>("button-help");
export const usersButton = $<HTMLButtonElement>("button-users");
export const textchatButton = $<HTMLButtonElement>("button-textchat");
export const loginButton = $<HTMLButtonElement>("button-login");
export const logoutButton = $<HTMLButtonElement>("button-logout");
export const textchatSendButton = $<HTMLButtonElement>("button-send");
export const textchatContainer = $<HTMLUListElement>("textchat-container");
export const textchatBar = $<HTMLDivElement>("messages-bar");
export const textchatMenuButton = $<HTMLButtonElement>("button-chat-menu");
export const textchatUsers = $<HTMLSelectElement>("select-users");
export const textchatSelect = $<HTMLSelectElement>("select-textchat");
export const textchatArea = $<HTMLTextAreaElement>("typing-field");
export const textchatDropdownChatsButton = $<HTMLButtonElement>("button-chat-list");
export const textchatDropdownChats = $<HTMLUListElement>("dropdown-chat-list");
export const textchatDropdownUsersButton = $<HTMLButtonElement>("button-user-list");
export const textchatDropdownUsers = $<HTMLUListElement>("dropdown-user-list");
export const textchatDropdownNewChat = $<HTMLElement>("textchat-create-new");
export const textchatDropdownAddUsers = $<HTMLElement>("textchat-add-to-chat");
export const interactiveBarChess = $<HTMLDivElement>("interactive-bar-chess");
export const chessExportButton = $<HTMLButtonElement>("button-chess-export");
export const chessImportButton = $<HTMLButtonElement>("button-chess-import");
export const settingsOkButton = $<HTMLButtonElement>("button-settings-ok");
export const settingsCancelButton = $<HTMLButtonElement>("button-settings-cancel");
export const settingsApplyButton = $<HTMLButtonElement>("button-settings-apply");
export const usernameInput = $<HTMLInputElement>("input-settings-username");
export const usernameInputWelcome = $<HTMLInputElement>("input-welcome-username");
export const displayNameInput = $<HTMLInputElement>("input-settings-display-name");
export const welcomeOkButton = $<HTMLButtonElement>("button-welcome-ok");
export const characterSelect = $<HTMLSelectElement>("character-select");
export const characterPreview = $<HTMLSelectElement>("character-preview");
export const helpExitButton = $<HTMLSelectElement>("button-help-ok");
export const interactiveWhiteboardCanvas = $<HTMLCanvasElement>("interactive-whiteboard-canvas");
export const interactivePongCanvas = $<HTMLCanvasElement>("interactive-pong-canvas");
export const interactiveChessCanvas = $<HTMLCanvasElement>("interactive-chess-canvas");
export const interactiveCanvas = $<HTMLCanvasElement>("interactive");
export const backpackCanvas = $<HTMLCanvasElement>("backpack");
export const canvas = $<HTMLCanvasElement>("canvas");
export const background = $<HTMLCanvasElement>("background");
export const foreground = $<HTMLCanvasElement>("foreground");
export const spriteSheet = $<HTMLCanvasElement>("spriteSheet");
export const doors = $<HTMLCanvasElement>("doors");
export const saveButton = $<HTMLButtonElement>("button-whiteboard-save");
export const clearButton = $<HTMLButtonElement>("button-whiteboard-clear");
export const eraserButton = $<HTMLButtonElement>("button-whiteboard-eraser");
export const penButton = $<HTMLButtonElement>("button-whiteboard-pen");
export const colorSelector = $<HTMLSelectElement>("whiteboard-color-selector");
export const size5Button = $<HTMLButtonElement>("button-whiteboard-size5");
export const size10Button = $<HTMLButtonElement>("button-whiteboard-size10");
export const whiteboardPanel = $<HTMLDivElement>("interactive-bar-whiteboard");

// @ts-ignore
export const bsWelcomeModal = new bootstrap.Modal(document.getElementById('welcome-modal'));
