class CloudTokConversation {


constructor(){


    const params =
    new URLSearchParams(
        window.location.search
    );


    this.username =
    params.get("user");


    this.name =
    document.getElementById(
        "conversationName"
    );

    this.avatar =
document.getElementById(
    "conversationAvatar"
);

    this.messages =
    document.getElementById(
        "messageList"
    );


    this.input =
    document.getElementById(
        "messageInput"
    );


    this.sendBtn =
    document.getElementById(
        "sendMessageBtn"
    );


    this.setup();


}



setup(){


    this.loadUser();


    this.loadMessages();


    this.setupButtons();


}



loadUser(){


    let users =
    JSON.parse(

        localStorage.getItem(
            "CloudTokUsers"
        )

        ||

        "[]"

    );



    const user =
    users.find(
        u=>
        u.username === this.username
    );



    if(user){


    this.name.textContent =
    user.displayName;



    if(this.avatar){

        this.avatar.src =
        user.avatar ||
        "assets/images/default-avatar.png";


    }


}

    else{

    this.name.textContent =
    this.username;


    if(this.avatar){

        this.avatar.src =
        "assets/images/default-avatar.png";

    }

}


}





loadMessages(){


    const key =
    "CloudTokChat_" +
    this.username;



    const messages =
    JSON.parse(

        localStorage.getItem(key)

        ||

        "[]"

    );



    this.messages.innerHTML="";



    messages.forEach(msg=>{


        const bubble =
        document.createElement("div");



        bubble.className =
        msg.sender === getCurrentCloudTokUser()

        ?

        "message sent"

        :

        "message received";



        bubble.textContent =
        msg.text;



        this.messages.appendChild(
            bubble
        );



    });



}







sendMessage(){


    const text =
    this.input.value.trim();



    if(!text){

        return;

    }



    const key =
    "CloudTokChat_" +
    this.username;



    let messages =
    JSON.parse(

        localStorage.getItem(key)

        ||

        "[]"

    );



    messages.push({

        sender:
        getCurrentCloudTokUser(),

        text:text,

        time:
        Date.now()

    });



    localStorage.setItem(

        key,

        JSON.stringify(messages)

    );



    this.input.value="";


    this.loadMessages();



}






setupButtons(){



    this.sendBtn.onclick = ()=>{

        this.sendMessage();

    };





    this.input.addEventListener(
        "keypress",
        e=>{


            if(e.key==="Enter"){

                this.sendMessage();

            }


        }
    );





    const back =
    document.getElementById(
        "conversationBackBtn"
    );



    if(back){

        back.onclick = ()=>{

            history.back();

        };

    }


}




}



document.addEventListener(

"DOMContentLoaded",

()=>{

    new CloudTokConversation();

}

);