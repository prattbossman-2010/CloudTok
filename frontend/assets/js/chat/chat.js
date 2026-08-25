class CloudTokChat{

constructor(){

this.list=document.getElementById("conversationList");
this.pollInterval=null;
this.lastChatData="";

this.loadChats();
this.startPolling();

const backBtn=document.getElementById("chatBackBtn");
if(backBtn){
    backBtn.onclick=()=>{this.stopPolling();window.location.href="index.html";};
}

window.addEventListener("beforeunload",()=>{this.stopPolling();});

}

startPolling(){
this.pollInterval=setInterval(()=>{this.loadChats(true);},4000);
}

stopPolling(){
if(this.pollInterval){clearInterval(this.pollInterval);this.pollInterval=null;}
}

async loadChats(isPoll=false){

if(isPoll){
    try{
        const result=await CloudTokAPI.getConversations();
        const newData=JSON.stringify(result);
        if(newData===this.lastChatData) return;
        this.lastChatData=newData;
    }catch(e){return;}
}

this.list.innerHTML="";

let users=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getConversations();

        if(result.conversations){

            this.lastChatData=JSON.stringify(result);

            users=result.conversations.map(c=>({
                username:c.other_username,
                displayName:c.other_display_name||c.other_username,
                avatar:c.other_avatar||"assets/images/default-avatar.png",
                lastMessage:c.last_message||"",
                lastMessageAt:c.last_message_at,
                unreadCount:c.unread_count||0
            }));

        }

    }
    catch(e){
        console.log("Conversations API failed");
    }

}

if(users.length===0){

    let storedUsers=JSON.parse(localStorage.getItem("CloudTokUsers")||"[]");

    if(typeof CloudTokDatabase!=="undefined"&&CloudTokDatabase.users){
        CloudTokDatabase.users.forEach(user=>{
            const exists=storedUsers.some(u=>u.username===user.username);
            if(!exists)storedUsers.push(user);
        });
    }

    const currentUser=localStorage.getItem("CloudTokCurrentUser")||"";

    users=storedUsers
    .filter(u=>u.username!==currentUser)
    .map(u=>({
        username:u.username,
        displayName:u.displayName||u.username,
        avatar:u.avatar||"assets/images/default-avatar.png",
        lastMessage:"Start chatting...",
        lastMessageAt:null,
        unreadCount:0
    }));

}

if(users.length===0){
    this.list.innerHTML='<div style="text-align:center;padding:60px 20px;color:#555;"><div style="font-size:48px;margin-bottom:16px;">💬</div>No conversations yet.<br>Tap ✏️ to start chatting.</div>';
    return;
}

users.sort((a,b)=>new Date(b.lastMessageAt||0)-new Date(a.lastMessageAt||0));

users.forEach(user=>{

    const card=document.createElement("div");
    card.className="chatCard";

    card.innerHTML=`
        <img src="${user.avatar}" class="chatAvatar" onerror="this.src='assets/images/default-avatar.png'">
        <div class="chatInfo">
            <h3>${user.displayName}</h3>
            <p>${user.lastMessage||"Start chatting..."}</p>
        </div>
        ${user.unreadCount>0?`<span class="unreadBadge">${user.unreadCount}</span>`:""}
    `;

    let longPressTimer=null;
    const startLP=()=>{longPressTimer=setTimeout(()=>{this.showChatContextMenu(user);},500);};
    const cancelLP=()=>{clearTimeout(longPressTimer);};

    card.addEventListener("touchstart",startLP,{passive:true});
    card.addEventListener("touchend",cancelLP,{passive:true});
    card.addEventListener("touchmove",cancelLP,{passive:true});
    card.addEventListener("mousedown",startLP);
    card.addEventListener("mouseup",cancelLP);
    card.addEventListener("mouseleave",cancelLP);

    card.onclick=()=>{
        if(this.ctxMenu){this.ctxMenu.remove();this.ctxMenu=null;return;}
        this.stopPolling();
        window.location.href="conversation.html?user="+encodeURIComponent(user.username);
    };

    this.list.appendChild(card);

});

}

showChatContextMenu(user){
    if(this.ctxMenu){this.ctxMenu.remove();}

    const menu=document.createElement("div");
    menu.className="msgContextMenu";
    this.ctxMenu=menu;

    const items=[
        {icon:"⚠️",text:"Report user",danger:true,action:async()=>{
            const reason=prompt("Report reason:");
            if(reason){
                try{await CloudTokAPI.reportUser(user.username,reason);showToast("User reported","success");}catch(e){showToast("Report failed","error");}
            }
        }},
        {icon:"🚫",text:"Block user",danger:true,action:async()=>{
            if(confirm("Block "+user.displayName+"?")){
                try{await CloudTokAPI.blockUser(user.username);showToast("User blocked","success");}catch(e){showToast("Block failed","error");}
            }
        }},
    ];

    items.forEach(item=>{
        const btn=document.createElement("button");
        btn.className="msgCtxItem"+(item.danger?" danger":"");
        btn.innerHTML='<span class="ctxIcon">'+item.icon+'</span>'+item.text;
        btn.onclick=(e)=>{e.stopPropagation();menu.remove();this.ctxMenu=null;item.action();};
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    const rect=menu.getBoundingClientRect();
    menu.style.top="50%";
    menu.style.left="50%";
    menu.style.transform="translate(-50%,-50%)";

    const closeMenu=(e)=>{if(!menu.contains(e.target)){menu.remove();this.ctxMenu=null;document.removeEventListener("click",closeMenu);}};
    setTimeout(()=>document.addEventListener("click",closeMenu),10);
}

}

document.addEventListener("DOMContentLoaded",()=>{

const chat=new CloudTokChat();

const newChatBtn=document.getElementById("newChatBtn");
const newChatOverlay=document.getElementById("newChatOverlay");
const newChatSearchInput=document.getElementById("newChatSearchInput");
const newChatUserList=document.getElementById("newChatUserList");

if(newChatBtn){
    newChatBtn.onclick=()=>{
        newChatOverlay.style.display="flex";
        newChatUserList.innerHTML="";
        newChatSearchInput.focus();
    };
}

if(newChatSearchInput){
    let searchTimeout=null;
    newChatSearchInput.addEventListener("input",()=>{
        clearTimeout(searchTimeout);
        const query=newChatSearchInput.value.trim();
        if(query.length<2){
            newChatUserList.innerHTML="";
            return;
        }
        searchTimeout=setTimeout(async()=>{
            if(typeof CloudTokAPI==="undefined")return;
            try{
                const result=await CloudTokAPI.search(query);
                newChatUserList.innerHTML="";
                const users=result.users||[];
                const currentUser=localStorage.getItem("CloudTokCurrentUser")||"";
                users.filter(u=>u.username!==currentUser).forEach(user=>{
                    const card=document.createElement("div");
                    card.className="newChatUserCard";
                    card.innerHTML=`
                        <img src="${user.avatar||"assets/images/default-avatar.png"}" class="newChatAvatar" onerror="this.src='assets/images/default-avatar.png'">
                        <div class="newChatUserInfo">
                            <h3>${user.displayName||user.username}</h3>
                            <p>@${user.username}</p>
                        </div>
                    `;
                    card.onclick=()=>{
                        newChatOverlay.style.display="none";
                        window.location.href="conversation.html?user="+encodeURIComponent(user.username);
                    };
                    newChatUserList.appendChild(card);
                });
                if(users.length===0){
                    newChatUserList.innerHTML='<div style="text-align:center;padding:40px;color:#555;">No users found</div>';
                }
            }catch(e){
                console.log("Search failed",e);
            }
        },300);
    });
}

});
