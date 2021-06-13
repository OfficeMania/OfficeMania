//import {JitsiMeetJS} from "./lib-jitsi-meet.min";

import {getRoom, PlayerRecord} from "../util";
import {SelfUser, User} from "./entities";
import {Room} from "colyseus.js";
import {setAudioButtonMute, setSwitchToDesktop, setVideoButtonMute} from "../main";

export {
    init as initConference,
    trackTypeAudio,
    trackTypeVideo,
    trackTypeDesktop,
    toggleMuteByType,
    toggleSharing,
    nearbyPlayerCheck
};

function $<T extends HTMLElement>(a: string) {
    return <T>document.getElementById(a);
}

// Constants

const trackTypeAudio = "audio";
const trackTypeVideo = "video";
const trackTypeDesktop = "desktop";

const deviceOutput = "output";
const deviceInput = "input";

const deviceKindAudio = "audiooutput";
const deviceKindVideo = "videooutput";

const audioBar = $<HTMLDivElement>("audio-bar");
const videoBar = $<HTMLDivElement>("video-bar");
const playerNearbyIndicator = $<HTMLDivElement>("player-nearby-indicator");

const selfUser = new SelfUser(audioBar, videoBar);
const users: User[] = [];

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
    startAudioMuted: true,
};

const optionsLocalTracks = {
    devices: [trackTypeAudio, trackTypeVideo],
    //resolution: 180,
    desktopSharingFrameRate: {
        max: 15
    },
    maxFps: 15,
    /*constraints: {
        video: {
            aspectRatio: 16/9,
            height: {
                ideal: 720,
                max: 720,
                min: 720,
            },
        },

    },*/
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
    console.error('Connection Failed!');
}

/**
 * This is called after successfully establishing a connection
 */
function onConnectionSuccess() {
    conference = connection.initJitsiConference(conferenceData().id, optionsConference);
    //conference.setStartMutedPolicy({audio: true});
    conference.on(JitsiMeetJS.events.conference.TRACK_ADDED, onTrackAdded);
    conference.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onTrackRemoved);
    conference.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    conference.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, onConferenceLeft); //TODO Verify that this event exists
    conference.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
    conference.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    conference.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => console.debug(`${track.isLocal() ? "Local" : "Remote"} '${track.getType()}' is muted: ${track.isMuted()}`)); //DEBUG
    conference.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`)); //DEBUG
    conference.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`)); //DEBUG
    conference.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${conference.getPhoneNumber()} - ${conference.getPhonePin()}`)); //DEBUG //REMOVE
    if (conferenceData().password) {
        //conference.join(conferenceData().password);
        conference.join();
    } else {
        conference.join();
    }
    users.forEach(user => user.conference = conference);
    selfUser.conference = conference;
    selfUser.participantId = conference.myUserId();
    console.debug("participantId:", selfUser.participantId)
    serverRoom.send("updateParticipantId", selfUser.participantId);
}

/**
 * This is called after a connection has been closed
 */
function onDisconnected() {
    console.debug('Disconnected');
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
}

/**
 * This is called when a conference has been joined.
 */
function onConferenceJoined() {
    console.debug('Conference joined'); //DEBUG
    isJoined = true;
    selfUser.addToConference();
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

function onLocalTracksCreated(tracks: any[]) {
    tracks.forEach(track => {
        console.debug(`Local Track added: ${track}`); //DEBUG
        track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Local: ${audioLevel}`)); //DEBUG
        track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('Local Track Mute changed')); //DEBUG
        track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Local Track stopped')); //DEBUG
        track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
        if (track.getType() === trackTypeVideo) {
            selfUser.setVideoTrack(track);
        } else {
            selfUser.setAudioTrack(track, false);
        }
        if (isJoined) {
            conference.addTrack(track);
        }
    });
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
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => onRemoteTrackMuteChanged(track));
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
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
        user = new User(conference, audioBar, videoBar, participantId);
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

function createLocalTracks(options: {}, onSuccess: (tracks: any[]) => void, onFailure: (error) => void = console.error) {
    JitsiMeetJS.createLocalTracks(options).then(onSuccess).catch(onFailure);
}

function disableSharing() {
    selfUser.disposeVideo();
    createLocalTracks({devices: [trackTypeVideo]}, (tracks) => {
        selfUser.setTempVideoTrack(tracks[0]);
        selfUser.setSharing(false);
        selfUser.swapTracks();
        updateButtons();
    });
}

function updateButtons() {
    const audioMuted: boolean = selfUser.audioMuted;
    const VideoMuted: boolean = selfUser.videoMuted;
    const sharingEnabled: boolean = selfUser.isSharing();
    setAudioButtonMute(audioMuted, sharingEnabled);
    setVideoButtonMute(VideoMuted, sharingEnabled);
    setSwitchToDesktop(sharingEnabled);
}

// Exported Functions

function toggleMuteByType(type: string): boolean {
    const muted = processTrackType(type, () => selfUser.toggleCamAudio(), () => selfUser.toggleCamVideo());
    updateButtons();
    return muted;
}

function toggleSharing(done: (enabled: boolean) => void) {
    const sharing = !selfUser.isSharing();
    if (!sharing) {
        done(false);
        disableSharing();
        return;
    }
    selfUser.disposeVideo();
    createLocalTracks({devices: [trackTypeDesktop]}, (tracks) => {
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

function nearbyPlayerCheck(players: PlayerRecord, ourPlayer) {
    //array with nearby players. use this vor videochat.
    const playersNearby: string[] = [];
    const playersAway: string[] = [];
    let isEmpty: boolean = true;
    for (const [key, value] of Object.entries(players)) {
        if (value.id === ourPlayer.id) {
            continue;
        }
        isEmpty = false;
        //console.log(Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2));

        if (Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2) < 50000) {
            //console.debug("Player nearby: " + value.participantId);
            playersNearby.push(value.participantId);
        } else {
            //console.debug("Player away: " + value.participantId);
            playersAway.push(value.participantId);
        }
    }
    //console.debug(serverRoom.state.players);
    playersAway.forEach((participantId) => {
        const user = getUser(participantId);
        user.setDisabled(true);
        //console.debug(`far away: ${user.participantId}`);
    });
    playersNearby.forEach((participantId) => {
        const user = getUser(participantId);
        user.setDisabled(false);
        //console.debug(`nearby  : ${user.participantId}`);
    });
    //console.log("Players consists of : " + players);
    if (isEmpty) {
        playerNearbyIndicator.innerHTML = "Waiting for someone else to join...";
    } else if (playersNearby.length === 0) {
        playerNearbyIndicator.innerHTML = "you are lonely :(";
    } else {
        playerNearbyIndicator.innerHTML = "player nearby";
    }
}

// Code

function init(room: Room) {
    serverRoom = room;
    window.addEventListener("beforeunload", unload);
    window.addEventListener("unload", unload); // TODO Why Twice?
    JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);          //mutes logger
    JitsiMeetJS.init(optionsInit);
    connection = new JitsiMeetJS.JitsiConnection(null, null, optionsConnection());
    console.debug("conference.id:", conferenceData().id); //DEBUG
    JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
    connection.connect();
    createLocalTracks(optionsLocalTracks, onLocalTracksCreated);
    /*
    //TODO Implement proper Audio Device Selection
    if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(deviceOutput)) {
        JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
            const audioOutputDevices = devices.filter(d => d.kind === deviceKindAudio);
            if (audioOutputDevices.length > 1) {
                //$('#audioOutputSelect').html(audioOutputDevices.map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('\n'));
                //$('#audioOutputSelectWrapper').show();
            }
        });
    }
    */
}
