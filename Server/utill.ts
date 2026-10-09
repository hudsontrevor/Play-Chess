
import { IncomingMessage, ServerResponse } from "http";
import { WebSocket } from "ws"
import { CookieOptions } from "./HttpServer";
// will the client send teir own key 
export interface Users {
    active: boolean
    user_id: User_Id,
    in_game_session: boolean,
    flagged: boolean,
    room_code?: GameSession["room_code"],
    logged_at: Date


}
type User_Id = string;
export interface GameSession {
    players: [User_Id, User_Id]
    game_no: number;
    room_code: string
}
export interface PlayerSocket extends WebSocket, Users { }

export const routes = {
    getAuth: "/getAuth",
    play: "/playChess"
} as const
// lets think for a minute
// how will the arch be ,
// client requests to be auth

//  /getauth
export const getBody: (request: IncomingMessage, on_error: (error: Error) => void) => Promise<string> = (request, on_error) => new Promise<string>((resolve, reject) => {
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


export const write_cookie: (cookies: CookieOptions[], response: ServerResponse<IncomingMessage> & { req: IncomingMessage }, code?: number) => void = (cookies, response, code = 200) => {
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
        response.end("Internal server error ")
    }
}


type SessionId = {
    session: string,
    found: boolean
}
export const read_cookie = (request: IncomingMessage): SessionId => {
    let sesh: SessionId = {
        session: "",
        found: false
    };
    let cookies: string[] | undefined = request.headers.cookie?.split(";")
    if (!cookies) {
        return sesh
    }
    let cookiestring: string;
    for (let i = 0; i < cookies.length; i++) {
        cookiestring = cookies[i]
        let [key, ...parts] = cookiestring.split("=")
        if (key.trim() == "USER_ID" && parts) {
            sesh.session = decodeURIComponent(parts.join("="))
            sesh.found = true
            return sesh
        }
    }
    return sesh
}


export enum Values {
    session_max_age = 24 * 60 * 60,
    session_age_check = 1 * 60 * 600
}


export interface ServerResponseStructure {



}
