import JitsiMeetJS from "./external_api";

export {roomName, trackTypeAudio, trackTypeVideo, toggleMuteByType};

// Constants

const trackTypeAudio = "audio";
const trackTypeVideo = "video";
//const trackTypeDesktop = "desktop";

const deviceOutput = "output";
const deviceInput = "input";

const deviceKindAudio = "audiooutput";
const deviceKindVideo = "videooutput";

// Options

const roomName = "conference"; //TODO

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
    disableAudioLevels: true
};

// Variables

let connection = null;
let isJoined = false;
let room = null;

let localTracks = [];
const remoteTracks = {};

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
    room = connection.initJitsiConference(roomName, optionsConference);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onTrackAdded);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, onTrackRemoved);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.CONFERENCE_LEFT, onConferenceLeft); //TODO Verify that this event exists
    room.on(JitsiMeetJS.events.conference.USER_JOINED, onUserJoined);
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, track => console.debug(`${track.getType()} - ${track.isMuted()}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED, (userID, audioLevel) => console.debug(`${userID} - ${audioLevel}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, (userID, displayName) => console.debug(`${userID} - ${displayName}`)); //DEBUG
    room.on(JitsiMeetJS.events.conference.PHONE_NUMBER_CHANGED, () => console.debug(`${room.getPhoneNumber()} - ${room.getPhonePin()}`)); //DEBUG //REMOVE
    room.join();
}

/**
 * Handles local tracks.
 *
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracksAdded(tracks) {
    localTracks = tracks; //TODO should this stay that way?
    for (let i = 0; i < localTracks.length; i++) {
        onLocalTrackAdded(localTracks[i], i);
    }
}

function onTrack(track, onLocal, onRemote) {
    if (track.isLocal()) {
        onLocal(track);
    } else {
        onRemote(track);
    }
}

function onTrackAdded(track) {
    onTrack(track, onLocalTrackAdded, onRemoteTrackAdded);
}

function onLocalTrackAdded(track, pos: number) {
    console.debug(`Local Track added: ${track}`); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Local: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('Local Track Muted')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Local Track Stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    if (track.getType() === trackTypeVideo) {
        $('body').append(`<video autoplay='1' id='localVideo${pos}' />`);
        track.attach($(`#localVideo${pos}`)[0]);
    } else {
        $('body').append(
            `<audio autoplay='1' muted='true' id='localAudio${pos}' />`);
        track.attach($(`#localAudio${pos}`)[0]);
    }
    if (isJoined) {
        room.addTrack(track);
    }
}

/**
 * Handles remote tracks.
 *
 * @param track JitsiTrack object
 */
function onRemoteTrackAdded(track) {
    console.debug(`Remote Track added: ${track}`); //DEBUG
    const participant = track.getParticipantId();
    if (!remoteTracks[participant]) {
        remoteTracks[participant] = []; //TODO
    }
    const idx = remoteTracks[participant].push(track);
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('Remote Track Muted'));  //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track Stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    const id = participant + track.getType() + idx;
    if (track.getType() === trackTypeVideo) {
        $('body').append(
            `<video autoplay='1' id='${participant}video${idx}' />`);
    } else {
        $('body').append(
            `<audio autoplay='1' id='${participant}audio${idx}' />`);
    }
    track.attach($(`#${id}`)[0]);
}

function onTrackRemoved(track) {
    onTrack(track, onLocalTrackRemoved, onRemoteTrackRemoved);
}

function onLocalTrackRemoved(track) {
    console.debug(`Remote Track added: ${track}`); //DEBUG
    //TODO
}

function onRemoteTrackRemoved(track) {
    console.debug(`Remote Track removed: ${track}`); //DEBUG
    //TODO
}

/**
 * This is called when a conference has been joined.
 */
function onConferenceJoined() {
    console.debug('Conference joined'); //DEBUG
    isJoined = true;
    localTracks.forEach(room.addTrack);
}

/**
 * This is called when a conference has been left.
 */
function onConferenceLeft() {
    console.debug('Conference left'); //DEBUG
    isJoined = false;
    //TODO
}

/**
 * This is called when a user has joined.
 *
 * @param id User id
 */
function onUserJoined(id) {
    console.debug('User joined: ' + id); //DEBUG
    remoteTracks[id] = [];
}

/**
 * This is called when a user has left.
 *
 * @param id User id
 */
function onUserLeft(id) {
    console.debug('User left: ' + id); //DEBUG
    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    for (const item of tracks) {
        item.detach($(`#${id}${item.getType()}`));
    }
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

// Functions

/**
 * Set Audio Output Device.
 *
 * @param selected Audio Output
 */
function setAudioOutputDevice(selected) {
    JitsiMeetJS.mediaDevices.setAudioOutputDevice(selected.value);
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
    let muted: boolean = null;
    for (const track of localTracks) {
        if (track.getType() !== type) {
            continue;
        }
        muted = toggleTrackMute(track);
    }
    return muted;
}

// Code

/*
let isVideo = true;
function switchVideo() { //TODO Is this even used anymore?
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
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.TRACK_MUTE_CHANGED,
                () => console.log('local track muted'));
            localTracks[1].addEventListener(
                JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED,
                () => console.log('local track stoped'));
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}
*/
$(window).on("beforeunload", unload);
$(window).on("unload", unload);
JitsiMeetJS.init(optionsInit);
connection = new JitsiMeetJS.JitsiConnection(null, null, optionsConnection);
JitsiMeetJS.mediaDevices.addEventListener(JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED, onDeviceListChanged);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, onDisconnected);
connection.connect();
JitsiMeetJS.createLocalTracks({devices: [trackTypeAudio, trackTypeVideo]}).then(onLocalTracksAdded).throw();
if (JitsiMeetJS.mediaDevices.isDeviceChangeAvailable(deviceOutput)) {
    JitsiMeetJS.mediaDevices.enumerateDevices().then(devices => {
        const audioOutputDevices = devices.filter(d => d.kind === deviceKindAudio);
        if (audioOutputDevices.length > 1) {
            $('#audioOutputSelect').html(audioOutputDevices.map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('\n'));
            $('#audioOutputSelectWrapper').show();
        }
    }).throw();
}