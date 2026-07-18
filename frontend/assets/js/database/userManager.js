class CloudTokUserManager{


static getAllUsers(){


try{


return JSON.parse(

localStorage.getItem(
"CloudTokUsers"
)

) || [];


}

catch(error){


console.log(
"USER LOAD ERROR:",
error
);


return [];


}



}







static getUser(username){



if(!username){

return null;

}




const cleanUsername =

username
.replace("@","")
.toLowerCase();





const users =

this.getAllUsers();





return users.find(user=>{


return (

user.username
.replace("@","")
.toLowerCase()

===

cleanUsername

);



}) || null;



}







static getCurrentUser(){



const username =

localStorage.getItem(
"CloudTokCurrentUser"
);





if(!username){

return null;

}




return this.getUser(username);



}







static getAvatar(username){



const user =

this.getUser(username);





if(user && user.avatar){



return user.avatar;



}





return "assets/images/default-avatar.png";



}







static getDisplayName(username){



const user =

this.getUser(username);





if(user && user.displayName){



return user.displayName;



}





return username
.replace("@","");



}



}
