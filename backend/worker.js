export default {

async fetch(request, env){


return new Response(

"CloudTok Backend is alive 🚀",

{

status:200,

headers:{
"Content-Type":"text/plain"
}

}

);


}

};