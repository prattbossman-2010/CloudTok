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


export async function withCORS(responseOrPromise){

  try{

  const response = await responseOrPromise;

  const newHeaders = new Headers(response.headers);

  Object.entries(CORS_HEADERS).forEach(([key, value])=>{
    newHeaders.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });

  }
  catch(error){

  return new Response(JSON.stringify({error:error.message||"Internal error"}),{
    status:500,
    headers:{...CORS_HEADERS,"Content-Type":"application/json"}
  });

  }

}
