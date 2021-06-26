import { Player } from "../player";
import { PlayerRecord } from "../util";
import {trackTypeDesktop, trackTypeVideo} from "./conference";

export {User, SelfUser};

let videoElementWitdh: string = "15%";
let percentPerVideoElement: number = 15;

function createAudioTrackElement(id: string): HTMLAudioElement {
    const element = document.createElement("audio");
    element.setAttribute("id", id);
    //element.toggleAttribute("muted", true);
    //element.toggleAttribute("playsinline", true);
    element.toggleAttribute("autoplay", true);
    //element.setAttribute("style", "width:15%; margin-right:5px;");
    return element;
}

function createVideoTrackElement(id: string): HTMLVideoElement {
    let widthLarge: string = "75%";
    const element = document.createElement("video");
    element.setAttribute("id", id);
    element.setAttribute("poster", "/img/pause-standby.png");
    element.toggleAttribute("muted", true);
    element.toggleAttribute("playsinline", true);
    element.toggleAttribute("autoplay", true);
    element.setAttribute("style", "margin-right:5px;");
    element.style.setProperty("width", videoElementWitdh);
    element.onclick = () => {
        //TODO Improve this, so that when a video is already big it will be set small again, so only one big at a time
        //And improve this, so that a big video is maybe centered or even moved from the video-bar into an extra div
        const big = element.hasAttribute("big");
        if (big) {
            element.toggleAttribute("big", false);
            element.style.setProperty("width", videoElementWitdh);
        } else {
            element.toggleAttribute("big", true);
            element.style.setProperty("width", widthLarge);
        }
    };
    return element;
}

//Exported functions

export function getVideoElementWidth(): number{
    return percentPerVideoElement;
}

export function checkPercentPerVideoElement(playersNearby: string[]):number{
    let playerCount: number = playersNearby.length + 1;
    let numberOfMax: number = 6;
    if (playerCount > numberOfMax){
        console.log("more than " + numberOfMax + " players");
        percentPerVideoElement = Math.floor(100/playerCount) - Math.floor(10/playerCount);
    }
    else percentPerVideoElement = 15;
    videoElementWitdh = percentPerVideoElement + "%";
    return percentPerVideoElement;
}

class User {

    // Constants
    protected audioBar: HTMLDivElement;
    protected videoBar: HTMLDivElement;
    participantId: string;
    conference;
    // Variables
    protected disabled: boolean = false;
    private _audioMuted: boolean = false;
    private _videoMuted: boolean = false;
    protected audioTrack: any = null;
    protected videoTrack: any = null;
    protected audioElement: HTMLAudioElement = null;
    protected videoElement: HTMLVideoElement = null;

    constructor(conference, audioBar: HTMLDivElement, videoBar: HTMLDivElement, participantId: string) {
        this.conference = conference;
        this.audioBar = audioBar;
        this.videoBar = videoBar;
        this.participantId = participantId;
    }

    removeTrack(track) {
        if (track.getType() === trackTypeVideo) {
            this.videoTrack = null;
            this.update();
        } else if (track.getType() === trackTypeDesktop) {
            this.videoTrack = null;
            this.update();
        } else {
            //TODO How to make sure that this is the cam audio track and not the share audio track?
            this.audioTrack = null;
            this.update();
        }
    }

    setAudioTrack(track, createElement: boolean = true) {
        if (!track) {
            console.warn("the cam audio track should not be set null");
            this.audioTrack = null;
            this.update();
            return;
        }
        //TODO What to do with overridden tracks? detach them?
        this.audioTrack = track;
        if (createElement) {
            const element = createAudioTrackElement(`track-audio-${this.participantId}-${track.getId()}`);
            this.audioElement = element;
            track.attach(element);
        }
        this.update();
    }

    setVideoTrack(track) {
        if (!track) {
            console.warn("the cam video track should not be set null");
            this.videoTrack = null;
            this.update();
            return;
        }
        //TODO What to do with overridden tracks? detach them?
        this.videoTrack = track;
        const element = createVideoTrackElement(`track-video-${this.participantId}-${track.getId()}`);
        this.videoElement = element;
        track.attach(element);
        this.update();
    }

    toggleCamAudio(): boolean {
        const muted = this.toggleTrack(this.audioTrack);
        this.audioMuted = muted;
        return muted;
    }

    toggleCamVideo(): boolean {
        const muted = this.toggleTrack(this.videoTrack);
        this.videoMuted = muted;
        return muted;
    }

    private toggleTrack(track: any): boolean {
        if (!track) {
            console.warn("toggling undefined or null track?")
            return undefined;
        }
        let muted = false;
        if (track.isMuted()) {
            track.unmute().then(() => this.update());
        } else {
            track.mute().then(() => this.update());
            muted = true;
        }
        return muted;
    }

