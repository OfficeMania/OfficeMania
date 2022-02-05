//import {JitsiMeetJS} from "./lib-jitsi-meet.min";

import {
    appendIcon,
    canSeeEachOther,
    createPlayerAvatar,
    getCameraDeviceId,
    getCollisionInfo,
    getCorrectedPlayerCoordinates,
    getMicDeviceId,
    getOurPlayer,
    getPlayerByParticipantId,
    getPlayers,
    getRoom,
    getSpeakerDeviceId,
    PlayerRecord,
    removeChildren,
    setCameraDeviceId,
    setMicDeviceId,
    setSpeakerDeviceId,
} from "../util";
import { SelfUser, User } from "./entities";
import { Room } from "colyseus.js";
import { solidInfo } from "../map";
import { Player } from "../player";
import { MessageType } from "../../common";
import { camButton, muteButton, shareButton } from "../static";
import { setShowTextchatBar } from "../textchat";

export { init as initConference, trackTypeAudio, trackTypeVideo, trackTypeDesktop };

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
const videoInputSelect = $<HTMLSelectElement>("video-input-select");

const playerOnlineContainer = $<HTMLUListElement>("player-online-container");
const playerOnlineList = $<HTMLUListElement>("player-online-list");

const selfUser = new SelfUser(audioBar, videoBar, focusBar);
const users: User[] = [];

let showParticipantsTab = false;

// Options

function conferenceState() {
    return getRoom().state.conference;
}

function optionsHosts() {
    return {
        domain: "8x8.vc",
        muc: `conference.${conferenceState().id}.8x8.vc`,
        focus: "focus.8x8.vc",
    };
}

function optionsConnection() {
    return {
        hosts: optionsHosts(),
        serviceUrl: "wss://8x8.vc/xmpp-websocket?room=" + conferenceState().id,
        clientNode: "https://jitsi.org/jitsimeet",
    };
}

const optionsConference = {
    enableLayerSuspension: true,
    p2p: {
        enabled: false,
    },
};

const optionsInit = {
    disableAudioLevels: true,
};

const optionsAudioTrack = {
    devices: [trackTypeAudio],
};

const optionsCamTrack = {
    devices: [trackTypeVideo],
    maxFps: 30,
    constraints: {
        video: {
            aspectRatio: 16 / 9,
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 360, ideal: 720, max: 1080 },
        },
    },
};

const optionsDesktopTrack = {
    devices: [trackTypeDesktop],
    desktopSharingFrameRate: {
        max: 30,
    },
};

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
    // console.debug('Current Devices: ' + devices); //DEBUG
}

/**
 * This is called after a connection failed to establish
 */
function onConnectionFailed() {
    console.error("Connection to Jitsi Server Failed!");
}

/**
 * This is called after successfully establishing a connection
 */
function onConnectionSuccess() {
    conference = connection.initJitsiConference(conferenceState().id, optionsConference);
    //conference.setStartMutedPolicy({audio: true});
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_ADDED, onTrackAdded);
    conference.on(JitsiMeetJSIntern.events.conference.TRACK_REMOVED, onTrackRemoved);
    conference.on(JitsiMeetJSIntern.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    conference.on(JitsiMeetJSIntern.events.conference.CONFERENCE_LEFT, onConferenceLeft);
    conference.on(JitsiMeetJSIntern.events.conference.USER_JOINED, onUserJoined);
    conference.on(JitsiMeetJSIntern.events.conference.USER_LEFT, onUserLeft);
    // conference.on(JitsiMeetJSIntern.events.conference.TRACK_MUTE_CHANGED, track => console.debug(`${track.isLocal() ? "Local" : "Remote"} '${track.getType()}' is muted: ${track.isMuted()}`)); //DEBUG
    // conference.on(JitsiMeetJSIntern.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`)); //DEBUG
    // conference.on(JitsiMeetJSIntern.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`)); //DEBUG
    // conference.on(JitsiMeetJSIntern.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${conference.getPhoneNumber()} - ${conference.getPhonePin()}`)); //DEBUG //REMOVE
    if (conferenceState().password) {
        conference.join(conferenceState().password);
    } else {
        conference.join();
    }
    users.forEach(user => (user.conference = conference));
    selfUser.conference = conference;
    selfUser.participantId = conference.myUserId();
    // console.debug("participantId:", selfUser.participantId)
    serverRoom.send(MessageType.UPDATE_PARTICIPANT_ID, selfUser.participantId);
    createCamTrack();
    createAudioTrack();
}

