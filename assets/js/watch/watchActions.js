class CloudTokWatchActions{


constructor(video){

this.video = video;
    
this.currentUser =
localStorage.getItem("CloudTokCurrentUser")||"";

this.setupElements();
this.loadUploaderAvatar();
this.loadState();
this.setupEvents();

}


setupElements(){

this.profileBtn =
document.getElementById("watchProfileBtn");

this.followBtn =
document.getElementById("followUserBtn");
    
this.profileAvatar =
document.getElementById("watchUploaderAvatar");

this.followPlus =
document.querySelector(".followPlus");

this.likeBtn =
document.getElementById("watchLikeBtn");

this.commentBtn =
document.getElementById("watchCommentBtn");

this.commentCount =
document.getElementById("watchCommentCount");

this.shareBtn =
document.getElementById("watchShareBtn");

this.saveBtn =
document.getElementById("watchSaveBtn");

this.likeCount =
document.getElementById("watchLikeCount");

}
    
loadUploaderAvatar(){

    if(!this.profileAvatar)return;

    let avatar = "assets/images/default-avatar.png";

    if(typeof CloudTokUserManager !== "undefined"){
        avatar = CloudTokUserManager.getAvatar(this.video.username);
    }

    this.profileAvatar.src = avatar;
    this.profileAvatar.onerror = ()=>{
        this.profileAvatar.src = "assets/images/default-avatar.png";
    };

}

loadState(){

if(!this.video.likedBy){
this.video.likedBy=[];
}

if(!this.video.savedBy){
this.video.savedBy=[];
}

this.isLiked = this.video.likedBy.includes(this.currentUser);
this.isSaved = this.video.savedBy.includes(this.currentUser);

this.updateUI();
this.updateFollowUI();

}


setupEvents(){

if(this.likeBtn){
    this.likeBtn.onclick = ()=>{
        this.toggleLike();
    };
}

if(this.saveBtn){
    this.saveBtn.onclick = ()=>{
        this.toggleSave();
    };
}

if(this.shareBtn){
    this.shareBtn.onclick = async ()=>{
        const link = getVideoShareLink(this.video.id);
        this.video.shares = (this.video.shares || 0) + 1;
        this.saveDatabase();
        try{
            if(navigator.share){
                await navigator.share({
                    title:"CloudTok",
                    text:this.video.caption,
                    url:link
                });
            }
            else{
                await navigator.clipboard.writeText(link);
                showToast("Video link copied.", "success");
            }
        }
        catch(error){
            console.log("Share cancelled.");
        }
    };
}

if(this.commentBtn){
    this.commentBtn.onclick = ()=>{
        if(!CloudTokAuthGuard.requireLogin("comments",{videoId:this.video.id})){
            return;
        }
        this.openComments();
    };
}

if(this.profileBtn){
    this.profileBtn.onclick = ()=>{
        this.openProfile();
    };
}

if(this.followBtn){
    this.followBtn.onclick = (e)=>{
        e.stopPropagation();
        this.toggleFollow();
    };
}

// Long-press action sheet
const videoArea = document.getElementById("videoArea");
if(videoArea){
    let longPressTimer = null;
    const startLongPress = (e) => {
        if(e.target.closest(".watchActions") || e.target.closest("#commentsPanel")) return;
        longPressTimer = setTimeout(()=>{
            if(!CloudTokAuthGuard.requireLogin()) return;
            this.showActionSheet();
        }, 600);
    };
    const cancelLongPress = () => { clearTimeout(longPressTimer); };
    videoArea.addEventListener("touchstart", startLongPress, {passive: true});
    videoArea.addEventListener("touchend", cancelLongPress, {passive: true});
    videoArea.addEventListener("touchmove", cancelLongPress, {passive: true});
    videoArea.addEventListener("mousedown", startLongPress);
    videoArea.addEventListener("mouseup", cancelLongPress);
    videoArea.addEventListener("mouseleave", cancelLongPress);
}

}

showActionSheet(){
    const existing = document.querySelector(".actionSheetOverlay");
    if(existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "actionSheetOverlay";

    const sheet = document.createElement("div");
    sheet.className = "actionSheet";

    const videoUrl = window.location.origin + "/CloudTok/watch.html?id=" + this.video.id;
    const shareText = (this.video.caption || "Check this out on CloudTok") + " " + videoUrl;

    const items = [
        {icon:"🔗", text:"Copy link", action:()=>{
            navigator.clipboard.writeText(videoUrl).catch(()=>{});
            showToast("Link copied!", "success");
        }},
        {icon:"📤", text:"Share to apps", action:()=>{ this.showSharePlatforms(); }},
        {icon:"👥", text:"Share with users", action:()=>{ this.showShareToUsers(); }},
        {sep:true},
        {icon:"⚠️", text:"Report video", danger:true, action:()=>{ this.showReportPrompt("video"); }},
        {icon:"🚫", text:"Report user", danger:true, action:()=>{ this.showReportPrompt("user"); }},
    ];

    items.forEach(item=>{
        if(item.sep){
            const s = document.createElement("div"); s.className="actionSheetSep"; sheet.appendChild(s); return;
        }
        const btn = document.createElement("button");
        btn.className = "actionSheetItem" + (item.danger ? " danger" : "");
        btn.innerHTML = '<span class="sheetIcon">' + item.icon + '</span>' + item.text;
        btn.onclick = (e)=>{ e.stopPropagation(); overlay.remove(); item.action(); };
        sheet.appendChild(btn);
    });

    const cancel = document.createElement("button");
    cancel.className = "actionSheetCancel";
    cancel.textContent = "Cancel";
    cancel.onclick = ()=> overlay.remove();
    sheet.appendChild(cancel);

    overlay.appendChild(sheet);
    overlay.onclick = (e)=>{ if(e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
}

showReportPrompt(type){
    const reason = prompt(type === "video" ? "Report reason (spam, inappropriate, other):" : "Report reason for this user:");
    if(!reason) return;

    if(type === "video"){
        CloudTokAPI.reportVideo(this.video.id, reason).then(()=>{
            showToast("Video reported. Thank you!", "success");
        }).catch(()=>{ showToast("Report failed", "error"); });
    } else {
        CloudTokAPI.reportUser(this.video.username, reason).then(()=>{
            showToast("User reported. Thank you!", "success");
        }).catch(()=>{ showToast("Report failed", "error"); });
    }
}

showSharePlatforms(){
    const existing = document.querySelector(".actionSheetOverlay");
    if(existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "actionSheetOverlay";

    const sheet = document.createElement("div");
    sheet.className = "actionSheet";

    const videoUrl = window.location.origin + "/CloudTok/watch.html?id=" + this.video.id;
    const caption = encodeURIComponent(this.video.caption || "Check this out on CloudTok");
    const url = encodeURIComponent(videoUrl);

    const platforms = [
        {icon:"💬", name:"WhatsApp", color:"#25D366", action:()=>{ window.open("https://wa.me/?text="+caption+"%20"+url, "_blank"); }},
        {icon:"📘", name:"Facebook", color:"#1877F2", action:()=>{ window.open("https://www.facebook.com/sharer/sharer.php?u="+url, "_blank"); }},
        {icon:"🐦", name:"Twitter / X", color:"#1DA1F2", action:()=>{ window.open("https://twitter.com/intent/tweet?text="+caption+"&url="+url, "_blank"); }},
        {icon:"📸", name:"Instagram", color:"#E4405F", action:()=>{ navigator.clipboard.writeText(videoUrl).catch(()=>{}); showToast("Link copied! Open Instagram and paste.", "success"); }},
        {icon:"🎵", name:"TikTok", color:"#000", action:()=>{ navigator.clipboard.writeText(videoUrl).catch(()=>{}); showToast("Link copied! Open TikTok and paste.", "success"); }},
        {icon:"📺", name:"YouTube", color:"#FF0000", action:()=>{ navigator.clipboard.writeText(videoUrl).catch(()=>{}); showToast("Link copied! Open YouTube and paste.", "success"); }},
        {icon:"✉️", name:"Telegram", color:"#0088cc", action:()=>{ window.open("https://t.me/share/url?url="+url+"&text="+caption, "_blank"); }},
        {icon:"💼", name:"LinkedIn", color:"#0A66C2", action:()=>{ window.open("https://www.linkedin.com/sharing/share-offsite/?url="+url, "_blank"); }},
        {icon:"📧", name:"Email", color:"#EA4335", action:()=>{ window.location.href="mailto:?subject=CloudTok Video&body="+caption+"%20"+url; }},
    ];

    sheet.innerHTML = '<div class="actionSheetHandle"></div>' +
        '<div style="padding:8px 20px 12px;color:rgba(255,255,255,.5);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Share to</div>';

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px 12px;";

    platforms.forEach(p=>{
        const item = document.createElement("div");
        item.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px;border-radius:12px;cursor:pointer;transition:background .15s;";
        item.innerHTML = '<div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:'+p.color+'20;">'+p.icon+'</div><span style="font-size:11px;color:rgba(255,255,255,.7);">'+p.name+'</span>';
        item.onmouseenter = ()=> item.style.background = "rgba(255,255,255,.06)";
        item.onmouseleave = ()=> item.style.background = "none";
        item.onclick = (e)=>{ e.stopPropagation(); overlay.remove(); p.action(); };
        grid.appendChild(item);
    });

    sheet.appendChild(grid);

    const cancel = document.createElement("button");
    cancel.className = "actionSheetCancel";
    cancel.textContent = "Cancel";
    cancel.onclick = ()=> overlay.remove();
    sheet.appendChild(cancel);

    overlay.appendChild(sheet);
    overlay.onclick = (e)=>{ if(e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
}

showShareToUsers(){
    const existing = document.querySelector(".actionSheetOverlay");
    if(existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "actionSheetOverlay";

    const sheet = document.createElement("div");
    sheet.className = "actionSheet";

    sheet.innerHTML = '<div class="actionSheetHandle"></div>' +
        '<div style="padding:8px 20px 12px;color:rgba(255,255,255,.5);font-size:13px;text-transform:uppercase;letter-spacing:1px;">Share with</div>' +
        '<div id="shareUserList" style="max-height:300px;overflow-y:auto;"></div>';

    const cancel = document.createElement("button");
    cancel.className = "actionSheetCancel";
    cancel.textContent = "Cancel";
    cancel.onclick = ()=> overlay.remove();
    sheet.appendChild(cancel);

    overlay.appendChild(sheet);
    overlay.onclick = (e)=>{ if(e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);

    const list = document.getElementById("shareUserList");
    list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,.3);">Loading...</div>';

    const videoUrl = window.location.origin + "/CloudTok/watch.html?id=" + this.video.id;
    const shareMsg = videoUrl;

    if(typeof CloudTokAPI !== "undefined"){
        CloudTokAPI.getConversations().then(result=>{
            const convos = result.conversations || [];
            list.innerHTML = "";
            if(convos.length === 0){
                list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,.3);">No conversations yet</div>';
                return;
            }
            convos.forEach(c=>{
                const card = document.createElement("div");
                card.style.cssText = "display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;transition:background .15s;";
                card.innerHTML = '<img src="' + (c.other_avatar || "assets/images/default-avatar.png") + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.src=\'assets/images/default-avatar.png\'">' +
                    '<span style="color:#fff;font-size:14px;">' + (c.other_display_name || c.other_username) + '</span>';
                card.onmouseenter = ()=> card.style.background = "rgba(255,255,255,.06)";
                card.onmouseleave = ()=> card.style.background = "none";
                card.onclick = ()=>{
                    CloudTokAPI.sendMessage(c.other_username, shareMsg).then(()=>{
                        showToast("Shared with " + (c.other_display_name || c.other_username), "success");
                    }).catch(()=>{ showToast("Failed to share", "error"); });
                    overlay.remove();
                };
                list.appendChild(card);
            });
        }).catch(()=>{
            list.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,.3);">Failed to load</div>';
        });
    }
}


async toggleLike(){

if(!CloudTokAuthGuard.requireLogin()){
    return;
}

const wasLiked = this.isLiked;

if(this.isLiked){
    this.video.likedBy = this.video.likedBy.filter(u=>u!==this.currentUser);
    this.video.likes = Math.max(0,(this.video.likes||0)-1);
}
else{
    this.video.likedBy.push(this.currentUser);
    this.video.likes = (this.video.likes||0)+1;
}
this.isLiked = !this.isLiked;
this.saveDatabase();
this.updateUI();

if(typeof CloudTokAPI!=="undefined"){
    try{
        const result=await CloudTokAPI.request(
            "/videos/"+this.video.id+"/like",
            {method:"POST"}
        );
        if(result.success){
            this.isLiked=result.liked;
            if(result.liked){
                if(!this.video.likedBy.includes(this.currentUser)) this.video.likedBy.push(this.currentUser);
            }else{
                this.video.likedBy=this.video.likedBy.filter(u=>u!==this.currentUser);
            }
            this.saveDatabase();
            this.updateUI();
        }
    }
    catch(e){
        this.isLiked = wasLiked;
        if(wasLiked){
            this.video.likedBy.push(this.currentUser);
            this.video.likes = (this.video.likes||0)+1;
        } else {
            this.video.likedBy = this.video.likedBy.filter(u=>u!==this.currentUser);
            this.video.likes = Math.max(0,(this.video.likes||0)-1);
        }
        this.saveDatabase();
        this.updateUI();
    }
}

}


toggleSave(){

if(!CloudTokAuthGuard.requireLogin()){
    return;
}

if(this.isSaved){
    this.video.savedBy = this.video.savedBy.filter(user=>user!==this.currentUser);
}
else{
    this.video.savedBy.push(this.currentUser);
}

this.isSaved = !this.isSaved;

if(typeof CloudTokAPI!=="undefined"){
    CloudTokAPI.toggleSave(this.video.id).catch(e=>{});
}

this.saveDatabase();
this.updateUI();

}

updateUI(){

if(this.commentCount){
    this.commentCount.textContent =
    this.video.comments ? this.video.comments.length : 0;
}

if(this.likeBtn){
    if(this.isLiked){
        this.likeBtn.classList.add("liked");
    }
    else{
        this.likeBtn.classList.remove("liked");
    }
}

const heartIcon = document.getElementById("watchHeartIcon");
if(heartIcon){
    heartIcon.src = this.isLiked ?
    "assets/icons/solid/heart.svg" :
    "assets/icons/outline/heart.svg";
}

const bookmarkIcon = document.getElementById("watchBookmarkIcon");
if(bookmarkIcon){
    bookmarkIcon.src = this.isSaved ?
    "assets/icons/solid/bookmark-solid.svg" :
    "assets/icons/outline/bookmark-outline.svg";
    if(this.isSaved){
        bookmarkIcon.classList.add("bookmarkSaved");
    }
    else{
        bookmarkIcon.classList.remove("bookmarkSaved");
    }
}

if(this.likeCount){
    this.likeCount.textContent = this.video.likes || 0;
}

}


saveDatabase(){

const index = CloudTokDatabase.videos.findIndex(
    video=>video.id===this.video.id
);

if(index !== -1){
    CloudTokDatabase.videos[index] = this.video;
}

try{
    localStorage.setItem("CloudTokVideos",
    JSON.stringify(CloudTokDatabase.videos));
}
catch(error){
    console.log("DATABASE SAVE ERROR:",error);
}

}


openComments(){

if(typeof WatchComments !== "undefined" && WatchComments){
    WatchComments.open();
}
else{
    console.log("COMMENTS NOT READY");
}

}
    
async toggleFollow(){

if(!CloudTokAuthGuard.requireLogin()){
    return;
}

const uploaderUsername =
this.video.username.replace("@","").toLowerCase();

const currentUser=
CloudTokUsers.getCurrentUser();

if(!currentUser)return;

const isFollowing=
(currentUser.following||[]).includes(uploaderUsername);

if(isFollowing){
    await CloudTokUsers.unfollow(uploaderUsername);
}
else{
    await CloudTokUsers.follow(uploaderUsername);
}

this.updateFollowUI();

}

  updateFollowUI(){

const uploaderUsername =
this.video.username.replace("@","").toLowerCase();

const currentUser=
CloudTokUsers.getCurrentUser();

if(!currentUser)return;

const isFollowing=
(currentUser.following||[]).includes(uploaderUsername);

if(this.followBtn){
    this.followBtn.textContent = isFollowing ? "✓" : "+";
}

}
    
openProfile(){

window.location.href =
"profile.html?user="+
encodeURIComponent(this.video.username.replace("@",""));

}


}


let WatchActions = null;


function loadWatchActions(videoId){

let video =
CloudTokDatabase.videos.find(v=>Number(v.id)===Number(videoId));

if(!video && typeof WatchEngine!=="undefined" && WatchEngine){
    video=WatchEngine.videos.find(v=>Number(v.id)===Number(videoId));
}

if(!video){
    console.log("VIDEO NOT FOUND FOR ACTIONS");
    return;
}

WatchActions = new CloudTokWatchActions(video);

}    
