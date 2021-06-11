export {User};

class TrackContainer {

    track: any = null;
    element: HTMLAudioElement | HTMLVideoElement = null;
    muted: boolean = false;
    disabled: boolean = false;

}

class User {

    // Constants
    private videoBar: HTMLDivElement;
    userId: string;
    participantId: string;
    // Variables
    private audioContainer: TrackContainer = new TrackContainer();
    private videoContainer: TrackContainer = new TrackContainer();
    private shareContainer: TrackContainer = new TrackContainer();

    constructor(videoBar: HTMLDivElement, userId: string, participantId: string) {
        this.videoBar = videoBar;
        this.userId = userId;
        this.participantId = participantId;
    }

    setAudioTrack(track) {
        if (!track) {
            User.removeContainer(this.audioContainer);
            return;
        }
        this.audioContainer.track = track;
        const element = document.createElement("audio");
        element.setAttribute("id", `track-audio-${this.participantId}`);
        element.setAttribute("muted", "true"); //TODO Why was that added anyway?
        element.setAttribute("autoplay", "1");
        this.audioContainer.element = element;
        this.audioContainer.muted = track.isMuted();
        track.attach(element);
    }

    setVideoTrack(track) {
        if (!track) {
            User.removeContainer(this.videoContainer);
            return;
        }
        this.videoContainer.track = track;
        const element = document.createElement("video");
        element.setAttribute("id", `track-video-${this.participantId}`);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        this.videoContainer.element = element;
        this.videoContainer.muted = track.isMuted();
        track.attach(element);
    }

    setShareTrack(track) {
        if (!track) {
            User.removeContainer(this.shareContainer);
            return;
        }
        this.shareContainer.track = track;
        const element = document.createElement("video");
        element.setAttribute("id", `track-share-${this.participantId}`);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        this.shareContainer.element = element;
        this.shareContainer.muted = track.isMuted();
        track.attach(element);
    }

    private static removeContainer(container) {
        container.element?.remove();
        container.track?.detach(container.element);
        container.element = null;
        container.track = null;
    }

    toggleAudioTrack(): boolean {
        return User.toggleTrack(this.audioContainer.track);
    }

    toggleVideoTrack(): boolean {
        return User.toggleTrack(this.videoContainer.track);
    }

    toggleShareTrack(): boolean {
        return User.toggleTrack(this.shareContainer.track);
    }

    private static toggleTrack(track): boolean {
        if (!track) {
            console.warn("toggling undefined or null track?")
            return undefined;
        }
        if (track.isMuted()) {
            track.unmute();
            return false;
        } else {
            track.mute();
            return true;
        }
    }

    private setElement(element: HTMLVideoElement | HTMLAudioElement, enabled: boolean) {
        if (!element) {
            return;
        }
        if (this.videoBar.contains(element) !== enabled) {
            if (enabled) {
                if (element.tagName.toLowerCase() === "video") {
                    element.play();
                }
                this.videoBar.append(element);
            } else {
                element.remove();
            }
        }
    }

    private updateTrackContainer(trackContainer: TrackContainer) {
        const enabled = !(trackContainer.disabled || trackContainer.muted);
        this.setElement(trackContainer.element, enabled);
    }

    setAudioMuted(muted: boolean) {
        const container = this.audioContainer;
        container.muted = muted;
        this.updateTrackContainer(container);
    }

    setVideoMuted(muted: boolean) {
        const container = this.videoContainer;
        container.muted = muted;
        this.updateTrackContainer(container);
    }

    setShareMuted(muted: boolean) {
        const container = this.shareContainer;
        container.muted = muted;
        this.updateTrackContainer(container);
    }

    setAudioDisabled(disabled: boolean) {
        const container = this.audioContainer;
        container.disabled = disabled;
        this.updateTrackContainer(container);
    }

    setVideoDisabled(disabled: boolean) {
        const container = this.videoContainer;
        container.disabled = disabled;
        this.updateTrackContainer(container);
    }

    setShareDisabled(disabled: boolean) {
        const container = this.shareContainer;
        container.disabled = disabled;
        this.updateTrackContainer(container);
    }

    remove() {
        this.removeElements();
        this.detachTracks();
    }

    private removeElements() {
        this.audioContainer.element?.remove();
        this.videoContainer.element?.remove();
        this.shareContainer.element?.remove();
    }

    private detachTracks() {
        this.audioContainer.track?.detach(this.audioContainer.element);
        this.videoContainer.track?.detach(this.videoContainer.element);
        this.shareContainer.track?.detach(this.shareContainer.element);
    }

}