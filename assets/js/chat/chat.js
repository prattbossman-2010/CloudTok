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

this.loadChats();

this.setupEvents();

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

}

async loadChats(){

this.list.innerHTML="";

let conversations=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getConversations();

        if(result.conversations){

            conversations=result.conversations.map(c=>({
                username:c.other_username,
                displayName:c.other_display_name||c.other_username,
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

if(conversations.length===0){

    const currentUser=localStorage.getItem("CloudTokCurrentUser")||"";

    if(typeof CloudTokUsers!=="undefined"){

        const allUsers=CloudTokUsers.getAllUsers();

        conversations=allUsers
        .filter(u=>u.username!==currentUser.toLowerCase())
        .map(u=>({
            username:u.username,
            displayName:u.displayName||u.username,
            avatar:u.avatar||"assets/images/default-avatar.png",
            lastMessage:"Start chatting...",
            lastMessageAt:null
        }));

    }

}

conversations.sort((a,b)=>{
    if(!a.lastMessageAt) return 1;
    if(!b.lastMessageAt) return -1;
    return new Date(b.lastMessageAt)-new Date(a.lastMessageAt);
});

conversations.forEach(user=>{

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

async loadAllUsers(query=""){

this.userList.innerHTML="";

let users=[];

if(query && typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.search(query);

        if(result.users){

            users=result.users.map(u=>({
                username:u.username,
                displayName:u.display_name||u.username,
                avatar:u.avatar||"assets/images/default-avatar.png"
            }));

        }

    }
    catch(e){
        console.log("Search API failed");
    }

}

if(users.length===0 && typeof CloudTokUsers!=="undefined"){

    const currentUser=localStorage.getItem("CloudTokCurrentUser")||"";
    const allUsers=CloudTokUsers.getAllUsers();

    users=allUsers
    .filter(u=>{
        const match=u.username!==currentUser.toLowerCase();
        if(!query) return match;
        return match && (
            u.username.includes(query.toLowerCase())||
            (u.displayName||"").toLowerCase().includes(query.toLowerCase())
        );
    })
    .map(u=>({
        username:u.username,
        displayName:u.displayName||u.username,
        avatar:u.avatar||"assets/images/default-avatar.png"
    }));

}

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
            <h3>${user.displayName}</h3>
            <p>@${user.username}</p>
        </div>
    `;

    card.onclick=()=>{
        window.location.href=
        "conversation.html?user="+
        encodeURIComponent(user.username);
    };

    this.userList.appendChild(card);

});

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
