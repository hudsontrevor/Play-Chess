export enum ChessPiece {
    King = "King",
    Queen = "Queen",
    Bishop = "Bishop",
    Rook = "Rook",
    Knight = "Knight",
    Pawn = "Pawn"
}

//  will use the board syst 
/**
 * x axis -> letters thus string 
 * y axis numbers 
 * 
 * in the form (x,y)->(string,number)
 */

export type Position = [X, Y]
export type Grid = {
    x: X[],
    y: Y[]
}
export type ChessPiecePosition<T> = {
    piece: T,
    position: Position,
    owner: SIDES,
    line_of_sight: Position[]
}
export type SIDES = "PRO" | "MASTER"


export enum BasicDirections {
    right,
    left,
    top,
    down,
}
export type X = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type Y = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const X_CEILLING = "H";
export const Y_CEILLING = 8;

export type CheckPayload = {
    oppressor: SIDES,
    piece: ChessPiece,
    available_moves_for_oppressed: AvailableMove[]
}

export type AvailableMove = {
    piece: ChessPiece,
    position: Position
}

export type MoveMake = {
    from: Position,
    to: Position,
    piece: ChessPiece,
    owner: SIDES
}

type EventAtTurnPayload = {
    move_made: MoveMake,
    whos_turto_move: SIDES
    check?: CheckPayload
    pin?: PinPayload,
}

// A pin is valid if neither the pinningg pice or the King moves as a result the pice pinned is stripped of playable moves untill either of the conditions fails to hold 
// we will need a place to store pins -- well see 
type PinPayload = {
    piece_oppressing: ChessPiecePosition<ChessPiece.Bishop | ChessPiece.Rook | ChessPiece.Queen>,
    pinned: ChessPiecePosition<ChessPiece.Bishop | ChessPiece.Rook | ChessPiece.Queen | ChessPiece.Knight | ChessPiece.Pawn>
}


export enum Events {
    NormalTurnSwitch,
    Check,
    Pin,
    Block,

}




