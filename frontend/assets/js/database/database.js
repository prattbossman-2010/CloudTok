const CloudTokDatabase = {


videos:[

{
id:1,

username:"@JohnDoe",

displayName:"John Doe",

avatar:"assets/images/default-avatar.png",

caption:"Very funny video 🚀",

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

},





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





/*
LOAD SAVED UPLOADS
*/

function loadCloudTokStorage(){


try{


const savedVideos =
localStorage.getItem(
"CloudTokVideos"
);



if(savedVideos){

const savedLikes =
localStorage.getItem(
    "CloudTokVideos"
);


if(savedLikes){


    const saved =
    JSON.parse(
        savedLikes
    );


    saved.forEach(savedVideo=>{


        const existing =
        CloudTokDatabase.videos.find(
            v =>
            String(v.id) === String(savedVideo.id)
        );


        if(existing){

    existing.likes =
    savedVideo.likes || 0;


    existing.likedBy =
    savedVideo.likedBy || [];


    existing.comments =
    savedVideo.comments || [];


    existing.shares =
    savedVideo.shares || 0;


    existing.saves =
    savedVideo.saves || 0;


    existing.views =
    savedVideo.views || 0;


}


    });


}
const uploadedVideos =
JSON.parse(savedVideos);



const existingIds =
new Set(
CloudTokDatabase.videos.map(
v=>v.id
)
);



uploadedVideos.forEach(video=>{


if(!existingIds.has(video.id)){


CloudTokDatabase.videos.unshift(video);


}



});


}





const savedSearch =
localStorage.getItem(
"CloudTokSearchIndex"
);



if(savedSearch){


CloudTokDatabase.searchIndex =
JSON.parse(savedSearch);


}



}

catch(error){


console.error(
"CloudTok storage load error:",
error
);


}



}

loadCloudTokStorage();

if(!CloudTokDatabase.users){

CloudTokDatabase.users = [];

}



function createDefaultUser(username){


return {


username:username,


displayName:username,


avatar:
"assets/images/default-avatar.png",


bio:
"Welcome to CloudTok",


followers:[],


following:[],


videos:[]


};


}

/* Add the line below to remove everything stored in local storage.
 You uncomment it here while the index.html is still opened 
 in the browser and refresh the webpage. After refreshing,the
 videos will be cleared so comment the code again*/
//  localStorage.clear();
/* Add the line below to remove videos stored in local storage.
 You uncomment it here while the index.html is still opened 
 in the browser and refresh the webpage. After refreshing,the
 videos will be cleared so comment the code again*/
//  localStorage.removeItem("CloudTokVideos");

/*
==============================
        LIKE SYSTEM
==============================
*/


function getCurrentCloudTokUser(){

    return localStorage.getItem(
        "CloudTokCurrentUser"
    )
    ||
    "@Prattbossman";

}





function hasLikedVideo(videoId){


    const user =
    getCurrentCloudTokUser();



    const video =
    CloudTokDatabase.videos.find(
        v=>v.id===videoId
    );



    if(!video){

        return false;

    }



    if(!video.likedBy){

        video.likedBy=[];

    }



    return video.likedBy.includes(
        user
    );


}







function toggleVideoLike(videoId){



    const user =
    getCurrentCloudTokUser();



    const video =
    CloudTokDatabase.videos.find(
        v=>v.id===videoId
    );



    if(!video){

        return;

    }




    if(!video.likedBy){

        video.likedBy=[];

    }





    const index =
    video.likedBy.indexOf(
        user
    );





    if(index === -1){


        video.likedBy.push(
            user
        );


        video.likes++;


    }
    else{


        video.likedBy.splice(
            index,
            1
        );


        video.likes =
        Math.max(
            0,
            video.likes-1
        );


    }





    saveCloudTokVideos();



}








function saveCloudTokVideos(){


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
"VIDEO SAVE ERROR:",
error
);


}


}

function hasSavedVideo(videoId){


    const currentUser =
    localStorage.getItem(
        "CloudTokCurrentUser"
    );


    if(!currentUser){

        return false;

    }



    const saved =
    JSON.parse(

        localStorage.getItem(
            "CloudTokSavedVideos"
        )

        ||

        "[]"

    );



    return saved.some(item =>

    String(item.videoId) === String(videoId) &&

    item.username === currentUser

);


}








function toggleVideoSave(videoId){

    const currentUser =
    localStorage.getItem(
        "CloudTokCurrentUser"
    );


    if(!currentUser){

        alert(
            "Please login to save videos."
        );

        return;

    }




    let saved =
    JSON.parse(

        localStorage.getItem(
            "CloudTokSavedVideos"
        )

        ||

        "[]"

    );





    const index =
saved.findIndex(item =>
        String(item.videoId) === String(videoId) &&

        item.username === currentUser

    );





    if(index !== -1){


        // remove saved video

        saved.splice(
            index,
            1
        );


    }

    else{


        // save video

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

    return (
        window.location.origin +
        window.location.pathname.replace(
            "index.html",
            "watch.html"
        ) +
        "?id=" +
        videoId
    );

}