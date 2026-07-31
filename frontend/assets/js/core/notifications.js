class CloudTokNotifications{


static async add(username, notification){

    if(typeof CloudTokAPI!=="undefined"){
        try{
            const currentUsername=
            localStorage.getItem("CloudTokCurrentUser");
            if(currentUsername){
                const targetUser=
                await CloudTokAPI.getProfile(username);
                if(!targetUser.error){
                    await CloudTokAPI.request(
                        "/notifications",
                        {
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body:JSON.stringify({
                                userId:targetUser.id,
                                type:notification.type||"follow",
                                message:notification.message||""
                            })
                        }
                    );
                }
            }
        }
        catch(e){
            console.log("Notification API failed, using localStorage fallback");
        }
    }

    const user=CloudTokUsers.find(username);
    if(!user)return;
    if(!user.notificationsList)user.notificationsList=[];
    user.notificationsList.unshift({
        id:Date.now(),
        read:false,
        time:Date.now(),
        ...notification
    });
    CloudTokUsers.save();
}


static async getForUser(username){

    if(typeof CloudTokAPI!=="undefined"){
        try{
            const result=await CloudTokAPI.getNotifications();
            if(result.notifications){
                return result.notifications.map(n=>({
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
            console.log("Notifications API failed, using localStorage fallback");
        }
    }

    const user=CloudTokUsers.find(username);
    if(!user)return[];
    return user.notificationsList||[];
}


static async markAllRead(username){

    if(typeof CloudTokAPI!=="undefined"){
        try{
            await CloudTokAPI.markAllNotificationsRead();
        }
        catch(e){}
    }

    const user=CloudTokUsers.find(username);
    if(!user)return;
    if(user.notificationsList){
        user.notificationsList.forEach(n=>{n.read=true;});
    }
    CloudTokUsers.save();
}


static async clear(username){

    if(typeof CloudTokAPI!=="undefined"){
        try{
            await CloudTokAPI.clearNotifications();
        }
        catch(e){}
    }

    const user=CloudTokUsers.find(username);
    if(!user)return;
    user.notificationsList=[];
    CloudTokUsers.save();
}

}
