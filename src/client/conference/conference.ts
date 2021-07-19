//import {JitsiMeetJS} from "./lib-jitsi-meet.min";

import {
    appendIcon,
    canSeeEachOther,
    createPlayerAvatar,
    getChatEnabled,
    getCollisionInfo,
    getCorrectedPlayerCoordinates,
    getOurPlayer,
    getPlayerByParticipantId,
    getPlayers,
    getRoom,
    PlayerRecord,
    removeChildren
} from "../util";
import {SelfUser, User} from "./entities";
import {Room} from "colyseus.js";
import {setAudioButtonMute, setSwitchToDesktop, setVideoButtonMute} from "../main";
import {solidInfo} from "../map";
import {Player} from "../player";
import {MessageType} from "../../common/util";

export {
    init as initConference,
    trackTypeAudio,
    trackTypeVideo,
    trackTypeDesktop
};

// @ts-ignore
const JitsiMeetJSIntern = JitsiMeetJS;

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

// Constants

const trackTypeAudio = "audio";
const trackTypeVideo = "video";
const trackTypeDesktop = "desktop";

const deviceDirectionOutput = "output";
const deviceDirectionInput = "input";

const deviceTypeAudio = "audio";
const deviceTypeVideo = "video";

const deviceKindAudioOutput = deviceTypeAudio + deviceDirectionOutput;
const deviceKindAudioInput = deviceTypeAudio + deviceDirectionInput;
const deviceKindVideoInput = deviceTypeVideo + deviceDirectionInput;

const audioBar = $<HTMLDivElement>("audio-bar");
const videoBar = $<HTMLDivElement>("video-bar");
const focusBar = $<HTMLDivElement>("focus-bar");

const audioInputSelect = $<HTMLSelectElement>("audio-input-select");
const audioOutputSelect = $<HTMLSelectElement>("audio-output-select");

const playerOnlineContainer = $<HTMLUListElement>("player-online-container");
const playerOnlineList = $<HTMLUListElement>("player-online-list");

const chatContainer = $<HTMLDivElement>("chat-container");
const chatList = $<HTMLDivElement>("chat-list");

const selfUser = new SelfUser(audioBar, videoBar, focusBar);
const users: User[] = [];

let showParticipantsTab = false;

// Options

function conferenceData() {
    return getRoom().state.conference;
}

function optionsHosts() {
    return {
        domain: "8x8.vc",
        muc: `conference.${conferenceData().id}.8x8.vc`,
        focus: "focus.8x8.vc"
    };
}

function optionsConnection() {
    return {
        hosts: optionsHosts(),
        serviceUrl: "wss://8x8.vc/xmpp-websocket?room=" + conferenceData().id,
        clientNode: "https://jitsi.org/jitsimeet"
    };
}

const optionsConference = {
    enableLayerSuspension: true,
    p2p: {
        enabled: false
    }
};

const optionsInit = {
    disableAudioLevels: true,
};

const optionsAudioTrack = {
    devices: [trackTypeAudio]
}

const optionsCamTrack = {
    devices: [trackTypeVideo],
    maxFps: 30,
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            width: { min: 1024, ideal: 1280, max: 1920 },
            height: { min: 576, ideal: 720, max: 1080 }
        }
    }
}

const optionsDesktopTrack = {
    devices: [trackTypeDesktop],
    desktopSharingFrameRate: {
        max: 30
    }
}

// Variables

let serverRoom: Room = null;

let connection = null;
let isJoined = false;
let conference = null;

// Callbacks

/**
 * This is called when the device list has changed.
 */
function onDeviceListChanged(devices) {
    console.debug('Current Devices: ' + devices); //DEBUG
}

/**
 * This is called after a connection failed to establish
 */
function onConnectionFailed() {
    console.error('Connection to Jitsi Server Failed!');
}

/**
 * This is called after successfully establishing a connection
 */
