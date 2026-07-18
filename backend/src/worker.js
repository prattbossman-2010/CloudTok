export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") {
      return new Response("CloudTok Backend is alive 🚀", {
        status: 200,
        headers: {
          "Content-Type": "text/plain"
        }
      });
    }

    if (path === "/api") {
      return Response.json({
        name: "CloudTok API",
        version: "1.0.0",
        status: "online"
      });
    }

    if (path === "/api/health") {
      return Response.json({
        status: "healthy",
        uptime: "running"
      });
    }

    if (path === "/api/version") {
      return Response.json({
        version: "1.0.0"
      });
    }

    return new Response("404 - Endpoint Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  }
};export default {

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
