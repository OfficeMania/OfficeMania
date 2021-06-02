import { remoteRoomCall } from "colyseus/lib/MatchMaker";

export {roomName, trackTypeAudio, trackTypeVideo, trackTypeDesktop, toggleMuteByType, switchVideo};

// Constants

const trackTypeAudio = "audio";
const trackTypeVideo = "video";
const trackTypeDesktop = "desktop";

const deviceOutput = "output";
const deviceInput = "input";

const deviceKindAudio = "audiooutput";
const deviceKindVideo = "videooutput";

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
function onConnectionSuccess() {
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
 * @param tracks Array with JitsiTrack objects
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
    if(typeof pos === "undefined") {
        return;
    }

    console.debug(`Local Track added: ${track}`); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Local: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => console.debug('Local Track Mute changed')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Local Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Local Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    if (track.getType() === trackTypeVideo) {
        $('videobar').append(`<video autoplay='1' style="width:15%; margin-right:5px;" id='localVideo${pos}' />`);
        track.attach($(`#localVideo${pos}`)[0]);
    } else {
        $('videobar').append(
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
    console.debug(`Participant id is: ${participant}`); //DEBUG
    if (!remoteTracks[participant]) {
        remoteTracks[participant] = []; //TODO
    }
    if(remoteTracks[participant].length == 2){
        console.log(`video and desktop swapping in progress`);
        remoteTracks[participant].pop();
        document.getElementById(participant + "video2").remove(); //wenn ich das aufrufe, wie rufe ich das zurück? -- also beim mute das aufrufen, und beim entmuten wieder hinmachen
    }
    const idx = remoteTracks[participant].push(track);
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_LEVEL_CHANGED, audioLevel => console.debug(`Audio Level Remote: ${audioLevel}`)); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_MUTE_CHANGED, () => {console.debug('Remote Track Mute changed'); onMute(track);});  //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.LOCAL_TRACK_STOPPED, () => console.debug('Remote Track stopped')); //DEBUG
    track.addEventListener(JitsiMeetJS.events.track.TRACK_AUDIO_OUTPUT_CHANGED, deviceId => console.debug(`Remote Track Audio Output Device was changed to ${deviceId}`)); //DEBUG
    const id = participant + track.getType() + idx;
    if (track.getType() === trackTypeVideo) {
        addVideoTrack(participant, idx);
    } else {
        $('videobar').append(
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
    console.debug(`document.getElementById: ${document.getElementById(track + "audio1")}`); //DEBUG
    //document.getElementById(track + "audio1").remove(); 
    //document.getElementById(track + "video2").remove();
    

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
    console.debug(`abcdefg ` + document.getElementById("canvas")=== null);
    console.debug(); //DEBUG
    //remove video and audio
    document.getElementById(id + "audio" + "1").remove(); 
    document.getElementById(id + "video" + "2").remove(); 

    if (!remoteTracks[id]) {
        return;
    }
    const tracks = remoteTracks[id];
    for (const item of tracks) {
        item.detach($(`#${id}${item.getType()}`));
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

function addVideoTrack(participant: string, idx: number){
    $('videobar').append(`<video autoplay='1' style="width: 10%; margin-right:5px;" id='${participant}video${idx}' />`);
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
function onMute(track){
    onHidden(track);
}
function onHidden(track){
    let participant = track.getParticipantId();
    let type = track.getType();
    console.log(`WTF IS THAT DAMAGE MY GUY ` + type);
    if (type === "audio"){
        console.log(`is audio, exiting`);
        return;
    }
    console.log(`abcdefghijkl`);
    
    checkRemoteTracks(track);
    //document.getElementById(track.getParticipantId() + "video2");
    //let name: string = track.getParticipantId();
    
    
    
}
function checkRemoteTracks(track){
    let participant = track.getParticipantId();
    let type = track.getType();
    const id = participant + track.getType() + 2;
    const i = {};
    for (let i = 0; i < remoteTracks[participant].length; i++){
        console.log(`hello there, general kenobi:`)
        if (remoteTracks[participant][i].getType() === "audio"){

            console.log(`track is: audio:  ${remoteTracks[participant][i]}`);
            
        }
        if (remoteTracks[participant][i].getType() === "video"){
            console.log(`track is: video:  ${remoteTracks[participant][i]}`);
            let isMuted: number = -1;
            isMuted = muted.indexOf(remoteTracks[participant][i]);
            if (isMuted != -1){
                muted.splice(isMuted, 1);
                addVideoTrack(participant, 2);
                track.attach($(`#${id}`)[0]);
                console.log(`muted is: when unmuting` + muted);
            }
            else {
                muted.push(remoteTracks[participant][i]);
                console.log(`document.getElementById` + participant + type + "2");
                document.getElementById(participant + type + "2").remove();
                console.log(`muted is: ` + muted);
            }
            //muted.push(i);
            
        }
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


let isVideo = true;
function switchVideo() { //TODO Is this even used anymore? //yes, for screen sharing 
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
                () => console.log('local track stopped'));
            localTracks[1].attach($('#localVideo1')[0]);
            room.addTrack(localTracks[1]);
        })
        .catch(error => console.log(error));
}

$(window).on("beforeunload", unload);
$(window).on("unload", unload);
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
            $('#audioOutputSelect').html(audioOutputDevices.map(d => `<option value="${d.deviceId}">${d.label}</option>`).join('\n'));
            $('#audioOutputSelectWrapper').show();
        }
    });
}