const CloudTokDatabase={

videos:[

{
id:1,
username:"@JohnDoe",
displayName:"John Doe",
avatar:"assets/images/default-avatar.png",
caption:"Very funny video",
video:"videos/test1.mp4",
thumbnail:"thumbnails/test1.jpg",
tags:["funny","laugh"],
category:"Comedy",
likes:0,
likedBy:[],
comments:[],
shares:0,
saves:0,
views:0
},

{
id:2,
username:"@Prattbossman",
displayName:"Pratt Bossman",
avatar:"assets/images/default-avatar.png",
caption:"Amazing technology video",
video:"videos/test2.mp4",
thumbnail:"thumbnails/test1.jpg",
tags:["tech","diy"],
category:"Technology",
likes:0,
likedBy:[],
comments:[],
shares:0,
saves:0,
views:0
}

],

users:[

{
username:"@JohnDoe",
displayName:"John Doe",
avatar:"assets/images/default-avatar.png",
bio:"Welcome to CloudTok",
followers:[],
following:[],
videos:[]
},

{
username:"@Prattbossman",
displayName:"Pratt Bossman",
avatar:"assets/images/default-avatar.png",
bio:"Welcome to CloudTok",
followers:[],
following:[],
videos:[]
}

],

searchIndex:[]

};


const _builtInVideos=
JSON.parse(JSON.stringify(CloudTokDatabase.videos));


async function loadCloudTokStorage(){

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.getVideos();

        if(result.videos && result.videos.length>0){

            CloudTokDatabase.videos=
            result.videos.map(v=>({
                id:v.id,
                username:v.username,
                displayName:v.username,
                avatar:v.avatar||
                "assets/images/default-avatar.png",
                caption:v.caption||"",
                video:v.video_url||"",
                thumbnail:v.thumbnail_url||
                "assets/images/video-placeholder.png",
                tags:(v.caption||"").split(" ")
                .filter(w=>w.startsWith("#"))
                .map(w=>w.replace("#","")),
                category:"",
                likes:v.likes||0,
                likedBy:[],
                comments:[],
                shares:0,
                saves:0,
                views:v.views||0,
                created_at:v.created_at
            }));

            _builtInVideos.forEach(builtin=>{

                const exists=
                CloudTokDatabase.videos.some(
                    v=>String(v.id)===String(builtin.id)
                );

                if(!exists){
                    CloudTokDatabase.videos.push(builtin);
                }

            });

            localStorage.setItem(
                "CloudTokVideos",
                JSON.stringify(CloudTokDatabase.videos)
            );

            return;

        }

    }
    catch(e){
        console.log("API load failed, using localStorage fallback");
    }

}

try{

    const savedVideos=
    localStorage.getItem("CloudTokVideos");

    if(savedVideos){

        const saved=JSON.parse(savedVideos);

        saved.forEach(savedVideo=>{

            const existing=
            CloudTokDatabase.videos.find(
                v=>String(v.id)===String(savedVideo.id)
            );

            if(existing){
                existing.likes=savedVideo.likes||0;
                existing.likedBy=savedVideo.likedBy||[];
                existing.comments=savedVideo.comments||[];
                existing.shares=savedVideo.shares||0;
                existing.saves=savedVideo.saves||0;
                existing.views=savedVideo.views||0;
            }

        });

        const existingIds=
        new Set(CloudTokDatabase.videos.map(v=>v.id));

        saved.forEach(video=>{

            if(!existingIds.has(video.id)){
                CloudTokDatabase.videos.unshift(video);
            }

        });

    }

}
catch(error){
    console.error("CloudTok storage load error:",error);
}

}

window._cloudtokStorageReady = loadCloudTokStorage();

if(!CloudTokDatabase.users){
CloudTokDatabase.users=[];
}


function createDefaultUser(username){
return{
username:username,
displayName:username,
avatar:"assets/images/default-avatar.png",
bio:"Welcome to CloudTok",
followers:[],
following:[],
videos:[]
};
}


