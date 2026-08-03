class CloudTokProfile{

constructor(){

const params =
new URLSearchParams(
window.location.search
);

this.currentUsername =

params.get("user")

||

localStorage.getItem(
"CloudTokCurrentUser"
)

||

"";


this.currentUsername =
String(this.currentUsername)
.replace(/^@+/,"")
.trim()
.toLowerCase();


this.user = null;

this.videos = [];

this.grid =
document.getElementById(
"profileContent"
);


this.init();

}


async init(){

try{
    await this.loadUser();
}
catch(e){
    console.log("loadUser error:",e);
}

if(!this.user){

this.user={

id:null,

displayName:
this.currentUsername || "User",

username:
this.currentUsername || "user",

avatar:
"assets/images/default-avatar.png",

bio:"",

followers:0,

following:0,

followersList:[],

followingList:[],

likes:0,

verified:false

};

}

try{ this.loadVideos(); }catch(e){}
try{ this.updateProfileUI(); }catch(e){}
try{ this.setupProfileMode(); }catch(e){}
try{ this.setupButtons(); }catch(e){}
try{ this.setupTabs(); }catch(e){}
try{ this.loadTheme(); }catch(e){}

}



async loadUser(){

    if(typeof CloudTokAPI !== "undefined"){

        try{

        const cloudUser =
        await CloudTokAPI.getProfile(
            this.currentUsername
        );


        if(!cloudUser.error){

            this.user = {
                ...cloudUser,
                followers: cloudUser.followersCount||0,
                following: cloudUser.followingCount||0,
                followersList:[],
                followingList:[]
            };

            return;

        }

        }
        catch(e){
            console.log("Profile API failed, using local");
        }

    }



    if(typeof CloudTokUsers !== "undefined"){

        this.user =
        CloudTokUsers.find(
            this.currentUsername
        );

    }



    if(!this.user){

        this.user={

            id:null,

            displayName:
            this.currentUsername || "User",

            username:
            this.currentUsername || "user",

            avatar:
            "assets/images/default-avatar.png",

            bio:"",

            followers:0,

            following:0,

            followersList:[],

            followingList:[],

            likes:0,

            verified:false

        };

    }


}




updateProfileUI(){

const displayName=this.user.displayName||this.user.username||"User";

document.getElementById(
"displayName"
).textContent=

displayName;

document.getElementById(
"username"
).textContent=

"@"+this.user.username;

document.getElementById(
"profileAvatar"
).src=

this.user.avatar ||

"assets/images/default-avatar.png";

document.getElementById(
"profileBio"
).textContent=

this.user.bio ||

"No bio yet.";

const website =

document.getElementById(
"profileWebsite"
);

website.textContent=

this.user.website ||

"";

website.href=

this.user.website ||

"#";

document.getElementById(
"followersCount"
).textContent=

typeof this.user.followers === "number" ?
this.user.followers :
(this.user.followers || []).length;

document.getElementById(
"followingCount"
).textContent=

typeof this.user.following === "number" ?
this.user.following :
(this.user.following || []).length;

    const badge =
document.getElementById(
"verifiedBadge"
);

if(badge){

badge.style.display =
this.user.verified
?
"inline"
:
"none";

}
    
}





async loadVideos(){

let allVideos=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=
        await CloudTokAPI.getUserVideos(this.currentUsername);

        if(result.videos){

            allVideos=result.videos.map(v=>({
                id:v.id,
                username:v.username,
                caption:v.caption||"",
                thumbnail:v.thumbnail_url||
                "assets/images/video-placeholder.png",
                video:v.video_url||"",
                likes:v.likes||0,
                views:v.views||0,
                comments:v.comments||0,
                liked:v.liked||false,
                likedBy:v.liked?[this.currentUsername]:[]
            }));

        }

    }
    catch(e){
        console.log("User videos API failed");
    }

}

if(allVideos.length===0){

    const savedVideos=
    JSON.parse(localStorage.getItem("CloudTokVideos")||"[]");

    const builtIn=CloudTokDatabase.videos||[];

    const all=[...savedVideos,...builtIn.filter(video=>
        !savedVideos.some(saved=>saved.id===video.id)
    )];

    allVideos=all.filter(video=>
        String(video.username).replace(/^@+/,"").trim().toLowerCase()===
        String(this.currentUsername).toLowerCase()
    );

}

