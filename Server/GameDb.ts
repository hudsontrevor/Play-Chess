import { Database } from "../DatabaseTS/DbSchema";
import { Query } from "../DatabaseTS/QueryClient";
import { Users, Values, GameRoom } from "./utill";
import { query } from "../DatabaseTS/DBtypes";
import { ManageTable } from "../DatabaseTS/TableManager";



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

const ChessDatabase: Database = new Database()
export const TableNames = {
    Users: "Users",
    GameSessions: "GameSessions "
} as const

const UsersTable = ChessDatabase.declare_table<Users>(TableNames.Users);
export const GameSessionsTable = ChessDatabase.declare_table<GameRoom>(TableNames.GameSessions);
export const UsersTableManager = new ManageTable<Users>(UsersTable, {
    queries: [
        { always: true, after: Values.session_age_check, query: "delete from " + TableNames.Users, details: { where: (record) => new Date().getTime() - record.logged_at.getTime() >= Values.session_max_age * 1000 } }
    ],
    on_this_thread: false,
})



export const GameSessionsTableManager: ManageTable<GameRoom> = new ManageTable<GameRoom>(GameSessionsTable, { queries: [] });

const QueryClient: Query = new Query(ChessDatabase)
export let QueryUsersTable = (query_: string, details?: query<Users>[2]) => {
    let res = QueryClient.query_table<Users>(query_, details, UsersTable)
    return res
}


export const QueryGameSessionsTable = (query_: string, details?: query<GameRoom>[2]) => {
    let res = QueryClient.query_table<GameRoom>(query_, details, GameSessionsTable)
    return res
}