function getCurrentCloudTokUser(){
return localStorage.getItem("CloudTokCurrentUser")||"";
}


function hasLikedVideo(videoId){
const user=getCurrentCloudTokUser();
const video=
CloudTokDatabase.videos.find(v=>Number(v.id)===Number(videoId));
if(!video)return false;
if(!video.likedBy)video.likedBy=[];
return video.likedBy.some(u=>{
    const nu=String(u).replace(/^@+/,"").trim().toLowerCase();
    return nu===user.replace(/^@+/,"").trim().toLowerCase();
});
}


async function toggleVideoLike(videoId){

    if(typeof CloudTokAPI === "undefined"){
        return false;
    }

    const video =
        CloudTokDatabase.videos.find(
            v => Number(v.id) === Number(videoId)
        );

    if(!video){
        return false;
    }

    try{

        const result =
            await CloudTokAPI.toggleLike(videoId);

        if(!result.success){
            return false;
        }

        /*
         * The backend is the source of truth.
         * Do not manually increment/decrement the
         * local like count here.
         */

        if(result.liked){

            video.likedBy =
                video.likedBy || [];

            const user =
                getCurrentCloudTokUser();

            if(
                user &&
                !video.likedBy.includes(user)
            ){
                video.likedBy.push(user);
            }

        }
        else{

            const user =
                getCurrentCloudTokUser();

            if(video.likedBy){

                video.likedBy =
                    video.likedBy.filter(
                        u => u !== user
                    );

            }

        }

        /*
         * Reload the authoritative like count
         * from the API instead of guessing it locally.
         */

        const resultVideos =
            await CloudTokAPI.getVideos();

        if(
            resultVideos.videos &&
            resultVideos.videos.length
        ){

            const freshVideo =
                resultVideos.videos.find(
                    v =>
                    Number(v.id) ===
                    Number(videoId)
                );

            if(freshVideo){

                video.likes =
                    freshVideo.likes || 0;

                video.liked =
                    !!freshVideo.liked;

            }

        }

        return result.liked;

    }
    catch(error){

        console.error(
            "VIDEO LIKE ERROR:",
            error
        );

        return false;

    }

}


function saveCloudTokVideos(){
try{
localStorage.setItem(
"CloudTokVideos",
JSON.stringify(CloudTokDatabase.videos)
);
}
catch(error){
console.log("VIDEO SAVE ERROR:",error);
}
}


function hasSavedVideo(videoId){
    const currentUser=
    localStorage.getItem("CloudTokCurrentUser");
    if(!currentUser)return false;
    const saved=
    JSON.parse(
        localStorage.getItem("CloudTokSavedVideos")||"[]"
    );
    return saved.some(item=>
        String(item.videoId)===String(videoId)&&
        item.username===currentUser
    );
}


function toggleVideoSave(videoId){

    if(typeof CloudTokAPI!=="undefined"){
        CloudTokAPI.toggleSave(videoId)
        .catch(e=>{});
    }

    const currentUser=
    localStorage.getItem("CloudTokCurrentUser");
    if(!currentUser){
        alert("Please login to save videos.");
        return;
    }

    let saved=
    JSON.parse(
        localStorage.getItem("CloudTokSavedVideos")||"[]"
    );

    const index=
    saved.findIndex(item=>
        String(item.videoId)===String(videoId)&&
        item.username===currentUser
    );

    if(index!==-1){
        saved.splice(index,1);
    }
    else{
        saved.push({
            videoId:videoId,
            username:currentUser,
            time:Date.now()
        });
    }

    localStorage.setItem(
        "CloudTokSavedVideos",
        JSON.stringify(saved)
    );
}


function getVideoShareLink(videoId){
return(
    window.location.origin+
    window.location.pathname.replace("index.html","watch.html")+
    "?id="+videoId
);
}
