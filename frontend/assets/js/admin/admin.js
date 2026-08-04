class CloudTokAdmin{

constructor(){
    this.token=localStorage.getItem("adminToken");
    this.apiBase="https://cloudtok-api.bossmanp16.workers.dev/api";

    if(this.token){
        this.showPanel();
    }else{
        this.showLogin();
    }

    this.setupLoginForm();
    this.setupTabs();
    this.setupLogout();
    this.setupPreviewClose();
    this.setupSearch();
}

showLogin(){
    document.getElementById("adminLoginGate").style.display="flex";
    document.getElementById("adminPanel").style.display="none";
}

showPanel(){
    document.getElementById("adminLoginGate").style.display="none";
    document.getElementById("adminPanel").style.display="flex";
    this.loadDashboard();
}

setupLoginForm(){
    document.getElementById("adminLoginForm").onsubmit=async(e)=>{
        e.preventDefault();
        const email=document.getElementById("adminEmail").value;
        const password=document.getElementById("adminPassword").value;
        const errEl=document.getElementById("adminLoginError");
        const btn=document.getElementById("adminLoginBtn");

        errEl.textContent="";
        btn.textContent="Logging in...";
        btn.disabled=true;

        try{
            const res=await fetch(this.apiBase+"/admin/login",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({email,password})
            });
            const data=await res.json();

            if(data.success&&data.token){
                this.token=data.token;
                localStorage.setItem("adminToken",data.token);
                localStorage.setItem("adminUser",JSON.stringify(data.user));
                this.showPanel();
            }else{
                errEl.textContent=data.error||"Login failed";
            }
        }catch(err){
            errEl.textContent="Connection failed. Try again.";
        }

        btn.textContent="Login";
        btn.disabled=false;
    };
}

setupTabs(){
    document.querySelectorAll(".adminNav").forEach(btn=>{
        btn.onclick=()=>{
            document.querySelectorAll(".adminNav").forEach(b=>b.classList.remove("active"));
            document.querySelectorAll(".adminTab").forEach(t=>t.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab+"Tab").classList.add("active");

            const tab=btn.dataset.tab;
            if(tab==="dashboard") this.loadDashboard();
            else if(tab==="users") this.loadUsers();
            else if(tab==="videos") this.loadVideos();
            else if(tab==="comments") this.loadComments();
            else if(tab==="messages") this.loadMessages();
            else if(tab==="streams") this.loadStreams();
            else if(tab==="transactions") this.loadTransactions();
            else if(tab==="gifts") this.loadGifts();
            else if(tab==="giftConfig") this.loadGiftConfig();
            else if(tab==="logs") this.loadLogs();
            else if(tab==="storage") this.loadStorage();
        };
    });
}

setupLogout(){
    document.getElementById("adminLogoutBtn").onclick=()=>{
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        this.token=null;
        this.showLogin();
    };
}

setupPreviewClose(){
    document.getElementById("closePreviewBtn").onclick=()=>{
        const modal=document.getElementById("videoPreviewModal");
        const video=document.getElementById("previewVideo");
        video.pause();
        video.src="";
        modal.classList.remove("show");
    };
    document.getElementById("videoPreviewModal").onclick=(e)=>{
        if(e.target.id==="videoPreviewModal"){
            const video=document.getElementById("previewVideo");
            video.pause();
            video.src="";
            e.target.classList.remove("show");
        }
    };
}

setupSearch(){
    let usersTimer=null;
    document.getElementById("usersSearch")?.addEventListener("input",function(){
        clearTimeout(usersTimer);
        usersTimer=setTimeout(()=>admin.loadUsers(),300);
    });

    let videosTimer=null;
    document.getElementById("videosSearch")?.addEventListener("input",function(){
        clearTimeout(videosTimer);
        videosTimer=setTimeout(()=>admin.loadVideos(),300);
    });
}

