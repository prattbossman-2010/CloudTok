class CloudTokDiscover{

constructor(){

this.grid =
document.getElementById(
"discoverGrid"
);

this.currentCategory =
"All";

    this.searchText = "";

this.searchInput =
document.getElementById(
    "discoverSearch"
);
    
this.setupCategories();

    if(this.searchInput){

    this.searchInput.oninput = ()=>{

        this.searchText =
        this.searchInput.value
        .trim()
        .toLowerCase();

        this.loadVideos();

    };

}
    
this.loadVideos();

}

loadVideos(){

this.grid.innerHTML = "";

let videos =
CloudTokDatabase.videos || [];

    if(this.searchText){

videos = videos.filter(video=>{

const text = (

(video.caption || "") + " " +

(video.username || "") + " " +

(video.displayName || "") + " " +

(video.category || "") + " " +

(video.tags || []).join(" ")

).toLowerCase();

return text.includes(
this.searchText
);

});

}
    
if(this.currentCategory !== "All"){

videos = videos.filter(video=>{

return (

video.category || ""

).toLowerCase()

===

this.currentCategory.toLowerCase();

});

}

videos.sort((a,b)=>{

const scoreA =

(a.views||0)*5 +

(a.likes||0)*10 +

((a.comments||[]).length)*8 +

(a.shares||0)*15 +

(a.saves||0)*12 +

(a.watchTime||0)*2;

const scoreB =

(b.views||0)*5 +

(b.likes||0)*10 +

((b.comments||[]).length)*8 +

(b.shares||0)*15 +

(b.saves||0)*12 +

(b.watchTime||0)*2;

return scoreB - scoreA;

});
    
videos.forEach(video=>{

const card =
document.createElement("div");

card.className =
"discoverCard";

card.innerHTML = `

<img
src="${video.thumbnail || "assets/images/video-placeholder.png"}"
class="discoverThumbnail">

<div class="discoverCaption">

${video.caption || ""}

</div>

`;

card.onclick = ()=>{

window.location.href =
"watch.html?id=" +
video.id;

};

this.grid.appendChild(card);

});

}

    setupCategories(){

const buttons =

document.querySelectorAll(
".category"
);

buttons.forEach(button=>{

button.onclick = ()=>{

buttons.forEach(btn=>{

btn.classList.remove(
"active"
);

});

button.classList.add(
"active"
);

this.currentCategory =
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

});

const backBtn =
document.getElementById(
    "discoverBackBtn"
);

if(backBtn){

    backBtn.onclick = ()=>{

        history.back();

    };

}