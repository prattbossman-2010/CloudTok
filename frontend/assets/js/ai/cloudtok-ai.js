class CloudTokAI {


static async enhanceVideo(video){


try{


console.log(
"AI ANALYSIS STARTED"
);



const result={


caption:
this.improveCaption(
video.caption
),


tags:
this.generateSmartTags(
video.caption,
video.tags
),


category:
this.detectCategory(
video.caption
)



};



console.log(
"AI RESULT",
result
);



return Promise.resolve(result);



}
catch(error){


console.log(
"AI ERROR",
error
);



return Promise.resolve(null);



}


}






static improveCaption(text){


if(!text)
return "CloudTok video";


return text
.charAt(0)
.toUpperCase()
+
text.slice(1);


}








static generateSmartTags(
caption,
oldTags
){


let tags=[...oldTags];



let words =
caption
.toLowerCase()
.split(" ");



words.forEach(word=>{


word =
word.replace(
/[^a-z0-9]/g,
""
);



if(
word.length>3 &&
!tags.includes(word)
){


tags.push(word);


}


});



if(!tags.includes("cloudtok")){


tags.push("cloudtok");


}



return tags;


}








static detectCategory(text){


text =
text.toLowerCase();



if(
text.includes("game")||
text.includes("gaming")
)

return "Gaming";



if(
text.includes("music")||
text.includes("song")
)

return "Music";



if(
text.includes("code")||
text.includes("program")
)

return "Technology";



if(
text.includes("football")||
text.includes("sport")
)

return "Sports";



return "General";


}


}


console.log(
"CloudTok AI Ready"
);