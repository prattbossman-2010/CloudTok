class CloudTokNotificationPopup {

constructor(){

this.lastNotificationId=0;
this.pollingInterval=null;
this.toastTimeout=null;
this.bellElement=null;
this.badgeElement=null;
this.toastElement=null;

}

init(){

if(!CloudTokAuth||!CloudTokAuth.isLoggedIn()) return;

this.createBell();
this.startPolling();
this.pollNow();

}

createBell(){

if(document.getElementById("notificationPopupBell")) return;

const bell=document.createElement("div");
bell.className="notificationPopupBell";
bell.id="notificationPopupBell";
bell.innerHTML=`<svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>`;
bell.style.cssText="position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;transition:background 0.2s;";
bell.addEventListener("click",()=>{
    this.clearBadge();
    if(typeof CloudTokNotificationPage!=="undefined"){
        window.location.href="notifications.html";
    } else {
        window.location.href="notifications.html";
    }
});

const badge=document.createElement("div");
badge.className="notificationPopupBadge";
badge.style.display="none";
bell.appendChild(badge);

this.bellElement=bell;
this.badgeElement=badge;

const target=document.getElementById("notifBellTopbar")
    ||document.querySelector(".topActions")
    ||document.querySelector(".topBarRight")
    ||document.querySelector(".topBarButtons");
if(target){
    target.insertBefore(bell,target.firstChild);
}

}

async pollNow(){

if(!CloudTokAuth||!CloudTokAuth.isLoggedIn()) return;

try{

    const data=await CloudTokAPI.getNotifications();
    const notifications=data.notifications||data.data||[];

    if(notifications.length>0){
        const newest=notifications.reduce((a,b)=>new Date(b.created_at)>new Date(a.created_at)?b:a);
        if(!this.lastNotificationId){
            this.lastNotificationId=newest.id;
            return;
        }
        const newOnes=notifications.filter(n=>
            n.id>this.lastNotificationId&&
            (n.type!=="message"||n.user_id!==CloudTokAuth.getCurrentUser().id)
        );
        if(newOnes.length>0){
            const latest=newOnes.reduce((a,b)=>new Date(b.created_at)>new Date(a.created_at)?b:a);
            this.lastNotificationId=latest.id;
            this.showToast(latest);
            this.updateBadge(newOnes.length);
        }
    }

}catch(e){
    console.log("Notification poll error:",e);
}

}

startPolling(){

this.stopPolling();
this.pollingInterval=setInterval(()=>this.pollNow(),30000);

}

stopPolling(){

if(this.pollingInterval){
    clearInterval(this.pollingInterval);
    this.pollingInterval=null;
}

}

updateBadge(count){

if(!this.badgeElement) return;

if(count>0){
    this.badgeElement.textContent=count>99?"99+":count;
    this.badgeElement.style.display="flex";
} else {
    this.badgeElement.style.display="none";
}

}

clearBadge(){

if(this.badgeElement){
    this.badgeElement.style.display="none";
}

if(typeof CloudTokAPI!=="undefined"){
    CloudTokAPI.markAllNotificationsRead().catch(()=>{});
}

}

showToast(notification){

if(this.toastElement) this.removeToast();

const toast=document.createElement("div");
toast.className="notificationPopupToast";
toast.id="notificationPopupToast";

const typeClass=notification.type||"like";
const typeIcon=this.getTypeIcon(typeClass);
const message=notification.content||this.getDefaultMessage(typeClass,notification);
const timeAgo=this.formatTime(notification.created_at);
const avatar=notification.from_avatar||notification.avatar||"assets/images/default-avatar.jpg";
const videoThumb=notification.thumbnail||"";
const videoId=notification.video_id||"";

toast.innerHTML=`

<div class="notificationPopupAvatar"
     onerror="this.src='assets/images/default-avatar.jpg'"
     src="${avatar}"></div>

<div class="notificationPopupIcon ${typeClass}">
    ${typeIcon}
</div>

<div class="notificationPopupBody">

<div class="notificationPopupMessage">${message}</div>
<div class="notificationPopupTime">${timeAgo}</div>

</div>

<button class="notificationPopupClose" onclick="this.closest('.notificationPopupToast').remove()">✕</button>

<div class="notificationPopupGradient"></div>

`;

toast.addEventListener("click",(e)=>{
    if(e.target.classList.contains("notificationPopupClose")) return;
    this.removeToast();
    if(videoId) window.location.href="watch.html?id="+videoId;
    else window.location.href="notifications.html";
});

document.body.appendChild(toast);
this.toastElement=toast;

this.toastTimeout=setTimeout(()=>this.removeToast(),6500);

}

removeToast(){

if(this.toastTimeout){
    clearTimeout(this.toastTimeout);
    this.toastTimeout=null;
}

if(this.toastElement){
    this.toastElement.classList.add("dismissing");
    setTimeout(()=>{
        if(this.toastElement&&this.toastElement.parentNode){
            this.toastElement.parentNode.removeChild(this.toastElement);
        }
        this.toastElement=null;
    },300);
}

}

getTypeIcon(type){

switch(type){
    case "like":
    case "comment":
        return "❤";
    case "follow":
        return "👤";
    case "message":
        return "💬";
    default:
        return "❤";
}

}

getDefaultMessage(type,notification){

const from=notification.from_username||"Someone";

switch(type){
    case "like":
        return `<strong>${from}</strong> liked your video`;
    case "comment":
        return `<strong>${from}</strong> commented on your video`;
    case "follow":
        return `<strong>${from}</strong> started following you`;
    case "message":
        return `<strong>${from}</strong> sent you a message`;
    default:
        return `<strong>${from}</strong> interacted with your content`;
}

}

formatTime(timestamp){

const now=Date.now();
const then=new Date(timestamp).getTime();
const diff=Math.floor((now-then)/1000);

if(diff<60) return "Just now";
if(diff<3600) return Math.floor(diff/60)+"m ago";
if(diff<86400) return Math.floor(diff/3600)+"h ago";
if(diff<604800) return Math.floor(diff/86400)+"d ago";
return new Date(timestamp).toLocaleDateString();

}

destroy(){

this.stopPolling();
this.removeToast();

}

}

const CloudTokNotificationPopup_=new CloudTokNotificationPopup();

document.addEventListener("DOMContentLoaded",()=>{
    setTimeout(()=>CloudTokNotificationPopup_.init(),500);
});