this.videos=allVideos;

let totalLikes=0;

this.videos.forEach(video=>{
    totalLikes+=video.likes||0;
});

document.getElementById("likesCount").textContent=totalLikes;
document.getElementById("videosCount").textContent=this.videos.length;

const currentUser =

CloudTokUsers.getCurrentUser();


const isOwner =

currentUser &&

currentUser.username === this.user.username;


const isFollower =

currentUser &&

(currentUser.following || [])

.includes(
this.user.username
);


if(

this.user.privacy &&
this.user.privacy.privateAccount &&
!isOwner &&
!isFollower

){

this.renderGrid([]);

}
else{

this.renderGrid(
this.videos
);

}

}

renderGrid(list){

this.grid.innerHTML="";

if(!list || list.length===0){

    const currentUser =
    CloudTokUsers.getCurrentUser();

    const isOwner =

    currentUser &&

    currentUser.username ===
    this.user.username;

    const isFollower =

    currentUser &&

    (currentUser.following || [])
    .includes(this.user.username);

    if(

    this.user.privacy &&
    this.user.privacy.privateAccount &&
    !isOwner &&
    !isFollower

    ){

        this.grid.innerHTML=`

        <div class="emptyProfile">

        <h3>🔒 Private Account</h3>

        <p>
        Follow this user to view their videos.
        </p>

        </div>

        `;

    }
    else{

        this.grid.innerHTML=`

        <div class="emptyProfile">

        <h3>No videos yet</h3>

        <p>Upload your first video.</p>

        </div>

        `;

    }

    return;

}

list.forEach(video=>{

const card=
document.createElement("div");

card.className="profileVideo";

card.innerHTML=`

<img
src="${video.thumbnail || "assets/images/video-placeholder.png"}"
loading="lazy">

<div class="videoViews">

▶ ${video.views || 0}

</div>

`;

card.onclick=()=>{

window.location.href=
"watch.html?id="+video.id;

};

this.grid.appendChild(card);

});

}






setupTabs(){

const tabs=
document.querySelectorAll(".profileTab");

tabs.forEach(tab=>{

tab.onclick=()=>{

tabs.forEach(button=>
button.classList.remove("active")
);

tab.classList.add("active");

switch(tab.id){

case "videosTab":

this.renderGrid(this.videos);

break;

case "likedTab":

this.showLikedVideos();

break;

case "savedTab":

this.showSavedVideos();

break;

}

};

});

}






async showLikedVideos(){

let videos=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getLikedVideos();

        if(result.videos && result.videos.length>0){

            const seen=new Set();
            videos=result.videos.filter(v=>{
                if(seen.has(v.id))return false;
                seen.add(v.id);
                return true;
            }).map(v=>({
                id:v.id,
                username:v.username,
                caption:v.caption||"",
                thumbnail:v.thumbnail_url||
                "assets/images/video-placeholder.png",
                video:v.video_url||"",
                likes:v.likes||0,
                views:v.views||0,
                liked:true,
                likedBy:[this.currentUsername]
            }));

        }

    }
    catch(e){
        console.log("Liked videos API failed");
    }

}

if(videos.length===0){

    const all=[
        ...(CloudTokDatabase.videos || []),
        ...JSON.parse(localStorage.getItem("CloudTokVideos") || "[]")
    ];

    const currentUser=localStorage.getItem("CloudTokCurrentUser")||"";
    const normalizedCurrentUser=currentUser.replace(/^@+/,"").trim().toLowerCase();

    const seenIds=new Set();
    videos=all.filter(video=>{
        if(seenIds.has(video.id))return false;
        let isLiked=false;
        if(video.liked===true) isLiked=true;
        const likedBy=video.likedBy||[];
        if(likedBy.some(u=>{
            const nu=String(u).replace(/^@+/,"").trim().toLowerCase();
            return nu===normalizedCurrentUser;
        })) isLiked=true;
        if(isLiked){
            seenIds.add(video.id);
            return true;
        }
        return false;
    });

}

this.renderGrid(videos);

}






