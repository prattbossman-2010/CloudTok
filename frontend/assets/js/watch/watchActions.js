class CloudTokWatchActions{


constructor(video){


this.video = video;
    
this.currentUser =
localStorage.getItem(
"CloudTokCurrentUser"
)
||
"PrattBossman";



this.setupElements();
this.loadUploaderAvatar();

this.loadState();



this.setupEvents();



}







setupElements(){



this.profileBtn =
document.getElementById(
"watchProfileBtn"
);

this.followBtn =
document.getElementById(
"followUserBtn"
);
    
this.profileAvatar =
document.getElementById(
"watchUploaderAvatar"
);

this.followPlus =
document.querySelector(
".followPlus"
);

this.likeBtn =
document.getElementById(
"watchLikeBtn"
);



this.commentBtn =
document.getElementById(
"watchCommentBtn"
);

this.commentCount =
document.getElementById(
"watchCommentCount"
);

this.shareBtn =
document.getElementById(
"watchShareBtn"
);



this.saveBtn =
document.getElementById(
"watchSaveBtn"
);



this.likeCount =
document.getElementById(
"watchLikeCount"
);



}
    
    loadUploaderAvatar(){

    if(!this.profileAvatar){

        return;

    }


    let avatar =
    "assets/images/default-avatar.png";


    if(
        typeof CloudTokUserManager !== "undefined"
    ){

        avatar =
        CloudTokUserManager.getAvatar(
            this.video.username
        );

    }


    this.profileAvatar.src =
    avatar;


    this.profileAvatar.onerror = ()=>{

        this.profileAvatar.src =
        "assets/images/default-avatar.png";

    };

}

loadState(){



if(!this.video.likedBy){


this.video.likedBy=[];


}



if(!this.video.savedBy){


this.video.savedBy=[];


}







this.isLiked =
this.video.likedBy.includes(
this.currentUser
);




this.isSaved =
this.video.savedBy.includes(
this.currentUser
);



this.updateUI();

this.updateFollowUI();

}









setupEvents(){





if(this.likeBtn){



this.likeBtn.onclick = ()=>{


this.toggleLike();



};


}

if(this.saveBtn){



this.saveBtn.onclick = ()=>{


this.toggleSave();
};


}

if(this.shareBtn){

    this.shareBtn.onclick = async ()=>{

        const link =
        getVideoShareLink(this.video.id);

        this.video.shares =
        (this.video.shares || 0) + 1;

        this.saveDatabase();

        try{

            if(navigator.share){

                await navigator.share({

                    title:"CloudTok",

                    text:this.video.caption,

                    url:link

                });

            }
            else{

                await navigator.clipboard.writeText(link);

                alert("Video link copied.");

            }

        }
        catch(error){

            console.log("Share cancelled.");

        }

    };

}







if(this.commentBtn){


this.commentBtn.onclick = ()=>{


if(
!CloudTokAuthGuard.requireLogin(
"comments",
{
videoId:this.video.id
}
)

){

return;

}



this.openComments();



};


}



if(this.profileBtn){



this.profileBtn.onclick = ()=>{


this.openProfile();



};


}

if(this.followBtn){

this.followBtn.onclick = (e)=>{

e.stopPropagation();

this.toggleFollow();

};

}

}









toggleLike(){

if(
!CloudTokAuthGuard.requireLogin()
){

return;

}

if(this.isLiked){



this.video.likedBy =
this.video.likedBy.filter(
user =>
user !== this.currentUser
);



this.video.likes =
Math.max(
0,
(this.video.likes||0)-1
);



}

else{



this.video.likedBy.push(
this.currentUser
);



this.video.likes =
(this.video.likes||0)+1;



}





this.isLiked =
!this.isLiked;



this.saveDatabase();



this.updateUI();



}









toggleSave(){

if(
!CloudTokAuthGuard.requireLogin()
){

return;

}

if(this.isSaved){



this.video.savedBy =
this.video.savedBy.filter(
user =>
user !== this.currentUser
);



}

else{



this.video.savedBy.push(
this.currentUser
);



}



this.isSaved =
!this.isSaved;



this.saveDatabase();



this.updateUI();



}
updateUI(){

if(this.commentCount){

this.commentCount.textContent =
this.video.comments
?
this.video.comments.length
:
0;

}

if(this.likeBtn){

    if(this.isLiked){

        this.likeBtn.classList.add(
            "liked"
        );

    }
    else{

        this.likeBtn.classList.remove(
            "liked"
        );

    }

}


const heartIcon =
document.getElementById(
    "watchHeartIcon"
);


if(heartIcon){

    heartIcon.src =

    this.isLiked

    ?

    "assets/icons/solid/heart.svg"

    :

    "assets/icons/outline/heart.svg";

}






const bookmarkIcon =
document.getElementById(
    "watchBookmarkIcon"
);


if(bookmarkIcon){

    bookmarkIcon.src =

    this.isSaved

    ?

    "assets/icons/solid/bookmark-solid.svg"

    :

    "assets/icons/outline/bookmark-outline.svg";


    if(this.isSaved){

        bookmarkIcon.classList.add(
            "bookmarkSaved"
        );

    }
    else{

        bookmarkIcon.classList.remove(
            "bookmarkSaved"
        );

    }

}


if(this.likeCount){



this.likeCount.textContent =

this.video.likes || 0;



}



}









saveDatabase(){



const index =
CloudTokDatabase.videos.findIndex(

video =>

video.id === this.video.id

);



if(index !== -1){



CloudTokDatabase.videos[index] =
this.video;



}





try{



localStorage.setItem(

"CloudTokVideos",

JSON.stringify(
CloudTokDatabase.videos
)

);



}

catch(error){



console.log(
"DATABASE SAVE ERROR:",
error
);



}



}









openComments(){


if(typeof WatchComments !== "undefined"
&&
WatchComments){


WatchComments.open();


}

else{


console.log(
"COMMENTS NOT READY"
);


}


}
    
toggleFollow(){


if(
!CloudTokAuthGuard.requireLogin()
){

return;

}



const uploaderUsername =
this.video.username.replace("@","");



const currentUsername =
this.currentUser.replace("@","");



const users =
JSON.parse(

localStorage.getItem(
"CloudTokUsers"
)

||

"[]"

);




const uploader =
users.find(

user =>

user.username.replace("@","").toLowerCase()

===

uploaderUsername.toLowerCase()

);




const current =
users.find(

user =>

user.username.replace("@","").toLowerCase()

===

currentUsername.toLowerCase()

);





if(!uploader || !current){

return;

}





if(!uploader.followers){

uploader.followers=[];

}



if(!current.following){

current.following=[];

}






const index =
uploader.followers.indexOf(
current.username
);





if(index === -1){

    CloudTokUsers.follow(uploader.username);

}
else{

    CloudTokUsers.unfollow(uploader.username);

}



this.updateFollowUI();



}

  updateFollowUI(){


const uploaderUsername =
this.video.username.replace("@","").toLowerCase();


const currentUsername =
this.currentUser.replace("@","").toLowerCase();



const users =
JSON.parse(

localStorage.getItem(
"CloudTokUsers"
)

||

"[]"

);



const uploader =
users.find(

user =>

user.username
.replace("@","")
.toLowerCase()

===

uploaderUsername

);



if(!uploader){

return;

}




const followers =
(uploader.followers || [])
.map(
user=>
user.replace("@","").toLowerCase()
);



const isFollowing =
followers.includes(
currentUsername
);





if(this.followBtn){


this.followBtn.textContent =

isFollowing

?

"✓"

:

"+";


}



}
    
openProfile(){



window.location.href =

"profile.html?user="

+

encodeURIComponent(

this.video.username.replace("@","")

);



}



}









let WatchActions = null;







function loadWatchActions(videoId){



const video =

CloudTokDatabase.videos.find(

v=>v.id === videoId

);



if(!video){


console.log(
"VIDEO NOT FOUND FOR ACTIONS"
);


return;


}



WatchActions =
new CloudTokWatchActions(
video
);



}    