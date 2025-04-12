export const make400 = (statusText = "Bad Request"): Response =>
  new Response(null, { status: 400, statusText });
export const make404 = (statusText = "Not Found"): Response =>
  new Response(null, { status: 404, statusText });
export const make405 = (statusText = "Method Not Allowed"): Response =>
  new Response(null, { status: 405, statusText });
export const make416 = (statusText = "Range Not Satisfiable"): Response =>
  new Response(statusText, { status: 416, statusText });
