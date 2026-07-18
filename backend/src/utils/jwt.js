const encoder = new TextEncoder();


function base64UrlEncode(data) {

  return btoa(
    String.fromCharCode(...new Uint8Array(data))
  )
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=/g, "");

}


function base64UrlDecode(str) {

  str = str
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const binary = atob(str);

  return Uint8Array.from(
    binary,
    c => c.charCodeAt(0)
  );

}


export async function createToken(payload, secret) {

  const now = Math.floor(Date.now() / 1000);

  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (60 * 60 * 24 * 7)
  };

  const header = {
    alg: "HS256",
    typ: "JWT"
  };


  const encodedHeader =
    btoa(JSON.stringify(header));


  const encodedPayload =
    btoa(JSON.stringify(tokenPayload));


  const data =
    `${encodedHeader}.${encodedPayload}`;


  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );


  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data)
    );


  return `${data}.${base64UrlEncode(signature)}`;

}


export async function verifyToken(token, secret) {

  try {

    const [
      encodedHeader,
      encodedPayload,
      signature
    ] = token.split(".");


    const data =
      `${encodedHeader}.${encodedPayload}`;


    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );


    const valid =
      await crypto.subtle.verify(
        "HMAC",
        key,
        base64UrlDecode(signature),
        encoder.encode(data)
      );


    if (!valid) {
      return null;
    }


    const decoded =
  JSON.parse(
    atob(encodedPayload)
  );


if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {

  return null;

}


return decoded;


  } catch {

    return null;

  }

}
