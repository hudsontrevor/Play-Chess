import { createServer, IncomingMessage, Server, ServerResponse } from "http"
import { routes, Values, write_cookie } from "./utill";
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
            value: auth_user(),
            httpOnly: true,
            maxAge: Values.session_max_age,
            sameSite: "Lax",
            secure: true

        }], response, 500)
        response.end(JSON.stringify({ status: "Authorized to play !" }))
        response.write(200)
        return

    } else {
        if (!(request.headers.upgrade?.toLowerCase() == "websocket")) {
            response.writeHead(400)
            response.end("Url requires an upgrade")
        }

        return
    }

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

HttpServer.listen(8080, () => {
    console.log("HTTP SERVER ON ")
})




