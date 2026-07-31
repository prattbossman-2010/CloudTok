const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};


export function corsHeaders(){
  return CORS_HEADERS;
}


export function handleCORS(request){


  if(request.method === "OPTIONS"){
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  return null;
}


export function withCORS(response){


  const newResponse = new Response(
    response.body,
    response
  );


  const headers = new Response(
    response.body,
    response
  ).headers;


  Object.entries(CORS_HEADERS).forEach(([key, value])=>{
    newResponse.headers.set(key, value);
  });


  return newResponse;
}
