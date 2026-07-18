window.Engine = new CloudTokEngine();


window.onload=function(){


    // Restore uploaded videos first

    if(
        typeof CloudTokUploader !== "undefined"
    ){

        CloudTokUploader.loadSavedVideos();

    }



    const topBar =
    new TopBar();


    document
    .getElementById("topBarContainer")
    .appendChild(
        topBar.element
    );




    const bottomNav =
    new BottomNav();



    document
    .getElementById("bottomNavContainer")
    .appendChild(
        bottomNav.element
    );




    Engine.init();



};