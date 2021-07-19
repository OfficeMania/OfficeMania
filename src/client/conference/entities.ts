import {createPlayerState, trackTypeDesktop, trackTypeVideo} from "./conference";
import {Player} from "../player";
import {appendFAIcon, removeChildren} from "../util";

export {User, SelfUser};

const attributeFocus = "focus";
const attributeHide = "hide";

function createAudioTrackElement(id: string): HTMLAudioElement {
    const element = document.createElement("audio");
    element.setAttribute("id", id);
    element.toggleAttribute("autoplay", true);
    return element;
}

function createVideoElementContainer(id: string, user: User, onUpdate: () => void): VideoContainer {
    const videoElement = document.createElement("video");
    videoElement.setAttribute("id", id);
    videoElement.setAttribute("poster", "/img/pause-standby.png");
    videoElement.toggleAttribute("muted", true);
    videoElement.toggleAttribute("playsinline", true);
    videoElement.toggleAttribute("autoplay", true);
    const focusToggle = () => {
        user.setFocused(!user.isFocused());
        onUpdate.call(user);
    };
    videoElement.addEventListener("click", focusToggle);
    const videoContainer = new VideoContainer(videoElement);
    videoContainer.buttonToggleSize.addEventListener("click", focusToggle);
    return videoContainer;
}

//Exported functions

class VideoContainer {

    private readonly _container: HTMLDivElement;
    private readonly _video: HTMLVideoElement;
    private readonly _overlay: HTMLDivElement;
    private readonly _buttonToggleSize: HTMLButtonElement;

    constructor(video: HTMLVideoElement) {
        this._container = document.createElement("div");
        this._video = video;
        this._overlay = document.createElement("div");
        this._buttonToggleSize = document.createElement("button");
        this.init();
    }

    protected init() {
        this.container.classList.add("video-container");
        this.container.append(this.video);
        this.overlay.classList.add("video-overlay");
        this.container.append(this.overlay);
        this.updatePlayerState(undefined);
        this.buttonToggleSize.classList.add("button-video-toggle-size");
        appendFAIcon(this.buttonToggleSize, "expand-alt");
        this.container.append(this.buttonToggleSize);
    }

    get container(): HTMLDivElement {
        return this._container;
    }

    get video(): HTMLVideoElement {
        return this._video;
    }

    get overlay(): HTMLDivElement {
        return this._overlay;
    }

    get buttonToggleSize(): HTMLButtonElement {
        return this._buttonToggleSize;
    }

    updatePlayerState(player: Player) {
        removeChildren(this.overlay);
        this.overlay.append(createPlayerState(player, document.createElement("div")));
    }

    updateFocus(focused: boolean) {
        removeChildren(this.buttonToggleSize);
        appendFAIcon(this.buttonToggleSize, focused ? "compress-alt" : "expand-alt");
    }

}

class User {

    // Constants
    protected audioBar: HTMLDivElement;
    protected videoBar: HTMLDivElement;
    protected focusBar: HTMLDivElement;
    participantId: string;
    conference;
    // Variables
    protected disabled: boolean = false;
    protected audioTrack: any = null;
    protected videoTrack: any = null;
    protected audioElement: HTMLAudioElement = null;
    protected videoContainer: VideoContainer = null;

    constructor(conference, audioBar: HTMLDivElement, videoBar: HTMLDivElement, focusBar: HTMLDivElement, participantId: string) {
        this.conference = conference;
        this.audioBar = audioBar;
        this.videoBar = videoBar;
        this.focusBar = focusBar;
        this.participantId = participantId;
    }

    isAudioMuted(): boolean {
        return this.audioTrack?.isMuted();
    }

    isVideoMuted(): boolean {
        return this.videoTrack?.isMuted();
    }

