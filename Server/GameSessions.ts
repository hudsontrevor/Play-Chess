import { randomUUID } from "crypto";
import { GameSessionsTable, GameSessionsTableManager, QueryGameSessionsTable, TableNames } from "./GameDb";
import { GameRoom, PlayerSocket, server_reply } from "./utill";








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
    static readonly queue_player = (player: PlayerSocket, on_pair: (sockets: [PlayerSocket, PlayerSocket], room: GameRoom, destroy_room: (reason: string) => void) => void) => {
        if (!this.#queue.length) {
            this.#queue.push(player)


            //// think of server response structure 
            player.send(
                server_reply({
                    message: "Looking for opponent ... "
                })
            )
            player.pause()
            return
        } else {
            let room_code = randomUUID()
            let other_player = this.#queue.shift()!
            other_player.resume()
            let player_sckts: [PlayerSocket, PlayerSocket] = [other_player, player]
            let Room: GameRoom = new GameRoom({
                game_no: GameSessionsTable.logs_length(),
                players: player_sckts.flatMap((v) => v.user_id) as [string, string],
                room_code: room_code
            })

            QueryGameSessionsTable("insert into " + TableNames.GameSessions, { record: Room })

            const destroy_room = (reason?: string) => {
                QueryGameSessionsTable("delete from  " + TableNames.GameSessions, {
                    where: (record) => record.session.room_code == room_code,
                })
                player_sckts.forEach((v) => {
                    v.send(server_reply({
                        message: reason || "Room terminated"
                    }))
                    v.terminate();
                })
            }



            on_pair(player_sckts, Room, destroy_room)
        }
    }





}