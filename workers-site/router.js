/**
 * Helper functions that when passed a request will return a
 * boolean indicating if the request uses that HTTP method,
 * header, host or referrer.
 */
const Method = method => req =>
    req.method.toLowerCase() === method.toLowerCase()
const Connect = Method('connect')
const Delete = Method('delete')
const Get = Method('get')
const Head = Method('head')
const Options = Method('options')
const Patch = Method('patch')
const Post = Method('post')
const Put = Method('put')
const Trace = Method('trace')

const Header = (header, val) => req => req.headers.get(header) === val
const Host = host => Header('host', host.toLowerCase())
const Referrer = host => Header('referrer', host.toLowerCase())

const Path = regExp => req => {
    const url = new URL(req.url)
    const path = url.pathname
    const match = path.match(regExp) || []
    return match[0] === path
}

const GitHubEvent = name => Header('x-github-event', name)

function hex2buf(hex) {
  return new Uint8Array(hex.match(/../g).map(h => parseInt(h, 16)))
}

async function processWebHook(event, secret, handler) {
  try {
    const request = event.request
    const signature = request.headers.get("x-hub-signature")
    const payload = await request.arrayBuffer()

    const [ signature_algorithm, signature_data ] = signature.split('=')

    const keyData = new TextEncoder().encode(secret)
    const hmacImportParams = {'name': 'HMAC', hash: 'SHA-1'}
    const key = await crypto.subtle.importKey(
        /*format*/'raw', keyData, /*algorithm*/hmacImportParams, /*exportable*/ false, /*usages*/ ['verify'])
    const verify = await crypto.subtle.verify(
        /*algorithm*/{'name': 'HMAC'}, key, hex2buf(signature_data), payload)

    if (!verify) {
      throw 'Failed to validate signature'
    }

    const utf8Decoder = new TextDecoder('utf-8', {fatal: true})
    const json = JSON.parse(utf8Decoder.decode(payload))

    return handler(event, json)
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
  }
}

/**
 * The Router handles determines which handler is matched given the
 * conditions present for each request.
 */
export class Router {
    constructor() {
        this.routes = []
    }

    handle(conditions, handler) {
        this.routes.push({
            conditions,
            handler,
        })
        return this
    }

    connect(url, handler) {
        return this.handle([Connect, Path(url)], handler)
    }

    delete(url, handler) {
        return this.handle([Delete, Path(url)], handler)
    }

    get(url, handler) {
        return this.handle([Get, Path(url)], handler)
    }

    head(url, handler) {
        return this.handle([Head, Path(url)], handler)
    }

    options(url, handler) {
        return this.handle([Options, Path(url)], handler)
    }

    patch(url, handler) {
        return this.handle([Patch, Path(url)], handler)
    }

    post(url, handler) {
        return this.handle([Post, Path(url)], handler)
    }

    put(url, handler) {
        return this.handle([Put, Path(url)], handler)
    }

    trace(url, handler) {
        return this.handle([Trace, Path(url)], handler)
    }

    webhook(name, secret, handler) {
        return this.handle([Post, GitHubEvent(name)], (event, options) => processWebHook(event, secret, handler))
    }

    all(handler) {
        return this.handle([], handler)
    }

    route(req) {
        const route = this.resolve(req)

        if (route) {
            return route.handler(req)
        }

        return new Response('resource not found', {
            status: 404,
            statusText: 'not found',
            headers: {
                'content-type': 'text/plain',
            },
        })
    }

    /**
     * resolve returns the matching route for a request that returns
     * true for all conditions (if any).
     */
    resolve(req) {
        return this.routes.find(r => {
            if (!r.conditions || (Array.isArray(r) && !r.conditions.length)) {
                return true
            }

            return r.conditions.every(c => c(req))
        })
    }
}
