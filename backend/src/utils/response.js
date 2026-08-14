export function success(data = null, message = null) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return Response.json(body);
}

export function error(message, status = 400, code = null, details = null) {
  const body = {
    success: false,
    error: message
  };
  if (code) body.code = code;
  if (details) body.details = details;

  return Response.json(body, { status });
}

// Helper for routes that already have an auth error Response
export function fromAuth(authResult) {
  if (authResult.error) return authResult.error;
  return null;
}