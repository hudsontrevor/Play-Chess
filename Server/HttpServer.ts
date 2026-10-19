import { createServer, IncomingMessage, Server, ServerResponse } from "http"
import { routes, Users, Values, write_cookie } from "./utill";
import { randomUUID } from "crypto";
import { QueryUsersTable, TableNames, UsersTableManager } from "./GameDb";
import { Queries } from "../DatabaseTS/DbQueries";
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

// get rid of old id sessions and preserve the newest 
// each 
UsersTableManager.add_query({
    query: Queries.DELETE, details: {
        where: (record, index, table) => {
            let records = table.filter((rec) => rec.ip_addr = record.ip_addr)
            if (records.length == 1) {
                return false
            }
            if (Math.max(...records.flatMap((rec) => rec.logged_at.getTime())) != record.logged_at.getTime()) {
                return true
            }
            return false
        }
    }, after: 20 * 60, always: true
})

const auth_user = (ip__addr: string): string => {

    // the authors for the game db were so high that this is bad code, the one commented 
    // the query below will go through the entire table  to return 
    // the logic is fine but the bottle neck  
    // app not scallable 
    // since auth is not tied to any valuable resource lets just delete junk id 


    // handle tasks to // table manager done above 

    // new id is assigned indefinetly 




    /**
     * 
     * let pre_record = (QueryUsersTable("select_once from " + TableNames.Users, { where: (record) => record.ip_addr == ip__addr }) as Users | undefined)
    if (pre_record && ip__addr != "") {
        return pre_record.user_id
    }
     */





    let id = randomUUID()
    QueryUsersTable("set into Users", {
        record: {
            active: false,
            flagged: false,
            in_game_session: false,
            logged_at: new Date(),
            user_id: id,
            ip_addr: ip__addr,
            room_code: undefined
        }
    })
    return id

}
export const HttpServer: Server = createServer((request, response) => {
    if (!Object.values(routes).includes(request.url as typeof routes.getAuth | typeof routes.play)) {
        response.writeHead(400)
        console.log(QueryUsersTable("select_all from " + TableNames.Users, { where: (record) => true }))
        response.end("Url not found " + `${JSON.stringify(QueryUsersTable("select_all from " + TableNames.Users, { where: (record) => true })?.length)}`)
        return
    }

    console.log(
        "Request on http server ..", request.headers.host, request.url
    )
    if (request.url == routes.getAuth) {
        write_cookie([{
            name: "USER_ID",
            value: auth_user(request.headers.host || ""),
            httpOnly: true,
            maxAge: Values.session_max_age,
            sameSite: "Lax",
            secure: true

        }], response, 500)
        // console.log("binary")
        response.write("Connected successfully ")
        response.end(JSON.stringify({ status: "Authorized to play !" }))
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
    console.log("HTTP SERVER ON listening on ", 8080)
})




