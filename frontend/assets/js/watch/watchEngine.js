class CloudTokWatchEngine{

constructor(){


this.videos =
CloudTokDatabase.videos || [];



this.currentIndex = 0;



this.area =
document.getElementById(
"videoArea"
);



this.video =
document.getElementById(
"watchVideo"
);

this.soundEnabled = false;

// New transition layers

this.nextVideo =
null;


this.previousVideo =
null;



this.startY = 0;

this.currentY = 0;


this.dragging = false;


this.locked = false;


this.swipeLimit = 120;





this.setupVideo();



this.setupSwipe();

this.setupKeyboard();

this.setupWheel();




}






createVideoLayers(){



if(!this.area){

return;

}




this.nextVideo =
document.createElement(
"video"
);



this.nextVideo.className =
"watchSlide";

this.nextVideo.id =
"nextVideo";



this.previousVideo =
document.createElement(
"video"
);



this.previousVideo.className =
"watchSlide";

this.previousVideo.id =
"previousVideo";





[
this.nextVideo,
this.previousVideo

].forEach(video=>{


video.muted = true;

video.loop = true;

video.playsInline = true;

video.setAttribute(
"webkit-playsinline",
""
);


video.style.position =
"absolute";


video.style.top =
"0";


video.style.left =
"0";


video.style.width =
"100%";


video.style.height =
"100%";


video.style.objectFit =
"cover";


});





this.area.appendChild(
this.previousVideo
);


this.area.appendChild(
this.nextVideo
);



// Put current video above others

this.video.style.zIndex =
"3";


this.nextVideo.style.zIndex =
"2";


this.previousVideo.style.zIndex =
"1";





this.resetPositions();



}









resetPositions(){



if(!this.video){

return;

}



this.video.style.transform =
"translateY(0px)";



if(this.nextVideo){

this.nextVideo.style.transform =
"translateY(100%)";

}



if(this.previousVideo){

this.previousVideo.style.transform =
"translateY(-100%)";

}



}








setupVideo(){



if(!this.video){

return;

}



this.video.muted = !this.soundEnabled;


this.video.loop = true;


this.video.playsInline = true;



this.video.addEventListener(
"click",
(e)=>{

if(
e.target.closest(".watchActions")
){

return;

}


this.togglePlay();


});



}








async init(id){


// Parse user param from URL for profile-context filtering
const urlParams=new URLSearchParams(window.location.search);
const userParam=(urlParams.get("user")||"").trim();

// Load videos from API if we only have built-in ones
if(typeof CloudTokAPI!=="undefined"){
    try{
        const result = userParam
            ? await CloudTokAPI.getVideos({ user: userParam })
            : await CloudTokAPI.getVideos();
        if(result.videos && result.videos.length > 0){
            this.videos = result.videos.map(v=>({
                id:v.id,
                username:v.username,
                displayName:v.username,
                avatar:v.avatar||"assets/images/default-avatar.png",
                caption:v.caption||"",
                video:v.video_url||"",
                thumbnail:v.thumbnail_url||"assets/images/video-placeholder.png",
                likes:v.likes||0,
                likedBy:v.liked?[getCurrentCloudTokUser()]:[],
                comments:Array(v.comments||0).fill(null),
                shares:0,
                saves:v.saved?1:0,
                views:v.views||0
            }));
            // Add built-in videos if not already present
            (CloudTokDatabase.videos||[]).forEach(builtin=>{
                if(!this.videos.some(v=>String(v.id)===String(builtin.id))){
                    this.videos.push(builtin);
                }
            });
            // Sync API videos into CloudTokDatabase.videos so loadWatchActions/loadWatchComments can find them
            if(!Array.isArray(CloudTokDatabase.videos)){
                CloudTokDatabase.videos=[];
            }
            this.videos.forEach(v=>{
                const existingIndex=CloudTokDatabase.videos.findIndex(db=>String(db.id)===String(v.id));
                if(existingIndex===-1){
                    CloudTokDatabase.videos.push(v);
                }else{
                    // Update stale entries with fresh API data
                    CloudTokDatabase.videos[existingIndex]=v;
                }
            });
        }
    }
    catch(e){
        console.log("Watch API load failed");
    }
}

const index =

this.videos.findIndex(

v=>

Number(v.id)===Number(id)

);



if(index!==-1){


this.currentIndex =
index;


}



this.createVideoLayers();

this.loadVideo();



}
    
loadVideo(){


const data =
this.videos[
this.currentIndex
];



if(!data){

console.log(
"NO VIDEO FOUND"
);

return;

}



this.currentVideo =
data;



this.video.pause();



this.video.src =
data.video;



this.video.load();



this.video.play()
.catch(
error=>{

console.log(
"AUTOPLAY BLOCKED",
error
);

}

);

if(typeof CloudTokAPI!=="undefined"&&data.id){
    CloudTokAPI.incrementViews(data.id).catch(()=>{});
}

this.updateInfo();



this.prepareSlides();



this.updateActions();



}









prepareSlides(){


const next =
this.videos[
this.currentIndex + 1
];



const previous =
this.videos[
this.currentIndex - 1
];





if(next){


this.nextVideo.src =
next.video;


this.nextVideo.load();


}

else{


this.nextVideo.removeAttribute(
"src"
);


}





if(previous){


this.previousVideo.src =
previous.video;


this.previousVideo.load();


}

else{


this.previousVideo.removeAttribute(
"src"
);


}



this.resetPositions();



}









setupSwipe(){



if(!this.area){

return;

}

const ignoreTapArea = (e)=>{

    return e.target.closest(
        ".watchActions"
    );

};

this.area.addEventListener(

"touchstart",

(e)=>{


if(
e.target.closest(".watchActions")
){

return;

}


if(this.locked){

return;

}



this.dragging = true;



this.startY =
e.touches[0].clientY;



this.currentY =
this.startY;



this.video.style.transition =
"none";


this.nextVideo.style.transition =
"none";


this.previousVideo.style.transition =
"none";



},

{
passive:true
}

);









this.area.addEventListener(

"touchmove",

(e)=>{


if(
e.target.closest(".watchActions")
){

return;

}


if(
!this.dragging ||
this.locked
){

return;

}



this.currentY =
e.touches[0].clientY;



const movement =
this.currentY -
this.startY;





// Move current video with finger

this.video.style.transform =
`
translateY(${movement}px)
`;






// Dragging upward

if(
movement < 0
){


this.nextVideo.style.transform =
`
translateY(
${window.innerHeight + movement}px
)
`;



}





// Dragging downward

else{


this.previousVideo.style.transform =
`
translateY(
${-window.innerHeight + movement}px
)
`;



}



},

{
passive:true
}

);




this.area.addEventListener(

"touchend",

(e)=>{


if(
e.target.closest(".watchActions")
){

return;

}


if(!this.dragging){

return;

}



this.dragging=false;



const distance =
this.currentY -
this.startY;





if(
distance < -this.swipeLimit
){


this.animateSwipe(
"next"
);


}

else if(
distance > this.swipeLimit
){


this.animateSwipe(
"previous"
);


}

else{


this.cancelSwipe();


}




});



}









cancelSwipe(){



this.video.style.transition =
"transform .35s ease";


this.nextVideo.style.transition =
"transform .35s ease";


this.previousVideo.style.transition =
"transform .35s ease";



this.resetPositions();



}








animateSwipe(direction){



if(this.locked){

return;

}



this.locked=true;





this.video.style.transition =
"transform .35s cubic-bezier(.25,.8,.25,1)";


this.nextVideo.style.transition =
"transform .35s cubic-bezier(.25,.8,.25,1)";


this.previousVideo.style.transition =
"transform .35s cubic-bezier(.25,.8,.25,1)";







if(direction==="next"){



if(
this.currentIndex >=
this.videos.length-1
){


this.cancelSwipe();

this.locked=false;

return;


}





this.video.style.transform =
"translateY(-100%)";



this.nextVideo.style.transform =
"translateY(0)";



setTimeout(()=>{


this.currentIndex++;


this.finishSwipe();



},350);



}









if(direction==="previous"){



if(
this.currentIndex<=0
){


this.cancelSwipe();


this.locked=false;


return;


}





this.video.style.transform =
"translateY(100%)";



this.previousVideo.style.transform =
"translateY(0)";




setTimeout(()=>{


this.currentIndex--;


this.finishSwipe();



},350);



}



}
    
finishSwipe(){



const data =
this.videos[
this.currentIndex
];



if(!data){

this.locked=false;

return;

}



this.video.pause();



this.video.style.transition =
"none";


this.nextVideo.style.transition =
"none";


this.previousVideo.style.transition =
"none";



this.resetPositions();



this.loadVideo();



this.locked=false;



}
    

toggleSound(){

this.soundEnabled =
!this.soundEnabled;

this.video.muted =
!this.soundEnabled;

if(this.nextVideo){

this.nextVideo.muted =
!this.soundEnabled;

}

if(this.previousVideo){

this.previousVideo.muted =
!this.soundEnabled;

}

const btn =
document.getElementById(
"watchSoundBtn"
);

if(btn){

btn.textContent =
this.soundEnabled
?
"🔊"
:
"🔇";

}

}

togglePlay(){



if(
this.video.paused
){


this.video.play()

.catch(
()=>{}

);



}

else{


this.video.pause();


}



}









updateInfo(){



if(!this.currentVideo){

return;

}



const user =
document.getElementById(
"watchUser"
);



const caption =
document.getElementById(
"watchCaption"
);



const tags =
document.getElementById(
"watchTags"
);





if(user){


user.textContent =
this.currentVideo.username;


}





if(caption){


caption.textContent =
this.currentVideo.caption;


}





if(tags){


tags.textContent =

(this.currentVideo.tags || [])

.map(
tag=>

"#"+tag

)

.join(" ");



}



}









updateActions(){



if(
typeof loadWatchActions ===
"function"
){


loadWatchActions(
this.currentVideo.id
);


}





if(
typeof loadWatchComments ===
"function"
){


loadWatchComments(
this.currentVideo.id
);


}



}









destroy(){



if(this.video){


this.video.pause();


}



if(this.nextVideo){


this.nextVideo.pause();


}



if(this.previousVideo){


this.previousVideo.pause();


}



if(this.area){


this.area.innerHTML="";


}



}



setupKeyboard(){

document.addEventListener("keydown",(e)=>{

    if(this.locked)return;

    if(e.key==="ArrowDown"){

        if(this.currentIndex < this.videos.length-1){
            this.animateSwipe("next");
        }
    }
    else if(e.key==="ArrowUp"){

        if(this.currentIndex > 0){
            this.animateSwipe("previous");
        }
    }

});

}



setupWheel(){

let wheelTimeout=null;
let accumulated=0;

document.addEventListener("wheel",(e)=>{

    if(this.locked)return;

    accumulated+=e.deltaY;

    if(wheelTimeout)return;

    wheelTimeout=setTimeout(()=>{

        if(Math.abs(accumulated)>50){

            if(accumulated>0 && this.currentIndex<this.videos.length-1){
                this.animateSwipe("next");
            }
            else if(accumulated<0 && this.currentIndex>0){
                this.animateSwipe("previous");
            }
        }

        accumulated=0;
        wheelTimeout=null;

    },150);

},{passive:true});

}


}