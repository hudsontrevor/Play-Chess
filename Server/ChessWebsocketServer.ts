import { WebSocketServer } from "ws";
import { IncomingMessage } from "http"
import { HttpServer } from "./HttpServer";
import { PlayerSocket, read_cookie, routes } from "./utill";
import { QueryUsersTable, TableNames } from "./GameDb";
import { styleText } from "util";

// we can instatsiate an instance of our database 
// we can have a users table and a playing session table 




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







const WsServer: WebSocketServer = new WebSocketServer({
    verifyClient({ req }: {
        origin: string;
        secure: boolean;
        req: IncomingMessage
    }, call_back) {
        let authcookie = read_cookie(req)
        if (!authcookie.found ||
            !QueryUsersTable("select_once from " + TableNames.Users, { where: (record) => record.user_id == authcookie.session })
        ) { call_back(false, 403, "Authentication failed "); return }

        QueryUsersTable("update_once into " + TableNames.Users, {
            call_back(record) { if (record.user_id == authcookie.session) { record.active = true; return true }; return false }
        }
        )
        // update server response structure 
        call_back(true, 400, "Authentication successfull ")
        return
    },
    handleProtocols(protocols) {
        if (protocols.has("application/json")) {
            return "application/json"
        }
        return false
    },
    clientTracking: true,
    path: routes.play,
    server: HttpServer,
})

console.log(styleText("bgGreen", "WEBSOCKET CHESS SERVER RUNNING --- "))
WsServer.on("connection", (playersocket: PlayerSocket, request: IncomingMessage) => {
    const hold = read_cookie(request)
    if (!hold.found) {
        playersocket.close(403, "Missing cookies ")
    }
    playersocket.user_id = hold.session







})


