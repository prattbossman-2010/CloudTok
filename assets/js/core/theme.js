class CloudTokTheme{


static apply(){

const theme =

localStorage.getItem(
"CloudTokTheme"
)

||

"dark";


if(theme === "light"){


document.body.classList.add(
"lightTheme"
);

document.body.classList.remove(
"darkTheme"
);


}
else{


document.body.classList.add(
"darkTheme"
);

document.body.classList.remove(
"lightTheme"
);


}


}



}


document.addEventListener(

"DOMContentLoaded",

()=>{

CloudTokTheme.apply();

}

);