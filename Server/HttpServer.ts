import { createServer, IncomingMessage, Server, ServerResponse } from "http"
import { routes } from "./utill";
import { randomUUID } from "crypto";
import { QueryUsersTable, TableNames } from "./GameDb";
// 
// DELETE = "DELETE",
// INHERIT = "INHERIT",
// INSERT = "INSERT",
// INSERT_IF_EVERY = "INSERT_IF_EVERY",
// INSERT_IF_SOME = "INSERT_IF_SOME",
// SELECT_ALL = "SELECT_ALL",
// SELECT_ONCE = "SELECT_ONCE",
// SET = "SET",
// UPDATE_ALL = "UPDATE_ALL",
// UPDATE_ONCE = "UPDATE_ONCE",
// WIPE = "WIPE",
// ABSORB = "ABSORB",


// well se weher to impliment a manager for tables 

const auth_user = (): string => {
    let id = randomUUID()
    QueryUsersTable("insert into Users", {
        record: {
            active: false,
            flagged: false,
            in_game_session: false,
            logged_at: new Date(),
            user_id: id,
        }
    })
    return id

}
export const HttpServer: Server = createServer((request, response) => {
    if (!Object.values(routes).includes(request.url as typeof routes.getAuth | typeof routes.play)) {
        response.writeHead(400)
        response.end("Url not found ")
    }

    if (request.url == routes.getAuth) {
        write_cookie([{
            name: "USER_ID",
            value: auth_user()
        }], response, 500)
        response.end(JSON.stringify({ status: "Authorized to play !" }))
        response.write(200)
        return

    } else {
        if (!(request.headers.upgrade?.toLowerCase() == "websocket")) {
            response.writeHead(400)
            // for ws dummy 
            response.end("Url requires an upgrade")
        }
        return
    }

    response.end("Server Error ")
    response.writeHead(500)








})

export interface CookieOptions {
    name: string;
    value: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    maxAge?: number;
}

const write_cookie: (cookies: CookieOptions[], response: ServerResponse<IncomingMessage> & { req: IncomingMessage }, code?: number) => void = (cookies, response, code = 200) => {
    response.appendHeader("set-cookie", cookies.flatMap((cookie) => {
        let { name, value } = cookie;
        let parts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
        if (cookie.httpOnly) parts.push('HttpOnly');
        if (cookie.secure) parts.push('Secure');
        if (cookie.sameSite) parts.push(`SameSite=${cookie.sameSite}`);
        if (cookie.path) parts.push(`Path=${cookie.path}`);
        if (cookie.maxAge) parts.push(`Max-Age=${cookie.maxAge}`);
        return parts.join("; ")

    }))
    if (!response.headersSent) {
        response.statusCode = code;
    }
}

const getBody: (request: IncomingMessage, on_error: (error: Error) => void) => Promise<string> = (request, on_error) => new Promise<string>((resolve, reject) => {
    let accumulatedChunks: Buffer[] = [];
    request.on("data", (chunk) => {
        accumulatedChunks.push(chunk);
        if (Buffer.concat(accumulatedChunks).length > 1 * 1024 * 1024) {
            request.destroy()
            reject(new Error("Buffer stream too large "))
        }
    })
    request.on("end", () => {
        resolve(Buffer.concat(accumulatedChunks).toString("utf8"))
    })
    request.on("error", (error) => { on_error(error); reject(error) })
})


