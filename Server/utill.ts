
import { WebSocket } from "ws"
// will the client send teir own key 
export interface Users {
    active: false
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