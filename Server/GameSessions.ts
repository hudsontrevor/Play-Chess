import { randomUUID } from "crypto";
import { GameSessionsTable, GameSessionsTableManager, QueryGameSessionsTable, TableNames } from "./GameDb";
import { GameRoom, PlayerSocket } from "./utill";








//    DELETE = "DELETE",
//     INHERIT = "INHERIT",
//     INSERT = "INSERT",
//     INSERT_IF_EVERY = "INSERT_IF_EVERY",
//     INSERT_IF_SOME = "INSERT_IF_SOME",
//     SELECT_ALL = "SELECT_ALL",
//     SELECT_ONCE = "SELECT_ONCE",
//     SET = "SET",
//     UPDATE_ALL = "UPDATE_ALL",
//     UPDATE_ONCE = "UPDATE_ONCE",
//     WIPE = "WIPE",
//     ABSORB = "ABSORB",
export class Game {
    static #queue: PlayerSocket[] = []
    constructor() { }
    static readonly queue_player = (player: PlayerSocket, on_pair: (sockets: [PlayerSocket, PlayerSocket], room: GameRoom) => void) => {
        if (!this.#queue.length) {
            this.#queue.push(player)


            //// think of server response structure 
            player.send(

            )

            // think of communication structure to start proccessing payloads 




            return
        } else {
            let room_code = randomUUID()
            let player_sckts: [PlayerSocket, PlayerSocket] = [player, this.#queue.shift()!]
            let Room: GameRoom = new GameRoom({
                game_no: GameSessionsTable.logs_length(),
                players: player_sckts.flatMap((v) => v.user_id) as [string, string],
                room_code: room_code
            })
            QueryGameSessionsTable("insert into " + TableNames.GameSessions, { record: Room })
            on_pair(player_sckts, Room)
        }
    }



}