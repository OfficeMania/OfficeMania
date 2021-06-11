//import {JitsiMeetJS} from "./lib-jitsi-meet.min";

import {PlayerRecord} from "../util";
import {User} from "./entities";

export {roomName, trackTypeAudio, trackTypeVideo, trackTypeDesktop, toggleMuteByType, switchVideo, nearbyPlayerCheck};

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

const videoBar = $<HTMLDivElement>("video-bar");
const playerNearbyIndicator = $<HTMLDivElement>("player-nearby-indicator");

// Options

const roomName = "conference-with-safe-name-djlsöncaöeif38723"; //TODO

const optionsHosts = {
    domain: "8x8.vc",
    muc: `conference.${roomName}.8x8.vc`,
    focus: "focus.8x8.vc"
};

const optionsConnection = {
    hosts: optionsHosts,
    serviceUrl: "wss://8x8.vc/xmpp-websocket?room=" + roomName,
    clientNode: "https://jitsi.org/jitsimeet"
};

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
    devices: [trackTypeAudio, trackTypeVideo,/* trackTypeDesktop*/],
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

const selfUser = new User(videoBar, null, null);

const users: User[] = [];

function getUser(participantId: string): User {
    let user = users.find(value => value.participantId === participantId);
    if (!user) {
        user = new User(videoBar, null, participantId);
        users.push(user);
    }
    return user;
}

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteTracks = {};
let muted = [];

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
function onConnectionSuccess(id: string) {
    selfUser.participantId = id;
    room = connection.initJitsiConference(roomName, optionsConference);
    //room.setStartMutedPolicy({audio: true});
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onTrackAdded);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onTrackRemoved);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, onConferenceLeft); //TODO Verify that this event exists
    room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => console.debug(`${track.isLocal() ? "Local" : "Remote"} '${track.getType()}' is muted: ${track.isMuted()}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${room.getPhoneNumber()} - ${room.getPhonePin()}`)); //DEBUG //REMOVE
    room.join();

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
    localTracks.forEach(track => room.addTrack(track));
}

/**
 * This is called when a conference has been left.
 */
function onConferenceLeft() {
    console.debug('Conference left'); //DEBUG
    isJoined = false;
    //TODO
}

function onTrack(track, onLocal, onRemote) {
    if (track.isLocal()) {
        onLocal(track);
    } else {
        onRemote(track);
    }
}

/**
 * Handles local tracks.
 *
 * @param tracks Array with tracks
 */
function onLocalTracksAdded(tracks) {
    localTracks = tracks; //TODO should this stay that way?
    for (let i = 0; i < localTracks.length; i++) {
        onLocalTrackAdded(localTracks[i], i);
    }
}

function onTrackAdded(track) {
    onTrack(track, onLocalTrackAdded, onRemoteTrackAdded);
}

function onLocalTrackAdded(track, pos: number) {

    //filter out local stream duplicate
    if (typeof pos === "undefined") {
        return;
    }

    console.debug(`Local Track added: ${track}`); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Local: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('Local Track Mute changed')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Local Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    if (track.getType() === trackTypeVideo) {
        selfUser.setVideoTrack(track);
        selfUser.setVideoEnabled(true);
    } else {
        selfUser.setAudioTrack(track); //Keep this for muting ourself
        //selfUser.setAudioEnabled(true); //TODO Wait wouldn't that cause you to hear yourself?
    }
    //TODO What is when you're sharing your Screen? Should you see it yourself?
    if (isJoined) {
        room.addTrack(track);
    }
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
    console.debug(`Participant id is: ${participantId}`); //DEBUG
    console.debug(`User is: ${user}`); //DEBUG
    if (!remoteTracks[participantId]) {
        remoteTracks[participantId] = [];
    }
    if (remoteTracks[participantId].length == 2) {
        console.debug(`video and desktop swapping in progress`);
        remoteTracks[participantId].pop();
        //document.getElementById(participantId + "video2").remove(); //wenn ich das aufrufe, wie rufe ich das zurück? -- also beim mute das aufrufen, und beim entmuten wieder hinmachen
    }
    const idx = remoteTracks[participantId].push(track);
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => {
        console.debug('Remote Track Mute changed');
        onRemoteMute(track);
    });  //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    const id = participantId + track.getType() + idx;
    if (track.getType() === trackTypeVideo) {
        user.setVideoTrack(track);
        user.setVideoEnabled(true);
        //addRemoteVideoTrack(participantId);
    } else {
        user.setAudioTrack(track);
        user.setAudioEnabled(true);
        //videoBar.append(`<audio autoplay='1' id='${participantId}audio${idx}' />`);
    }
    //track.attach($(`#${id}`)[0]);
    console.debug(`User is: ${user}`); //DEBUG
}

function onTrackRemoved(track) {
    onTrack(track, onLocalTrackRemoved, onRemoteTrackRemoved);
}

function onLocalTrackRemoved(track) {
    console.debug(`Remote Track added: ${track}`); //DEBUG
    //TODO
    removeTrack(selfUser, track.getType());
}

function onRemoteTrackRemoved(track) {
    console.debug(`Remote Track removed: ${track}`); //DEBUG
    //console.debug(`document.getElementById: ${document.getElementById(track + "audio1")}`); //DEBUG
    //document.getElementById(track + "audio1").remove(); 
    //document.getElementById(track + "video2").remove();
    const user = getUser(track.getParticipantId());

    removeTrack(user, track.getType());
    //TODO
}

