class Feed{


constructor(){


    this.container =
    document.getElementById(
        "feedContainer"
    );


    this.cards = [];


    this.activeIndex = 0;


}







addCard(card){



    if(!card){

        return;

    }



    this.cards.push(card);



    if(
        this.container &&
        card.element
    ){

        this.container.appendChild(
            card.element
        );

    }



}








removeCard(index){



    if(
        index < 0 ||
        index >= this.cards.length
    ){

        return;

    }



    const card =
    this.cards[index];



    if(card){


        if(
            typeof card.destroy === "function"
        ){

            card.destroy();

        }



        if(card.element){

            card.element.remove();

        }


    }



    this.cards.splice(
        index,
        1
    );




    if(
        this.activeIndex >= this.cards.length
    ){

        this.activeIndex =
        Math.max(
            0,
            this.cards.length - 1
        );

    }



}








clear(){



    this.cards.forEach(card=>{


        if(
            card &&
            typeof card.destroy === "function"
        ){

            card.destroy();

        }



        if(
            card &&
            card.element
        ){

            card.element.remove();

        }



    });



    this.cards = [];



    if(this.container){

        this.container.innerHTML =
        "";

    }



    this.activeIndex = 0;



}








getCard(index){



    if(
        index < 0 ||
        index >= this.cards.length
    ){

        return null;

    }



    return this.cards[index];



}








getLength(){


    return this.cards.length;


}








setActive(index){



    if(
        index < 0 ||
        index >= this.cards.length
    ){

        return;

    }



    this.activeIndex = index;



}








getActive(){



    return this.getCard(
        this.activeIndex
    );



}








pauseAll(){



    this.cards.forEach(card=>{



        if(
            card &&
            typeof card.pause === "function"
        ){

            card.pause();

        }



    });



}








play(index){



    const card =
    this.getCard(index);



    if(
        card &&
        typeof card.play === "function"
    ){

        card.play();

    }



}








forEach(callback){



    this.cards.forEach(
        callback
    );



}








destroy(){



    this.clear();



    this.container =
    null;



}



}