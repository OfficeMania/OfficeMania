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
    private videoBar: HTMLDivElement;
    private camContainer: MediaContainer = new MediaContainer();
    private shareContainer: MediaContainer = new MediaContainer();
    // Variables
    disabled: boolean = false;
    userId: string;
    participantId: string;

    constructor(videoBar: HTMLDivElement, userId: string, participantId: string) {
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

    setCamAudioTrack(track, createElement: boolean = true) {
        if (!track) {
            console.warn("the cam audio track should not be set null");
            this.camContainer.audioTrack = null;
            this.update();
            return;
        }
        this.camContainer.audioTrack = track;
        if (createElement) {
            const element = document.createElement("audio");
            element.setAttribute("id", `track-audio-${this.participantId}-${track.getId()}`);
            //element.toggleAttribute("muted", true);
            //element.toggleAttribute("playsinline", true);
            element.toggleAttribute("autoplay", true);
            //element.setAttribute("style", "width:15%; margin-right:5px;");
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
        const element = document.createElement("video");
        element.setAttribute("id", `track-video-${this.participantId}-${track.getId()}`);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        this.camContainer.videoElement = element;
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
        this.updateContainer(this.shareContainer);
    }

    private updateContainer(container: MediaContainer) {
        const remove = this.disabled || container.videoTrack?.isMuted();
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
                    if (!this.videoBar.contains(container.audioElement)) {
                        this.videoBar.append(container.audioElement);
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