function removeTrack(user: User, trackType: string) {
    useTrackType(trackType, () => user.setAudioTrack(null), () => user.setVideoTrack(null), () => user.setShareTrack(null));
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


/*  
 *  Checks if muted button was audio or other
 */
function onRemoteMute(track) {
    const user = getUser(track.getParticipantId());
    const enabled = !track.isMuted();
    useTrackType(track.getType(), () => user.setAudioEnabled(enabled), () => user.setVideoEnabled(enabled), () => user.setShareEnabled(enabled));

    /*
    if (track.getType() === trackTypeAudio){
        console.log(`is audio, exiting`);
        return;
    }
    
    checkRemoteTracks(track);
    */
}

/**
 * This is called when a user has joined.
 *
 * @param id User id
 */
function onUserJoined(participantId) {
    console.debug('User joined: ' + participantId); //DEBUG
    remoteTracks[participantId] = [];
    const user = getUser(participantId);
}

/**
 * This is called when a user has left.
 *
 * @param participantId Participant id
 */
function onUserLeft(participantId) {
    const user = getUser(participantId);
    console.debug('User left: ' + participantId); //DEBUG
    console.debug(`abcdefg ` + document.getElementById("canvas") === null);
    console.debug(); //DEBUG
    //remove video and audio
    //document.getElementById(participantId + "audio" + "1").remove();
    //document.getElementById(participantId + "video" + "2").remove();

    //TODO participant.remove();
    user.remove();

    if (!remoteTracks[participantId]) {
        return;
    }
    const tracks = remoteTracks[participantId];
    for (const item of tracks) {
        //item.detach($(`#${participantId}${item.getType()}`));
    }
}

// Functions

/**
 * Set Audio Output Device.
 *
 * @param selected Audio Output
 */
function setAudioOutputDevice(selected) {
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
}

function addRemoteVideoTrack(participantId: string, idx: number) {

    //videoBar.append(`<video autoplay='1' style="width: 15%; margin-right:5px;" id='${participant}video${idx}' />`);
    //document.getElementById(participant + "video2").style.width = "50%";
}

function toggleTrackMute(track) {
    if (track.isMuted()) {
        track.unmute();
        return false;
    } else {
        track.mute();
        return true;
    }
}

/*
 *checks the remote tracks, and removes the video track to be muted
 */
function checkRemoteTracks(track) {
    let participant = track.getParticipantId();
    let type = track.getType();
    const id = participant + track.getType() + 2;
    const i = {};
    for (let i = 0; i < remoteTracks[participant].length; i++) {

        if (remoteTracks[participant][i].getType() === "video") {//could just be "if (i===2)"
            if (track.isMuted()) {
                addRemoteVideoTrack(participant, 2);
                //track.attach($(`#${id}`)[0]);
            } else {
                //document.getElementById(participant + type + "2").remove();
            }
        }
    }
}

/*
 *switches local videotrack
 */
let isVideo = true;

function switchVideo() {
    isVideo = !isVideo;
    if (localTracks[1]) {
        localTracks[1].dispose();
        localTracks.pop();
    }
    JitsiMeetJS.createLocalTracks({
        devices: [isVideo ? trackTypeVideo : trackTypeDesktop]
    })
        .then(tracks => {
            localTracks.push(tracks[0]);
            localTracks[1].addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.log('local track muted'));
            localTracks[1].addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.log('local track stopped'));
            //localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

/**
 *
 */
function unload() {
    localTracks.forEach(item => item.dispose);
    room.leave();
    connection.disconnect();
}

// Exported Functions

function toggleMuteByType(type: string) {
    /*
    let muted: boolean = null;
    for (const track of localTracks) {
        if (track.getType() !== type) {
            continue;
        }
        muted = toggleTrackMute(track);
    }
    return muted;
    */
    console.debug(`type: ${type}, selfUser: ${selfUser}`)
    return processTrackType(type, () => selfUser.toggleAudioTrack(), () => {
        const enabled = !selfUser.toggleVideoTrack();
        selfUser.setVideoEnabled(enabled);
        return !enabled;
    });
}

function nearbyPlayerCheck(players: PlayerRecord, ourPlayer) {
    //array with nearby players. use this vor videochat.
    let playersNearby = [];
    let isEmpty: boolean = true;
    for (const [key, value] of Object.entries(players)) {
        if (value.id === ourPlayer.id) {
            continue;
        }
        isEmpty = false;
        //console.log(Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2));

        if (Math.pow(value.positionX - ourPlayer.positionX, 2) + Math.pow(value.positionY - ourPlayer.positionY, 2) < 50000) {
            //console.log("Player nearby: " + value.name);
            playersNearby.push(value);
        }
    }
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


window.addEventListener("beforeunload", unload);
window.addEventListener("unload", unload); // TODO Why Twice?
JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);          //mutes logger
JitsiMeetJS.init(optionsInit);
connection = new JitsiMeetJS.JitsiConnection(null, null, optionsConnection);
JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
connection.connect();
JitsiMeetJS.createLocalTracks(optionsLocalTracks).then(onLocalTracksAdded);
if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(deviceOutput)) {
    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
        const audioOutputDevices = devices.filter(d => d.kind === deviceKindAudio);
        if (audioOutputDevices.length > 1) {
            //$('#audioOutputSelect').html(audioOutputDevices.map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('\n'));
            //$('#audioOutputSelectWrapper').show();
        }
    });
}