async showSavedVideos(){

let videos=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getSavedVideos();

        if(result.videos){

            videos=result.videos.map(v=>({
                id:v.id,
                username:v.username,
                caption:v.caption||"",
                thumbnail:v.thumbnail_url||
                "assets/images/video-placeholder.png",
                video:v.video_url||"",
                likes:v.likes||0,
                views:v.views||0
            }));

        }

    }
    catch(e){
        console.log("Saved videos API failed");
    }

}

if(videos.length===0){

    const saved=
    JSON.parse(localStorage.getItem("CloudTokSavedVideos")||"[]");

    const ids=
    saved.filter(item=>item.username===this.user.username)
    .map(item=>String(item.videoId));

    const all=[...(CloudTokDatabase.videos||[]),
    ...JSON.parse(localStorage.getItem("CloudTokVideos")||"[]")];

    videos=all.filter(video=>ids.includes(String(video.id)));

}

this.renderGrid(videos);

}

    setupProfileMode(){

const followBtn =
document.getElementById(
"followBtn"
);


const settingsBtn =
document.getElementById(
"settingsBtn"
);

const adminBtn =
document.getElementById("adminBtn");

const changeAvatarBtn =
document.getElementById("changeAvatarBtn");

const currentUser =

(localStorage.getItem(
"CloudTokCurrentUser"
)

||

"")

.replace(/^@+/,"")

.trim()

.toLowerCase();



const profileUser =

String(this.user.username)

.replace(/^@+/,"")

.trim()

.toLowerCase();





if(currentUser === profileUser){


/*
Own profile
*/


if(followBtn){

followBtn.style.display =
"none";

}


if(settingsBtn){

settingsBtn.style.display =
"block";

}

if(adminBtn){
adminBtn.style.display =
(this.user.role==="admin")?"block":"none";
adminBtn.onclick=()=>{
    window.location.href="admin.html";
};
}

if(changeAvatarBtn){

changeAvatarBtn.style.display = "block";

}

}

else{


/*
Other user's profile
*/


if(followBtn){

followBtn.style.display =
"block";

this.updateFollowButton();

}



if(settingsBtn){

settingsBtn.style.display =
"none";

}

if(adminBtn){
adminBtn.style.display="none";
}

if(changeAvatarBtn){

changeAvatarBtn.style.display = "none";

}

}



}

