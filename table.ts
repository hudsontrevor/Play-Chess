import { AvailableMove, BasicDirections, ChessPiece, ChessPiecePosition, Events, Grid, MoveMake, Position, SIDES, X, X_CEILLING, Y, Y_CEILLING } from "./chessutils";

// i am thinking of not to impliment an actual table 
/**
 * Grid in the form 
 * .
 * .
 * .
 *    Pro on this side 
 * 8
 * 7
 * 6
 * 5
 * 4
 * 3
 * 2
 * 1
 *  a    b    c    d    e    f     g     h 
 *      MAster on this side 
 * 
 * 
 */

// type set = [
//     // for x transformation 
//     [BasicDirections.right | BasicDirections.left, number],
//     // for y transformation 
//     [BasicDirections.top | BasicDirections.down, number]
// ]

class Chess {
    #Grid: Grid = { x: ["A", "B", "C", "D", "E", "F", "G", "H"] as const, y: [1, 2, 3, 4, 5, 6, 7, 8] as const }
    #positions: ChessPiecePosition<ChessPiece>[] = [];
    // need to store prohin=bited moves 
    #prohibited: (MoveMake & { reason?: string | Events.Pin | Events.Check })[] = []

    is_move_prohibited = (move: MoveMake): boolean => this.#prohibited.some((v) => JSON.stringify(v.from) == JSON.stringify(move.from) && JSON.stringify(move.to) == JSON.stringify(v.to) && v.owner == move.owner)
    find_king_and_queen = (owner: SIDES): { king: Position, Queen: Position } => { return { king: this.#positions.filter((v) => v.owner == owner && v.piece == ChessPiece.King)[0].position, Queen: this.#positions.filter((v) => v.owner == owner && v.piece == ChessPiece.Queen)[0].position } }
    drop(piece: ChessPiece, owner: SIDES, position: Position) { this.#positions.push({ owner: owner, piece: piece, position: position, line_of_sight: [] }) }
    get_piece_at = (position: Position): ChessPiecePosition<ChessPiece> | undefined => this.#positions.filter((v) => JSON.stringify(v.position) == JSON.stringify(position)).at(0)






    transform_x = (position_on_x: X, direction: BasicDirections.left | BasicDirections.right): X => direction == BasicDirections.left ? this.#Grid.x[this.#Grid.x.indexOf(position_on_x) - 1 >= 0 ? this.#Grid.x.indexOf(position_on_x) - 1 : 0] : this.#Grid.x[this.#Grid.x.indexOf(position_on_x) + 1 < 8 ? this.#Grid.x.indexOf(position_on_x) + 1 : 7]
    transform_y = (position_on_y: Y, direction: BasicDirections.top | BasicDirections.down): Y => direction == BasicDirections.down ? (position_on_y - 1 > 0 ? position_on_y - 1 as Y : 1 as Y) : (position_on_y + 1 <= 8 ? position_on_y + 1 as Y : 8 as Y)
    diagonal_transform = (position: Position, direction: [BasicDirections.right | BasicDirections.left, BasicDirections.top | BasicDirections.down]): Position => [this.transform_x(position[0], direction[0]), this.transform_y(position[1], direction[1])]




    match(piece: ChessPiece, position: Position, owner: SIDES): Position[] {
        switch (piece) {
            case (ChessPiece.Bishop):
                return this.diagonal_proggression_host([...position], owner)
            case (ChessPiece.King):
                let collective: Position[] = [];
                let x_axis = [BasicDirections.left, BasicDirections.right] as const;
                let y_axis = [BasicDirections.top, BasicDirections.down] as const
                x_axis.forEach((v) => {
                    y_axis.forEach((j) => { collective.push([...this.diagonal_transform([...position], [v, j])]) })
                    let holder: Position = [this.transform_x(position[0], v), position[1]]
                        ; if (!collective.some((v) => v[0] == holder[0] && v[1] == holder[1]) && !this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] })) {
                            collective.push(holder)
                            // for efficient look ups fuck readability minimize code to O(n) i am incompetent like that
                            // happy debugging 
                        }
                });
                y_axis.forEach((v) => {
                    let holder: Position = [position[0], this.transform_y(position[1], v)]
                        ; if (!collective.some((v) => v[0] == holder[0] && v[1] == holder[1]) && !this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] })) {
                            collective.push(holder)
                        }
                })
                return collective.filter((v) => JSON.stringify(v) != JSON.stringify(position))
            case (ChessPiece.Knight):
                return this.knight_movement([...position], owner)
            case (ChessPiece.Pawn):
                let collective_pawn: Position[] = [[position[0], this.transform_y(position[1], owner == "MASTER" ? BasicDirections.top : BasicDirections.down)]];
                [BasicDirections.right, BasicDirections.left].forEach((v) => {
                    let hold: Position = this.diagonal_transform([...position], [v as BasicDirections.right | BasicDirections.left, owner == "MASTER" ? BasicDirections.top : BasicDirections.down])
                    if ((this.get_piece_at([...hold]) && this.get_piece_at([...hold])?.owner == owner) || this.is_move_prohibited({ from: position, owner: owner, piece: piece, to: hold })) { return }
                    collective_pawn.push()
                })
                return collective_pawn
            case (ChessPiece.Queen):
                return this.x_y_progression_host([...position], owner).concat(this.diagonal_proggression_host([...position], owner))
            case (ChessPiece.Rook):
                return this.x_y_progression_host(position, owner)
        }
    }

    grid_itterator(): Position[] {
        let collect: Position[] = []
        this.#Grid.y.forEach((v) => {
            this.#Grid.x.forEach((j) => {
                collect.push([j, v])
            })
        })
        return collect
    }

    // should evaluate piece moves 
    // should we evaluate possible and allowed piece moves ater evry play or should  a client send for us to evaluate 
    visualize = () => {
        // to be most comprehesive function yet 
        // should gauge interaction of pieces cut of lines of sight check check and  give available moves 

    }
    visualize_piece(piece: AvailableMove & { onwer: SIDES }): Position[] {
        let moves: Position[] = [];
        let is_prohibited: boolean;

        switch (piece.piece) {
            case (ChessPiece.Pawn):
                // we need to check wether there is a piece blocking this one or wether moving this piece is prohhibited 
                // get piece moves 
                moves = this.match(ChessPiece.Pawn, piece.position, piece.onwer)
                // lets check wether there is a piece bolcking it 
                moves.forEach((move) => {
                    is_prohibited = this.is_move_prohibited({ from: piece.position, owner: piece.onwer, piece: piece.piece, to: move })
                    if (move[0] == piece.position[0]) {
                        if (this.#positions.some((v) => JSON.stringify(v.position) == JSON.stringify(move))) {
                            moves = moves.filter((j) => JSON.stringify(j) != JSON.stringify(move))
                        }
                        return
                    }
                    if (!this.#positions.some((v) => JSON.stringify(v.position) == JSON.stringify(move) && v.owner != piece.onwer) || is_prohibited) {
                        moves = moves.filter((v) => JSON.stringify(v) != JSON.stringify(move))
                    }
                })
                return moves
            case (ChessPiece.King):
                moves = this.match(piece.piece, piece.position, piece.onwer)
                moves.forEach((move) => {
                    is_prohibited = this.is_move_prohibited({ from: piece.position, owner: piece.onwer, piece: piece.piece, to: move })
                    if (this.#positions.some((v) => JSON.stringify(v.position) == JSON.stringify(move) && v.owner == piece.onwer) || is_prohibited) {
                        moves = moves.filter((v) => JSON.stringify(move) != JSON.stringify(v))
                    }
                })
                return moves
            case (ChessPiece.Bishop):
                moves = this.match(piece.piece, piece.position, piece.onwer)
                moves











        }
        return moves

    }

    make_move(move: MoveMake): { reason: any, done: boolean } {

        if (this.#prohibited.filter((v) => JSON.stringify(v.from) == JSON.stringify(move.from) && move.piece == v.piece).length > 0) { return { done: false, reason: "MOVE PROHIBITED" } } // need to figure the output type of this message 
        if (!this.match(move.piece, move.from, move.owner).some((v) => JSON.stringify(v) == JSON.stringify(move.to))) { return { done: false, reason: "Invalid move " } }
        // if (!this.match(move.piece, move.from, move.owner).some((v) => JSON.stringify(v) == JSON.stringify(move.to))) { return { done: false, reason: "Invalid move " } }
        let status: { done: boolean, reason: any } = { done: false, reason: "PIECE NOT FOUND " }
        this.#positions.map((v) => {
            if (v.owner == move.owner && JSON.stringify(v.position) == JSON.stringify(move.from) && move.piece == v.piece) {
                v.position = move.to
                status = { done: true, reason: "DONE" }
            }
            return v
        })
        console.log("PS", this.#positions)

        return status

    }







    prime_pieces_order = [ChessPiece.Rook, ChessPiece.Knight, ChessPiece.Bishop, ChessPiece.Queen, ChessPiece.King, ChessPiece.Bishop, ChessPiece.Knight, ChessPiece.Rook] as const
    set_pieces(): void {
        if (this.#positions.length) { return }
        this.#Grid.x.forEach((v, index) => {
            this.#positions.push({ owner: "MASTER", piece: ChessPiece.Pawn, position: [v, 2], line_of_sight: this.match(ChessPiece.Pawn, [v, 2], "MASTER").filter((j) => j[0] != v[0]) })
            this.#positions.push({ owner: "MASTER", piece: this.prime_pieces_order[index], position: [v, 1], line_of_sight: this.match(this.prime_pieces_order[index], [v, 1], "MASTER") })
            this.#positions.push({ owner: "PRO", piece: ChessPiece.Pawn, position: [v, 7], line_of_sight: this.match(ChessPiece.Pawn, [v, 7], "PRO").filter((j) => j[0] != v[0]) })
            this.#positions.push({ owner: "PRO", piece: this.prime_pieces_order[index], position: [v, 8], line_of_sight: this.match(this.prime_pieces_order[index], [v, 8], "MASTER") })
        })
    }






    // impliment a fun that gauhes wether a certain transformation will be on the board 
    private knight_L(position: Position, direction: [BasicDirections.right | BasicDirections.left, BasicDirections.top | BasicDirections.down] | [BasicDirections.top | BasicDirections.down, BasicDirections.left | BasicDirections.right]): Position {
        let position_: Position = [...position];
        const eval_ = () => {
            let should_continue: boolean = false;
            if (direction[0] == BasicDirections.right || direction[0] == BasicDirections.left) {
                should_continue = direction[0] == BasicDirections.right ? (this.#Grid.x.indexOf(position_[0]) + 2 < 8 && (direction[1] == BasicDirections.top ? position_[1] + 1 <= 8 : position_[1] - 1 > 0)) : (this.#Grid.x.indexOf(position_[0]) - 2 > 0 && (direction[1] == BasicDirections.top ? position_[1] + 1 <= 8 : position_[1] - 1 > 0))
                if (!should_continue) return position
                position_[0] = this.transform_x(position_[0], direction[0])
                position_[0] = this.transform_x(position_[0], direction[0])
                position_[1] = this.transform_y(position_[1], direction[1] as BasicDirections.top | BasicDirections.down)
                return position_
            } else {
                should_continue = direction[0] == BasicDirections.top ? (position_[1] + 2 <= 8 && (direction[1] == BasicDirections.right ? this.#Grid.x.indexOf(position_[0]) + 1 < 8 : this.#Grid.x.indexOf(position_[0]) - 1 >= 0)) : (position_[1] - 2 > 0 && (direction[1] == BasicDirections.right ? this.#Grid.x.indexOf(position_[0]) + 1 < 8 : this.#Grid.x.indexOf(position_[0]) - 1 >= 0))
                if (!should_continue) return position
                position_[1] = this.transform_y(position_[1], direction[0])
                position_[1] = this.transform_y(position_[1], direction[0])
                position_[0] = this.transform_x(position_[0], direction[1] as BasicDirections.right | BasicDirections.left)
                return position_
            }
        }
        return eval_()
    }

    private knight_movement(position: Position, owner: SIDES) {
        return [
            this.knight_L([...position], [BasicDirections.right, BasicDirections.top]),
            this.knight_L([...position], [BasicDirections.right, BasicDirections.down]),
            this.knight_L([...position], [BasicDirections.left, BasicDirections.top]),
            this.knight_L([...position], [BasicDirections.left, BasicDirections.down]),
            this.knight_L([...position], [BasicDirections.top, BasicDirections.left]),
            this.knight_L([...position], [BasicDirections.top, BasicDirections.right]),
            this.knight_L([...position], [BasicDirections.down, BasicDirections.left]),
            this.knight_L([...position], [BasicDirections.down, BasicDirections.right]),
        ].filter((v) => v[0] != position[0] || (!this.get_piece_at(v) || this.get_piece_at(v)?.owner != owner))
    }








    diagonal_progression(position: Position, set: [BasicDirections.right | BasicDirections.left, BasicDirections.down | BasicDirections.top], call_back: (position: Position) => { stop: boolean, pop: boolean }): Position[] {
        let i = 0;
        let coords: Position[] = [[...position]]
        while (i < 8) {
            let hold: Position = [this.transform_x(coords[coords.length - 1][0], set[0]), this.transform_y(coords[coords.length - 1][1], set[1])]
            if (hold[0] == position[0] || hold[1] == position[1]) {
                break
            }
            coords.push(hold)
            let call = call_back(hold)
            if (call.stop || hold[0] == "H" || hold[1] == 8 || hold[0] == "A" || hold[1] == 1) {
                if (call.pop && call.stop) {
                    coords.pop()
                }
                break
            }
            i++
        }
        coords.shift()
        // anny point that preseerves an aspect of the original position is invalid 
        return coords
    }
    // if the call back to positions evaluates to true then evry position after
    diagonal_proggression_host(position: Position, owner: SIDES) {

        let collection: Position[] = []
        let hold_split = {
            own: this.#positions.filter((v) => v.owner == owner).flatMap((v) => JSON.stringify(v.position)),
            against: this.#positions.filter((v) => v.owner != owner).flatMap((v) => JSON.stringify(v.position)),
            includes: (position: Position) => hold_split.against.includes(JSON.stringify(position)) || hold_split.own.includes(JSON.stringify(position))
        }
        const call_back: (position: Position) => { stop: boolean, pop: boolean } = () => {
            return { pop: this.get_piece_at(position)?.owner == owner, stop: !!this.get_piece_at(position) }

        }
        // console.log(this.#positions)

        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.right, BasicDirections.top], call_back))
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.right, BasicDirections.down], call_back))
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.left, BasicDirections.top], call_back));
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.left, BasicDirections.down], call_back))
        return collection
    }
    private x_y_progression(posistion: Position, direction: BasicDirections, call_back: (position: Position) => { stop: boolean, pop: boolean }): Position[] {
        let coords: Position[] = [[...posistion]];

        let i: number = 0;
        let call: { stop: boolean, pop: boolean };
        while (i < 8) {
            let hold: Position;
            if (direction == BasicDirections.left || direction == BasicDirections.right) {
                hold = [this.transform_x(coords[coords.length - 1][0], direction), posistion[1]]
                if (hold[0] == posistion[0]) { break }
                coords.push(hold)
            } else {
                hold = [posistion[0], this.transform_y(coords[coords.length - 1][1], direction)]
                if (hold[1] == posistion[1]) { break }
                coords.push(hold)
            }
            call = call_back(hold)
            if (call.stop) {
                if (call.pop) {
                    coords.pop()
                }
                break
            }
            i++
        }
        coords.shift()

        return coords
    }
    private x_y_progression_host(position: Position, owner: SIDES) {
        let hold_split = {
            own: this.#positions.filter((v) => v.owner == owner).flatMap((v) => JSON.stringify(v.position)),
            against: this.#positions.filter((v) => v.owner != owner).flatMap((v) => JSON.stringify(v.position)),
            includes: (position: Position) => hold_split.against.includes(JSON.stringify(position)) || hold_split.own.includes(JSON.stringify(position))
        }
        const call_back = (position: Position): { pop: boolean, stop: boolean } => {
            return { pop: this.get_piece_at(position)?.owner == owner, stop: !!this.get_piece_at(position) }
        }
        let collection: Position[] = [];
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.right, call_back))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.left, call_back))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.top, call_back))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.down, call_back))
        return collection

    }










}

const ch = new Chess()

ch.set_pieces()
// ch.drop(ChessPiece.Bishop, "MASTER", ["E", 5])
// console.log("BISOP NDO HUYU", ch.match(ChessPiece.Bishop, ["E", 5], "MASTER"))
// console.log("BISOP NDO HUYU@", ch.diagonal_proggression_host(["E", 5], "MASTER"))
// console.log("BISOP NDO HUYU@", ch.diagonal_progression(["H", 2], [BasicDirections.left, BasicDirections.top], (position) => { return { pop: ch.get_piece_at(position)?.owner == "PRO", stop: !!ch.get_piece_at(position) } }))

console.log(ch.make_move({
    from: ["C", 2],
    owner: "MASTER",
    piece: ChessPiece.Pawn,
    to: ["C", 3]
})
)

ch.drop(ChessPiece.Bishop, "MASTER", ["E", 5])
console.log(
    "MATCH ",

    ch.match(ChessPiece.Bishop, ["F", 4], "MASTER")
)
ch.drop(ChessPiece.Bishop, "MASTER", ["F", 4])
console.log(ch.make_move({
    from: ["F", 4],
    owner: "MASTER",
    piece: ChessPiece.Bishop,
    to: ["G", 5]
}))