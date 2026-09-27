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
export type ChessPiecePosition = {
    piece: ChessPiece,
    position: Position,
    owner: SIDES
}
type SIDES = "PRO" | "MASTER"


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

type AvailableMove = {
    piece: ChessPiece,
    position: Position
}


type EventAtTurnPayload = {
    move_made: AvailableMove,
    whos_turto_move: SIDES
    check: CheckPayload
}

// A pin is valid if neither the pinningg pice or the King moves as a result the pice pinned is stripped of playable moves untill either of the conditions fails to hold 
// we will need a place to store pins -- well see 
type PinPayload = {
    piece_oppressing: ChessPiece,
    pinned: ChessPiece,
}


enum Events {
    NormalTurnSwitch,
    Check,
    Pin,
    Block
}


