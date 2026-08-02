class CloudTokAdmin{

constructor(){
this.setupTabs();
this.loadDashboard();
this.setupLogout();
}

setupTabs(){
document.querySelectorAll(".adminNav").forEach(btn=>{
    btn.onclick=()=>{
        document.querySelectorAll(".adminNav").forEach(b=>b.classList.remove("active"));
        document.querySelectorAll(".adminTab").forEach(t=>t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab+"Tab").classList.add("active");

        if(btn.dataset.tab==="dashboard") this.loadDashboard();
        if(btn.dataset.tab==="users") this.loadUsers();
        if(btn.dataset.tab==="videos") this.loadVideos();
    };
});
}

setupLogout(){
document.getElementById("adminLogoutBtn").onclick=()=>{
    localStorage.removeItem("CloudTokToken");
    localStorage.removeItem("CloudTokCurrentUser");
    window.location.href="login.html";
};
}

async api(path,method="GET",body=null){
const token=localStorage.getItem("CloudTokToken");
const opts={method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"}};
if(body) opts.body=JSON.stringify(body);
const res=await fetch("https://cloudtok-api.bossmanp16.workers.dev/api"+path,opts);
return await res.json();
}

async loadDashboard(){
try{
    const stats=await this.api("/admin/stats");
    document.getElementById("statsGrid").innerHTML=`
        <div class="statCard"><div class="statNumber">${stats.users||0}</div><div class="statLabel">Users</div></div>
        <div class="statCard"><div class="statNumber">${stats.videos||0}</div><div class="statLabel">Videos</div></div>
        <div class="statCard"><div class="statNumber">${stats.likes||0}</div><div class="statLabel">Likes</div></div>
        <div class="statCard"><div class="statNumber">${stats.comments||0}</div><div class="statLabel">Comments</div></div>
        <div class="statCard"><div class="statNumber">${stats.follows||0}</div><div class="statLabel">Follows</div></div>
    `;
}catch(e){
    document.getElementById("statsGrid").innerHTML="<p>Failed to load stats. Are you logged in as admin?</p>";
}
}

async loadUsers(){
try{
    const result=await this.api("/admin/users");
    const users=result.users||[];
    let html=`<table><thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>`;

    users.forEach(u=>{
        const status=u.status||"active";
        const role=u.role||"user";
        html+=`<tr>
            <td>${u.id}</td>
            <td><strong>${u.display_name||u.username}</strong><br><small style="color:#888">@${u.username}</small></td>
            <td>${u.email||""}</td>
            <td><span class="statusBadge ${role}">${role}</span></td>
            <td><span class="statusBadge ${status}">${status}</span></td>
            <td>${u.created_at?new Date(u.created_at).toLocaleDateString():""}</td>
            <td>
                ${status!=="banned"?`<button class="adminBtn ban" onclick="admin.banUser(${u.id})">Ban</button>`:`<button class="adminBtn unban" onclick="admin.unbanUser(${u.id})">Unban</button>`}
                ${role!=="admin"?`<button class="adminBtn makeAdmin" onclick="admin.makeAdmin(${u.id})">Make Admin</button>`:""}
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
    const videos=result.videos||[];
    let html=`<table><thead><tr><th>ID</th><th>User</th><th>Caption</th><th>Likes</th><th>Comments</th><th>Views</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;

    videos.forEach(v=>{
        html+=`<tr>
            <td>${v.id}</td>
            <td>@${v.username}</td>
            <td>${(v.caption||"").substring(0,40)}${(v.caption||"").length>40?"...":""}</td>
            <td>${v.likes||0}</td>
            <td>${v.comments||0}</td>
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
if(!confirm("Delete this video?")) return;
await this.api("/admin/videos/"+id,"DELETE");
this.loadVideos();
}

}

const admin=new CloudTokAdmin();
