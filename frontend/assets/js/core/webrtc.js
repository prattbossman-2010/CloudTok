class CloudTokWebRTC {

    constructor() {
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.pollTimeout = null;
        this.lastSignalId = 0;
        this.onRemoteStream = null;
        this.onCallEnd = null;
        this.onIncomingCall = null;
        this.onAnswerReceived = null;
        this.onConnectionStateChange = null;
        this.isInitiator = false;
        this.backendReady = false;
        this.iceCandidateQueue = [];
        this.isInCall = false;
        this._targetUsername = null;
        this._polling = false;
    }

    _log(...args) {
        console.log("[WebRTC]", ...args);
    }

    async startLocalStream(video = true) {
        this._log("Requesting media, video=", video);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("[WebRTC] getUserMedia NOT supported on this browser/context");
            return null;
        }

        const fullConstraints = {
            audio: true,
            video: video ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false
        };

        const audioOnlyConstraints = { audio: true, video: false };

        const attempts = [fullConstraints, fullConstraints, audioOnlyConstraints];

        for (let i = 0; i < attempts.length; i++) {
            try {
                this._log("Attempt", i + 1, "constraints:", JSON.stringify(attempts[i]));
                this.localStream = await navigator.mediaDevices.getUserMedia(attempts[i]);
                const tracks = this.localStream.getTracks();
                this._log("Media OK, tracks:", tracks.map(t => t.kind + ":" + t.label + " enabled=" + t.enabled));
                if (tracks.length === 0) {
                    this._log("WARNING: 0 tracks returned");
                    this.localStream = null;
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                return this.localStream;
            } catch (e) {
                console.error("[WebRTC] getUserMedia attempt", i + 1, "FAILED:", e.name, e.message);
                if (i < attempts.length - 1) {
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        this.localStream = null;
        return null;
    }

    _getICEServers() {
        return [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
            { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
            { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" }
        ];
    }

    createPeerConnection() {
        if (this.pc) {
            this._log("Closing existing PC");
            this.pc.close();
            this.pc = null;
        }

        this.pc = new RTCPeerConnection({ iceServers: this._getICEServers() });

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this._log("ICE candidate generated, sending...");
                this.sendSignal("ice-candidate", e.candidate.toJSON());
            }
        };

        this.pc.ontrack = (e) => {
            this._log("ontrack:", e.track.kind, "streams:", e.streams.length);
            this.remoteStream = e.streams[0];
            if (this.onRemoteStream) {
                this.onRemoteStream(this.remoteStream);
            }
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc ? this.pc.connectionState : "closed";
            this._log("connectionState:", state);
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(state);
            }
            if (state === "failed") {
                this.endCall(false);
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc ? this.pc.iceConnectionState : "closed";
            this._log("iceConnectionState:", state);
            if (state === "connected" || state === "completed") {
                this._log("*** ICE CONNECTED - media flowing ***");
            }
        };

        if (this.localStream) {
            const tracks = this.localStream.getTracks();
            this._log("Adding", tracks.length, "tracks to PC");
            tracks.forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });
        } else {
            this._log("WARNING: no localStream when creating PC");
        }

        return this.pc;
    }

    async initiateCall(toUsername, video = true) {
        this._log("Initiating call to", toUsername);
        this.isInitiator = true;
        this.isInCall = true;
        this.iceCandidateQueue = [];
        this._targetUsername = toUsername;

        if (!this.localStream) {
            const stream = await this.startLocalStream(video);
            if (!stream) {
                this._log("FAILED to get media");
                return false;
            }
        }

        this.createPeerConnection();

        try {
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            this._log("Offer created, SDP length:", this.pc.localDescription.sdp.length);

            await this.sendSignal("call-offer", {
                sdp: this.pc.localDescription.sdp,
                type: this.pc.localDescription.type,
                video: video
            });

            this._log("Offer sent, starting polling");
            this.startPolling(toUsername);
            return true;
        } catch (e) {
            console.error("[WebRTC] initiateCall FAILED:", e);
            return false;
        }
    }

    async handleAnswer(signalData) {
        if (!this.pc || !signalData) {
            this._log("handleAnswer: pc=", !!this.pc, "data=", !!signalData);
            return;
        }

        try {
            this._log("Setting remote description from answer...");
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                sdp: signalData.sdp,
                type: signalData.type
            }));
            this._log("Remote description set OK");

            this._log("Draining", this.iceCandidateQueue.length, "queued ICE candidates");
            for (const candidate of this.iceCandidateQueue) {
                try {
                    await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {}
            }
            this.iceCandidateQueue = [];

            if (this.onAnswerReceived) {
                this.onAnswerReceived();
            }
        } catch (e) {
            console.error("[WebRTC] handleAnswer FAILED:", e);
        }
    }

    async handleIceCandidate(signalData) {
        if (!signalData) return;

        if (this.pc && this.pc.remoteDescription) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(signalData));
                this._log("Added ICE candidate");
            } catch (e) {
                console.error("[WebRTC] addIceCandidate FAILED:", e);
            }
        } else {
            this._log("Queuing ICE candidate");
            this.iceCandidateQueue.push(signalData);
        }
    }

    async sendSignal(type, data) {
        if (typeof CloudTokAPI === "undefined") return;
        const target = this._targetUsername;
        if (!target) return;

        try {
            await CloudTokAPI.request("/webrtc/signal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_username: target,
                    signal_type: type,
                    signal_data: data
                })
            });
        } catch (e) {
            console.error("[WebRTC] sendSignal FAILED:", e);
        }
    }

    startPolling(username) {
        this._targetUsername = username;
        this.lastSignalId = 0;
        this._polling = true;

        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = null;
        }

        this._log("Starting polling for:", username);
        this._pollOnce();
    }

    async _pollOnce() {
        if (!this._polling) return;

        if (typeof CloudTokAPI !== "undefined") {
            try {
                const result = await CloudTokAPI.request(
                    "/webrtc/poll?after=" + this.lastSignalId
                );

                if (!result.error) {
                    this.backendReady = true;

                    if (result.signals && result.signals.length > 0) {
                        this._log("Poll got", result.signals.length, "signals");

                        for (const signal of result.signals) {
                            if (signal.id > this.lastSignalId) {
                                this.lastSignalId = signal.id;
                            }

                            switch (signal.type) {
                                case "call-offer":
                                    if (this.onIncomingCall) {
                                        this.onIncomingCall(signal.from, signal.data);
                                    }
                                    break;
                                case "call-answer":
                                    this.handleAnswer(signal.data);
                                    break;
                                case "ice-candidate":
                                    this.handleIceCandidate(signal.data);
                                    break;
                                case "call-end":
                                    this.endCall(false);
                                    break;
                            }
                        }
                    }
                }
            } catch (e) {
                this.backendReady = false;
            }
        }

        if (this._polling) {
            const delay = this.isInCall ? 300 : 2000;
            this.pollTimeout = setTimeout(() => this._pollOnce(), delay);
        }
    }

    stopPolling() {
        this._polling = false;
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
            this.pollTimeout = null;
        }
    }

    endCall(notify = true) {
        this._log("endCall");
        this.isInCall = false;

        if (notify && this._targetUsername) {
            this.sendSignal("call-end", {}).catch(() => {});
        }

        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }

        this.stopPolling();
        this.remoteStream = null;
        this._targetUsername = null;
        this.iceCandidateQueue = [];

        if (this.onCallEnd) {
            this.onCallEnd();
        }
    }

    async startLiveStream(title) {
        if (typeof CloudTokAPI === "undefined") return { error: "API not loaded" };
        try {
            return await CloudTokAPI.request("/live/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title })
            });
        } catch (e) {
            return { error: "Network error" };
        }
    }

    async getLiveStreams() {
        if (typeof CloudTokAPI === "undefined") return [];
        try {
            const result = await CloudTokAPI.request("/live/streams");
            return result.streams || [];
        } catch (e) {
            return [];
        }
    }
}

window.CloudTokWebRTC = new CloudTokWebRTC();
