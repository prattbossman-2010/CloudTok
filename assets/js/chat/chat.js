class CloudTokChat{

constructor(){

this.list=
document.getElementById("conversationList");

this.overlay=
document.getElementById("newChatOverlay");

this.userList=
document.getElementById("newChatUserList");

this.searchInput=
document.getElementById("newChatSearchInput");

this.pollInterval=null;
this.lastChatData="";

this.loadChats();
this.setupEvents();
this.startPolling();

}

startPolling(){
this.pollInterval=setInterval(()=>{
    this.loadChats(true);
},4000);
}

stopPolling(){
if(this.pollInterval){
    clearInterval(this.pollInterval);
    this.pollInterval=null;
}
}

setupEvents(){

document.getElementById("newChatBtn").onclick=()=>{
    this.overlay.style.display="flex";
    this.loadAllUsers();
};

document.getElementById("closeNewChatBtn").onclick=()=>{
    this.overlay.style.display="none";
};

this.searchInput.addEventListener("input",()=>{
    this.filterConversations(this.searchInput.value);
});

let debounce=null;
this.searchInput.addEventListener("input",()=>{
    clearTimeout(debounce);
    debounce=setTimeout(()=>{
        this.loadAllUsers(this.searchInput.value);
    },300);
});

const back=document.getElementById("chatBackBtn");
if(back){
    back.onclick=()=>{
        this.stopPolling();
        window.location.href="index.html";
    };
}

window.addEventListener("beforeunload",()=>{
    this.stopPolling();
});

}

async loadChats(isPoll=false){

if(isPoll){
    // Only re-render if data changed
    try{
        const result=await CloudTokAPI.getConversations();
        const newData=JSON.stringify(result);
        if(newData===this.lastChatData) return;
        this.lastChatData=newData;
    }catch(e){return;}
}

this.list.innerHTML="";

let conversations=[];

// Try API first
if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=
        await CloudTokAPI.getConversations();

        if(result.conversations){

            conversations=result.conversations;

            if(!isPoll) this.lastChatData=JSON.stringify(result);

        }

    }
    catch(e){
        console.log("Chat API failed, using local");
    }

}

// Fallback to local
if(conversations.length===0){

    conversations=this.getLocalConversations();

}

if(conversations.length===0){
    this.list.innerHTML=`
    <div style="text-align:center;padding:60px 20px;color:#555;">
        <div style="font-size:48px;margin-bottom:16px;">💬</div>
        No conversations yet.<br>Tap ✏️ to start chatting.
    </div>
    `;
    return;
}

// Sort by most recent
conversations.sort((a,b)=>{
    return new Date(b.lastMessageAt||0)-new Date(a.lastMessageAt||0);
});

conversations.forEach(user=>{

    const card=document.createElement("div");
    card.className="chatCard";

    const unread=user.unreadCount||0;

    card.innerHTML=`
        <img
src="${user.avatar||"assets/images/default-avatar.png"}"
class="chatAvatar"
onerror="this.src='assets/images/default-avatar.png'">
        <div class="chatInfo">
            <h3>${user.displayName||user.username}</h3>
            <p class="lastMessageText">${user.lastMessage||"Start chatting..."}</p>
        </div>
        ${unread>0?`<span class="unreadBadge">${unread}</span>`:""}
    `;

    card.querySelector(".chatAvatar").onclick=(e)=>{
        e.stopPropagation();
        this.stopPolling();
        window.location.href="profile.html?user="+encodeURIComponent(user.username);
    };

    card.onclick=()=>{
        this.stopPolling();
        window.location.href=
        "conversation.html?user="+
        encodeURIComponent(user.username);
    };

    this.list.appendChild(card);

});

}

getLocalConversations(){

const currentUsername=
localStorage.getItem("CloudTokCurrentUser")||"";
const conversations={};

for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key.startsWith("CloudTokChat_")){
        const username=key.replace("CloudTokChat_","");
        const messages=JSON.parse(localStorage.getItem(key)||"[]");
        if(messages.length>0){
            const last=messages[messages.length-1];
            const otherMsgs=messages.filter(m=>m.sender!==currentUsername);
            conversations[username]={
                username:username,
                displayName:username,
                avatar:"assets/images/default-avatar.png",
                lastMessage:last.text||"",
                lastMessageAt:last.time||Date.now(),
                unreadCount:0
            };
        }
    }
}

return Object.values(conversations);

}

async loadAllUsers(query=""){

if(typeof CloudTokAPI==="undefined") return;

try{

    const result=await CloudTokAPI.searchUsers(query);
    const users=result.users||[];

    this.userList.innerHTML="";

    if(users.length===0){
        this.userList.innerHTML=`
        <div style="text-align:center;padding:40px;color:#555;">
            No users found
        </div>
        `;
        return;
    }

    users.forEach(user=>{

        const card=document.createElement("div");
        card.className="newChatUserCard";

        card.innerHTML=`
            <img
src="${user.avatar||"assets/images/default-avatar.png"}"
class="newChatAvatar"
onerror="this.src='assets/images/default-avatar.png'">
            <div class="newChatUserInfo">
                <h3>${user.displayName||user.username}</h3>
                <p>@${user.username}</p>
            </div>
        `;

        card.querySelector(".newChatAvatar").onclick=(e)=>{
            e.stopPropagation();
            this.stopPolling();
            window.location.href="profile.html?user="+encodeURIComponent(user.username);
        };

        card.onclick=()=>{
            this.stopPolling();
            window.location.href=
            "conversation.html?user="+
            encodeURIComponent(user.username);
        };

        this.userList.appendChild(card);

    });

}
catch(e){
    console.log("Search users failed");
}

}

filterConversations(query){

const cards=this.list.querySelectorAll(".chatCard");
query=query.toLowerCase();

cards.forEach(card=>{
    const name=card.querySelector("h3").textContent.toLowerCase();
    card.style.display=name.includes(query)?"flex":"none";
});

}

}

const chatApp=new CloudTokChat();