    removeTrack(track) {
        if (track.getType() === trackTypeVideo || track.getType() === trackTypeDesktop) {
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
        const container = createVideoElementContainer(`track-video-${this.participantId}-${track.getId()}`, this, this.updateVideoContainer);
        this.videoContainer = container;
        track.attach(container.video);
        this.update();
    }

    protected pauseVideo(): boolean {
        return false;
    }

    setHidden(hide: boolean) {
        this.videoContainer?.video?.toggleAttribute(attributeHide, hide);
    }

    isHidden(): boolean {
        return this.videoContainer?.video?.hasAttribute(attributeHide);
    }

    setFocused(focus: boolean) {
        this.videoContainer?.video?.toggleAttribute(attributeFocus, focus);
    }

    isFocused(): boolean {
        return this.videoContainer?.video?.hasAttribute(attributeFocus);
    }

    protected updateVideoContainer() {
        if (!this.videoContainer) {
            return;
        }
        const element = this.videoContainer.container;
        if (this.isHidden()) {
            if (this.videoBar.contains(element) || this.focusBar.contains(element)) {
                element.remove();
            }
            return;
        }
        const focused = this.isFocused();
        this.videoContainer.updateFocus(focused);
        const currentBar = focused ? this.focusBar : this.videoBar;
        const lastBar = !focused ? this.focusBar : this.videoBar;
        if (lastBar.contains(element)) {
            element.remove();
        }
        if (!currentBar.contains(element)) {
            currentBar.append(element);
        }
    }

    update() {
        //console.log("update has been called");
        const removeVideo = this.disabled || this.videoTrack?.isMuted();
        if (this.videoContainer) {
            if (this.videoTrack) {
                const changed = this.videoBar.contains(this.videoContainer.container) === removeVideo;
                const changedPause = this.videoContainer.video.hasAttribute("paused") !== removeVideo;
                if (changed || changedPause) {
                    if (removeVideo) {
                        this.videoContainer.video.toggleAttribute("paused", true);
                    } else {
                        this.videoContainer.video.toggleAttribute("paused", false);
                    }
                    if (this.pauseVideo()) {
                        if (!removeVideo && !this.videoBar.contains(this.videoContainer.container)) {
                            this.setHidden(false);
                            this.updateVideoContainer();
                        }
                        if (changedPause) {
                            if (removeVideo) {
                                this.videoTrack.detach(this.videoContainer.video);
                            } else {
                                this.videoTrack.attach(this.videoContainer.video);
                            }
                        }
                    } else {
                        if (changed) {
                            if (removeVideo) {
                                this.setHidden(true);
                                this.updateVideoContainer();
                            } else {
                                this.videoContainer.video.play().then(() => {
                                    this.setHidden(false);
                                    this.updateVideoContainer();
                                });
                            }
                        }
                    }
                }
            } else {
                this.setHidden(true);
                this.updateVideoContainer();
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

    updatePlayer(player: Player) {
        this.videoContainer?.updatePlayerState(player);
    }

    getRatio(): number {
        if (this.videoContainer != null) {
            return this.videoContainer.video.offsetWidth / this.videoContainer.video.offsetHeight;
        } else {
            return undefined;
        }
    }

    remove() {
        this.removeElements();
        this.detachTracks();
    }

    private removeElements() {
        this.audioElement?.remove();
        this.videoContainer?.container?.remove();
    }

    private detachTracks() {
        this.audioTrack?.detach(this.audioElement);
        this.videoTrack?.detach(this.videoContainer.video);
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
        this.videoTrack?.detach(this.videoContainer.video);
        this.videoTrack?.dispose();
    }

}

class SelfUser extends User {

    protected sharing: boolean = false;
    private sharedAudioMuted: boolean = false;
    private sharedVideoMuted: boolean = false;
    private _audioMuted: boolean = false;
    private _videoMuted: boolean = false;
    // Temp
    protected tempAudioTrack: any = null;
    protected tempVideoTrack: any = null;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement, focusBar: HTMLDivElement) {
        super(null, audioBar, videoBar, focusBar, null);
    }

    get audioMuted(): boolean {
        return this.sharing ? this.sharedAudioMuted : this._audioMuted;
    }

    set audioMuted(value: boolean) {
        if (this.sharing) {
            this.sharedAudioMuted = value;
        } else {
            this._audioMuted = value;
        }
    }

    get videoMuted(): boolean {
        return this.sharing ? this.sharedVideoMuted : this._videoMuted;
    }

    set videoMuted(value: boolean) {
        if (this.sharing) {
            this.sharedVideoMuted = value;
        } else {
            this._videoMuted = value;
        }
    }

    addToConference() {
        if (this.audioTrack) {
            this.conference.addTrack(this.audioTrack);
        }
        if (this.videoTrack) {
            this.conference.addTrack(this.videoTrack);
        }
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
        if (!this.sharing && this.tempVideoTrack && this.tempVideoTrack.isMuted() !== this.videoMuted) {
            if (this.videoMuted) {
                this.tempVideoTrack.mute().then(() => this.swapTracksIntern());
            } else {
                this.tempVideoTrack.unmute().then(() => this.swapTracksIntern());
            }
        } else {
            this.swapTracksIntern();
        }
    }

    private async swapTracksIntern() {
        if (!this.conference) {
            return; //FIXME When is the Track swapped than?
        }
        if (this.tempAudioTrack) {
            await this.audioTrack?.dispose();
            this.audioTrack = this.tempAudioTrack;
            this.tempAudioTrack = null;
            if (this.audioElement) {
                this.audioTrack.attach(this.audioElement);
            }
            this.conference.addTrack(this.audioTrack);
        }
        if (this.tempVideoTrack) {
            if (!this.videoContainer) {
                this.setVideoTrack(this.tempVideoTrack);
                this.tempVideoTrack = null;
                this.conference.addTrack(this.videoTrack);
                return
            }
            this.videoTrack = this.tempVideoTrack;
            this.tempVideoTrack = null;
            this.videoTrack.attach(this.videoContainer.video);
            this.conference.addTrack(this.videoTrack);
        }
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
