class CloudTokNotificationPage{


constructor(){

this.list=
document.getElementById("notificationsList");

this.username=
localStorage.getItem("CloudTokCurrentUser")||"";

this.render();

this.setup();

}


async render(){

this.list.innerHTML="";

let notifications=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getNotifications();

        if(result.notifications){

            notifications=result.notifications.map(n=>({
                id:n.id,
                type:n.type,
                message:n.message,
                read:Boolean(n.read),
                time:new Date(n.created_at).getTime(),
                from:n.from_username,
                fromDisplay:n.from_display_name,
                fromAvatar:n.from_avatar
            }));

        }

    }
    catch(e){
        console.log("Notifications API failed");
    }

}

if(notifications.length===0){

    if(typeof CloudTokNotifications!=="undefined"){
        notifications=
        await CloudTokNotifications.getForUser(this.username);
    }

}

if(notifications.length===0){

    this.list.innerHTML=`
    <div class="emptyNotifications">
        <div class="emptyNotificationsIcon">🔔</div>
        No notifications yet.
    </div>
    `;
    return;

}

// Add clear all button
const clearBtn=document.createElement("button");
clearBtn.className="clearAllBtn";
clearBtn.textContent="Clear All";
clearBtn.onclick=async()=>{
    if(typeof CloudTokAPI!=="undefined"){
        try{ await CloudTokAPI.clearNotifications(); }catch(e){}
    }
    this.render();
};
this.list.appendChild(clearBtn);


notifications.forEach(notification=>{

    const item=
    document.createElement("div");

    item.className="notificationItem"+
    (notification.read?"":" unread");

    const iconClass=this.getIconClass(notification.type);
    const iconEmoji=this.getIconEmoji(notification.type);
    const avatar=this.getAvatar(notification);

    item.innerHTML=`
        ${avatar?
        `<img class="notificationAvatar" src="${avatar}" onerror="this.style.display='none'">`:
        `<div class="notificationIcon ${iconClass}">${iconEmoji}</div>`}
        <div class="notificationContent">
            <p class="notificationText">${notification.message}</p>
            <span class="notificationTime">${this.formatTime(notification.time)}</span>
        </div>
    `;

    const avatarEl=item.querySelector(".notificationAvatar");
    if(avatarEl&&notification.from){
        avatarEl.style.cursor="pointer";
        avatarEl.onclick=(e)=>{
            e.stopPropagation();
            window.location.href="profile.html?user="+encodeURIComponent(notification.from);
        };
    }

    item.onclick=()=>{
        this.markRead(notification.id);
        item.classList.remove("unread");
    };

    this.list.appendChild(item);

});


}


getIconClass(type){
switch(type){
    case "like": return "like";
    case "comment": return "comment";
    case "follow": return "follow";
    case "message": return "message";
    default: return "follow";
}
}

getIconEmoji(type){
switch(type){
    case "like": return "❤️";
    case "comment": return "💬";
    case "follow": return "👤";
    case "message": return "✉️";
    default: return "🔔";
}
}

getAvatar(notification){
if(notification.fromAvatar){
    return notification.fromAvatar;
}
return null;
}

formatTime(timestamp){
const diff=Date.now()-timestamp;
const mins=Math.floor(diff/60000);
const hours=Math.floor(diff/3600000);
const days=Math.floor(diff/86400000);

if(mins<1) return "Just now";
if(mins<60) return mins+"m ago";
if(hours<24) return hours+"h ago";
if(days<7) return days+"d ago";
return new Date(timestamp).toLocaleDateString();
}

async markRead(id){
if(typeof CloudTokAPI!=="undefined"){
    try{
        await CloudTokAPI.request(
            "/notifications/"+id+"/read",
            {method:"POST"}
        );
    }catch(e){}
}
}

setup(){

document
.getElementById("backBtn")
.onclick=()=>{
    history.back();
};

}


}


document.addEventListener(
"DOMContentLoaded",
()=>{
    new CloudTokNotificationPage();
}
);