/**
 * This is called after a connection has been closed
 */
function onDisconnected() {
    // console.debug('Disconnected from Jitsi Server');
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
}

/**
 * This is called when a conference has been joined.
 */
function onConferenceJoined() {
    // console.debug('Conference joined'); //DEBUG
    isJoined = true;
    selfUser.addToConference();
    //toggleMuteByType("video");
    //toggleMuteByType("audio");
}

/**
 * This is called when a conference has been left.
 */
function onConferenceLeft() {
    // console.debug('Conference left'); //DEBUG
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


function onLocalTrackCreated(track) {
    // console.debug(`Local Track added: ${track}`); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel =>
        console.debug(`Audio Level Local: ${audioLevel}`)
    ); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_MUTE_CHANGED, () =>
        console.debug("Local Track Mute changed")
    ); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.LOCAL_TRACK_STOPPED, () =>
        console.debug("Local Track stopped")
    ); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId =>
        console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)
    ); //DEBUG
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
    // console.debug(`Remote Track added: ${track}`); //DEBUG
    // track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    // track.addEventListener(JitsiMeetJSIntern.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track stopped')); //DEBUG
    // track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    track.addEventListener(JitsiMeetJSIntern.events.track.TRACK_MUTE_CHANGED, () => onRemoteTrackMuteChanged(track));
    const participantId = track.getParticipantId();
    const user = getUser(participantId);
    if (track.getType() === trackTypeVideo) {
        user.setVideoTrack(track, false);
    } else {
        user.setAudioTrack(track, false);
    }
}

function onTrackRemoved(track) {
    onTrack(track, onLocalTrackRemoved, onRemoteTrackRemoved);
}

function onLocalTrackRemoved(track) {
    // console.debug(`Local Track removed: ${track}`); //DEBUG
    selfUser.removeTrack(track);
}

function onRemoteTrackRemoved(track) {
    // console.debug(`Remote Track removed: ${track}`); //DEBUG
    getUser(track.getParticipantId())?.removeTrack(track);
}

/*
 *  Checks if muted button was audio or other
 */
function onRemoteTrackMuteChanged(track) {
    // console.debug('Remote Track Mute changed'); //DEBUG
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
    // console.debug('User joined: ' + participantId); //DEBUG
    getUser(participantId); // Creates a User with the participantId
}

/**
 * This is called when a user has left.
 *
 * @param participantId Participant id
 */
function onUserLeft(participantId) {
    // console.debug('User left: ' + participantId); //DEBUG
    getUser(participantId)?.remove();
}

// Functions

export function getUser(participantId: string): User {
    let user = users.find(value => value.participantId === participantId);
    if (!user) {
        user = new User(conference, audioBar, videoBar, focusBar, participantId);
        users.push(user);
    }
    return user;
}

