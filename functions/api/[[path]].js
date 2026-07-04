export async function onRequest(context) {
  const { request, env, params } = context

  if (!env.API_ORIGIN) {
    return Response.json({ error: "API proxy is not configured" }, { status: 503 })
  }

  const pathParam = params.path
  const path = Array.isArray(pathParam) ? pathParam.join("/") : (pathParam || "")
  const sourceUrl = new URL(request.url)
  const targetUrl = new URL(`/${path}`, env.API_ORIGIN)
  targetUrl.search = sourceUrl.search

  const headers = new Headers()

  const authorization = request.headers.get("Authorization")
  if (authorization) headers.set("Authorization", authorization)

  const contentType = request.headers.get("Content-Type")
  if (contentType) headers.set("Content-Type", contentType)

  const accept = request.headers.get("Accept")
  if (accept) headers.set("Accept", accept)

  if (env.API_PROXY_SECRET) {
    headers.set("X-Internal-Proxy-Secret", env.API_PROXY_SECRET)
  }

  const init = {
    method: request.method,
    headers
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = request.body
  }

  const response = await fetch(targetUrl.toString(), init)
  const responseHeaders = new Headers(response.headers)

  responseHeaders.delete("Access-Control-Allow-Origin")
  responseHeaders.delete("Access-Control-Allow-Credentials")
  responseHeaders.delete("Access-Control-Allow-Headers")
  responseHeaders.delete("Access-Control-Allow-Methods")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  })
}