setupButtons(){

    const followersStat =
document.getElementById(
"followersStat"
);


if(followersStat){

followersStat.onclick=()=>{


window.location.href =

"followers.html?user="

+

encodeURIComponent(
this.user.username
);


};

}



const followingStat =
document.getElementById(
"followingStat"
);


if(followingStat){

followingStat.onclick=()=>{


window.location.href =

"following.html?user="

+

encodeURIComponent(
this.user.username
);


};

}
    
const backBtn=
document.getElementById("backBtn");

if(backBtn){

backBtn.onclick=()=>history.back();

}

    const shareBtn =
document.getElementById(
"shareProfileBtn"
);


if(shareBtn){

shareBtn.onclick=()=>{

this.shareProfile();

};

}
    
const settingsBtn=
document.getElementById("settingsBtn");

const settingsSidebar=
document.getElementById("settingsSidebar");

const closeSettingsBtn=
document.getElementById("closeSettingsBtn");

if(settingsBtn && settingsSidebar){

settingsBtn.onclick=()=>{

settingsSidebar.classList.add("open");

};

}

if(closeSettingsBtn){

closeSettingsBtn.onclick=()=>{

settingsSidebar.classList.remove("open");

};

}

const editBtn=
document.getElementById("editProfileBtn");

if(editBtn){

editBtn.onclick=()=>{

this.openAccountSheet();

};

}

const accountBtn=
document.getElementById("accountSettingsBtn");

if(accountBtn){

accountBtn.onclick=()=>{

this.openAccountSheet();

settingsSidebar.classList.remove("open");

};

}
    
const closeAccountBtn=
document.getElementById("closeAccountBtn");

if(closeAccountBtn){

closeAccountBtn.onclick=()=>{

document

.getElementById("accountSheet")

.classList.remove("open");

};

}
    
    const privacyBtn =
document.getElementById("privacyBtn");

if(privacyBtn){

    privacyBtn.onclick=()=>{

        this.openPrivacySheet();

        settingsSidebar.classList.remove("open");

    };

}
    
    const appearanceBtn =
document.getElementById("appearanceBtn");

if(appearanceBtn){

    appearanceBtn.onclick=()=>{

        this.openAppearanceSheet();

        settingsSidebar.classList.remove("open");

    };

}
    
    const closeAppearanceBtn =
document.getElementById("closeAppearanceBtn");


if(closeAppearanceBtn){

    closeAppearanceBtn.onclick=()=>{

        document
        .getElementById("appearanceSheet")
        .classList.remove("open");

    };

}
    
    const saveAppearanceBtn =
document.getElementById("saveAppearanceBtn");


if(saveAppearanceBtn){

    saveAppearanceBtn.onclick=()=>{

        this.saveAppearance();

    };

}
    
    const notificationsBtn =
document.getElementById("notificationsBtn");


if(notificationsBtn){

    notificationsBtn.onclick=()=>{


        window.location.href =
        "notifications.html";


    };

}


const closeNotificationsBtn =
document.getElementById("closeNotificationsBtn");


if(closeNotificationsBtn){

    closeNotificationsBtn.onclick=()=>{

        document
        .getElementById("notificationsSheet")
        .classList.remove("open");

    };

}


const saveNotificationsBtn =
document.getElementById("saveNotificationsBtn");


if(saveNotificationsBtn){

    saveNotificationsBtn.onclick=()=>{

        this.saveNotifications();

    };

}
    
    const closePrivacyBtn =
document.getElementById("closePrivacyBtn");

if(closePrivacyBtn){

    closePrivacyBtn.onclick=()=>{

        document
        .getElementById("privacySheet")
        .classList.remove("open");

    };

}
    
    const savePrivacyBtn =
document.getElementById("savePrivacyBtn");

if(savePrivacyBtn){

    savePrivacyBtn.onclick=()=>{

        this.savePrivacy();

    };

}
    
const logoutBtn =
document.getElementById(
"logoutBtn"
);


if(logoutBtn){

logoutBtn.onclick=()=>{

CloudTokAuthGuard.logout();

};

}

const saveBtn=
document.getElementById("saveAccountBtn");

if(saveBtn){

saveBtn.onclick=()=>{

this.saveAccount();

};

}

    const followBtn =
document.getElementById(
"followBtn"
);


if(followBtn){

followBtn.onclick=()=>{

if(
!CloudTokAuthGuard.requireLogin()
){

return;

}


this.toggleFollow();

};

}
    
this.setupAvatarButtons();

}






openAccountSheet(){

this.fillAccountForm();

document

.getElementById("accountSheet")

.classList.add("open");

}






fillAccountForm(){

document.getElementById("accountDisplayName").value=
this.user.displayName || "";

document.getElementById("accountUsername").value=
this.user.username || "";

document.getElementById("accountBio").value=
this.user.bio || "";

document.getElementById("accountWebsite").value=
this.user.website || "";

document.getElementById("accountEmail").value=
this.user.email || "";

document.getElementById("accountAvatarPreview").src=
this.user.avatar;

}






setupAvatarButtons(){

const avatarButton=
document.getElementById("changeAvatarBtn");

const avatarInput=
document.getElementById("avatarInput");

if(avatarButton && avatarInput){

avatarButton.onclick=()=>avatarInput.click();

avatarInput.onchange=(e)=>{

this.changeAvatar(e.target.files[0]);

};

}

const accountButton=
document.getElementById("accountChangePhotoBtn");

const accountInput=
document.getElementById("accountAvatarPicker");

if(accountButton && accountInput){

accountButton.onclick=()=>accountInput.click();

accountInput.onchange=(e)=>{

this.changeAvatar(e.target.files[0],true);

};

}

}






async changeAvatar(file,preview=false){

if(!file){

return;

}

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.updateAvatar(file);

        if(result.success && result.avatar){

            this.user.avatar=result.avatar;

            const profileAvatar=
            document.getElementById("profileAvatar");

            if(profileAvatar){
                profileAvatar.src=result.avatar;
            }

            if(preview){
                const previewImage=
                document.getElementById("accountAvatarPreview");
                if(previewImage){
                    previewImage.src=result.avatar;
                }
            }

            return;

        }

    }
    catch(e){
        console.log("Avatar API failed, using local");
    }

}

const reader = new FileReader();

