class CloudTokNotifications{


static add(

username,

notification

){


const user =

CloudTokUsers.find(
username
);



if(!user){

return;

}



if(!user.notificationsList){

user.notificationsList=[];

}



user.notificationsList.unshift({

id:Date.now(),

read:false,

time:Date.now(),

...notification

});



CloudTokUsers.save();


}





static getForUser(username){


const user =

CloudTokUsers.find(
username
);



if(!user){

return [];

}



return user.notificationsList || [];


}





static markAllRead(username){


const user =

CloudTokUsers.find(
username
);



if(!user){

return;

}



if(user.notificationsList){

user.notificationsList.forEach(

notification=>{

notification.read=true;

}

);

}



CloudTokUsers.save();


}





static clear(username){


const user =

CloudTokUsers.find(
username
);



if(!user){

return;

}



user.notificationsList=[];


CloudTokUsers.save();


}

    
}

