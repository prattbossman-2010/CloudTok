const searchInput=
document.getElementById("searchInput");

const suggestions=
document.getElementById("suggestions");

const searchButton=
document.getElementById("searchButton");


function performSearch(){

let query=searchInput.value.trim();

if(query==="")return;

window.location.href=
"results.html?query="+encodeURIComponent(query);

}


searchButton.addEventListener("click",()=>{
performSearch();
});


searchInput.addEventListener("keydown",(e)=>{
if(e.key==="Enter")performSearch();
});


searchInput.addEventListener("input",async()=>{

let text=searchInput.value.toLowerCase();

suggestions.innerHTML="";

if(text==="")return;

if(typeof CloudTokAPI!=="undefined"){

    try{

        const result=await CloudTokAPI.search(text);

        if(result.videos){

            result.videos.slice(0,5).forEach(video=>{

                suggestions.innerHTML+=`
                    <div class="suggestion"
                    data-query="${video.caption}">
                    ${video.caption}
                    </div>
                `;

            });

        }

        if(result.users){

            result.users.slice(0,3).forEach(user=>{

                suggestions.innerHTML+=`
                    <div class="suggestion"
                    data-query="${user.username}">
                    @${user.username}
                    </div>
                `;

            });

        }

        return;

    }
    catch(e){
        console.log("Search API failed, using local");
    }

}

CloudTokDatabase.videos.forEach(video=>{

    let searchable=
    (video.username+video.caption+(video.tags||[]).join(" "))
    .toLowerCase();

    if(searchable.includes(text)){
        suggestions.innerHTML+=`
            <div class="suggestion"
            data-query="${video.caption}">
            ${video.caption}
            </div>
        `;
    }

});

});


suggestions.addEventListener("click",(e)=>{

if(e.target.classList.contains("suggestion")){

    let query=e.target.getAttribute("data-query");

    window.location.href=
    "results.html?query="+encodeURIComponent(query);

}

});
