class CloudTokWebRTC {

    constructor() {
        this.pc = null;
        this.localStream = null;
        this.remoteStream = null;
        this.pollInterval = null;
        this.lastSignalId = 0;
        this.onRemoteStream = null;
        this.onCallEnd = null;
        this.onIncomingCall = null;
        this.onAnswerReceived = null;
        this.isInitiator = false;
        this.backendReady = false;
        this.iceCandidateQueue = [];
        this.isInCall = false;
    }

    async startLocalStream(video = true) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false
            });
            return this.localStream;
        } catch (e) {
            console.error("getUserMedia failed:", e);
            return null;
        }
    }

    createPeerConnection() {
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        const config = {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun4.l.google.com:19302" }
            ]
        };

        this.pc = new RTCPeerConnection(config);

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.sendSignal("ice-candidate", e.candidate.toJSON());
            }
        };

        this.pc.ontrack = (e) => {
            this.remoteStream = e.streams[0];
            if (this.onRemoteStream) {
                this.onRemoteStream(this.remoteStream);
            }
        };

        this.pc.onconnectionstatechange = () => {
            const state = this.pc ? this.pc.connectionState : "closed";
            if (state === "failed" || state === "closed") {
                this.endCall(false);
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc ? this.pc.iceConnectionState : "closed";
            if (state === "failed") {
                this.endCall(false);
            }
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
            });
        }

        return this.pc;
    }

    async initiateCall(toUsername, video = true) {
        this.isInitiator = true;
        this.isInCall = true;
        this.iceCandidateQueue = [];

        await this.startLocalStream(video);
        this.createPeerConnection();

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        await this.sendSignal("call-offer", {
            sdp: this.pc.localDescription.sdp,
            type: this.pc.localDescription.type,
            video: video
        });

        this.startPolling(toUsername);
    }

    async handleAnswer(signalData) {
        if (this.pc && signalData) {
            try {
                await this.pc.setRemoteDescription(new RTCSessionDescription({
                    sdp: signalData.sdp,
                    type: signalData.type
                }));

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
                console.error("handleAnswer error:", e);
            }
        }
    }

    async handleIceCandidate(signalData) {
        if (signalData) {
            try {
                if (this.pc && this.pc.remoteDescription) {
                    await this.pc.addIceCandidate(new RTCIceCandidate(signalData));
                } else {
                    this.iceCandidateQueue.push(signalData);
                }
            } catch (e) {
                console.error("ICE candidate error:", e);
            }
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
            console.error("Signal send failed:", e);
        }
    }

    startPolling(username) {
        this._targetUsername = username;
        this.lastSignalId = 0;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }

        const pollMs = this.isInCall ? 500 : 2000;

        this.pollInterval = setInterval(async () => {
            if (typeof CloudTokAPI === "undefined") return;

            try {
                const result = await CloudTokAPI.request(
                    "/webrtc/poll?after=" + this.lastSignalId
                );

                if (result.error) return;

                this.backendReady = true;

                if (result.signals) {
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
            } catch (e) {
                this.backendReady = false;
            }
        }, pollMs);
    }

    endCall(notify = true) {
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

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

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
            const result = await CloudTokAPI.request("/live/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title })
            });
            return result;
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