reader.onload = (e)=>{

this.user.avatar = e.target.result;

const profileAvatar =
document.getElementById("profileAvatar");

if(profileAvatar){
    profileAvatar.src = e.target.result;
}

if(preview){
    const previewImage =
    document.getElementById("accountAvatarPreview");
    if(previewImage){
        previewImage.src = e.target.result;
    }
}

const users =
JSON.parse(localStorage.getItem("CloudTokUsers")||"[]");

const index =
users.findIndex(user=>user.id===this.user.id);

if(index !== -1){
    users[index] = this.user;
    localStorage.setItem("CloudTokUsers",JSON.stringify(users));
}

};

reader.readAsDataURL(file);

}


async saveAccount(){

this.user.displayName=
document.getElementById("accountDisplayName").value.trim();

this.user.username=
document.getElementById("accountUsername").value
.replace(/^@+/,"")
.trim();

this.user.bio=
document.getElementById("accountBio").value.trim();

this.user.website=
document.getElementById("accountWebsite").value.trim();

this.user.email=
document.getElementById("accountEmail").value.trim();


if(typeof CloudTokAPI!=="undefined"){

    try{

        await CloudTokAPI.updateProfile(
            this.user.displayName,
            this.user.bio,
            this.user.website
        );

    }
    catch(e){
        console.log("Profile update API failed");
    }

}


const users=

JSON.parse(

localStorage.getItem("CloudTokUsers")

||

"[]"

);

const index=

users.findIndex(user=>

user.id===this.user.id

);

if(index!==-1){

users[index]=this.user;

localStorage.setItem(

"CloudTokUsers",

JSON.stringify(users)

);

}

localStorage.setItem(

"CloudTokCurrentUser",

this.user.username

);

this.updateProfileUI();

document

.getElementById("accountSheet")

.classList.remove("open");

}

    updateFollowButton(){

const followBtn =
document.getElementById(
"followBtn"
);


if(!followBtn){

return;

}


const currentUser =

(localStorage.getItem(
"CloudTokCurrentUser"
)

||

"")

.replace("@","")

.toLowerCase();



let isFollowing=false;

if(typeof CloudTokUsers!=="undefined"){
    const currentUserData=CloudTokUsers.getCurrentUser();
    if(currentUserData&&currentUserData.following){
        isFollowing=currentUserData.following.includes(
            this.user.username.replace("@","").toLowerCase()
        );
    }
}


followBtn.textContent =

isFollowing

?

"Following"

:

"Follow";


}
    
    async toggleFollow(){

if(
!CloudTokAuthGuard.requireLogin()
){

return;

}


const username =
this.user.username.replace("@","").toLowerCase();


const currentUserData =
CloudTokUsers.getCurrentUser();


if(!currentUserData){

return;

}



const isFollowing=
(currentUserData.following||[]).includes(username);

if(isFollowing){

    await CloudTokUsers.unfollow(username);
    if(typeof this.user.followers==="number"){
        this.user.followers=Math.max(0,this.user.followers-1);
    }

}
else{

    await CloudTokUsers.follow(username);
    if(typeof this.user.followers==="number"){
        this.user.followers=this.user.followers+1;
    }

}



this.updateProfileUI();

this.updateFollowButton();


}
    
    shareProfile(){


const username =
this.user.username
.replace("@","");



const link =

window.location.origin +

window.location.pathname.replace(
"profile.html",
""
)

+

"profile.html?user="

+

encodeURIComponent(
username
);



if(
navigator.share
){


navigator.share({

title:
"CloudTok Profile",

text:
"Check out this CloudTok profile",

url:
link


})

.catch(()=>{});


}
else{


navigator.clipboard.writeText(
link
);


alert(
"Profile link copied"
);


}



}
    
    openPrivacySheet(){

    document.getElementById(
"privateAccountToggle"
).checked =
this.user.privacy.privateAccount;

document.getElementById(
"allowCommentsToggle"
).checked =
this.user.privacy.allowComments;

document.getElementById(
"allowDownloadsToggle"
).checked =
this.user.privacy.allowDownloads;

document.getElementById(
"onlineStatusToggle"
).checked =
this.user.privacy.showOnlineStatus;

    document
    .getElementById("privacySheet")
    .classList.add("open");

}
    openNotificationsSheet(){

document.getElementById(
"videoNotificationToggle"
).checked =

this.user.notifications.videoUploads;


document.getElementById(
"commentNotificationToggle"
).checked =

this.user.notifications.comments;


document.getElementById(
"likeNotificationToggle"
).checked =

this.user.notifications.likes;


document.getElementById(
"followerNotificationToggle"
).checked =

this.user.notifications.followers;



document

.getElementById(
"notificationsSheet"
)

.classList.add("open");

}
    
    savePrivacy(){

    this.user.privacy.privateAccount =

document.getElementById(
"privateAccountToggle"
).checked;

this.user.privacy.allowComments =

document.getElementById(
"allowCommentsToggle"
).checked;

this.user.privacy.allowDownloads =

document.getElementById(
"allowDownloadsToggle"
).checked;

this.user.privacy.showOnlineStatus =

document.getElementById(
"onlineStatusToggle"
).checked;

    const users =

    JSON.parse(

    localStorage.getItem(
    "CloudTokUsers"
    ) || "[]"

    );

    const index =

    users.findIndex(

    user => user.id === this.user.id

    );

    if(index !== -1){

        users[index] = this.user;

    }

    localStorage.setItem(

    "CloudTokUsers",

    JSON.stringify(users)

    );

    document
    .getElementById("privacySheet")
    .classList.remove("open");

}
    
    openNotificationsSheet(){

    if(!this.user.notifications){

        this.user.notifications = {

            videoUploads:true,

            comments:true,

            likes:true,

            followers:true

        };

    }


    document.getElementById(
    "videoNotificationToggle"
    ).checked =
    this.user.notifications.videoUploads;


    document.getElementById(
    "commentNotificationToggle"
    ).checked =
    this.user.notifications.comments;


    document.getElementById(
    "likeNotificationToggle"
    ).checked =
    this.user.notifications.likes;


    document.getElementById(
    "followerNotificationToggle"
    ).checked =
    this.user.notifications.followers;



    document
    .getElementById("notificationsSheet")
    .classList.add("open");

}





