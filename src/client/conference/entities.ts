export {User};

class User {

    // Constants
    private videoBar: HTMLDivElement;
    userId: string;
    participantId: string;
    // Variables
    private audio = {
        track: null,
        element: null
    }
    private video = {
        track: null,
        element: null
    }
    private share = {
        track: null,
        element: null
    }

    constructor(videoBar: HTMLDivElement, userId: string, participantId: string) {
        this.videoBar = videoBar;
        this.userId = userId;
        this.participantId = participantId;
    }

    setAudioTrack(track) {
        if (!track) {
            User.removeContainer(this.audio);
            return;
        }
        this.audio.track = track;
        const element = document.createElement("audio");
        element.setAttribute("id", `track-audio-${this.participantId}`);
        //element.setAttribute("muted", "true"); //TODO Why was that added anyway?
        element.setAttribute("autoplay", "1");
        this.audio.element = element;
        track.attach(element);
    }

    setVideoTrack(track) {
        if (!track) {
            User.removeContainer(this.video);
            return;
        }
        this.video.track = track;
        const element = document.createElement("video");
        element.setAttribute("id", `track-video-${this.participantId}`);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        this.video.element = element;
        track.attach(element);
    }

    setShareTrack(track) {
        if (!track) {
            User.removeContainer(this.share);
            return;
        }
        this.share.track = track;
        const element = document.createElement("video");
        element.setAttribute("id", `track-share-${this.participantId}`);
        element.toggleAttribute("muted", true);
        element.toggleAttribute("playsinline", true);
        element.toggleAttribute("autoplay", true);
        element.setAttribute("style", "width:15%; margin-right:5px;");
        this.share.element = element;
        track.attach(element);
    }

    private static removeContainer(container) {
        container.element?.remove();
        container.track?.detach(container.element);
        container.element = null;
        container.track = null;
    }

    toggleAudioTrack(): boolean {
        return User.toggleTrack(this.audio.track);
    }

    toggleVideoTrack(): boolean {
        return User.toggleTrack(this.video.track);
    }

    toggleShareTrack(): boolean {
        return User.toggleTrack(this.share.track);
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

    private toggleElement(element: HTMLVideoElement | HTMLAudioElement, enabled: boolean) {
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

    setAudioEnabled(enabled: boolean) {
        this.toggleElement(this.audio.element, enabled);
    }

    setVideoEnabled(enabled: boolean) {
        this.toggleElement(this.video.element, enabled);
    }

    setShareEnabled(enabled: boolean) {
        this.toggleElement(this.share.element, enabled);
    }

    remove() {
        this.removeElements();
        this.detachTracks();
    }

    private removeElements() {
        this.audio.element?.remove();
        this.video.element?.remove();
        this.share.element?.remove();
    }

    private detachTracks() {
        this.audio.track?.detach(this.audio.element);
        this.video.track?.detach(this.video.element);
        this.share.track?.detach(this.share.element);
    }

}