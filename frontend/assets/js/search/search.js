const searchInput =
document.getElementById("searchInput");


const suggestions =
document.getElementById("suggestions");


const searchButton =
document.getElementById("searchButton");



function performSearch(){


let query =
searchInput.value.trim();



if(query === "")
return;



window.location.href =
"results.html?query="
+
encodeURIComponent(query);



}



searchButton.addEventListener("click",()=>{


performSearch();


});



searchInput.addEventListener("keydown",(e)=>{


if(e.key==="Enter"){

performSearch();

}


});

searchInput.addEventListener("input",()=>{


let text =
searchInput.value.toLowerCase();


suggestions.innerHTML="";


if(text==="")
return;



CloudTokDatabase.videos.forEach(video=>{


let searchable = 
(
video.username +
video.caption +
video.tags.join(" ")
)
.toLowerCase();



if(searchable.includes(text)){


suggestions.innerHTML += `

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


let query =
e.target.getAttribute("data-query");


window.location.href =
"results.html?query="
+
encodeURIComponent(query);


}


});