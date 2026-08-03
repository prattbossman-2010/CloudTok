(function(){
    let lastSignalId = 0;
    let pollInterval = null;
    let activePopup = null;

    function getToken(){
        return localStorage.getItem("CloudTokToken");
    }

    function getCurrentUser(){
        return localStorage.getItem("CloudTokCurrentUser");
    }

    async function pollForCalls(){
        if(!getToken() || !getCurrentUser()) return;

        try {
            const response = await fetch(
                "https://cloudtok-api.bossmanp16.workers.dev/api/webrtc/poll?after=" + lastSignalId,
                { headers: { "Authorization": "Bearer " + getToken() } }
            );
            const result = await response.json();

            if(result.error) return;

            if(result.signals){
                for(const signal of result.signals){
                    lastSignalId = Math.max(lastSignalId, signal.id);

                    if(signal.type === "call-offer"){
                        showCallPopup(signal.from, signal.data);
                    }
                    else if(signal.type === "call-end"){
                        dismissPopup();
                        localStorage.removeItem("CloudTokPendingCall");
                    }
                }
            }
        } catch(e){}
    }

    function showCallPopup(from, data){
        if(activePopup) return;

        const isVideo = data.video !== false;

        const overlay = document.createElement("div");
        overlay.id = "globalCallPopup";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;";
        overlay.innerHTML = `
            <div style="font-size:80px;animation:bounce 1s infinite;">📞</div>
            <h2 style="color:#fff;font-size:24px;margin:0;">${from}</h2>
            <p style="color:rgba(255,255,255,.5);font-size:16px;">${isVideo ? "Video" : "Voice"} call</p>
            <div style="display:flex;gap:24px;margin-top:20px;">
                <button id="globalCallDecline" style="width:70px;height:70px;border-radius:50%;background:#ff2d55;color:#fff;border:none;font-size:28px;cursor:pointer;">✕</button>
                <button id="globalCallAccept" style="width:70px;height:70px;border-radius:50%;background:#00c853;color:#fff;border:none;font-size:28px;cursor:pointer;">📞</button>
            </div>
            <p style="color:rgba(255,255,255,.3);font-size:13px;margin-top:10px;">Tap to answer</p>
            <style>@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}</style>
        `;

        document.body.appendChild(overlay);
        activePopup = overlay;

        document.getElementById("globalCallDecline").onclick = async ()=>{
            try {
                await fetch("https://cloudtok-api.bossmanp16.workers.dev/api/webrtc/signal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
                    body: JSON.stringify({ to_username: from, signal_type: "call-end", signal_data: {} })
                });
            } catch(e){}
            dismissPopup();
        };

        document.getElementById("globalCallAccept").onclick = ()=>{
            localStorage.setItem("CloudTokPendingCall", JSON.stringify({
                from: from,
                data: data,
                timestamp: Date.now()
            }));
            dismissPopup();
            window.location.href = "conversation.html?user=" + encodeURIComponent(from) + "&call=accept";
        };

        if(navigator.vibrate) navigator.vibrate([500, 300, 500, 300, 500]);
    }

    function dismissPopup(){
        if(activePopup){
            activePopup.remove();
            activePopup = null;
        }
    }

    function startGlobalCallPolling(){
        if(pollInterval) return;
        pollForCalls();
        pollInterval = setInterval(pollForCalls, 2000);
    }

    function stopGlobalCallPolling(){
        if(pollInterval){
            clearInterval(pollInterval);
            pollInterval = null;
        }
    }

    if(getToken()){
        startGlobalCallPolling();
    }

    window.addEventListener("storage", (e)=>{
        if(e.key === "CloudTokToken"){
            if(e.newValue){
                startGlobalCallPolling();
            } else {
                stopGlobalCallPolling();
            }
        }
    });

    window.CloudTokCallPoller = { start: startGlobalCallPolling, stop: stopGlobalCallPolling };
})();
