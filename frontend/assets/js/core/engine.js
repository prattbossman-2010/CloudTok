
class CloudTokEngine{

constructor(){

    this.feed = new Feed();

    this.currentIndex = 0;

    this.videoList = [];

    this.startY = 0;
    this.currentY = 0;

    this.swipeDistance = 80;

    this.isSwiping = false;

    // ===== Global Sound Manager =====
    this.soundEnabled = false;
    this.soundButton = null;
    this.soundLabel = null;
}

createSoundController(){

    this.soundButton = document.createElement("button");
    this.soundButton.className = "globalSoundButton";
    this.soundButton.textContent = "🔇";

    this.soundLabel = document.createElement("div");
    this.soundLabel.className = "soundToast";
    this.soundLabel.textContent = "";

    document.body.appendChild(this.soundButton);
    document.body.appendChild(this.soundLabel);

    this.soundButton.addEventListener("click",()=>{

        this.toggleSound();

    });

}

    toggleSound(){

    this.soundEnabled = !this.soundEnabled;

    this.soundButton.textContent =
        this.soundEnabled ? "🔊" : "🔇";

    this.refreshCurrentVideoSound();

    this.showSoundToast(
        this.soundEnabled ?
        "Sound Enabled" :
        "Sound Muted"
    );

}

    showSoundToast(message){

    this.soundLabel.textContent = message;

    this.soundLabel.classList.add("show");

    clearTimeout(this.soundTimer);

    this.soundTimer = setTimeout(()=>{

        this.soundLabel.classList.remove("show");

    },2000);

}

async init(){

    this.createSoundController();

    await this.loadVideos();

    this.registerTouchEvents();

}







async loadVideos(){

    if(typeof CloudTokUploader!=="undefined"){

        CloudTokUploader.loadSavedVideos();

    }

    try{

    const result =
    await CloudTokAPI.getVideos();

        
    this.videoList =
    result.videos.map(video=>({

        id: video.id,

        username:
        "@" + video.username,

        displayName:
        video.username,

        avatar:
        video.avatar ||
        "assets/images/default-avatar.png",

        caption:
        video.caption,

        video:
        video.video_url,

        thumbnail:
        video.thumbnail_url || "",

        tags:[],

        category:"General",

        likes:
        video.likes || 0,

        likedBy:[],

        comments:[],

        shares:0,

        saves:0,

        views:
        video.views || 0,

        uploaded:
        video.created_at

    }));

}
catch(error){

    console.error(
        "Backend unavailable. Using local videos.",
        error
    );

    this.videoList =
    [...(CloudTokDatabase.videos || [])];

}

this.videoList.sort((a,b)=>{

    const scoreA =
        (a.views||0)*5 +
        (a.likes||0)*10 +
        ((a.comments||[]).length)*8 +
        (a.shares||0)*15 +
        (a.saves||0)*12 +
        (a.watchTime||0)*2 +
        Math.random()*20;

    const scoreB =
        (b.views||0)*5 +
        (b.likes||0)*10 +
        ((b.comments||[]).length)*8 +
        (b.shares||0)*15 +
        (b.saves||0)*12 +
        (b.watchTime||0)*2 +
        Math.random()*20;

    return scoreB - scoreA;

});

    this.feed.clear();

    this.videoList.forEach(video=>{

        try{

            const card = new VideoCard(video);

            const videoElement = card.getVideoElement();

            if(videoElement){

                videoElement.muted = !this.soundEnabled;
            }

            this.feed.addCard(card);

        }

        catch(error){

            console.error(error);

            alert(
                "VIDEO ERROR: " + error.message
            );

        }

    });

    this.currentIndex = 0;

    this.updateFeed();

}






updateFeed(){



this.feed.cards.forEach(

(card,index)=>{



card.element.style.transition=
"transform .45s cubic-bezier(.25,.8,.25,1)";



card.element.style.transform=

`

translateY(

${(index-this.currentIndex)*101}%

)

`;



}



);



this.playCurrentVideo();



}





playCurrentVideo(){

    this.feed.cards.forEach((card,index)=>{

        const video = card.getVideoElement();

        if(index === this.currentIndex){

    if(video){

        video.muted = !this.soundEnabled;
    }


    if(!card.userPaused){

        card.play();

    }

}
        else{

            card.pause();

            if(video){

                video.muted = true;
            }

        }

    });

}


nextVideo(){



if(

this.currentIndex <
this.feed.cards.length-1

){


this.currentIndex++;


this.updateFeed();


}



}






previousVideo(){



if(this.currentIndex>0){


this.currentIndex--;


this.updateFeed();


}



}
registerTouchEvents(){


const container=
document.getElementById(
"feedContainer"
);



if(!container){

return;

}





container.addEventListener(
"touchstart",
(e)=>{


this.startY=
e.touches[0].clientY;


this.currentY=
this.startY;


this.isSwiping=true;



this.feed.cards.forEach(card=>{


card.element.style.transition="none";


});



},

{
passive:true
}

);








container.addEventListener(
"touchmove",
(e)=>{


if(!this.isSwiping){

return;

}



this.currentY=
e.touches[0].clientY;



const movement=
this.currentY-this.startY;



this.feed.cards.forEach(
(card,index)=>{


const position=
(index-this.currentIndex)*101;



const offset=
(movement/window.innerHeight)*100;



card.element.style.transform=

`

translateY(

${position+offset}%

)

`;



}

);



},

{
passive:true

}

);









container.addEventListener(
"touchend",
()=>{



if(!this.isSwiping){

return;

}



this.isSwiping=false;



const distance=
this.currentY-this.startY;




if(distance < -this.swipeDistance){



this.nextVideo();



}

else if(distance > this.swipeDistance){



this.previousVideo();



}

else{


this.updateFeed();


}



}

);



}




refreshCurrentVideoSound(){

    const card = this.feed.cards[this.currentIndex];

    if(!card){
        return;
    }

    const video = card.getVideoElement();

    if(!video){
        return;
    }

    video.muted = !this.soundEnabled;

}


async reloadFeed(){

    const currentSoundState = this.soundEnabled;

    if(typeof CloudTokUploader !== "undefined"){

        CloudTokUploader.loadSavedVideos();

    }

    await this.loadVideos();

    this.soundEnabled = currentSoundState;

    this.playCurrentVideo();

}



}
