import WebSocket, { createWebSocketStream, VerifyClientCallbackAsync, WebSocketServer } from "ws";
import { createServer, IncomingMessage, Server } from "http"
import { Database } from "../DatabaseTS/DbSchema"
import { Query } from "../DatabaseTS/QueryClient";
import { HttpServer } from "./HttpServer";


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
    port: 8080,
    verifyClient({ origin, req, secure }: {
        origin: string;
        secure: boolean;
        req: IncomingMessage
    }, call_back) {



    },
    //  handleProtocols(protocols, request) {


    // },
    clientTracking: true,
    // do proper socket routing 
    path: ,
    // get server here 
    server: HttpServer,
    host: "rada"

})
console.log("RAD BRO ")