function useTrackType(
    trackType: string,
    onTrackTypeAudio: () => void,
    onTrackTypeVideo: () => void,
    onTrackTypeDesktop?: () => void,
    onTrackTypeElse?: () => void
) {
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

function processTrackType<R>(
    trackType: string,
    onTrackTypeAudio: () => R,
    onTrackTypeVideo: () => R,
    onTrackTypeDesktop?: () => R,
    onTrackTypeElse?: () => R
): R {
    switch (trackType) {
        case trackTypeAudio:
            return onTrackTypeAudio();
        case trackTypeVideo:
            return onTrackTypeVideo();
        case trackTypeDesktop:
            return onTrackTypeDesktop();
        default:
            if (!onTrackTypeElse) {
                console.warn(`Unknown TrackType: ${trackType}`);
            }
            return onTrackTypeElse();
    }
}

async function unload() {
    await selfUser.dispose();
    conference.leave();
    connection.disconnect();
}

function createCamTrack(cameraDeviceId: string = getCameraDeviceId()) {
    createVideoTrack(!cameraDeviceId ? optionsCamTrack : { ...optionsCamTrack, cameraDeviceId });
}

function createDesktopTrack() {
    //createVideoTrack(optionsDesktopTrack, true);
    createLocalTracks(
        optionsDesktopTrack,
        tracks => {
            // tracks.forEach(onLocalTrackCreated);
            const track = tracks[0];
            track.track.addEventListener("ended", () => disableSharing());
            selfUser.setNewVideoTrack(track, true).then(() => updateButtons());
        },
        error => {
            if (error.name !== "gum.screensharing_user_canceled") {
                console.error(error);
            }
            disableSharing();
        }
    );
}

function createVideoTrack(options: {}) {
    createLocalTracks(
        options,
        tracks => {
            // tracks.forEach(onLocalTrackCreated);
            selfUser.setNewVideoTrack(tracks[0]).then(() => updateButtons());
        },
        error => {
            console.error(error);
            setCameraDeviceId(null);
        }
    );
}

function createAudioTrack(micDeviceId: string = getMicDeviceId()) {
    const options = !micDeviceId ? optionsAudioTrack : { ...optionsAudioTrack, micDeviceId };
    createLocalTracks(
        options,
        tracks => {
            // tracks.forEach(onLocalTrackCreated);
            selfUser.setNewAudioTrack(tracks[0]).then(() => updateButtons());
        },
        error => {
            console.error(error);
            setMicDeviceId(null);
        }
    );
}

function createLocalTracks(
    options: {},
    onSuccess: (tracks: any[]) => void,
    onFailure: (error) => void = console.error
) {
    JitsiMeetJSIntern.createLocalTracks(options).then(onSuccess).catch(onFailure);
}

function disableSharing() {
    selfUser.disposeVideo();
    createCamTrack();
}

function enableSharing() {
    selfUser.disposeVideo();
    createDesktopTrack();
}

export function setAudioButtonMute(muted: boolean, supported: boolean, sharing: boolean) {
    muteButton.disabled = !supported;
    muteButton.innerHTML =
        muted || !supported
            ? '<em class = "fa fa-microphone-slash"></em><span></span>'
            : '<em class = "fa fa-microphone"></em><span></span>';
}

export function setVideoButtonMute(muted: boolean, supported: boolean, sharing: boolean) {
    camButton.disabled = !supported;
    const camNormal = '<em class = "fa fa-video"></em><span></span>';
    const camMuted = '<em class = "fa fa-video-slash"></em><span></span>';
    const sharingNormal = '<em class = "fa fa-pause"></em><span></span>';
    const sharingMuted = '<em class = "fa fa-play"></em><span></span>';
    const textNormal = sharing ? sharingNormal : camNormal;
    const textMuted = sharing ? sharingMuted : camMuted;
    camButton.innerHTML = muted || !supported ? textMuted : textNormal;
}

export function setSwitchToDesktop(enabled: boolean, supported: boolean = false) {
    shareButton.disabled = !supported;
    shareButton.innerHTML = enabled
        ? '<em class = "fa fa-user"></em><span></span>'
        : '<em class = "fa fa-desktop"></em><span></span>';
}

export function updateButtons() {
    setAudioButtonMute(selfUser.currentAudioMuted(), !audioInputSelect.disabled, selfUser.isSharing());
    setVideoButtonMute(selfUser.currentVideoMuted(), !videoInputSelect.disabled, selfUser.isSharing());
    setSwitchToDesktop(selfUser.isSharing(), isDesktopSharingSupported());
}

function getMediaDeviceInfos(deviceType: string, deviceDirection: string): Promise<MediaDeviceInfo[]> {
    if (!JitsiMeetJSIntern.mediaDevices.isDeviceChangeAvailable(deviceDirection)) {
        return undefined;
    }
    const kind = deviceType + deviceDirection;
    return navigator.mediaDevices.enumerateDevices().then(devices => devices.filter(device => device.kind === kind));
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

// Exported Functions

export function isDesktopSharingSupported() {
    return JitsiMeetJSIntern.isDesktopSharingEnabled();
}

export function toggleMuteByType(type: string): boolean {
    return processTrackType(
        type,
        () => selfUser.toggleAudio(),
        () => selfUser.toggleVideo()
    );
}

export function toggleSharing() {
    if (selfUser.isSharing()) {
        disableSharing();
        return;
    }
    enableSharing();
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
        if (player.roomId === ourPlayer.roomId) {
            continue;
        }
        if (!ourRoomId && ourRoomId !== 0) {
            //TODO ist this too many or too much? - jedenfalls ist es quatsch.
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
        const distanceSquared =
            Math.pow(player.positionX - ourPlayer.positionX, 2) + Math.pow(player.positionY - ourPlayer.positionY, 2);
        if (distanceSquared <= minDistanceSquared || (isOurRoomConferenceRoom && sameRoom)) {
            playersNearby.push(player.participantId);
            continue;
        }
        playersAway.push(player.participantId);
    }
    playersAway.forEach(participantId => getUser(participantId).setDisabled(true));
    playersNearby.forEach(participantId => getUser(participantId).setDisabled(false));
}

export function createPlayerState<Type extends HTMLElement>(
    player: Player,
    element: Type,
    showCharacter: boolean = false,
    showMuteState: boolean = true
): Type {
    element.classList.add("unselectable");
    element.classList.add("player-state");
    const playerName = document.createElement("span");
    playerName.classList.add("player-state-name");
    playerName.innerText = player ? player.displayName : "You";
    if (showMuteState && player && selfUser.participantId !== player.participantId) {
        const user = getUser(player.participantId);
        if (user.isAudioTrackMuted()) {
            const icon = appendIcon(element, "microphone-slash");
            icon.classList.add("fa-xs");
            icon.classList.add("player-state-mute");
        }
        if (user.isVideoTrackMuted()) {
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
    Object.values(players).forEach(player => getUser(player.participantId)?.updatePlayer(player));
    removeChildren(playerOnlineList);
    Object.values(players).forEach(player =>
        playerOnlineList.append(createPlayerState(player, document.createElement("li"), true))
    );
}

export function toggleShowParticipantsTab(): boolean {
    setShowParticipantsTab(!getShowParticipantsTab());
    setShowTextchatBar(false);
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
let videoInputDevices: MediaDeviceInfo[] = null;

let audioInputDevice: MediaDeviceInfo = undefined;
let audioOutputDevice: MediaDeviceInfo = undefined;
let videoInputDevice: MediaDeviceInfo = undefined;

export async function loadConferenceSettings() {
    // Audio Input
    audioInputDevices = await getMediaDeviceInfos(deviceTypeAudio, deviceDirectionInput);
    if (audioInputDevices && audioInputDevices.length > 0) {
        if (!audioInputDevice) {
            const micDeviceId = getMicDeviceId();
            audioInputDevice =
                (micDeviceId
                    ? audioInputDevices.find(audioInputDevice => audioInputDevice.deviceId === micDeviceId)
                    : audioInputDevices[0]) ?? audioInputDevices[0];
        }
        setMediaDevices(audioInputSelect, audioInputDevices, audioInputDevice);
        audioInputSelect.disabled = false;
    } else {
        audioInputSelect.disabled = true;
    }
    // Audio Output
    audioOutputDevices = await getMediaDeviceInfos(deviceTypeAudio, deviceDirectionOutput);
    if (audioOutputDevices && audioOutputDevices.length > 0) {
        if (!audioOutputDevice) {
            const speakerDeviceId = getSpeakerDeviceId();
            audioOutputDevice =
                (speakerDeviceId
                    ? audioOutputDevices.find(audioOutputDevice => audioOutputDevice.deviceId === speakerDeviceId)
                    : audioOutputDevices[0]) ?? audioOutputDevices[0];
        }
        const currentAudioOutputDevice = JitsiMeetJSIntern.mediaDevices.getAudioOutputDevice();
        setMediaDevices(
            audioOutputSelect,
            audioOutputDevices,
            !currentAudioOutputDevice || currentAudioOutputDevice == ""
                ? undefined
                : audioOutputDevices.find(device => device.deviceId == currentAudioOutputDevice)
        );
        audioOutputSelect.disabled = false;
    } else {
        audioOutputSelect.disabled = true;
    }
    // Video Input
    videoInputDevices = await getMediaDeviceInfos(deviceTypeVideo, deviceDirectionInput);
    if (videoInputDevices && videoInputDevices.length > 0) {
        if (!videoInputDevice) {
            const cameraDeviceId = getCameraDeviceId();
            videoInputDevice =
                (cameraDeviceId
                    ? videoInputDevices.find(videoInputDevice => videoInputDevice.deviceId === cameraDeviceId)
                    : videoInputDevices[0]) ?? videoInputDevices[0];
        }
        setMediaDevices(videoInputSelect, videoInputDevices, videoInputDevice);
        videoInputSelect.disabled = false;
    } else {
        videoInputSelect.disabled = true;
    }
    updateButtons();
}

export function applyConferenceSettings() {
    // Audio Input
    if (audioInputDevices) {
        const newAudioInputDevice = audioInputDevices[audioInputSelect.selectedIndex];
        if (newAudioInputDevice.deviceId !== audioInputDevice?.deviceId) {
            audioInputDevice = newAudioInputDevice;
            if (audioInputDevice) {
                createAudioTrack(audioInputDevice.deviceId);
                setMicDeviceId(audioInputDevice.deviceId);
            }
        }
    }
    // Audio Output
    if (audioOutputDevices) {
        const newAudioOutputDevice = audioOutputDevices[audioOutputSelect.selectedIndex];
        if (newAudioOutputDevice.deviceId !== audioOutputDevice?.deviceId) {
            audioOutputDevice = newAudioOutputDevice;
            if (audioOutputDevice) {
                setAudioOutputDevice(audioOutputDevice.deviceId);
            }
        }
    }
    // Video Input
    if (videoInputDevices) {
        const newVideoInputDevice = videoInputDevices[videoInputSelect.selectedIndex];
        if (newVideoInputDevice.deviceId !== videoInputDevice?.deviceId) {
            videoInputDevice = newVideoInputDevice;
            if (videoInputDevice) {
                createCamTrack(videoInputDevice.deviceId);
                setCameraDeviceId(videoInputDevice.deviceId);
            }
        }
    }
}

function setAudioOutputDevice(deviceId: string) {
    try {
        JitsiMeetJSIntern.mediaDevices.setAudioOutputDevice(deviceId);
        setSpeakerDeviceId(deviceId);
    } catch (error) {
        //TODO Does this trigger if we try to set a non existing audio device as an output
        setSpeakerDeviceId(null);
    }
}

function init(room: Room) {
    serverRoom = room;
    window.addEventListener("pagehide", unload);
    JitsiMeetJSIntern.setLogLevel(JitsiMeetJSIntern.logLevels.ERROR);
    JitsiMeetJSIntern.init(optionsInit);
    updateButtons();
    connection = new JitsiMeetJSIntern.JitsiConnection(null, null, optionsConnection());
    // console.debug("conference.id:", conferenceData().id); //DEBUG
    JitsiMeetJSIntern.mediaDevices.addEventListener(
        JitsiMeetJSIntern.events.mediaDevices.DEVICE_LIST_CHANGED,
        onDeviceListChanged
    );
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.addEventListener(JitsiMeetJSIntern.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
    connection.connect();
    const speakerDeviceId = getSpeakerDeviceId();
    if (speakerDeviceId) {
        setAudioOutputDevice(speakerDeviceId);
    }
    loadConferenceSettings().catch(console.error);
}
