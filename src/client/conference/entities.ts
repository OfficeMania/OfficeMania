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
    // Variables
    protected disabled: boolean = false;
    protected audioTrack: any = null;
    protected videoTrack: any = null;
    protected audioElement: HTMLAudioElement = null;
    protected videoElement: HTMLVideoElement = null;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement, participantId: string) {
        this.audioBar = audioBar;
        this.videoBar = videoBar;
        this.participantId = participantId;
    }

    removeTrack(track) {
        if (track.getType() === trackTypeVideo) {
            this.videoTrack = null;
        } else if (track.getType() === trackTypeDesktop) {
            this.videoTrack = null;
        } else {
            //TODO How to make sure that this is the cam audio track and not the share audio track?
            this.audioTrack = null;
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
                    //this.audioTrack.detach(this.audioElement);
                    //this.audioElement.remove();
                } else {
                    this.audioElement.volume = 1.0;
                    this.audioElement.setAttribute("volume", "1.0");
                    this.audioElement.toggleAttribute("muted", false);
                    //this.audioTrack.attach(this.audioElement);
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

}

class SelfUser extends User {

    protected sharing: boolean = false;
    protected shareAudioTrack: any = null;
    protected shareVideoTrack: any = null;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement) {
        super(audioBar, videoBar, null);
    }

    setSharedAudioTrack(track, createElement: boolean = true) {
        if (!track) {
            console.warn("the share audio track should not be set null");
            this.shareAudioTrack = null;
            this.update();
            return;
        }
        //TODO What to do with overridden tracks? detach them?
        this.shareAudioTrack = track;
        if (createElement) {
            const element = createAudioTrackElement(`track-share-audio-${this.participantId}-${track.getId()}`);
            this.audioElement = element;
            track.attach(element);
        }
        this.update();
    }

    setSharedVideoTrack(track) {
        if (!track) {
            console.warn("the share video track should not be set null");
            this.shareVideoTrack = null;
            this.update();
            return;
        }
        //TODO What to do with overridden tracks? detach them?
        this.shareVideoTrack = track;
        const element = createVideoTrackElement(`track-share-video-${this.participantId}-${track.getId()}`);
        this.videoElement = element;
        track.attach(element);
        this.update();
    }

    setSharing(sharing: boolean) {
        this.sharing = sharing;
        this.update();
    }

    isSharing(): boolean {
        return this.sharing;
    }

    hasSharingTracks(): boolean {
        return !!(this.shareVideoTrack || this.shareAudioTrack);
    }

}