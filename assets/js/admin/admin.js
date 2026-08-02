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

        if(btn.dataset.tab==="dashboard") this.loadDashboard();
        if(btn.dataset.tab==="users") this.loadUsers();
        if(btn.dataset.tab==="videos") this.loadVideos();
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
    modal.style.display="none";
};
document.getElementById("videoPreviewModal").onclick=(e)=>{
    if(e.target.id==="videoPreviewModal"){
        const video=document.getElementById("previewVideo");
        video.pause();
        video.src="";
        e.target.style.display="none";
    }
};
}

async api(path,method="GET",body=null){
const opts={method,headers:{"Authorization":"Bearer "+this.token,"Content-Type":"application/json"}};
if(body) opts.body=JSON.stringify(body);
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
    const users=result.users||[];
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
                ${status!=="banned"?`<button class="adminBtn ban" onclick="admin.banUser(${u.id})">Ban</button>`:`<button class="adminBtn unban" onclick="admin.unbanUser(${u.id})">Unban</button>`}
                ${role!=="admin"?`<button class="adminBtn makeAdmin" onclick="admin.makeAdmin(${u.id})">Admin</button>`:""}
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
    const videos=result.videos||[];
    let html=`<table><thead><tr><th>Preview</th><th>User</th><th>Caption</th><th>Likes</th><th>Comments</th><th>Views</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;

    videos.forEach(v=>{
        const thumb=v.thumbnail_url||"";
        const vidUrl=v.video_url||"";
        html+=`<tr>
            <td>
                <div class="videoPreviewThumb" onclick="admin.previewVideo('${vidUrl}','${(v.caption||'').replace(/'/g,"\\'")}','@${v.username}',${v.likes||0},${v.comments||0},${v.views||0})">
                    ${thumb?`<img src="${thumb}" onerror="this.parentElement.innerHTML='🎬'">`:`<span class="noThumb">🎬</span>`}
                </div>
            </td>
            <td>@${v.username}</td>
            <td>${(v.caption||"").substring(0,35)}${(v.caption||"").length>35?"...":""}</td>
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
modal.style.display="flex";
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

}

const admin=new CloudTokAdmin();
