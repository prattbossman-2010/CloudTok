class CloudTokNotificationPage{


constructor(){

this.list =
document.getElementById(
"notificationsList"
);



this.username =

localStorage.getItem(
"CloudTokCurrentUser"
)
||
"";


this.render();


this.setup();


}




render(){


const notifications =

CloudTokNotifications.getForUser(
this.username
);



this.list.innerHTML="";



if(notifications.length===0){


this.list.innerHTML=

`

<div class="emptyNotifications">

No notifications yet.

</div>

`;


return;


}




notifications.forEach(notification=>{


const item =

document.createElement("div");


item.className="notificationItem";



item.innerHTML=

`

<h3>
${notification.message}
</h3>


<span>

${new Date(
notification.time
).toLocaleString()}

</span>

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