saveNotifications(){


    this.user.notifications = {


        videoUploads:

        document.getElementById(
        "videoNotificationToggle"
        ).checked,


        comments:

        document.getElementById(
        "commentNotificationToggle"
        ).checked,


        likes:

        document.getElementById(
        "likeNotificationToggle"
        ).checked,


        followers:

        document.getElementById(
        "followerNotificationToggle"
        ).checked


    };



    const users =

    JSON.parse(

        localStorage.getItem(
        "CloudTokUsers"
        ) || "[]"

    );



    const index =

    users.findIndex(

        user =>

        user.id === this.user.id

    );



    if(index !== -1){

        users[index] = this.user;

    }



    localStorage.setItem(

        "CloudTokUsers",

        JSON.stringify(users)

    );



    document

    .getElementById("notificationsSheet")

    .classList.remove("open");

}
    
  openAppearanceSheet(){

    const savedTheme =
    localStorage.getItem(
    "CloudTokTheme"
    )
    ||
    "dark";


    if(savedTheme === "light"){

        document.getElementById(
        "lightModeToggle"
        ).checked = true;

    }
    else{

        document.getElementById(
        "darkModeToggle"
        ).checked = true;

    }


    document
    .getElementById("appearanceSheet")
    .classList.add("open");

}  
    
  saveAppearance(){

    let theme = "dark";


    if(
    document.getElementById("lightModeToggle").checked
    ){

        theme = "light";

    }


    localStorage.setItem(
        "CloudTokTheme",
        theme
    );


    this.applyTheme(theme);


    document
    .getElementById("appearanceSheet")
    .classList.remove("open");

}  
    
    applyTheme(theme){

    if(theme === "light"){

        document.body.classList.add("lightTheme");
        document.body.classList.remove("darkTheme");

    }
    else{

        document.body.classList.add("darkTheme");
        document.body.classList.remove("lightTheme");

    }

}
    
    loadTheme(){

    const theme =
    localStorage.getItem(
        "CloudTokTheme"
    )
    ||
    "dark";


    this.applyTheme(theme);


    if(theme === "light"){

        document.getElementById(
            "lightModeToggle"
        ).checked = true;

    }
    else{

        document.getElementById(
            "darkModeToggle"
        ).checked = true;

    }

}
    
    
    
    
    
    
    
    
    
    
    
    
    
}

document.addEventListener(

"DOMContentLoaded",

()=>{

new CloudTokProfile();

}

);

