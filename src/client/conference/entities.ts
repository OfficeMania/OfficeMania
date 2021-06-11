import {trackTypeDesktop, trackTypeVideo} from "./conference";

export {User};

class MediaContainer {
    audioTrack: any = null;
    videoTrack: any = null;
    audioElement: HTMLAudioElement = null;
    videoElement: HTMLVideoElement = null;
}

class User {

    // Constants
    private audioBar: HTMLDivElement;
    private videoBar: HTMLDivElement;
    private camContainer: MediaContainer = new MediaContainer();
    private shareContainer: MediaContainer = new MediaContainer();
    // Variables
    private disabled: boolean = false;
    private sharing: boolean = false;
    userId: string;
    participantId: string;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement, userId: string, participantId: string) {
        this.audioBar = audioBar;
        this.videoBar = videoBar;
        this.userId = userId;
        this.participantId = participantId;
    }

    removeTrack(track) {
        if (track.getType() === trackTypeVideo) {
            this.camContainer.videoTrack = null;
        } else if (track.getType() === trackTypeDesktop) {
            this.shareContainer.videoTrack = null;
        } else {
            //TODO How to make sure that this is the cam audio track and not the share audio track?
            this.camContainer.audioTrack = null;
        }
    }

    private static createAudioTrackElement(id: string): HTMLAudioElement {
        const element = document.createElement("audio");
        element.setAttribute("id", id);
        //element.toggleAttribute("muted", true);
        //element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        //element.setAttribute("style", "width:15%; margin-right:5px;");
        return element;
    }

    private static createVideoTrackElement(id: string): HTMLVideoElement {
        const element = document.createElement("video");
        element.setAttribute("id", id);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        return element;
    }

    setCamAudioTrack(track, createElement: boolean = true) {
        if (!track) {
            console.warn("the cam audio track should not be set null");
            this.camContainer.audioTrack = null;
            this.update();
            return;
        }
        this.camContainer.audioTrack = track;
        if (createElement) {
            const element = User.createAudioTrackElement(`track-cam-audio-${this.participantId}-${track.getId()}`);
            this.camContainer.audioElement = element;
            track.attach(element);
        }
        this.update();
    }

    setCamVideoTrack(track) {
        if (!track) {
            console.warn("the cam video track should not be set null");
            this.camContainer.videoTrack = null;
            this.update();
            return;
        }
        this.camContainer.videoTrack = track;
        const element = User.createVideoTrackElement(`track-cam-video-${this.participantId}-${track.getId()}`);
        this.camContainer.videoElement = element;
        track.attach(element);
        this.update();
    }

    setShareAudioTrack(track, createElement: boolean = true) {
        if (!track) {
            console.warn("the share audio track should not be set null");
            this.shareContainer.audioTrack = null;
            this.update();
            return;
        }
        this.shareContainer.audioTrack = track;
        if (createElement) {
            const element = User.createAudioTrackElement(`track-share-audio-${this.participantId}-${track.getId()}`);
            this.shareContainer.audioElement = element;
            track.attach(element);
        }
        this.update();
    }

    setShareVideoTrack(track) {
        if (!track) {
            console.warn("the share video track should not be set null");
            this.shareContainer.videoTrack = null;
            this.update();
            return;
        }
        this.shareContainer.videoTrack = track;
        const element = User.createVideoTrackElement(`track-share-video-${this.participantId}-${track.getId()}`);
        this.shareContainer.videoElement = element;
        track.attach(element);
        this.update();
    }

    toggleCamAudio(): boolean {
        return this.toggleTrack(this.camContainer.audioTrack);
    }

    toggleCamVideo(): boolean {
        return this.toggleTrack(this.camContainer.videoTrack);
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
        this.updateContainer(this.camContainer);
        this.updateContainer(this.shareContainer, this.sharing);
    }

    private updateContainer(container: MediaContainer, enabled: boolean = true) {
        const remove = this.disabled || container.videoTrack?.isMuted() || !enabled;
        if (container.videoElement) {
            if (container.videoTrack) {
                if (this.videoBar.contains(container.videoElement) === remove) {
                    if (remove) {
                        container.videoElement.remove();
                    } else {
                        container.videoElement.play().then(() => this.videoBar.append(container.videoElement));
                    }
                }
            } else {
                container.videoElement.remove();
            }
        }
        if (container.audioElement) {
            if (container.audioTrack) {
                if (remove) {
                    container.audioElement.volume = 0.0;
                    container.audioElement.setAttribute("volume", "0.0");
                    container.audioElement.toggleAttribute("muted", true);
                    //container.audioTrack.detach(container.audioElement);
                    //container.audioElement.remove();
                } else {
                    container.audioElement.volume = 1.0;
                    container.audioElement.setAttribute("volume", "1.0");
                    container.audioElement.toggleAttribute("muted", false);
                    //container.audioTrack.attach(container.audioElement);
                    if (!this.audioBar.contains(container.audioElement)) {
                        this.audioBar.append(container.audioElement);
                    }
                }
            } else {
                container.audioElement.remove();
            }
        }
    }

    setDisabled(disabled: boolean) {
        this.disabled = disabled;
        this.update();
    }

    setSharing(sharing: boolean) {
        this.sharing = sharing;
        this.update();
    }

    remove() {
        this.removeElements();
        this.detachTracks();
    }

    private removeElements() {
        this.camContainer.audioElement?.remove();
        this.camContainer.videoElement?.remove();
        this.shareContainer.audioElement?.remove();
        this.shareContainer.videoElement?.remove();
    }

    private detachTracks() {
        this.camContainer.audioTrack?.detach(this.camContainer.audioElement);
        this.camContainer.videoTrack?.detach(this.camContainer.videoElement);
        this.shareContainer.audioTrack?.detach(this.shareContainer.audioElement);
        this.shareContainer.videoTrack?.detach(this.shareContainer.videoElement);
    }

}