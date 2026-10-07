import { METHODS } from "http";
import { Database } from "../DatabaseTS/DbSchema";
import { Query } from "../DatabaseTS/QueryClient";
import { Users, GameSession } from "./utill";
import { query } from "../DatabaseTS/DBtypes";

const ChessDatabase: Database = new Database()
export const TableNames = {
    Users: "Users",
    GameSessions: "GameSessions "
} as const

ChessDatabase.declare_table<Users>(TableNames.Users);
ChessDatabase.declare_table<GameSession>(TableNames.GameSessions);
const QueryClient: Query = new Query(ChessDatabase)


export let QueryUsersTable = (query_: string, details?: query<Users>[2]) => {
    QueryClient.query_table<Users>(query_, details)
}

// QueryUsersTable("insert into Users", { record: { active: false, flagged: false, in_game_session: false, logged_at: new Date(), user_id: "reds " } })

export const QueryGameSessionsTable = (query_: string, details?: query<GameSession>[2]) => {
    QueryClient.query_table<GameSession>(query_, details)
}