async api(path,method="GET",body=null){
    const opts={method,headers:{"Authorization":"Bearer "+this.token,"Content-Type":"application/json"}};
    if(body){
        if(body instanceof FormData){
            delete opts.headers["Content-Type"];
            opts.body=body;
        }else{
            opts.body=JSON.stringify(body);
        }
    }
    const res=await fetch(this.apiBase+path,opts);
    return await res.json();
}

async loadDashboard(){
    try{
        const stats=await this.api("/admin/stats");
        if(stats.error){
            document.getElementById("statsGrid").innerHTML="<p>"+stats.error+"</p>";
            return;
        }
        document.getElementById("statsGrid").innerHTML=`
            <div class="statCard"><div class="statNumber">${stats.users||0}</div><div class="statLabel">Users</div></div>
            <div class="statCard"><div class="statNumber">${stats.videos||0}</div><div class="statLabel">Videos</div></div>
            <div class="statCard"><div class="statNumber">${stats.likes||0}</div><div class="statLabel">Likes</div></div>
            <div class="statCard"><div class="statNumber">${stats.comments||0}</div><div class="statLabel">Comments</div></div>
            <div class="statCard"><div class="statNumber">${stats.follows||0}</div><div class="statLabel">Follows</div></div>
            <div class="statCard"><div class="statNumber">${stats.messages||0}</div><div class="statLabel">Messages</div></div>
            <div class="statCard"><div class="statNumber">${stats.activeStreams||0}</div><div class="statLabel">Live Now</div></div>
            <div class="statCard"><div class="statNumber">${stats.giftsSent||0}</div><div class="statLabel">Gifts Sent</div></div>
        `;
    }catch(e){
        document.getElementById("statsGrid").innerHTML="<p>Failed to load stats.</p>";
    }
}

