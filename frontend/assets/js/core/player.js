class VideoCard{


constructor(videoData){


    this.data = videoData;


    this.element = null;

    this.card = null;


    this.video = null;

    this.thumbnail = null;

    this.loader = null;

    this.controlIcon = null;


    this.likeBtn = null;

    this.likeCount = null;

    this.commentBtn = null;
    this.commentCount = null;
    
    this.shareBtn = null;

    this.saveBtn = null;

    this.profileBtn = null;



    this.likes =
    videoData.likes || 0;


    this.isLiked =
hasLikedVideo(
    videoData.id
);

this.isSaved =
hasSavedVideo(
    this.data.id
);

    

    this.userPaused = false;
this.viewTimer = null;

this.viewCounted = false;
    this.watchStart = 0;
    this.observer = null;


    this.destroyed = false;



    this.createCard();



    this.setupVideoObserver();



}






createCard(){


    const card =
    document.createElement("div");


    card.className =
    "videoCard";


    this.card = card;


    this.element = card;





    const videoContainer =
    document.createElement("div");


    videoContainer.className =
    "videoContainer";





    /*
        THUMBNAIL
    */


    this.thumbnail =
    document.createElement("img");


    this.thumbnail.className =
    "videoThumbnail";


    this.thumbnail.src =
    this.data.thumbnail || "";






    /*
        VIDEO
    */


    this.video =
    document.createElement("video");


    this.video.loop = true;


    this.video.muted = true;


    this.video.autoplay = false;


    this.video.playsInline = true;


    this.video.preload = "metadata";


    this.video.setAttribute(
        "disablePictureInPicture",
        "true"
    );





    const source =
    document.createElement("source");


    source.src =
    this.data.video;


    source.type =
    "video/mp4";


    this.video.appendChild(
        source
    );







    /*
        LOADER
    */


    this.loader =
    document.createElement("div");


    this.loader.className =
    "videoLoader";


    this.loader.textContent =
    "⏳";







    /*
        PLAY ICON
    */


    this.controlIcon =
    document.createElement("div");


    this.controlIcon.className =
    "videoControlIcon";


    this.controlIcon.textContent =
    "▶";







    videoContainer.appendChild(
        this.thumbnail
    );


    videoContainer.appendChild(
        this.video
    );


    videoContainer.appendChild(
        this.loader
    );


    videoContainer.appendChild(
        this.controlIcon
    );



    card.appendChild(
        videoContainer
    );



    this.createMenus(card);



    this.setupVideoEvents();


    this.setupTapControl();



}
    
createMenus(card){


    const rightMenu =
    document.createElement("div");


    rightMenu.className =
    "rightMenu";





    const createAction =
    (className, icon, count=null)=>{


        const wrapper =
        document.createElement("div");


        wrapper.className =
        "actionButton";



        const button =
        document.createElement("button");


        button.className =
        className;


        button.innerHTML =
icon;



        wrapper.appendChild(
            button
        );



        let span = null;



        if(count !== null){


            span =
            document.createElement("span");


            span.textContent =
            count;


            wrapper.appendChild(
                span
            );


        }



        return {

            wrapper,

            button,

            span

        };


    };








const profile =
createAction(
    "profileBtn",
    `
    <div class="followProfileIcon">

        <img
        src="${this.data.avatar || "assets/images/default-avatar.png"}"
        class="videoProfileIcon"
        onerror="this.src='assets/images/default-avatar.png'">

    </div>
    `
);


    const like =
createAction(
    "likeBtn",
    "",
    this.likes
);



    const comment =
    createAction(
        "commentBtn",
        "💬",
        this.data.comments ?
        this.data.comments.length :
        0
    );



    const share =
createAction(
    "shareBtn",
    `<img src="assets/icons/solid/share.svg" class="actionIcon">`
);



  const save =
createAction(
    "saveBtn",
    `<img src="assets/icons/outline/bookmark-outline.svg" class="actionIcon">`
);






    rightMenu.appendChild(
        profile.wrapper
    );

    profile.wrapper.classList.add(
    "profileAction"
);
    
    profile.wrapper.style.width = "52px";
profile.wrapper.style.height = "64px";

const followButton =
document.createElement("button");

followButton.className =
"followPlus";

profile.wrapper.appendChild(
    followButton
);

    rightMenu.appendChild(
        like.wrapper
    );


    rightMenu.appendChild(
        comment.wrapper
    );


    rightMenu.appendChild(
        share.wrapper
    );


    rightMenu.appendChild(
        save.wrapper
    );




    card.appendChild(
        rightMenu
    );







    /*
        SAVE REFERENCES
    */


    this.profileBtn =
    profile.button;

    this.followPlus =
followButton;

this.updateFollowButton();

    this.likeBtn =
    like.button;

    const heartIcon =
document.createElement("img");

heartIcon.className =
"likeIcon";

heartIcon.src =
this.isLiked
?
"assets/icons/solid/heart.svg"
:
"assets/icons/outline/heart.svg";

this.likeBtn.appendChild(
    heartIcon
);

this.heartIcon =
heartIcon;

    this.likeCount =
    like.span;


    this.commentBtn =
    comment.button;
    
    this.commentCount =
    comment.span;

    this.shareBtn =
    share.button;


    this.saveBtn =
    save.button;
    
    const bookmarkIcon =
this.saveBtn.querySelector("img");

this.bookmarkIcon =
bookmarkIcon;

this.updateSave();





    /*
        BOTTOM VIDEO INFO
    */


    const bottomInfo =
    document.createElement("div");


    bottomInfo.className =
    "bottomInfo";





    const profileArea =
    document.createElement("div");


    profileArea.className =
    "profileArea";





    const avatar =
    document.createElement("img");


    avatar.className =
    "videoAvatar";




    if(
        typeof CloudTokUserManager !== "undefined"
    ){


        avatar.src =
        CloudTokUserManager.getAvatar(
            this.data.username
        );


    }

    else{


        avatar.src =
        "assets/images/default-avatar.png";


    }






    avatar.onerror = ()=>{


        avatar.src =
        "assets/images/default-avatar.png";


    };







    const username =
    document.createElement("h2");



    if(
        typeof CloudTokUserManager !== "undefined"
    ){


        username.textContent =
        CloudTokUserManager.getDisplayName(
            this.data.username
        );


    }

    else{


        username.textContent =
        this.data.username || "@user";


    }






    profileArea.appendChild(
        avatar
    );


    profileArea.appendChild(
        username
    );





    const caption =
    document.createElement("p");


    caption.textContent =
    this.data.caption || "";






    const tags =
    document.createElement("span");


    tags.textContent =

    this.data.tags &&
    this.data.tags.length

    ?

    this.data.tags
    .map(
        tag=>"#" + tag
    )
    .join(" ")

    :

    "#CloudTok";







    bottomInfo.appendChild(
        profileArea
    );


    bottomInfo.appendChild(
        caption
    );


    bottomInfo.appendChild(
        tags
    );




    card.appendChild(
        bottomInfo
    );





    this.setupButtons();


}
    
    setupButtons(){

        if(this.profileBtn){

    this.profileBtn.onclick = (e)=>{

        e.stopPropagation();

        window.location.href =
        "profile.html?user=" +
        encodeURIComponent(
            this.data.username.replace("@","")
        );

    };

}

if(this.followPlus){

    this.followPlus.onclick = (e)=>{

        e.stopPropagation();

        this.toggleFollow();

    };

}



        if(this.likeBtn){

            this.likeBtn.onclick = (e)=>{

                e.stopPropagation();

                this.toggleLike();

            };

        }



        if(this.commentBtn){

            this.commentBtn.onclick = (e)=>{

    e.stopPropagation();

                localStorage.setItem(
    "CloudTokPendingAction",
    "comment"
);

localStorage.setItem(
    "CloudTokPendingVideo",
    this.data.id
);
    if(
                
        !CloudTokAuthGuard.requireLogin()
    ){
        return;
    }

    if(typeof CloudTokComments !== "undefined"){

        window.CloudTokActiveVideoCard =
        this;

        window.CloudTokActiveComments =
        new CloudTokComments(this.data);

        window.CloudTokActiveComments.open();

        this.updateCommentCount();

    }
    else{

        console.log(
            "Comments system not loaded"
        );

    }

};

        }



    if(this.shareBtn){

    this.shareBtn.onclick = async (e)=>{

        e.stopPropagation();

        const link =
        getVideoShareLink(this.data.id);

        this.data.shares =
        (this.data.shares || 0) + 1;

        saveCloudTokVideos();

        try{

            if(navigator.share){

                await navigator.share({

                    title:"CloudTok",

                    text:this.data.caption,

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




        if(this.saveBtn){

    this.saveBtn.onclick = (e)=>{

        e.stopPropagation();


        this.toggleSave();


    };

}

    }







    setupVideoEvents(){


        if(!this.video){

            console.error(
                "Video element missing"
            );

            return;

        }



        this.video.addEventListener(
            "loadeddata",
            ()=>{


                if(this.loader){

                    this.loader.style.display="none";

                }


                if(this.thumbnail){

                    this.thumbnail.style.opacity="0";

                }


            }
        );





        this.video.addEventListener(
            "waiting",
            ()=>{


                if(this.loader){

                    this.loader.style.display="block";

                }


            }
        );





        this.video.addEventListener(
            "playing",
            ()=>{


                if(this.loader){

                    this.loader.style.display="none";

                }


            }
        );





        this.video.addEventListener(
            "error",
            ()=>{


                console.error(
                    "VIDEO FAILED:",
                    this.data.video
                );


                if(this.loader){

                    this.loader.style.display="none";

                }


                if(this.thumbnail){

                    this.thumbnail.style.opacity="1";

                }


            }
        );


    }








    setupTapControl(){

    let lastTap = 0;

    let tapTimer = null;


    this.element.addEventListener(
        "click",
        (e)=>{


            if(
                e.target.closest(".rightMenu")
            ){

                return;

            }


            if(
                e.target.closest(".globalSoundButton")
            ){

                return;

            }




            const now =
            Date.now();



            const difference =
            now - lastTap;




            // DOUBLE TAP
            if(
                difference < 300
            ){


                clearTimeout(
                    tapTimer
                );


                this.toggleLike();


                this.showHeart();


                lastTap = 0;


                return;


            }




            // FIRST TAP
            lastTap = now;



            tapTimer =
            setTimeout(()=>{


                if(
                    Date.now() - lastTap >= 300
                ){

                    this.togglePlayback();

                }


            },320);



        }
    );


}






    togglePlayback(){


        if(!this.video){

            return;

        }



        if(this.video.paused){


            this.userPaused = false;


            this.play();


            this.showControlIcon("▶");


        }
        else{


            this.userPaused = true;


            this.pause();


            this.showControlIcon("Ⅱ");


        }


    }








    showControlIcon(icon){


        if(!this.controlIcon){

            return;

        }



        this.controlIcon.textContent = icon;



        this.controlIcon.classList.remove(
            "show"
        );



        void this.controlIcon.offsetWidth;



        this.controlIcon.classList.add(
            "show"
        );



        clearTimeout(
            this.iconTimer
        );



        this.iconTimer =
        setTimeout(()=>{


            this.controlIcon.classList.remove(
                "show"
            );


        },600);



    }
    
    showHeart(){


        const heart =
        document.createElement("div");


        heart.className =
        "doubleHeart";


        heart.textContent =
        "❤️";



        this.element.appendChild(
            heart
        );



        setTimeout(()=>{


            heart.remove();


        },800);


    }


showSavedMessage(text){
    
    const popup =
    document.createElement("div");

    popup.className =
    "savePopup";

    popup.textContent =
    text;

    this.element.appendChild(
        popup
    );

    setTimeout(()=>{

        popup.remove();

    },1000);

}
    

    setupVideoObserver(){


        if(
            !this.element ||
            !this.video
        ){

            return;

        }




        this.observer =
        new IntersectionObserver(

            (entries)=>{


                entries.forEach(
                    entry=>{


                        if(
                            entry.isIntersecting
                        ){


                            if(
                                this.video.readyState < 2
                            ){

                                this.video.load();

                            }



                            if(
                                !this.userPaused
                            ){

                                this.play();

                            }



                        }

                        else{


                            this.pause();


                        }


                    }
                );


            },


            {

                threshold:0.75

            }


        );




        this.observer.observe(
            this.element
        );



    }








    play(){

    if(!this.video){
        return;
    }

    if(this.userPaused){
        return;
    }

        this.watchStart = Date.now();
    this.video.play()
    .catch(error=>{

        console.log(
            "Autoplay prevented:",
            error
        );

    });

    // Count a view only after 3 seconds
    if(!this.viewCounted){

        clearTimeout(this.viewTimer);

        this.viewTimer = setTimeout(()=>{

            if(!this.viewCounted){

                this.viewCounted = true;

                this.data.views =
                (this.data.views || 0) + 1;

                saveCloudTokVideos();

                console.log(
                    "View counted:",
                    this.data.views
                );

            }

        },3000);

    }

}


    pause(){

    if(!this.video){
        return;
    }

    clearTimeout(this.viewTimer);

    if(this.watchStart){

        const seconds = Math.floor(
            (Date.now() - this.watchStart) / 1000
        );

        this.data.watchTime =
        (this.data.watchTime || 0) + seconds;

        saveCloudTokVideos();

        console.log(
            "Watch time:",
            this.data.watchTime,
            "seconds"
        );

        this.watchStart = 0;

    }

    this.video.pause();

}


    toggleLike(){

    if(
        !CloudTokAuthGuard.requireLogin()
    ){
        return;
    }

    if(
        typeof toggleVideoLike === "undefined"
    ){

        console.log(
            "toggleVideoLike missing"
        );

        return;

    }

    toggleVideoLike(
        this.data.id
    );

    const video =
    CloudTokDatabase.videos.find(
        v =>
        String(v.id) === String(this.data.id)
    );

    if(video){

        this.likes =
        video.likes;

    }

    this.isLiked =
    hasLikedVideo(
        this.data.id
    );

    this.updateLike();

}


toggleSave(){


    console.log(
        "toggleSave started",
        this.data.id
    );



    if(
        typeof toggleVideoSave === "undefined"
    ){

        console.log(
            "toggleVideoSave does not exist"
        );

        return;

    }



    toggleVideoSave(
        this.data.id
    );



    console.log(
        "After toggleVideoSave",
        localStorage.getItem(
            "CloudTokSavedVideos"
        )
    );



    this.isSaved =
    hasSavedVideo(
        this.data.id
    );



    console.log(
        "isSaved state:",
        this.isSaved
    );



    this.updateSave();
    this.showSavedMessage(

    this.isSaved ?

    "Video Saved"

    :

    "Video Removed"

);

}



updateSave(){


    if(this.bookmarkIcon){


        this.bookmarkIcon.src =

        this.isSaved

        ?

        "assets/icons/solid/bookmark-solid.svg"

        :

        "assets/icons/outline/bookmark-outline.svg";


    }



    if(this.saveBtn){


        if(this.isSaved){

            this.saveBtn.classList.add(
                "saved"
            );

        }
        else{

            this.saveBtn.classList.remove(
                "saved"
            );

        }


    }


}




    updateLike(){


    if(this.likeCount){

        this.likeCount.textContent =
        this.likes;

    }


    if(this.heartIcon){

        this.heartIcon.src =

        this.isLiked

        ?

        "assets/icons/solid/heart.svg"

        :

        "assets/icons/outline/heart.svg";


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


}



updateCommentCount(){

    const count =
    this.data.comments ?
    this.data.comments.length :
    0;


    if(this.commentCount){

        this.commentCount.textContent = count;

    }

}




    updateVideo(videoData){


        this.data =
        videoData;



        if(
            !this.video
        ){

            return;

        }




        const source =
        this.video.querySelector(
            "source"
        );



        if(
            source
        ){

            source.src =
            videoData.video;


        }



        if(
            this.thumbnail
        ){

            this.thumbnail.src =
            videoData.thumbnail || "";

        }



        this.video.load();



    }
    
    getElement(){


        return this.element;


    }








    getVideoElement(){


        return this.video;


    }


    updateFollowButton(){

const currentUser =
(localStorage.getItem(
"CloudTokCurrentUser"
) || "")
.replace("@","")
.toLowerCase();

const users =
JSON.parse(
localStorage.getItem(
"CloudTokUsers"
) || "[]"
);

const uploader =
users.find(user=>

String(user.username)
.replace("@","")
.toLowerCase()

===

String(this.data.username)
.replace("@","")
.toLowerCase()

);

if(!uploader || !this.followPlus){
return;
}

const followers =
(uploader.followers || [])
.map(user=>

String(user)
.replace("@","")
.toLowerCase()

);

this.followPlus.textContent =

followers.includes(currentUser)

?

"✓"

:

"+";

}
    
    toggleFollow(){

    if(!CloudTokAuthGuard.requireLogin()){
        return;
    }

    const username = this.data.username;

    const current = CloudTokUsers.getCurrentUser();

    const target = CloudTokUsers.find(username);

    if(!current || !target){
        return;
    }

    const isFollowing =
        current.following.includes(target.username);

    if(isFollowing){
        CloudTokUsers.unfollow(target.username);
    }else{
        CloudTokUsers.follow(target.username);
    }

    this.updateFollowButton();

}

    destroy(){


        this.destroyed = true;



        if(
            this.observer
        ){

            this.observer.disconnect();

        }




        this.pause();




        if(
            this.video
        ){


            this.video.removeAttribute(
                "src"
            );


            this.video.load();


        }





        if(
            this.element
        ){

            this.element.remove();

        }





        this.video = null;

        this.thumbnail = null;

        this.loader = null;

        this.controlIcon = null;

        this.likeBtn = null;

        this.likeCount = null;

        this.element = null;


    }



}   