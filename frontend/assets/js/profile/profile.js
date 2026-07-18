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

this.loadUser();

this.loadVideos();

this.updateProfileUI();

this.setupProfileMode();

this.setupButtons();

this.setupTabs();
this.loadTheme();
    
}





loadUser(){

if(typeof CloudTokUsers !== "undefined"){

this.user =
CloudTokUsers.find(
this.currentUsername
);

}


if(this.user){

    if(!this.user.privacy){

        this.user.privacy={

            privateAccount:false,

            allowComments:true,

            allowDownloads:true,

            showOnlineStatus:true

        };

    }

    if(!this.user.notifications){

    this.user.notifications={

        videoUploads:true,

        comments:true,

        likes:true,

        followers:true

    };

}
    
    return;

}


this.user={

id:Date.now(),

displayName:
this.currentUsername ||

"User",

username:
this.currentUsername ||

"user",

email:"",

password:"",

avatar:
"assets/images/default-avatar.png",

bio:"",

website:"",

followers:[],

following:[],

likes:0,

verified:false

};


if(typeof CloudTokUsers !== "undefined"){

CloudTokUsers.users.push(
this.user
);

CloudTokUsers.save();

}

}






updateProfileUI(){

document.getElementById(
"displayName"
).textContent=

this.user.displayName;

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

(this.user.followers || []).length;

document.getElementById(
"followingCount"
).textContent=

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






loadVideos(){

const savedVideos=

JSON.parse(

localStorage.getItem(
"CloudTokVideos"
)

||

"[]"

);

const builtIn=

CloudTokDatabase.videos

||

[];

const all=[

...savedVideos,

...builtIn.filter(video=>

!savedVideos.some(

saved=>

saved.id===video.id

)

)

];

this.videos=

all.filter(video=>

String(video.username)

.replace(/^@+/,"")

.trim()

.toLowerCase()

===

String(this.user.username)
.toLowerCase()

);

let totalLikes=0;

this.videos.forEach(video=>{

totalLikes+=

video.likes || 0;

});

document.getElementById(
"likesCount"
).textContent=

totalLikes;

document.getElementById(
"videosCount"
).textContent=

this.videos.length;

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






showLikedVideos(){

const all=[

...(CloudTokDatabase.videos || []),

...JSON.parse(

localStorage.getItem("CloudTokVideos")

||

"[]"

)

];

const liked=

all.filter(video=>

(video.likedBy || [])

.includes(this.user.username)

);

this.renderGrid(liked);

}






showSavedVideos(){

const saved=

JSON.parse(

localStorage.getItem(
"CloudTokSavedVideos"
)

||

"[]"

);

const ids=

saved

.filter(item=>

item.username===this.user.username

)

.map(item=>

String(item.videoId)

);

const all=[

...(CloudTokDatabase.videos || []),

...JSON.parse(

localStorage.getItem("CloudTokVideos")

||

"[]"

)

];

const videos=

all.filter(video=>

ids.includes(

String(video.id)

)

);

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






changeAvatar(file,preview=false){

if(!file){

return;

}

const reader =
new FileReader();


reader.onload = (e)=>{


this.user.avatar = e.target.result;


// Update visible profile image

const profileAvatar =
document.getElementById("profileAvatar");


if(profileAvatar){

profileAvatar.src =
e.target.result;

}


// Update account settings preview

if(preview){

const previewImage =
document.getElementById("accountAvatarPreview");


if(previewImage){

previewImage.src =
e.target.result;

}

}


// SAVE USER DATA

const users =

JSON.parse(

localStorage.getItem("CloudTokUsers")

||

"[]"

);



const index =

users.findIndex(

user =>

user.id === this.user.id

);



if(index !== -1){

users[index] = this.user;


localStorage.setItem(

"CloudTokUsers",

JSON.stringify(users)

);

}


// update global memory

if(typeof CloudTokUsers !== "undefined"){

const globalIndex =

CloudTokUsers.users.findIndex(

user =>

user.id === this.user.id

);


if(globalIndex !== -1){

CloudTokUsers.users[globalIndex] =
this.user;

}


}


};


reader.readAsDataURL(file);

}


saveAccount(){

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

const password=

document.getElementById("accountPassword").value.trim();

if(password){

this.user.password=password;

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

users[index]=this.user;

localStorage.setItem(

"CloudTokUsers",

JSON.stringify(users)

);

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



const followers =

(this.user.followers || [])

.map(user=>

String(user)
.replace("@","")
.toLowerCase()

);



followBtn.textContent =

followers.includes(currentUser)

?

"Following"

:

"Follow";


}
    
    toggleFollow(){

if(
!CloudTokAuthGuard.requireLogin()
){

return;

}


const username =
this.user.username;
        
const current =
CloudTokUsers.getCurrentUser();


if(!current){

return;

}



if(

current.following.includes(
username

)

){

CloudTokUsers.unfollow(
username
);


}
else{


CloudTokUsers.follow(
username
);


}



this.user =
CloudTokUsers.find(
username
);



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