async loadUsers(){
    try{
        const result=await this.api("/admin/users");
        if(result.error){
            document.getElementById("usersTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        let users=result.users||[];

        const search=document.getElementById("usersSearch")?.value?.toLowerCase();
        if(search){
            users=users.filter(u=>(u.username||"").toLowerCase().includes(search)||(u.email||"").toLowerCase().includes(search)||(u.display_name||"").toLowerCase().includes(search));
        }

        if(users.length===0){
            document.getElementById("usersTable").innerHTML='<div class="emptyState"><div class="icon">👥</div><p>No users found</p></div>';
            return;
        }

        let html=`<table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>`;
        users.forEach(u=>{
            const status=u.status||"active";
            const role=u.role||"user";
            html+=`<tr>
                <td>
                    <div class="userCell">
                        <img src="${u.avatar||'assets/images/default-avatar.png'}" class="userCellAvatar" onerror="this.src='assets/images/default-avatar.png'">
                        <div><strong>${u.display_name||u.username}</strong><br><small>@${u.username}</small></div>
                    </div>
                </td>
                <td>${u.email||""}</td>
                <td><span class="statusBadge ${role}">${role}</span></td>
                <td><span class="statusBadge ${status}">${status}</span></td>
                <td>${u.created_at?new Date(u.created_at).toLocaleDateString():""}</td>
                <td class="actionsCell">
                    <button class="adminBtn view" onclick="admin.adjustBalance(${u.id})">💰 Balance</button>
                    ${status!=="banned"?`<button class="adminBtn ban" onclick="admin.banUser(${u.id})">Ban</button>`:`<button class="adminBtn unban" onclick="admin.unbanUser(${u.id})">Unban</button>`}
                    ${role!=="admin"?`<button class="adminBtn admin" onclick="admin.makeAdmin(${u.id})">Admin</button>`:""}
                </td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("usersTable").innerHTML=html;
    }catch(e){
        document.getElementById("usersTable").innerHTML="<p>Failed to load users.</p>";
    }
}

async loadVideos(){
    try{
        const result=await this.api("/admin/videos");
        if(result.error){
            document.getElementById("videosTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        let videos=result.videos||[];

        const search=document.getElementById("videosSearch")?.value?.toLowerCase();
        if(search){
            videos=videos.filter(v=>(v.caption||"").toLowerCase().includes(search)||(v.username||"").toLowerCase().includes(search));
        }

        if(videos.length===0){
            document.getElementById("videosTable").innerHTML='<div class="emptyState"><div class="icon">🎬</div><p>No videos found</p></div>';
            return;
        }

        let html=`<table><thead><tr><th>Preview</th><th>User</th><th>Caption</th><th>Likes</th><th>Comments</th><th>Views</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;
        videos.forEach(v=>{
            const thumb=v.thumbnail_url||"";
            const vidUrl=v.video_url||"";
            html+=`<tr>
                <td>
                    <div class="videoPreviewThumb" onclick="admin.previewVideo('${vidUrl.replace(/'/g,"\\'")}','${(v.caption||'').replace(/'/g,"\\'")}','@${v.username}',${v.likes||0},${v.comments_count||0},${v.views||0})">
                        ${thumb?`<img src="${thumb}" onerror="this.parentElement.innerHTML='🎬'">`:`<span>🎬</span>`}
                    </div>
                </td>
                <td>@${v.username}</td>
                <td>${(v.caption||"").substring(0,35)}${(v.caption||"").length>35?"...":""}</td>
                <td>${v.likes||0}</td>
                <td>${v.comments_count||0}</td>
                <td>${v.views||0}</td>
                <td>${v.created_at?new Date(v.created_at).toLocaleDateString():""}</td>
                <td><button class="adminBtn delete" onclick="admin.deleteVideo(${v.id})">Delete</button></td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("videosTable").innerHTML=html;
    }catch(e){
        document.getElementById("videosTable").innerHTML="<p>Failed to load videos.</p>";
    }
}

async loadComments(){
    try{
        const result=await this.api("/admin/comments");
        if(result.error){
            document.getElementById("commentsTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const comments=result.comments||[];
        if(comments.length===0){
            document.getElementById("commentsTable").innerHTML='<div class="emptyState"><div class="icon">💬</div><p>No comments found</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>User</th><th>Comment</th><th>Video</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;
        comments.forEach(c=>{
            const videoLabel=c.video_caption?(c.video_caption.substring(0,30)+(c.video_caption.length>30?"...":"")):(c.video_id?"#"+c.video_id:"-");
            html+=`<tr>
                <td>@${c.username||"unknown"}</td>
                <td><span class="commentText" title="${(c.text||"").replace(/"/g,"&quot;")}">${(c.text||"").substring(0,50)}${(c.text||"").length>50?"...":""}</span></td>
                <td>${videoLabel}</td>
                <td>${c.created_at?new Date(c.created_at).toLocaleDateString():""}</td>
                <td><button class="adminBtn delete" onclick="admin.deleteComment(${c.id})">Delete</button></td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("commentsTable").innerHTML=html;
    }catch(e){
        document.getElementById("commentsTable").innerHTML="<p>Failed to load comments.</p>";
    }
}

async loadMessages(){
    try{
        const result=await this.api("/admin/messages");
        if(result.error){
            document.getElementById("messagesTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const messages=result.messages||[];
        if(messages.length===0){
            document.getElementById("messagesTable").innerHTML='<div class="emptyState"><div class="icon">✉️</div><p>No messages found</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>From</th><th>To</th><th>Message</th><th>Date</th></tr></thead><tbody>`;
        messages.forEach(m=>{
            html+=`<tr>
                <td>@${m.sender_name||m.sender_username||"?"}</td>
                <td>@${m.receiver_name||"?"}</td>
                <td><span class="msgPreview" title="${(m.text||m.content||"").replace(/"/g,"&quot;")}">${(m.text||m.content||"").substring(0,60)}${(m.text||m.content||"").length>60?"...":""}</span></td>
                <td>${m.created_at?new Date(m.created_at).toLocaleDateString():""}</td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("messagesTable").innerHTML=html;
    }catch(e){
        document.getElementById("messagesTable").innerHTML="<p>Failed to load messages.</p>";
    }
}

async loadStreams(){
    try{
        const result=await this.api("/admin/streams");
        if(result.error){
            document.getElementById("streamsTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const streams=result.streams||[];
        if(streams.length===0){
            document.getElementById("streamsTable").innerHTML='<div class="emptyState"><div class="icon">📡</div><p>No live streams</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>Streamer</th><th>Title</th><th>Viewers</th><th>Started</th><th>Status</th><th>Actions</th></tr></thead><tbody>`;
        streams.forEach(s=>{
            const isLive=s.status==="active"||s.status==="live";
            html+=`<tr>
                <td>@${s.username||"?"}</td>
                <td>${s.title||"Untitled"}</td>
                <td>${s.viewers||0}</td>
                <td>${s.created_at?new Date(s.created_at).toLocaleString():""}</td>
                <td><span class="statusBadge ${isLive?"live":"offline"}">${isLive?"LIVE":"Ended"}</span></td>
                <td class="actionsCell">
                    ${isLive?`<button class="adminBtn stop" onclick="admin.stopStream('${s.stream_key}')">Stop</button>`:""}
                </td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("streamsTable").innerHTML=html;
    }catch(e){
        document.getElementById("streamsTable").innerHTML="<p>Failed to load streams.</p>";
    }
}

async loadTransactions(){
    try{
        const result=await this.api("/admin/transactions");
        if(result.error){
            document.getElementById("transactionsTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const txns=result.transactions||[];
        if(txns.length===0){
            document.getElementById("transactionsTable").innerHTML='<div class="emptyState"><div class="icon">💰</div><p>No transactions</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Currency</th><th>Status</th><th>Reference</th><th>Date</th></tr></thead><tbody>`;
        txns.forEach(t=>{
            html+=`<tr>
                <td>@${t.username||"?"}</td>
                <td>${t.type||t.transaction_type||"-"}</td>
                <td>${t.amount!=null?"$"+Number(t.amount).toFixed(2):"-"}</td>
                <td>${t.currency||"USD"}</td>
                <td><span class="statusBadge ${t.status||"active"}">${t.status||"-"}</span></td>
                <td><small>${t.reference||t.paystack_reference||"-"}</small></td>
                <td>${t.created_at?new Date(t.created_at).toLocaleDateString():""}</td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("transactionsTable").innerHTML=html;
    }catch(e){
        document.getElementById("transactionsTable").innerHTML="<p>Failed to load transactions.</p>";
    }
}

async loadGifts(){
    try{
        const result=await this.api("/admin/gifts");
        if(result.error){
            document.getElementById("giftsTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const gifts=result.gifts||[];
        if(gifts.length===0){
            document.getElementById("giftsTable").innerHTML='<div class="emptyState"><div class="icon">🎁</div><p>No gifts sent yet</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>From</th><th>To</th><th>Gift</th><th>Amount</th><th>Date</th></tr></thead><tbody>`;
        gifts.forEach(g=>{
            html+=`<tr>
                <td>@${g.sender_username||"?"}</td>
                <td>@${g.receiver_username||"?"}</td>
                <td>${g.gift_emoji||"🎁"} ${g.gift_name||"Gift"}</td>
                <td>$${g.amount_usd!=null?Number(g.amount_usd).toFixed(2):"-"}</td>
                <td>${g.created_at?new Date(g.created_at).toLocaleDateString():""}</td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("giftsTable").innerHTML=html;
    }catch(e){
        document.getElementById("giftsTable").innerHTML="<p>Failed to load gifts.</p>";
    }
}

async loadLogs(){
    try{
        const result=await this.api("/admin/logs");
        if(result.error){
            document.getElementById("logsTable").innerHTML="<p>"+result.error+"</p>";
            return;
        }
        const logs=result.logs||[];
        if(logs.length===0){
            document.getElementById("logsTable").innerHTML='<div class="emptyState"><div class="icon">📋</div><p>No activity logs</p></div>';
            return;
        }
        let html=`<table><thead><tr><th>User</th><th>Action</th><th>Details</th><th>Date</th></tr></thead><tbody>`;
        logs.forEach(l=>{
            html+=`<tr>
                <td>@${l.username||l.user_id||"system"}</td>
                <td><span class="statusBadge active">${l.action||"-"}</span></td>
                <td><span class="msgPreview" title="${(l.details||l.metadata||"").replace(/"/g,"&quot;")}">${(l.details||l.metadata||"-").substring(0,60)}</span></td>
                <td>${l.created_at?new Date(l.created_at).toLocaleString():""}</td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("logsTable").innerHTML=html;
    }catch(e){
        document.getElementById("logsTable").innerHTML="<p>Failed to load logs.</p>";
    }
}

async loadStorage(){
    try{
        const result=await this.api("/admin/storage");
        const s=result.storage||result;
        const providers=s.providers||[];
        const events=s.events||[];

        let html=`<div class="statsGrid">`;
        html+=`<div class="statCard"><div class="statNumber">${providers.length}</div><div class="statLabel">Providers</div></div>`;
        html+=`<div class="statCard"><div class="statNumber">${events.length}</div><div class="statLabel">Storage Events</div></div>`;
        html+=`</div>`;

        if(providers.length>0){
            html+=`<h3 style="color:#888;font-size:12px;text-transform:uppercase;margin:20px 0 10px;letter-spacing:1px;">Cloud Storage Providers</h3>`;
            html+=`<table><thead><tr><th>Provider</th><th>Status</th><th>Configured</th></tr></thead><tbody>`;
            providers.forEach(p=>{
                const statusColor=p.status==="ok"||p.status==="healthy"?"#00c853":p.status==="error"?"#ff2d55":"#ffc107";
                html+=`<tr>
                    <td><strong>${p.id||p.name||"Unknown"}</strong></td>
                    <td><span style="color:${statusColor};font-weight:600;">${p.status||"unknown"}</span></td>
                    <td>${p.configured!==false?"✅ Yes":"❌ No"}</td>
                </tr>`;
            });
            html+=`</tbody></table>`;
        }

        if(events.length>0){
            html+=`<h3 style="color:#888;font-size:12px;text-transform:uppercase;margin:20px 0 10px;letter-spacing:1px;">Recent Events</h3>`;
            html+=`<table><thead><tr><th>Type</th><th>Provider</th><th>File</th><th>Status</th><th>Date</th></tr></thead><tbody>`;
            events.forEach(e=>{
                html+=`<tr>
                    <td>${e.event_type||"-"}</td>
                    <td>${e.provider||"-"}</td>
                    <td>${(e.filename||"-").substring(0,30)}</td>
                    <td><span class="statusBadge ${e.status==="success"?"active":"banned"}">${e.status||"-"}</span></td>
                    <td>${e.created_at?new Date(e.created_at).toLocaleDateString():""}</td>
                </tr>`;
            });
            html+=`</tbody></table>`;
        }

        document.getElementById("storageGrid").innerHTML=html;
    }catch(e){
        document.getElementById("storageGrid").innerHTML="<p>Failed to load storage info.</p>";
    }
}

previewVideo(url,caption,username,likes,comments,views){
    const modal=document.getElementById("videoPreviewModal");
    const video=document.getElementById("previewVideo");
    const info=document.getElementById("previewInfo");

    video.src=url;
    info.innerHTML=`
        <h3>${caption}</h3>
        <p>by ${username}</p>
        <div class="previewStats">
            <span>❤️ ${likes}</span>
            <span>💬 ${comments}</span>
            <span>👁 ${views}</span>
        </div>
    `;
    modal.classList.add("show");
}

async banUser(id){
    if(!confirm("Ban this user?")) return;
    await this.api("/admin/users/"+id,"PUT",{status:"banned"});
    this.loadUsers();
}

async unbanUser(id){
    await this.api("/admin/users/"+id,"PUT",{status:"active"});
    this.loadUsers();
}

async makeAdmin(id){
    if(!confirm("Make this user an admin?")) return;
    await this.api("/admin/users/"+id,"PUT",{role:"admin"});
    this.loadUsers();
}

async deleteVideo(id){
    if(!confirm("Delete this video permanently?")) return;
    await this.api("/admin/videos/"+id,"DELETE");
    this.loadVideos();
}

async deleteComment(id){
    if(!confirm("Delete this comment?")) return;
    await this.api("/admin/comments/"+id,"DELETE");
    this.loadComments();
}

async stopStream(streamKey){
    if(!confirm("Stop this live stream?")) return;
    await this.api("/admin/streams/"+encodeURIComponent(streamKey)+"/stop","POST");
    this.loadStreams();
}

async adjustBalance(userId){
    const amount=prompt("Enter amount to add (positive) or remove (negative):\nExample: 10 or -5");
    if(amount===null) return;
    const num=parseFloat(amount);
    if(isNaN(num)){
        alert("Invalid amount");
        return;
    }
    const reason=prompt("Reason (optional):") || "";
    const result=await this.api("/admin/balance","POST",{user_id:userId,amount:num,reason:reason});
    if(result.success){
        alert("Balance updated! New balance: $"+result.balance.toFixed(2));
        this.loadUsers();
    } else {
        alert(result.error||"Failed to update balance");
    }
}

async loadGiftConfig(){
    try{
        const result=await this.api("/admin/gift-config");
        const config=result.config||[];
        const defaultGifts=[
            {gift_name:"Rose",price_usd:0.99},
            {gift_name:"Heart",price_usd:1.99},
            {gift_name:"Star",price_usd:4.99},
            {gift_name:"Fire",price_usd:9.99},
            {gift_name:"Diamond",price_usd:19.99},
            {gift_name:"Crown",price_usd:49.99},
            {gift_name:"Party",price_usd:9.99},
            {gift_name:"Clap",price_usd:0.99}
        ];
        const merged=defaultGifts.map(d=>{
            const found=config.find(c=>c.gift_name===d.gift_name);
            return{gift_name:d.gift_name,price_usd:found?found.price_usd:d.price_usd};
        });
        let html=`<table><thead><tr><th>Gift</th><th>Price (USD)</th><th>Actions</th></tr></thead><tbody>`;
        const emojis={Rose:"🌹",Heart:"❤️",Star:"⭐",Fire:"🔥",Diamond:"💎",Crown:"👑",Party:"🎉",Clap:"👏"};
        merged.forEach(g=>{
            html+=`<tr>
                <td>${emojis[g.gift_name]||"🎁"} ${g.gift_name}</td>
                <td>$${g.price_usd.toFixed(2)}</td>
                <td><button class="adminBtn view" onclick="admin.editGiftPrice('${g.gift_name}',${g.price_usd})">Edit</button></td>
            </tr>`;
        });
        html+="</tbody></table>";
        document.getElementById("giftConfigTable").innerHTML=html;
    }catch(e){
        document.getElementById("giftConfigTable").innerHTML="<p>Failed to load gift config.</p>";
    }
}

async editGiftPrice(giftName,currentPrice){
    const newPrice=prompt("Enter new price for "+giftName+":",currentPrice);
    if(newPrice===null) return;
    const num=parseFloat(newPrice);
    if(isNaN(num)||num<=0){
        alert("Invalid price");
        return;
    }
    const result=await this.api("/admin/gift-config","POST",{gift_name:giftName,new_price:num});
    if(result.success){
        alert(giftName+" price updated to $"+num.toFixed(2));
        this.loadGiftConfig();
    } else {
        alert(result.error||"Failed to update price");
    }
}

}

const admin=new CloudTokAdmin();
