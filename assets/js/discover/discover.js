class CloudTokDiscover{

constructor(){

this.grid=
document.getElementById("discoverGrid");

this.currentCategory="All";

this.searchText="";

this.searchInput=
document.getElementById("discoverSearch");

this.setupCategories();

if(this.searchInput){

    this.searchInput.oninput=()=>{
        this.searchText=
        this.searchInput.value.trim().toLowerCase();
        this.loadVideos();
    };

}

this.loadVideos();

}

async loadVideos(){

this.grid.innerHTML="";

let videos=[];

if(typeof CloudTokAPI!=="undefined"){

    try{

        const category=
        this.currentCategory!=="All"
        ?this.currentCategory
        :null;

        const result=
        await CloudTokAPI.getDiscover(category,30);

        if(result.videos){

            videos=result.videos.map(v=>({
                id:v.id,
                username:v.username,
                caption:v.caption||"",
                thumbnail:v.thumbnail_url||
                "assets/images/video-placeholder.png",
                video:v.video_url||"",
                likes:v.likes||0,
                comments:v.comments||0,
                views:v.views||0
            }));

        }

    }
    catch(e){
        console.log("Discover API failed, using local");
    }

}

if(videos.length===0){

    videos=CloudTokDatabase.videos||[];

    if(this.searchText){

        videos=videos.filter(video=>{
            const text=
            ((video.caption||"")+" "+
            (video.username||"")+" "+
            (video.displayName||"")+" "+
            (video.category||"")+" "+
            (video.tags||[]).join(" "))
            .toLowerCase();
            return text.includes(this.searchText);
        });

    }

    if(this.currentCategory!=="All"){

        videos=videos.filter(video=>{
            return(video.category||"")
            .toLowerCase()===
            this.currentCategory.toLowerCase();
        });

    }

    videos.sort((a,b)=>{
        const scoreA=
        (a.views||0)*5+(a.likes||0)*10+
        ((a.comments||[]).length||a.comments||0)*8;
        const scoreB=
        (b.views||0)*5+(b.likes||0)*10+
        ((b.comments||[]).length||b.comments||0)*8;
        return scoreB-scoreA;
    });

}

videos.forEach(video=>{

const card=
document.createElement("div");

card.className="discoverCard";

card.innerHTML=`

<img
src="${video.thumbnail||"assets/images/video-placeholder.png"}"
class="discoverThumbnail">

<div class="discoverCaption">
${video.caption||""}
</div>

`;

card.onclick=()=>{
    window.location.href=
    "watch.html?id="+video.id;
};

this.grid.appendChild(card);

});

}

setupCategories(){

const buttons=
document.querySelectorAll(".category");

buttons.forEach(button=>{

    button.onclick=()=>{
        buttons.forEach(btn=>{
            btn.classList.remove("active");
        });
        button.classList.add("active");
        this.currentCategory=
        button.textContent.trim();
        this.loadVideos();
    };

});

}


}

document.addEventListener(
"DOMContentLoaded",
()=>{
    new CloudTokDiscover();
}
);

const backBtn=
document.getElementById("discoverBackBtn");

if(backBtn){
    backBtn.onclick=()=>{history.back();};
}
