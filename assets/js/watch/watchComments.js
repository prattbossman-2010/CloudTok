class CloudTokComments{


constructor(video){

this.video = video;

this.currentUser =
localStorage.getItem("CloudTokCurrentUser")||"";

this.panel =
document.getElementById("commentsPanel");

this.list =
document.getElementById("commentsList");

this.input =
document.getElementById("commentInput");

this.sendBtn =
document.getElementById("sendCommentBtn");

this.closeBtn =
document.getElementById("closeCommentsBtn");

this.setup();

}


setup(){

if(this.sendBtn){
    this.sendBtn.onclick = ()=>{
        this.addComment();
    };
}

if(this.closeBtn){
    this.closeBtn.onclick = ()=>{
        this.close();
    };
}

this.render();

}


open(){
if(this.panel){
    this.panel.style.display = "flex";
}
this.render();
}


close(){
if(this.panel){
    this.panel.style.display = "none";
}
}


async render(){

if(!this.list)return;

this.list.innerHTML="";


let comments=[];
let count=0;

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=
        await CloudTokAPI.getComments(this.video.id);

        if(result.comments && result.comments.length>0){

            comments=result.comments.map(c=>({
                id:c.id,
                username:c.username,
                text:c.comment,
                time:new Date(c.created_at).getTime(),
                avatar:c.avatar
            }));

            count=comments.length;

        }

    }
    catch(e){
        console.log("Comments API failed");
    }

}

if(comments.length===0){

    this.list.innerHTML = `
    <p class="noComments">No comments yet</p>
    `;
    this.updateCountDirect(0);
    return;

}

comments.forEach(comment=>{

    const item = document.createElement("div");
    item.className = "commentItem";

    let avatar = comment.avatar||
    "assets/images/default-avatar.png";

    if(typeof CloudTokUserManager !== "undefined"){
        avatar = CloudTokUserManager.getAvatar(comment.username)||avatar;
    }

    item.innerHTML = `
    <div class="commentProfile">
    <img 
    class="commentAvatar"
    src="${avatar}"
    onerror="this.src='assets/images/default-avatar.png'">
    <div class="commentContent">
    <h4>@${comment.username}</h4>
    <p>${comment.text}</p>
    <span>${new Date(comment.time).toLocaleString()}</span>
    </div>
    </div>
    `;

    const avatarEl=item.querySelector(".commentAvatar");
    if(avatarEl){
        avatarEl.style.cursor="pointer";
        avatarEl.onclick=()=>{
            window.location.href="profile.html?user="+encodeURIComponent(comment.username);
        };
    }

    this.list.appendChild(item);

});

this.updateCountDirect(count);

}


async addComment(){

if(!CloudTokAuthGuard.requireLogin()){
    return;
}

if(!this.input)return;

const text = this.input.value.trim();
if(!text)return;


if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=
        await CloudTokAPI.addComment(this.video.id,text);

        if(result.success){
            this.input.value="";
            this.render();
            if(window.CloudTokActiveVideoCard){
                window.CloudTokActiveVideoCard.updateCommentCount();
            }
            return;
        }

    }
    catch(e){
        console.log("Comment API failed, using local");
    }

}


this.render();
if(window.CloudTokActiveVideoCard){
    window.CloudTokActiveVideoCard.updateCommentCount();
}

}


updateCountDirect(count){

const watchCount = document.getElementById("watchCommentCount");
if(watchCount){
    watchCount.textContent = count;
}

}


updateCount(){

this.render();

}


}


let WatchComments = null;


function loadWatchComments(videoId){

let video =
CloudTokDatabase.videos.find(v=>Number(v.id)===Number(videoId));

if(!video && typeof WatchEngine!=="undefined" && WatchEngine){
    video=WatchEngine.videos.find(v=>Number(v.id)===Number(videoId));
}

if(!video){
    console.log("COMMENT VIDEO NOT FOUND");
    return;
}

WatchComments = new CloudTokComments(video);

}    
