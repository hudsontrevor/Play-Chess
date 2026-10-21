import { WebSocketServer } from "ws";
import { IncomingMessage } from "http"
import { HttpServer } from "./HttpServer";
import { ClientResponse, get_client_response, PlayerSocket, read_cookie, routes, server_reply } from "./utill";
import { QueryGameSessionsTable, QueryUsersTable, TableNames, UsersTableManager } from "./GameDb";
import { styleText } from "util";
import { Game } from "./GameSessions";
import { EventAtTurnPayload, SIDES } from "../ChessLogic/chessutils";

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
        console.log(authcookie, "ndo hii ")
        if (!authcookie.found ||
            !QueryUsersTable("select_once from " + TableNames.Users, { where: (record) => record.user_id == authcookie.session })
        ) { call_back(false, 403, "Authentication failed "); return }
        console.log("127.0.0.1:8080")

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
    console.log(
        "Client connected "
    )
    if (!hold.found) {
        playersocket.close(403, "Missing cookies ")
    }
    console.log(
        "Client ", hold.session, "auth true "
    )
    playersocket.user_id = hold.session
    Game.queue_player(playersocket, (players, room, destroy_room) => {

        room.chess.set_pieces()
        const owners: Map<string, { side: SIDES, color: "WHITE" | "BLACK" }> = new Map<string, { side: SIDES, color: "WHITE" | "BLACK" }>([[players[0].user_id, { side: "MASTER", color: "WHITE" }], [players[1].user_id, { color: "BLACK", side: "PRO" }]])

        let oppenent_sckt: PlayerSocket;
        players.forEach((v, i) => {
            oppenent_sckt = players[i == 0 ? 1 : 0]
            v.send(server_reply({
                message: "Oppenent found .. ",
                game_details: {
                    color: owners.get(v.user_id)?.color!,
                    room_code: room.session.room_code,
                    event_at_turn_payload: {
                        whos_turto_move: owners.get(v.user_id)?.color!,

                    }
                }
            }))
            v.on("error", (error) => {
                if (v.readyState != v.OPEN) {
                    destroy_room("Opponent Disconnected ")
                }
            })
            v.on("message", (data) => {
                // if a user makes a move request and is not to play reject 
                if (owners.get(v.user_id)?.side != room.chess.key_given_to) { return }
                get_client_response(data.toString()).then((client_response: ClientResponse) => {
                    let event: EventAtTurnPayload = room.chess.visualize_board({ move_made: { ...client_response.move_made, owner: owners.get(v.user_id)?.side! }, promote: client_response.promote });
                    if (event.is_move_accepted) {
                        oppenent_sckt.send(server_reply({
                            message: "Opponent made a move ... ",
                            game_details: {
                                color: owners.get(v.user_id)?.color!,
                                event_at_turn_payload: { ...event, whos_turto_move: owners.get(oppenent_sckt.user_id)?.color! },
                                room_code: room.session.room_code
                            }
                        }))
                    } else {
                        v.send(server_reply({
                            message: "Move rejected ",
                            game_details: {
                                color: owners.get(v.user_id)?.color!,
                                event_at_turn_payload: { ...event, whos_turto_move: owners.get(v.user_id)?.color! },
                                room_code: room.session.room_code
                            }
                        }))
                    }

                }, (reason: string) => destroy_room("Opponent misbehaved "))
            })


            v.on("close", (code, reason) => destroy_room("Opponent left the room "))
        })

    })







})



// declare class Rada {
//     on(): boolean;
//     on(args: any): string;

// }

// new Rada().on()

// class tum extends Rada {
//     on(): boolean;
//     on(args: any): string;
//     on(args?: any): boolean | string {

//     }
// }
