class CloudTokChat{

    constructor(){

        this.list=
        document.getElementById("conversationList");

        this.loadChats();

    }

    async loadChats(){

        this.list.innerHTML="";

        let users=[];

        if(typeof CloudTokAPI!=="undefined"){

            try{

                const result=await CloudTokAPI.getConversations();

                if(result.conversations){

                    users=result.conversations.map(c=>({
                        username:c.other_username,
                        displayName:c.other_display_name,
                        avatar:c.other_avatar||
                        "assets/images/default-avatar.png",
                        lastMessage:c.last_message,
                        lastMessageAt:c.last_message_at
                    }));

                }

            }
            catch(e){
                console.log("Conversations API failed");
            }

        }

        if(users.length===0){

            let storedUsers=
            JSON.parse(
                localStorage.getItem("CloudTokUsers")||"[]"
            );

            CloudTokDatabase.users.forEach(user=>{
                const exists=storedUsers.some(u=>u.username===user.username);
                if(!exists)storedUsers.push(user);
            });

            const currentUser=getCurrentCloudTokUser();

            users=storedUsers
            .filter(u=>u.username!==currentUser)
            .map(u=>({
                username:u.username,
                displayName:u.displayName,
                avatar:u.avatar||
                "assets/images/default-avatar.png",
                lastMessage:"Start chatting...",
                lastMessageAt:null
            }));

        }

        users.forEach(user=>{

            const card=document.createElement("div");
            card.className="chatCard";

            card.innerHTML=`
                <img
src="${user.avatar||"assets/images/default-avatar.png"}"
class="chatAvatar"
onerror="this.src='assets/images/default-avatar.png'">
                <div class="chatInfo">
                    <h3>${user.displayName}</h3>
                    <p>${user.lastMessage||"Start chatting..."}</p>
                </div>
            `;

            card.onclick=()=>{
                window.location.href=
                "conversation.html?user="+
                encodeURIComponent(user.username);
            };

            this.list.appendChild(card);

        });

    }

}

document.addEventListener(
"DOMContentLoaded",
()=>{
    new CloudTokChat();
}
);

const backBtn=
document.getElementById("chatBackBtn");

if(backBtn){
    backBtn.onclick=()=>{history.back();};
}
