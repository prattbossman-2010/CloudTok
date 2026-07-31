function getRelatedVideos(video){


let recommendations=[];



CloudTokDatabase.videos.forEach(item=>{


// avoid recommending the same video

if(item.id === video.id)
return;



// same category

if(item.category === video.category){


recommendations.push(item);


}



});



return recommendations;


}