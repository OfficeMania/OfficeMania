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
        user.toggleFocus();
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

    isAudioTrackMuted(): boolean {
        return this.audioTrack?.isMuted();
    }

    isVideoTrackMuted(): boolean {
        return this.videoTrack?.isMuted();
    }

    removeTrack(track) {
        if (track.getType() === trackTypeVideo || track.getType() === trackTypeDesktop) {
            this.videoTrack = null;
            this.update();
        } else {
            this.audioTrack = null;
            this.update();
        }
    }

    async setAudioTrack(track, isLocal: boolean) {
        await this.disposeAudio();
        if (!track) {
            console.warn("The Audio Track should not be empty");
            this.audioTrack = null;
            this.update();
            return;
        }
        this.audioTrack = track;
        if (isLocal) {
            this.conference.addTrack(this.audioTrack);
        } else {
            if (!this.audioElement) {
                this.audioElement = createAudioTrackElement(`track-audio-${this.participantId}-${track.getId()}`);
            }
            if (this.audioElement) {
                this.audioTrack.attach(this.audioElement);
            }
        }
        this.update();
    }

    async setVideoTrack(track, isLocal: boolean) {
        await this.disposeVideo();
        if (!track) {
            console.warn("The Video Track should not be empty");
            this.videoTrack = null;
            this.update();
            return;
        }
        this.videoTrack = track;
        if (!this.videoContainer) {
            this.videoContainer = createVideoElementContainer(`track-video-${this.participantId}-${track.getId()}`, this, this.updateVideoContainer);
        }
        if (this.videoContainer?.video) {
            this.videoTrack.attach(this.videoContainer.video);
        }
        if (isLocal) {
            this.conference.addTrack(this.videoTrack);
        }
        this.update();
    }

    protected pauseVideo(): boolean {
        return false;
    }

    protected setHidden(hide: boolean) {
        this.videoContainer?.video?.toggleAttribute(attributeHide, hide);
    }

    protected isHidden(): boolean {
        return this.videoContainer?.video?.hasAttribute(attributeHide);
    }

    protected setFocused(focus: boolean) {
        this.videoContainer?.video?.toggleAttribute(attributeFocus, focus);
    }

    protected isFocused(): boolean {
        return this.videoContainer?.video?.hasAttribute(attributeFocus);
    }

    toggleFocus() {
        this.setFocused(!this.isFocused());
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
        this.videoContainer.video.play().catch(console.error);
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
                                this.setHidden(false);
                                this.updateVideoContainer();
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

    async dispose() {
        await this.disposeAudio();
        await this.disposeVideo();
    }

    async disposeAudio() {
        this.audioTrack?.detach(this.audioElement);
        await this.audioTrack?.dispose();
    }

    async disposeVideo() {
        this.videoTrack?.detach(this.videoContainer.video);
        await this.videoTrack?.dispose();
    }

}

class SelfUser extends User {

    private _sharingAudio: boolean = false;
    private _sharingVideo: boolean = false;
    private _audioMuted: boolean = false;
    private _videoMuted: boolean = false;
    private _sharedAudioMuted: boolean = false;
    private _sharedVideoMuted: boolean = false;

    constructor(audioBar: HTMLDivElement, videoBar: HTMLDivElement, focusBar: HTMLDivElement) {
        super(null, audioBar, videoBar, focusBar, null);
    }

    private get sharingAudio(): boolean {
        return this._sharingAudio;
    }

    private set sharingAudio(value: boolean) {
        this._sharingAudio = value;
    }

    private get sharingVideo(): boolean {
        return this._sharingVideo;
    }

    private set sharingVideo(value: boolean) {
        this._sharingVideo = value;
    }

    private get audioMuted(): boolean {
        return this._audioMuted;
    }

    private set audioMuted(value: boolean) {
        this._audioMuted = value;
    }

    private get videoMuted(): boolean {
        return this._videoMuted;
    }

    private set videoMuted(value: boolean) {
        this._videoMuted = value;
    }

    private get sharedAudioMuted(): boolean {
        return this._sharedAudioMuted;
    }

    private set sharedAudioMuted(value: boolean) {
        this._sharedAudioMuted = value;
    }

    private get sharedVideoMuted(): boolean {
        return this._sharedVideoMuted;
    }

    private set sharedVideoMuted(value: boolean) {
        this._sharedVideoMuted = value;
    }

    addToConference() {
        if (this.audioTrack) {
            this.conference.addTrack(this.audioTrack);
        }
        if (this.videoTrack) {
            this.conference.addTrack(this.videoTrack);
        }
    }

    toggleAudio(): boolean {
        const muted = toggleTrack(this.audioTrack, () => this.update());
        if (this.sharingAudio) {
            this.sharedAudioMuted = muted;
        } else {
            this.audioMuted = muted;
        }
        return muted;
    }

    toggleVideo(): boolean {
        const muted = toggleTrack(this.videoTrack, () => this.update());
        if (this.sharingVideo) {
            this.sharedVideoMuted = muted;
        } else {
            this.videoMuted = muted;
        }
        return muted;
    }

    async setNewAudioTrack(track, sharing: boolean = false) {
        if (!this.conference) {
            return; //TODO When will the new Track be set then?
        }
        this.sharingAudio = sharing;
        const mute: boolean = this.currentAudioMuted();
        if (track.isMuted() !== mute) {
            if (mute) {
                track.mute();
            } else {
                track.unmute();
            }
        }
        await this.setAudioTrack(track, true);
    }

    async setNewVideoTrack(track, sharing: boolean = false) {
        if (!this.conference) {
            return; //TODO When will the new Track be set then?
        }
        this.sharingVideo = sharing;
        const mute: boolean = this.currentVideoMuted();
        if (track.isMuted() !== mute) {
            if (mute) {
                track.mute();
            } else {
                track.unmute();
            }
        }
        await this.setVideoTrack(track, true);
    }

    currentAudioMuted(): boolean {
        return this.sharingAudio ? this.sharedAudioMuted : this.audioMuted;
    }

    currentVideoMuted(): boolean {
        return this.sharingVideo ? this.sharedVideoMuted : this.videoMuted;
    }

    isSharingAudio(): boolean {
        return this.sharingAudio;
    }

    isSharingVideo(): boolean {
        return this.sharingVideo;
    }

    isSharing(): boolean {
        return this.isSharingVideo() || this.isSharingAudio();
    }

}

function toggleTrack(track: any, callback: () => void): boolean {
    if (!track) {
        console.warn("Toggling undefined or null Track?")
        return undefined;
    }
    let muted = false;
    if (track.isMuted()) {
        track.unmute().then(callback);
    } else {
        track.mute().then(callback);
        muted = true;
    }
    return muted;
}
