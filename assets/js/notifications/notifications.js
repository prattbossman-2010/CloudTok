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
        No notifications yet.
    </div>
    `;
    return;

}


notifications.forEach(notification=>{

    const item=
    document.createElement("div");

    item.className="notificationItem";

    item.innerHTML=`
        <h3>${notification.message}</h3>
        <span>${new Date(notification.time).toLocaleString()}</span>
    `;

    this.list.appendChild(item);

});


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
