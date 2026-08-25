class CloudTokConversation{

constructor(){
    const params=new URLSearchParams(window.location.search);
    this.username=params.get("user");
    this.name=document.getElementById("conversationName");
    this.avatar=document.getElementById("conversationAvatar");
    this.messages=document.getElementById("messageList");
    this.input=document.getElementById("messageInput");
    this.sendBtn=document.getElementById("sendMessageBtn");
    this.lastMessageCount=0;
    this.pollInterval=null;
    this.selectMode=false;
    this.selectedMsgIds=new Set();
    this.allMessages=[];
    this.archivedIds=new Set();
    this.lockedIds=new Set();
    this.lockedTexts={};
    this.ctxMenu=null;
    this.longPressTimer=null;
    this.longPressMsgId=null;
    this.setup();
    this.setupSelectBar();
}

setupSelectBar(){
    const bar=document.getElementById("msgSelectBar");
    document.getElementById("selCancelBtn").onclick=()=>this.exitSelectMode();
    document.getElementById("selDeleteBtn").onclick=()=>this.bulkDelete();
    document.getElementById("selArchiveBtn").onclick=()=>this.bulkArchive();
    document.getElementById("selLockBtn").onclick=()=>this.bulkLock();
}

enterSelectMode(){
    this.selectMode=true;
    document.getElementById("msgSelectBar").classList.add("show");
}

exitSelectMode(){
    this.selectMode=false;
    this.selectedMsgIds.clear();
    document.getElementById("msgSelectBar").classList.remove("show");
    this.messages.querySelectorAll(".message.selected").forEach(m=>m.classList.remove("selected"));
}

toggleSelect(msgId,el){
    if(this.selectedMsgIds.has(msgId)){
        this.selectedMsgIds.delete(msgId);
        el.classList.remove("selected");
    } else {
        this.selectedMsgIds.add(msgId);
        el.classList.add("selected");
    }
    document.getElementById("selCount").textContent=this.selectedMsgIds.size+" selected";
}

showContextMenu(msgId,text,el){
    this.removeContextMenu();
    const menu=document.createElement("div");
    menu.className="msgContextMenu";
    const isMine=el.classList.contains("sent");
    const isLocked=this.lockedIds.has(msgId);
    const isArchived=this.archivedIds.has(msgId);

    const items=[
        {icon:"📋",text:"Copy",action:()=>{navigator.clipboard.writeText(text).catch(()=>{});}},
        {icon:"✅",text:"Select",action:()=>{this.enterSelectMode();this.toggleSelect(msgId,el);}},
    ];

    if(isLocked){
        items.push({icon:"🔓",text:"Unlock",action:()=>this.toggleLock(msgId)});
    } else {
        items.push({icon:"🔒",text:"Lock with password",action:()=>this.toggleLock(msgId)});
    }

    if(isArchived){
        items.push({icon:"📤",text:"Unarchive",action:()=>this.toggleArchive(msgId)});
    } else {
        items.push({icon:"📦",text:"Archive",action:()=>this.toggleArchive(msgId)});
    }

    if(isMine){
        items.push({sep:true});
        items.push({icon:"🗑",text:"Delete",danger:true,action:()=>this.deleteMessage(msgId,el)});
    }

    items.forEach(item=>{
        if(item.sep){
            const s=document.createElement("div");s.className="msgCtxSep";menu.appendChild(s);return;
        }
        const btn=document.createElement("button");
        btn.className="msgCtxItem"+(item.danger?" danger":"");
        btn.innerHTML='<span class="ctxIcon">'+item.icon+'</span>'+item.text;
        btn.onclick=(e)=>{e.stopPropagation();this.removeContextMenu();item.action();};
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    this.ctxMenu=menu;

    const rect=el.getBoundingClientRect();
    let top=rect.top-10;
    let left=rect.left;
    if(top+menu.offsetHeight>window.innerHeight) top=window.innerHeight-menu.offsetHeight-10;
    if(left+menu.offsetWidth>window.innerWidth) left=window.innerWidth-menu.offsetWidth-10;
    menu.style.top=top+"px";
    menu.style.left=left+"px";
}

removeContextMenu(){
    if(this.ctxMenu){this.ctxMenu.remove();this.ctxMenu=null;}
}

setupMessageEvents(){
    this.messages.querySelectorAll(".message").forEach(el=>{
        const msgId=parseInt(el.dataset.msgId);
        if(!msgId) return;

        el.addEventListener("mousedown",(e)=>{
            if(this.selectMode){e.preventDefault();this.toggleSelect(msgId,el);return;}
            this.longPressMsgId=msgId;
            this.longPressTimer=setTimeout(()=>{
                this.showContextMenu(msgId,el.textContent,el);
            },500);
        });
        el.addEventListener("mouseup",()=>{clearTimeout(this.longPressTimer);});
        el.addEventListener("mouseleave",()=>{clearTimeout(this.longPressTimer);});

        el.addEventListener("touchstart",(e)=>{
            if(this.selectMode){this.toggleSelect(msgId,el);return;}
            this.longPressMsgId=msgId;
            this.longPressTimer=setTimeout(()=>{
                this.showContextMenu(msgId,el.textContent,el);
            },500);
        },{passive:true});
        el.addEventListener("touchend",()=>{clearTimeout(this.longPressTimer);},{passive:true});
        el.addEventListener("touchmove",()=>{clearTimeout(this.longPressTimer);},{passive:true});

        el.addEventListener("click",()=>{
            if(this.selectMode) this.toggleSelect(msgId,el);
        });

        if(this.archivedIds.has(msgId)){
            el.style.opacity="0.4";
            el.style.position="relative";
        }
        if(this.lockedIds.has(msgId)){
            el.innerHTML='<div class="lockedOverlay">🔒 This message is password protected. Tap to view.</div>';
            el.onclick=()=>{
                const pass=prompt("Enter password to view message:");
                if(pass && this.lockedTexts[msgId]===pass){
                    el.textContent=text||"Message";
                    el.style.opacity="1";
                } else if(pass){
                    showToast("Wrong password","error");
                }
            };
        }
    });
}

async deleteMessage(msgId,el){
    if(typeof CloudTokAPI!=="undefined"){
        try{
            const result=await CloudTokAPI.request("/messages/"+msgId,{method:"DELETE"});
            if(result.success){
                el.style.transition="all .3s";
                el.style.maxHeight="0";
                el.style.padding="0";
                el.style.margin="0";
                el.style.opacity="0";
                setTimeout(()=>el.remove(),300);
                this.allMessages=this.allMessages.filter(m=>m.id!==msgId);
                this.lastMessageCount=Math.max(0,this.lastMessageCount-1);
                showToast("Message deleted","success");
            } else {
                showToast("Delete failed: "+(result.error||"Unknown"),"error");
            }
        }catch(e){
            showToast("Delete failed","error");
        }
    } else {
        el.style.transition="all .3s";
        el.style.maxHeight="0";
        el.style.opacity="0";
        setTimeout(()=>el.remove(),300);
        this.allMessages=this.allMessages.filter(m=>m.id!==msgId);
    }
}

async toggleArchive(msgId){
    if(this.archivedIds.has(msgId)){
        this.archivedIds.delete(msgId);
        showToast("Message unarchived","success");
    } else {
        this.archivedIds.add(msgId);
        showToast("Message archived","success");
    }
    const el=this.messages.querySelector('[data-msg-id="'+msgId+'"]');
    if(el){
        el.style.opacity=this.archivedIds.has(msgId)?"0.4":"1";
    }
    if(typeof CloudTokAPI!=="undefined"){
        try{await CloudTokAPI.request("/messages/"+msgId+"/archive",{method:"POST"});}catch(e){}
    }
}

async toggleLock(msgId){
    if(this.lockedIds.has(msgId)){
        this.lockedIds.delete(msgId);
        delete this.lockedTexts[msgId];
        showToast("Message unlocked","success");
        const el=this.messages.querySelector('[data-msg-id="'+msgId+'"]');
        if(el){
            const msg=this.allMessages.find(m=>m.id===msgId);
            el.textContent=msg?msg.text:"Message";
            el.style.opacity="1";
        }
    } else {
        const pass=prompt("Set a password for this message:");
        if(!pass)return;
        this.lockedIds.add(msgId);
        this.lockedTexts[msgId]=pass;
        showToast("Message locked","success");
        const el=this.messages.querySelector('[data-msg-id="'+msgId+'"]');
        if(el){
            el.innerHTML='<div class="lockedOverlay">🔒 This message is password protected. Tap to view.</div>';
            el.style.opacity="1";
        }
    }
    if(typeof CloudTokAPI!=="undefined"){
        try{await CloudTokAPI.request("/messages/"+msgId+"/lock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locked:!this.lockedIds.has(msgId)})});}catch(e){}
    }
}

async bulkDelete(){
    const ids=[...this.selectedMsgIds];
    ids.forEach(id=>{
        const el=this.messages.querySelector('[data-msg-id="'+id+'"]');
        if(el){el.style.transition="all .3s";el.style.maxHeight="0";el.style.padding="0";el.style.opacity="0";setTimeout(()=>el.remove(),300);}
        this.allMessages=this.allMessages.filter(m=>m.id!==id);
    });
    this.exitSelectMode();
    if(typeof CloudTokAPI!=="undefined"){
        try{await CloudTokAPI.request("/messages/bulk-delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});}catch(e){}
    }
    showToast(ids.length+" messages deleted","success");
}

async bulkArchive(){
    const ids=[...this.selectedMsgIds];
    ids.forEach(id=>{
        this.archivedIds.add(id);
        const el=this.messages.querySelector('[data-msg-id="'+id+'"]');
        if(el){el.style.opacity="0.4";}
    });
    this.exitSelectMode();
    if(typeof CloudTokAPI!=="undefined"){
        try{await CloudTokAPI.request("/messages/bulk-archive",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});}catch(e){}
    }
    showToast(ids.length+" messages archived","success");
}

async bulkLock(){
    const pass=prompt("Set a password to lock these messages:");
    if(!pass)return;
    const ids=[...this.selectedMsgIds];
    ids.forEach(id=>{
        this.lockedIds.add(id);
        this.lockedTexts[id]=pass;
        const el=this.messages.querySelector('[data-msg-id="'+id+'"]');
        if(el){
            el.innerHTML='<div class="lockedOverlay">🔒 This message is password protected. Tap to view.</div>';
            el.style.opacity="1";
        }
    });
    this.exitSelectMode();
    if(typeof CloudTokAPI!=="undefined"){
        try{await CloudTokAPI.request("/messages/bulk-lock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids,password:pass})});}catch(e){}
    }
    showToast(ids.length+" messages locked","success");
}


setup(){
    this.loadUser();
    this.loadMessages();
    this.setupButtons();
    this.startPolling();
}

startPolling(){
    this.pollInterval=setInterval(()=>{
        this.loadMessages(true);
    },3000);
}

stopPolling(){
    if(this.pollInterval){
        clearInterval(this.pollInterval);
        this.pollInterval=null;
    }
}


async loadUser(){

    if(typeof CloudTokAPI!=="undefined"){

        try{

            const result=
            await CloudTokAPI.getProfile(this.username);

            if(!result.error){

                this.name.textContent=
                result.displayName||result.username;

                if(this.avatar){
                    this.avatar.src=
                    result.avatar||
                    "assets/images/default-avatar.png";
                }

                return;

            }

        }
        catch(e){}

    }

    let users=
    JSON.parse(
        localStorage.getItem("CloudTokUsers")||"[]"
    );

    const user=users.find(u=>u.username===this.username);

    if(user){
        this.name.textContent=user.displayName;
        if(this.avatar){
            this.avatar.src=
            user.avatar||"assets/images/default-avatar.png";
        }
    }
    else{
        this.name.textContent=this.username;
        if(this.avatar){
            this.avatar.src="assets/images/default-avatar.png";
        }
    }

}


async loadMessages(isPoll=false){

    if(typeof CloudTokAPI!=="undefined"){

        try{

            const result=
            await CloudTokAPI.getMessages(this.username);

            if(result.messages){

                if(isPoll&&result.messages.length===this.lastMessageCount){
                    return;
                }

                this.lastMessageCount=result.messages.length;
                this.allMessages=result.messages;
                this.messages.innerHTML="";

                const currentUsername=
                localStorage.getItem("CloudTokCurrentUser")||"";

                result.messages.forEach(msg=>{

                    const bubble=
                    document.createElement("div");

                    bubble.className=
                    msg.sender_username===currentUsername
                    ?"message sent"
                    :"message received";

                    bubble.dataset.msgId=msg.id;

                    const videoMatch=(msg.text||"").match(/watch\.html\?id=(\d+)/);
                    if(videoMatch){
                        bubble.innerHTML='<div class="msgVideoPreview" onclick="window.location.href=\'watch.html?id='+videoMatch[1]+'\'" style="cursor:pointer;background:rgba(255,255,255,.06);border-radius:12px;padding:10px;max-width:220px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="font-size:20px;">🎬</span><span style="font-size:12px;color:rgba(255,255,255,.5);">Video</span></div><div style="font-size:12px;color:rgba(255,255,255,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+msg.text+'</div></div>';
                    } else if((msg.text||"").startsWith("http")){
                        bubble.innerHTML='<a href="'+msg.text+'" target="_blank" rel="noopener" style="color:#00b7ff;text-decoration:none;word-break:break-all;">'+msg.text+'</a>';
                    } else {
                        bubble.textContent=msg.text;
                    }

                    this.messages.appendChild(bubble);

                });

                this.setupMessageEvents();

                this.messages.scrollTop=
                this.messages.scrollHeight;

                return;

            }

        }
        catch(e){
            if(!isPoll) console.log("Messages API failed, using localStorage");
        }

    }

    if(isPoll) return;

    const key="CloudTokChat_"+this.username;

    const messages=
    JSON.parse(localStorage.getItem(key)||"[]");

    this.messages.innerHTML="";

    messages.forEach((msg,idx)=>{

        const bubble=
        document.createElement("div");

        bubble.className=
        msg.sender===getCurrentCloudTokUser()
        ?"message sent"
        :"message received";

        bubble.dataset.msgId=msg.time||idx;
        bubble.textContent=msg.text;

        this.messages.appendChild(bubble);

    });

    this.setupMessageEvents();

    this.messages.scrollTop=this.messages.scrollHeight;

}


async sendMessage(){

    const text=this.input.value.trim();
    if(!text)return;

    if(typeof CloudTokAPI!=="undefined"){

        try{

            const result=
            await CloudTokAPI.sendMessage(this.username,text);

            if(result.success){
                this.input.value="";
                this.lastMessageCount=0;
                await this.loadMessages();
                return;
            }

        }
        catch(e){
            console.log("Send message API failed, using localStorage");
        }

    }

    const key="CloudTokChat_"+this.username;

    let messages=
    JSON.parse(localStorage.getItem(key)||"[]");

    messages.push({
        sender:getCurrentCloudTokUser(),
        text:text,
        time:Date.now()
    });

    localStorage.setItem(key,JSON.stringify(messages));

    this.input.value="";
    this.loadMessages();

}


setupButtons(){

    this.sendBtn.onclick=()=>{
        this.sendMessage();
    };

    this.input.addEventListener("keypress",e=>{
        if(e.key==="Enter"){
            this.sendMessage();
        }
    });

    const back=
    document.getElementById("conversationBackBtn");

    if(back){
        back.onclick=()=>{
            this.stopPolling();
            history.back();
        };
    }

    window.addEventListener("beforeunload",()=>{
        this.stopPolling();
    });

}


}


document.addEventListener(
"DOMContentLoaded",
()=>{
    new CloudTokConversation();
}
);
