class CloudTokChat {

    constructor() {

        this.list =
document.getElementById(
    "conversationList"
);

        this.loadChats();

    }

    loadChats() {

        this.list.innerHTML = "";

        let users =
JSON.parse(
    localStorage.getItem("CloudTokUsers")
    || "[]"
);

// Add default users if they don't already exist
CloudTokDatabase.users.forEach(user=>{

    const exists =
    users.some(u=>
        u.username === user.username
    );

    if(!exists){

        users.push(user);

    }

});

        const currentUser =
        getCurrentCloudTokUser();

        users.forEach(user=>{

            if(user.username === currentUser){

                return;

            }

            const card =
            document.createElement("div");

            card.className =
            "chatCard";

            card.innerHTML = `

               <img
src="${user.avatar || "assets/images/default-avatar.png"}"
class="chatAvatar"
onerror="this.src='assets/images/default-avatar.png'">

                <div class="chatInfo">

                    <h3>${user.displayName}</h3>

                    <p>Start chatting...</p>

                </div>

            `;

            card.onclick = ()=>{

                window.location.href =
                "conversation.html?user=" +
                encodeURIComponent(user.username);

            };

            this.list.appendChild(card);

        });

    }

}

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        new CloudTokChat();

    }

);

const backBtn =
document.getElementById(
    "chatBackBtn"
);

if(backBtn){

    backBtn.onclick = ()=>{

        history.back();

    };

}