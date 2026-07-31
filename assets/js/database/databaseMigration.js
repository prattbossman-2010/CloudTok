class CloudTokDatabaseMigration{


static run(){


if(
localStorage.getItem(
"CloudTokMigration_v1"
)
){

return;

}



console.log(
"Running CloudTok username migration..."
);



/* USERS */

const users =

JSON.parse(

localStorage.getItem(
"CloudTokUsers"
)

||

"[]"

);



users.forEach(user=>{
    
if(user.username){


user.username =

String(user.username)

.replace(/^@+/,"")

.trim()

.toLowerCase();


}


if(user.followers){


user.followers =

user.followers.map(

name=>

String(name)

.replace(/^@+/,"")

.trim()

.toLowerCase()

);


}


if(user.following){


user.following =

user.following.map(

name=>

String(name)

.replace(/^@+/,"")

.trim()

.toLowerCase()

);


}

if(typeof user.privateAccount !== "boolean"){

    user.privateAccount = false;

}

});




localStorage.setItem(

"CloudTokUsers",

JSON.stringify(users)

);






/* VIDEOS */

const videos =

JSON.parse(

localStorage.getItem(
"CloudTokVideos"
)

||

"[]"

);



videos.forEach(video=>{


if(video.username){


video.username =

String(video.username)

.replace(/^@+/,"")

.trim()

.toLowerCase();


}


if(video.likedBy){


video.likedBy =

video.likedBy.map(

name=>

String(name)

.replace(/^@+/,"")

.trim()

.toLowerCase()

);


}


});



localStorage.setItem(

"CloudTokVideos",

JSON.stringify(videos)

);






/* COMMENTS */

const comments =

JSON.parse(

localStorage.getItem(
"CloudTokComments"
)

||

"[]"

);



comments.forEach(comment=>{


if(comment.username){


comment.username =

String(comment.username)

.replace(/^@+/,"")

.trim()

.toLowerCase();


}


});



localStorage.setItem(

"CloudTokComments",

JSON.stringify(comments)

);





localStorage.setItem(

"CloudTokMigration_v1",

"done"

);



console.log(
"CloudTok migration completed."
);


}



}



CloudTokDatabaseMigration.run();