window.Engine = new CloudTokEngine();


window.onload = async function(){


    // Restore uploaded videos first

    if(
        typeof CloudTokUploader !== "undefined"
    ){

        CloudTokUploader.loadSavedVideos();

    }



    const topBar =
    new TopBar();


    document
    .getElementById("topBarContainer")
    .appendChild(
        topBar.element
    );



    const bottomNav =
    new BottomNav();


    document
    .getElementById("bottomNavContainer")
    .appendChild(
        bottomNav.element
    );



    await Engine.init();


};


window.addEventListener("auth:expired", function(e){

    if(document.getElementById("sessionExpiredModal")){
        return;
    }

    var msg = e.detail && e.detail.message
        ? e.detail.message
        : "Your session has expired. Please log out and log back in to continue.";

    var overlay = document.createElement("div");
    overlay.id = "sessionExpiredModal";
    overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;" +
        "background:rgba(0,0,0,0.7);z-index:99999;" +
        "display:flex;align-items:center;justify-content:center;";

    var card = document.createElement("div");
    card.style.cssText =
        "background:#1a1a2e;border-radius:16px;padding:32px;" +
        "max-width:360px;width:90%;text-align:center;border:1px solid #333;";

    card.innerHTML =
        '<div style="width:56px;height:56px;border-radius:50%;' +
        'background:linear-gradient(135deg,#ff0050,#ff6b35);' +
        'margin:0 auto 20px;display:flex;align-items:center;' +
        'justify-content:center;font-size:28px;color:#fff;">&#9888;</div>' +
        '<h2 style="color:#fff;margin:0 0 12px;font-size:18px;' +
        'font-family:sans-serif;">Session Expired</h2>' +
        '<p style="color:#aaa;margin:0 0 24px;font-size:14px;' +
        'line-height:1.5;font-family:sans-serif;">' + msg + "</p>" +
        '<button id="sessionExpiredLoginBtn" style="' +
        "background:linear-gradient(135deg,#ff0050,#ff6b35);" +
        "color:#fff;border:none;border-radius:8px;padding:12px 32px;" +
        "font-size:15px;font-weight:600;cursor:pointer;width:100%;" +
        'font-family:sans-serif;">Log In</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById("sessionExpiredLoginBtn")
        .addEventListener("click", function(){
            localStorage.removeItem("CloudTokToken");
            localStorage.removeItem("CloudTokUser");
            window.location.href = "/login.html";
        });
});
