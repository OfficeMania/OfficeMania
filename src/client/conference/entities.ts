import {trackTypeDesktop, trackTypeVideo} from "./conference";

export {User, SelfUser};

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
    const element = document.createElement("video");
    element.setAttribute("id", id);
    element.toggleAttribute("muted", true);
    element.toggleAttribute("playsinline", true);
    element.toggleAttribute("autoplay", true);
    element.setAttribute("style", "width:15%; margin-right:5px;");
    return element;
}

class User {

    // Constants
    protected audioBar: HTMLDivElement;
    protected videoBar: HTMLDivElement;
    participantId: string;
    conference;
    // Variables
    protected disabled: boolean = false;
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
        return this.toggleTrack(this.audioTrack);
    }

    toggleCamVideo(): boolean {
        return this.toggleTrack(this.videoTrack);
    }

    private toggleTrack(track): boolean {
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

    update() {
        const remove = this.disabled || this.videoTrack?.isMuted();
        if (this.videoElement) {
            if (this.videoTrack) {
                if (this.videoBar.contains(this.videoElement) === remove) {
                    if (remove) {
                        this.videoElement.remove();
                    } else {
                        this.videoElement.play().then(() => this.videoBar.append(this.videoElement));
                    }
                }
            } else {
                this.videoElement.remove();
            }
        }
        if (this.audioElement) {
            if (this.audioTrack) {
                if (remove) {
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
    // Temp
    protected tempAudioTrack: any = null;
    protected tempVideoTrack: any = null;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement) {
        super(null, audioBar, videoBar, null);
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
            this.videoTrack = this.tempVideoTrack;
            this.tempVideoTrack = null;
            this.videoTrack.attach(this.videoElement);
            this.conference.addTrack(this.videoTrack);
        }
        this.update();
    }

    setSharing(sharing: boolean) {
        this.sharing = sharing;
    }

    isSharing(): boolean {
        return this.sharing;
    }

}