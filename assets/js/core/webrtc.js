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
        this.isInitiator = false;
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
        const config = {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ]
        };

        this.pc = new RTCPeerConnection(config);

        this.pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.sendSignal("ice-candidate", e.candidate);
            }
        };

        this.pc.ontrack = (e) => {
            this.remoteStream = e.streams[0];
            if (this.onRemoteStream) {
                this.onRemoteStream(this.remoteStream);
            }
        };

        this.pc.onconnectionstatechange = () => {
            if (this.pc.connectionState === "disconnected" || this.pc.connectionState === "failed") {
                this.endCall();
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
        await this.startLocalStream(video);
        this.createPeerConnection();

        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        await this.sendSignal("call-offer", {
            sdp: offer.sdp,
            type: offer.type,
            video: video
        });

        this.startPolling(toUsername);
    }

    async handleOffer(fromUsername, signalData) {
        this.isInitiator = false;
        await this.startLocalStream(signalData.video !== false);
        this.createPeerConnection();

        await this.pc.setRemoteDescription(new RTCSessionDescription({
            sdp: signalData.sdp,
            type: signalData.type
        }));

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        await this.sendSignal("call-answer", {
            sdp: answer.sdp,
            type: answer.type
        });

        this.startPolling(fromUsername);
    }

    async handleAnswer(signalData) {
        if (this.pc) {
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                sdp: signalData.sdp,
                type: signalData.type
            }));
        }
    }

    async handleIceCandidate(signalData) {
        if (this.pc && signalData) {
            try {
                await this.pc.addIceCandidate(new RTCIceCandidate(signalData));
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

        this.pollInterval = setInterval(async () => {
            if (typeof CloudTokAPI === "undefined") return;

            try {
                const result = await CloudTokAPI.request(
                    "/webrtc/poll?after=" + this.lastSignalId
                );

                if (result.signals) {
                    for (const signal of result.signals) {
                        this.lastSignalId = signal.id;

                        switch (signal.type) {
                            case "call-offer":
                                if (this.onIncomingCall) {
                                    this.onIncomingCall(signal.from, signal.data);
                                } else {
                                    this.handleOffer(signal.from, signal.data);
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
                console.error("Signal poll failed:", e);
            }
        }, 1000);
    }

    endCall(notify = true) {
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

        if (this.onCallEnd) {
            this.onCallEnd();
        }
    }

    async startLiveStream(title) {
        if (typeof CloudTokAPI === "undefined") return null;

        try {
            const result = await CloudTokAPI.request("/live/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title })
            });
            return result;
        } catch (e) {
            return null;
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
