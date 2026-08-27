class CloudTokChat{

constructor(){

this.list=document.getElementById("conversationList");
this.pollInterval=null;
this.lastChatData="";
this.selectMode=false;
this.selectedConvIds=new Set();
this.allConversations=[];
this.deletedConvIds=new Set();

this.loadChats();
this.startPolling();
this.setupSelectBar();

const backBtn=document.getElementById("chatBackBtn");
if(backBtn){
    backBtn.onclick=()=>{this.stopPolling();window.location.href="index.html";};
}

window.addEventListener("beforeunload",()=>{this.stopPolling();});

}

setupSelectBar(){
    document.getElementById("chatSelCancelBtn").onclick=()=>this.exitSelectMode();
    document.getElementById("chatSelDeleteBtn").onclick=()=>this.bulkDeleteConversations();
}

enterSelectMode(){
    this.selectMode=true;
    document.getElementById("chatSelectBar").classList.add("show");
}

exitSelectMode(){
    this.selectMode=false;
    this.selectedConvIds.clear();
    document.getElementById("chatSelectBar").classList.remove("show");
    this.list.querySelectorAll(".chatCard.selected").forEach(c=>c.classList.remove("selected"));
}

toggleSelectConv(convId,card){
    if(this.selectedConvIds.has(convId)){
        this.selectedConvIds.delete(convId);
        card.classList.remove("selected");
    } else {
        this.selectedConvIds.add(convId);
        card.classList.add("selected");
    }
    document.getElementById("chatSelCount").textContent=this.selectedConvIds.size+" selected";
}

async bulkDeleteConversations(){
    const ids=[...this.selectedConvIds];
    if(!ids.length) return;
    if(!confirm("Delete "+ids.length+" conversation(s)? This cannot be undone.")) return;

    ids.forEach(id=>{
        const card=this.list.querySelector('[data-conv-id="'+id+'"]');
        if(card){card.style.transition="all .3s";card.style.maxHeight="0";card.style.padding="0";card.style.opacity="0";setTimeout(()=>card.remove(),300);}
        this.allConversations=this.allConversations.filter(c=>c.id!==id);
        this.deletedConvIds.add(id);
    });
    this.exitSelectMode();

    if(typeof CloudTokAPI!=="undefined"){
        try{
            const result=await CloudTokAPI.request("/messages/delete-conversations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});
            if(result.success){
                showToast(ids.length+" conversation(s) deleted","success");
            } else {
                showToast("Delete failed","error");
                this.loadChats();
            }
        }catch(e){
            showToast("Delete failed","error");
            this.loadChats();
        }
    }
}

async deleteConversation(convId,card){
    if(!confirm("Delete this conversation? This cannot be undone.")) return;

    card.style.transition="all .3s";
    card.style.maxHeight="0";
    card.style.padding="0";
    card.style.opacity="0";
    setTimeout(()=>card.remove(),300);
    this.allConversations=this.allConversations.filter(c=>c.id!==convId);
    this.deletedConvIds.add(convId);

    if(typeof CloudTokAPI!=="undefined"){
        try{
            const result=await CloudTokAPI.request("/conversations/"+convId,{method:"DELETE"});
            if(result.success){
                showToast("Conversation deleted","success");
            } else {
                showToast("Delete failed","error");
                this.loadChats();
            }
        }catch(e){
            showToast("Delete failed","error");
            this.loadChats();
        }
    }
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
            const activeConvs=result.conversations.filter(c=>!this.deletedConvIds.has(c.id));
            this.allConversations=activeConvs;

            users=activeConvs.map(c=>({
                id:c.id,
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
        id:0,
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
    if(user.id) card.dataset.convId=user.id;

    card.innerHTML=`
        <img src="${user.avatar}" class="chatAvatar" onerror="this.src='assets/images/default-avatar.png'">
        <div class="chatInfo">
            <h3>${user.displayName}</h3>
            <p>${user.lastMessage||"Start chatting..."}</p>
        </div>
        ${user.unreadCount>0?`<span class="unreadBadge">${user.unreadCount}</span>`:""}
    `;

    let longPressTimer=null;
    let longPressFired=false;
    const startLP=()=>{longPressFired=false;longPressTimer=setTimeout(()=>{longPressFired=true;this.showChatContextMenu(user,card);},500);};
    const cancelLP=()=>{clearTimeout(longPressTimer);};

    card.addEventListener("touchstart",startLP,{passive:true});
    card.addEventListener("touchend",cancelLP,{passive:true});
    card.addEventListener("touchmove",cancelLP,{passive:true});
    card.addEventListener("mousedown",startLP);
    card.addEventListener("mouseup",cancelLP);
    card.addEventListener("mouseleave",cancelLP);

    card.addEventListener("click",(e)=>{
        if(longPressFired){
            longPressFired=false;
            e.stopPropagation();
            return;
        }
        if(this.ctxMenu){e.stopPropagation();return;}
        if(this.selectMode){
            if(user.id) this.toggleSelectConv(user.id,card);
            return;
        }
        this.stopPolling();
        window.location.href="conversation.html?user="+encodeURIComponent(user.username);
    });

    this.list.appendChild(card);

});

}

showChatContextMenu(user,card){
    if(this.ctxMenu){this.ctxMenu.remove();}

    const menu=document.createElement("div");
    menu.className="msgContextMenu";
    this.ctxMenu=menu;

    const items=[
        {icon:"✅",text:"Select chat",action:()=>{
            if(user.id){
                this.enterSelectMode();
                this.toggleSelectConv(user.id,card);
            }
        }},
        {sep:true},
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
        {sep:true},
        {icon:"🗑",text:"Delete chat",danger:true,action:()=>{
            if(user.id){
                this.deleteConversation(user.id,card);
            }
        }},
    ];

    items.forEach(item=>{
        if(item.sep){
            const s=document.createElement("div");s.className="msgCtxSep";menu.appendChild(s);return;
        }
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