function onConnectionSuccess() {
    conference = connection.initJitsiConference(conferenceData().id, optionsConference);
    //conference.setStartMutedPolicy({audio: true});
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_ADDED, onTrackAdded);
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_REMOVED, onTrackRemoved);
    conference.on(JitsiMeetJSIntern.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    conference.on(JitsiMeetJSIntern.events.conference.CONFERENCE_LEFT, onConferenceLeft); //TODO Verify that this event exists
    conference.on(JitsiMeetJSIntern.events.conference.USER_JOINED, onUserJoined);
    conference.on(JitsiMeetJSIntern.events.conference.USER_LEFT, onUserLeft);
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_MUTE_CHANGED, track => console.debug(`${track.isLocal() ? "Local" : "Remote"} '${track.getType()}' is muted: ${track.isMuted()}`)); //DEBUG
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`)); //DEBUG
    conference.on(JitsiMeetJSIntern.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`)); //DEBUG
    conference.on(JitsiMeetJSIntern.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${conference.getPhoneNumber()} - ${conference.getPhonePin()}`)); //DEBUG //REMOVE
    conference.on(JitsiMeetJSIntern.events.conference.MESSAGE_RECEIVED, onMessageReceived);
    if (conferenceData().password) {
        conference.join(conferenceData().password);
    } else {
        conference.join();
    }
    users.forEach(user => user.conference = conference);
    selfUser.conference = conference;
    selfUser.participantId = conference.myUserId();
    console.debug("participantId:", selfUser.participantId)
    serverRoom.send(MessageType.UPDATE_PARTICIPANT_ID, selfUser.participantId);
}

/**
 * This is called after a connection has been closed
 */
function onDisconnected() {
    console.debug('Disconnected from Jitsi Server');
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
}

/**
 * This is called when a conference has been joined.
 */
function onConferenceJoined() {
    console.debug('Conference joined'); //DEBUG
    isJoined = true;
    selfUser.addToConference();
    //toggleMuteByType("video");
    //toggleMuteByType("audio");
}

/**
 * This is called when a conference has been left.
 */
function onConferenceLeft() {
    console.debug('Conference left'); //DEBUG
    isJoined = false;
}

function onTrack(track, onLocal, onRemote) {
    if (track.isLocal()) {
        if (onLocal) {
            onLocal(track);
        }
    } else {
        if (onRemote) {
            onRemote(track);
        }
    }
}

function onMessageReceived(participantId: string, message: string, ts: number) {
    console.debug(`participantId: ${participantId}, ts: ${ts}, message: ${message}`); //DEBUG
    if (!getChatEnabled()) {
        return;
    }
    const chatItem = createChatItem(getUser(participantId), message);
    if (chatItem) {
        ensureChatAppend();
        chatList.append(chatItem);
    }
}

function onLocalTrackCreated(track) {
    console.debug(`Local Track added: ${track}`); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Local: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_MUTE_CHANGED, () => console.debug('Local Track Mute changed')); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Local Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
}

function onTrackAdded(track) {
    onTrack(track, undefined, onRemoteTrackAdded);
}

/**
 * Handles remote tracks.
 *
 * @param track JitsiTrack object
 */
function onRemoteTrackAdded(track): void {
    console.debug(`Remote Track added: ${track}`); //DEBUG
    const participantId = track.getParticipantId();
    const user = getUser(participantId);
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_MUTE_CHANGED, () => onRemoteTrackMuteChanged(track));
    track.addEventListener(JitsiMeetJSIntern.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    if (track.getType() === trackTypeVideo) {
        user.setVideoTrack(track);
    } else {
        user.setAudioTrack(track);
    }
    console.debug(`User is: ${user}`); //DEBUG
}

function onTrackRemoved(track) {
    onTrack(track, onLocalTrackRemoved, onRemoteTrackRemoved);
}

function onLocalTrackRemoved(track) {
    console.debug(`Local Track removed: ${track}`); //DEBUG
    selfUser.removeTrack(track);
}

function onRemoteTrackRemoved(track) {
    console.debug(`Remote Track removed: ${track}`); //DEBUG
    getUser(track.getParticipantId())?.removeTrack(track);
}

/*
 *  Checks if muted button was audio or other
 */
function onRemoteTrackMuteChanged(track) {
    console.debug('Remote Track Mute changed'); //DEBUG
    if (track.getType() === trackTypeAudio) {
        //The Audio Element doesn't need to be updated on remote mute change, because it's already silent
        return;
    }
    getUser(track.getParticipantId())?.update();
}

/**
 * This is called when a user has joined.
 *
 * @param participantId
 */
function onUserJoined(participantId) {
    console.debug('User joined: ' + participantId); //DEBUG
    getUser(participantId); // Creates a User with the participantId
}

/**
 * This is called when a user has left.
 *
 * @param participantId Participant id
 */
function onUserLeft(participantId) {
    console.debug('User left: ' + participantId); //DEBUG
    getUser(participantId)?.remove();
}

// Functions

function getUser(participantId: string): User {
    let user = users.find(value => value.participantId === participantId);
    if (!user) {
        user = new User(conference, audioBar, videoBar, focusBar, participantId);
        users.push(user);
    }
    return user;
}

function useTrackType(trackType: string, onTrackTypeAudio: () => void, onTrackTypeVideo: () => void, onTrackTypeDesktop?: () => void, onTrackTypeElse?: () => void) {
    switch (trackType) {
        case trackTypeAudio:
            onTrackTypeAudio();
            break;
        case trackTypeVideo:
            onTrackTypeVideo();
            break;
        case trackTypeDesktop:
            onTrackTypeDesktop();
            break;
        default:
            onTrackTypeElse();
    }
}

function processTrackType<R>(trackType: string, onTrackTypeAudio: () => R, onTrackTypeVideo: () => R, onTrackTypeDesktop?: () => R, onTrackTypeElse?: () => R): R {
    switch (trackType) {
        case trackTypeAudio:
            return onTrackTypeAudio();
        case trackTypeVideo:
            return onTrackTypeVideo();
        case trackTypeDesktop:
            return onTrackTypeDesktop();
        default:
            if (!onTrackTypeElse) {
                console.warn(`Unknown TrackType: ${trackType}`)
            }
            return onTrackTypeElse();
    }
}

function unload() {
    selfUser.dispose();
    conference.leave();
    connection.disconnect();
}

function createCamTrack(cameraDeviceId: string = undefined) {
    createVideoTrack(!cameraDeviceId ? optionsCamTrack : {...optionsCamTrack, cameraDeviceId});
}

function createDesktopTrack(done: (enabled: boolean) => void) {
    //createVideoTrack(optionsDesktopTrack, true);
    createLocalTracks(optionsDesktopTrack, (tracks) => {
        selfUser.setTempVideoTrack(tracks[0]);
        selfUser.setSharing(true);
        selfUser.swapTracks();
        done(true);
        updateButtons();
    }, error => {
        if (error.name !== "gum.screensharing_user_canceled") {
            console.error(error);
        }
        done(false);
        disableSharing();
    });
}

function createVideoTrack(options: {}, sharing: boolean = false) {
    createLocalTracks(options, (tracks) => {
        tracks.forEach(onLocalTrackCreated);
        selfUser.setTempVideoTrack(tracks[0]);
        selfUser.setSharing(sharing);
        selfUser.swapTracks();
        updateButtons();
    });
}

function createAudioTrack(micDeviceId: string = undefined) {
    const options = !micDeviceId ? optionsAudioTrack : {...optionsAudioTrack, micDeviceId};
    createLocalTracks(options, (tracks) => {
        tracks.forEach(onLocalTrackCreated);
        selfUser.setTempAudioTrack(tracks[0]);
        selfUser.swapTracks();
        updateButtons();
    });
}

function createLocalTracks(options: {}, onSuccess: (tracks: any[]) => void, onFailure: (error) => void = console.error) {
    JitsiMeetJSIntern.createLocalTracks(options).then(onSuccess).catch(onFailure);
}

function disableSharing() {
    selfUser.disposeVideo();
    createCamTrack();
}

function enableSharing(done: (enabled: boolean) => void) {
    selfUser.disposeVideo();
    createDesktopTrack(done);
}

function updateButtons() {
    const audioMuted: boolean = selfUser.audioMuted;
    const VideoMuted: boolean = selfUser.videoMuted;
    const sharingEnabled: boolean = selfUser.isSharing();
    setAudioButtonMute(audioMuted, sharingEnabled);
    setVideoButtonMute(VideoMuted, sharingEnabled);
    setSwitchToDesktop(sharingEnabled, isDesktopSharingSupported());
}

function getMediaDeviceInfos(deviceType: string, deviceDirection: string): Promise<MediaDeviceInfo[]> {
    if (!JitsiMeetJSIntern.mediaDevices.isDeviceChangeAvailable(deviceDirection)) {
        return undefined;
    }
    const kind = deviceType + deviceDirection;
    JitsiMeetJSIntern.mediaDevices.enumerateDevices(() => console.debug("Updated Media Devices"));
    return navigator.mediaDevices.enumerateDevices().then((devices) => devices.filter(device => device.kind === kind));
}

function setMediaDevices(select: HTMLSelectElement, devices: MediaDeviceInfo[], selectedDevice: MediaDeviceInfo) {
    removeChildren(select);
    let selectedIndex = selectedDevice === null ? -1 : 0;
    let counter = 0;
    devices.forEach(device => {
        if (selectedDevice && device.deviceId === selectedDevice.deviceId) {
            selectedIndex = counter;
        }
        counter++;
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.innerText = device.label;
        select.append(option);
    });
    select.selectedIndex = selectedIndex;
}

function createChatItem(user: User, message: string): HTMLLIElement {
    if (!user || !message) {
        return null;
    }
    const chatItem = document.createElement("li");
    chatItem.classList.add("chat-list-item");
    chatItem.setAttribute("data-created", "" + new Date().getTime());
    const messageItem = document.createElement("span");
    messageItem.classList.add("chat-list-item-message");
    messageItem.innerText = message;
    const playerState = document.createElement("div");
    const player = getPlayerByParticipantId(user.participantId);
    chatItem.append(createPlayerState(player, playerState, false, false));
    chatItem.append(messageItem);
    return chatItem;
}

function ensureChatAppend() {
    while (chatList.childElementCount > 10) {
        chatList.firstChild.remove();
    }
}

// Exported Functions

export function isDesktopSharingSupported() {
    return JitsiMeetJSIntern.isDesktopSharingEnabled();
}

export function toggleMuteByType(type: string): boolean {
    const muted = processTrackType(type, () => selfUser.toggleCamAudio(), () => selfUser.toggleCamVideo());
    updateButtons();
    return muted;
}

export function toggleSharing(done: (enabled: boolean) => void) {
    const sharing = !selfUser.isSharing();
    if (!sharing) {
        done(false);
        disableSharing();
        return;
    }
    enableSharing(done);
}

const minDistance: number = 300;
const minDistanceSquared: number = minDistance * minDistance;

export function nearbyPlayerCheck() {
    const players: PlayerRecord = getPlayers();
    const ourPlayer: Player = getOurPlayer();
    const collisionInfo: solidInfo[][] = getCollisionInfo();
    //array with nearby players. use this vor videochat.
    const playersAway: string[] = [];
    const playersNearby: string[] = [];
    //TODO Check if they are on the same map
    const [ourX, ourY] = getCorrectedPlayerCoordinates(ourPlayer);
    const solidInfo: solidInfo = collisionInfo[ourX]?.[ourY];
    const ourRoomId: number = solidInfo?.roomId;
    const isOurRoomConferenceRoom: boolean = solidInfo?.isConferenceRoom;
    for (const player of Object.values(players)) {
        if (player.id === ourPlayer.id) {
            continue;
        }
        if (!ourRoomId && ourRoomId !== 0) {
            playersAway.push(player.participantId);
            continue;
        }
        const [x, y] = getCorrectedPlayerCoordinates(player);
        const roomId = collisionInfo[x]?.[y]?.roomId;
        if (!roomId && roomId !== 0) {
            playersAway.push(player.participantId);
            continue;
        }
        const sameRoom = ourRoomId === roomId;
        if (!(sameRoom || canSeeEachOther(ourPlayer, player, collisionInfo))) {
            playersAway.push(player.participantId);
            continue;
        }
        const distanceSquared = Math.pow(player.positionX - ourPlayer.positionX, 2) + Math.pow(player.positionY - ourPlayer.positionY, 2);
        if (distanceSquared <= minDistanceSquared || (isOurRoomConferenceRoom && sameRoom)) {
            playersNearby.push(player.participantId);
            continue;
        }
        playersAway.push(player.participantId);
    }
    playersAway.forEach((participantId) => getUser(participantId).setDisabled(true));
    playersNearby.forEach((participantId) => getUser(participantId).setDisabled(false));
}

export function createPlayerState<Type extends HTMLElement>(player: Player, element: Type, showCharacter: boolean = false, showMuteState: boolean = true): Type {
    element.classList.add("unselectable");
    element.classList.add("player-state");
    const playerName = document.createElement("span");
    playerName.classList.add("player-state-name");
    playerName.innerText = player ? player.name : "You";
    if (showMuteState && player && selfUser.participantId !== player.participantId) {
        const user = getUser(player.participantId);
        if (user.isAudioMuted()) {
            const icon = appendIcon(element, "microphone-slash");
            icon.classList.add("fa-xs");
            icon.classList.add("player-state-mute");
        }
        if (user.isVideoMuted()) {
            const icon = appendIcon(element, "video-slash");
            icon.classList.add("fa-xs");
            icon.classList.add("player-state-mute");
        }
    }
    element.append(playerName);
    if (showCharacter && player?.character) {
        const playerAvatar = createPlayerAvatar(player.character);
        playerAvatar.classList.add("player-state-avatar");
        element.append(playerAvatar);
    }
    return element;
}

export function updateUsers() {
    const players: PlayerRecord = getPlayers();
    Object.values(players).forEach((player) => getUser(player.participantId)?.updatePlayer(player));
    removeChildren(playerOnlineList);
    Object.values(players).forEach((player) => playerOnlineList.append(createPlayerState(player, document.createElement("li"), true)));
}

export function updateChat() {
    if (!getChatEnabled()) {
        return;
    }
    const now: number = new Date().getTime();
    const children = chatList.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const created: number = Number(child.getAttribute("data-created"));
        if (now - created > 10000) {
            child.remove();
        }
    }
}

export function toggleShowParticipantsTab(): boolean {
    setShowParticipantsTab(!getShowParticipantsTab());
    return getShowParticipantsTab();
}

export function getShowParticipantsTab(): boolean {
    return showParticipantsTab;
}

export function setShowParticipantsTab(setTo: boolean) {
    if (setTo) {
        playerOnlineContainer.classList.add("hover");
    } else {
        playerOnlineContainer.classList.remove("hover");
    }
    showParticipantsTab = setTo;
}

let audioInputDevices: MediaDeviceInfo[] = null;
let audioOutputDevices: MediaDeviceInfo[] = null;

let audioInputDevice: MediaDeviceInfo = undefined;
let audioOutputDevice: MediaDeviceInfo = undefined;

export async function loadConferenceSettings() {
    // Audio Input
    audioInputDevices = await getMediaDeviceInfos(deviceTypeAudio, deviceDirectionInput);
    if (audioInputDevices) {
        setMediaDevices(audioInputSelect, audioInputDevices, audioInputDevice);
        audioInputSelect.disabled = false;
    } else {
        audioInputSelect.disabled = true;
    }
    // Audio Output
    audioOutputDevices = await getMediaDeviceInfos(deviceTypeAudio, deviceDirectionOutput);
    if (audioOutputDevices) {
        const currentAudioOutputDevice = JitsiMeetJSIntern.mediaDevices.getAudioOutputDevice();
        setMediaDevices(audioOutputSelect, audioOutputDevices, !currentAudioOutputDevice || currentAudioOutputDevice == '' ? undefined : audioOutputDevices.find(device => device.deviceId == currentAudioOutputDevice));
        audioOutputSelect.disabled = false;
    } else {
        audioOutputSelect.disabled = true;
    }
}

export function applyConferenceSettings() {
    // Audio Input
    if (audioInputDevices) {
        const newAudioInputDevice = audioInputDevices[audioInputSelect.selectedIndex];
        if (newAudioInputDevice !== audioInputDevice) {
            audioInputDevice = newAudioInputDevice;
            if (audioInputDevice) {
                createAudioTrack(audioInputDevice.deviceId);
            }
        }
    }
    // Audio Output
    if (audioOutputDevices) {
        const newAudioOutputDevice = audioOutputDevices[audioOutputSelect.selectedIndex];
        if (newAudioOutputDevice !== audioOutputDevice) {
            audioOutputDevice = newAudioOutputDevice;
            if (audioOutputDevice) {
                JitsiMeetJSIntern.mediaDevices.setAudioOutputDevice(audioOutputDevice.deviceId);
            }
        }
    }
}

// Code

function init(room: Room) {
    serverRoom = room;
    window.addEventListener("pagehide", unload);
    JitsiMeetJSIntern.setLogLevel(JitsiMeetJSIntern.logLevels.ERROR);          //mutes logger
    JitsiMeetJSIntern.init(optionsInit);
    updateButtons();
    connection = new JitsiMeetJSIntern.JitsiConnection(null, null, optionsConnection());
    console.debug("conference.id:", conferenceData().id); //DEBUG
    JitsiMeetJSIntern.mediaDevices.addEventListener(JitsiMeetJSIntern.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
    connection.connect();
    createCamTrack();
    createAudioTrack();
    loadConferenceSettings();
}