    protected pauseVideo(): boolean {
        return false;
    }
    updateVideo(){
        if(this.videoElement != null) this.videoElement.style.setProperty("width", videoElementWitdh);
        else console.log("videoElement is null");
        
    }
    update() {
        //console.log("update has been called");
        const removeVideo = this.disabled || this.videoTrack?.isMuted();
        if (this.videoElement) {
            if (this.videoTrack) {
                const changed = this.videoBar.contains(this.videoElement) === removeVideo;
                const changedPause = this.videoElement.hasAttribute("paused") !== removeVideo;
                if (changed || changedPause) {
                    if (removeVideo) {
                        this.videoElement.toggleAttribute("paused", true);
                    } else {
                        this.videoElement.toggleAttribute("paused", false);
                    }
                    if (this.pauseVideo()) {
                        if (!removeVideo && !this.videoBar.contains(this.videoElement)) {
                            this.videoBar.append(this.videoElement);
                        }
                        if (changedPause) {
                            if (removeVideo) {
                                this.videoTrack.detach(this.videoElement);
                            } else {
                                this.videoTrack.attach(this.videoElement);
                            }
                        }
                    } else {
                        if (changed) {
                            if (removeVideo) {
                                this.videoElement.remove();
                            } else {
                                this.videoElement.play().then(() => this.videoBar.append(this.videoElement));
                            }
                        }
                    }
                }
            } else {
                this.videoElement.remove();
            }
        }
        const removeAudio = this.disabled || this.audioTrack?.isMuted();
        if (this.audioElement) {
            if (this.audioTrack) {
                if (removeAudio) {
                    this.audioElement.volume = 0.0;
                    this.audioElement.setAttribute("volume", "0.0");
                    this.audioElement.toggleAttribute("muted", true);
                } else {
                    this.audioElement.volume = 1.0;
                    this.audioElement.setAttribute("volume", "1.0");
                    this.audioElement.toggleAttribute("muted", false);
                    if (!this.audioBar.contains(this.audioElement)) {
                        this.audioBar.append(this.audioElement);
                    }
                }
            } else {
                this.audioElement.remove();
            }
        }
    }

    setDisabled(disabled: boolean) {
        this.disabled = disabled;
        this.update();
    }
    getRatio(): number{
        let ratio: number = 0;
        if(this.videoElement != null) {ratio = this.videoElement.width}
        return ratio;
    }
    get audioMuted(): boolean {
        return this._audioMuted;
    }

    set audioMuted(value: boolean) {
        this._audioMuted = value;
    }

    get videoMuted(): boolean {
        return this._videoMuted;
    }

    set videoMuted(value: boolean) {
        this._videoMuted = value;
    }

    remove() {
        this.removeElements();
        this.detachTracks();
    }

    private removeElements() {
        this.audioElement?.remove();
        this.videoElement?.remove();
    }

    private detachTracks() {
        this.audioTrack?.detach(this.audioElement);
        this.videoTrack?.detach(this.videoElement);
    }

    dispose() {
        this.disposeAudio();
        this.disposeVideo();
    }

    disposeAudio() {
        this.audioTrack?.detach(this.audioElement);
        this.audioTrack?.dispose();
    }

    disposeVideo() {
        this.videoTrack?.detach(this.videoElement);
        this.videoTrack?.dispose();
    }

}

class SelfUser extends User {

    protected sharing: boolean = false;
    private sharedAudioMuted: boolean = false;
    private sharedVideoMuted: boolean = false;
    // Temp
    protected tempAudioTrack: any = null;
    protected tempVideoTrack: any = null;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement) {
        super(null, audioBar, videoBar, null);
    }

    addToConference() {
        if (this.audioTrack) {
            this.conference.addTrack(this.audioTrack);
        }
        if (this.videoTrack) {
            this.conference.addTrack(this.videoTrack);
        }
    }

    /*
    get audioMuted(): boolean {
        return this.sharing ? this.sharedAudioMuted : super.audioMuted;
    }

    set audioMuted(value: boolean) {
        if (this.sharing) {
            this.sharedAudioMuted = value;
        } else {
            super.audioMuted = value;
        }
    }
    */

    get videoMuted(): boolean {
        return this.sharing ? this.sharedVideoMuted : super.videoMuted;
    }

    set videoMuted(value: boolean) {
        if (this.sharing) {
            this.sharedVideoMuted = value;
        } else {
            super.videoMuted = value;
        }
    }

    setTempAudioTrack(track) {
        if (!track) {
            this.tempAudioTrack = null;
            return;
        }
        this.tempAudioTrack = track;
    }

    setTempVideoTrack(track) {
        if (!track) {
            this.tempVideoTrack = null;
            return;
        }
        this.tempVideoTrack = track;
    }

    swapTracks() {
        /*
        if (this.sharedAudioTrack) {
            //this.audioTrack?.detach(this.audioElement);
            this.audioTrack?.dispose();
            this.audioTrack = this.sharedAudioTrack;
            this.sharedAudioTrack = null;
            //this.audioTrack.attach(this.audioElement);
        }
        */
        if (this.tempVideoTrack) {
            if (!this.sharing && this.tempVideoTrack.isMuted() !== this.videoMuted) {
                if (this.videoMuted) {
                    this.tempVideoTrack.mute().then(() => this.swapTracksIntern());
                } else {
                    this.tempVideoTrack.unmute().then(() => this.swapTracksIntern());
                }
            } else {
                this.swapTracksIntern();
            }
        }
    }

    private swapTracksIntern() {
        this.videoTrack = this.tempVideoTrack;
        this.tempVideoTrack = null;
        this.videoTrack.attach(this.videoElement);
        this.conference.addTrack(this.videoTrack);
        this.update();
    }

    protected pauseVideo(): boolean {
        return this.sharing;
    }

    setSharing(sharing: boolean) {
        this.sharing = sharing;
    }

    isSharing(): boolean {
        return this.sharing;
    }

}
