import { BasicDirections, ChessPiece, ChessPiecePosition, Grid, Position, X, X_CEILLING, Y, Y_CEILLING } from "./chessutils";

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
    #positions: ChessPiecePosition[] = [];
    #owner_rows: { owner: ChessPiecePosition["owner"], rows: 1 | 8 }[] = [{ owner: "MASTER", rows: 1 }, { owner: "PRO", rows: 8 }] as const


    transform_x = (position_on_x: X, direction: BasicDirections.left | BasicDirections.right): X => direction == BasicDirections.left ? this.#Grid.x[this.#Grid.x.indexOf(position_on_x) - 1 >= 0 ? this.#Grid.x.indexOf(position_on_x) - 1 : 0] : this.#Grid.x[this.#Grid.x.indexOf(position_on_x) + 1 < 8 ? this.#Grid.x.indexOf(position_on_x) + 1 : 7]
    transform_y = (position_on_y: Y, direction: BasicDirections.top | BasicDirections.down): Y => direction == BasicDirections.down ? (position_on_y - 1 > 0 ? position_on_y - 1 as Y : 1 as Y) : (position_on_y + 1 <= 8 ? position_on_y + 1 as Y : 8 as Y)
    diagonal_transform = (position: Position, direction: [BasicDirections.right | BasicDirections.left, BasicDirections.top | BasicDirections.down]): Position => [this.transform_x(position[0], direction[0]), this.transform_y(position[1], direction[1])]




    match(piece: ChessPiece, position: Position): Position[] {
        switch (piece) {
            case (ChessPiece.Bishop):
                return this.diagonal_proggression_host([...position])
            case (ChessPiece.King):
                let collective: Position[] = [];
                let x_axis = [BasicDirections.left, BasicDirections.right] as const;
                let y_axis = [BasicDirections.top, BasicDirections.down] as const
                x_axis.forEach((v) => {
                    y_axis.forEach((j) => { collective.push([...this.diagonal_transform([...position], [v, j])]) })
                    let holder: Position = [this.transform_x(position[0], v), position[1]]
                        ; if (!collective.some((v) => v[0] == holder[0] && v[1] == holder[1])) {
                            collective.push(holder)
                        }
                });
                console.log("after x ", collective)
                y_axis.forEach((v) => {
                    let holder: Position = [position[0], this.transform_y(position[1], v)]
                        ; if (!collective.some((v) => v[0] == holder[0] && v[1] == holder[1])) {
                            collective.push(holder)
                        }
                })
                return collective.filter((v) => JSON.stringify(v) != JSON.stringify(position))
            case (ChessPiece.Knight):
                return this.knight_movement([...position])
            case (ChessPiece.Pawn):
                let collective_pawn: Position[] = [[position[0], this.transform_y(position[1], BasicDirections.top)]];
                [BasicDirections.right, BasicDirections.left].forEach((v) => {
                    collective_pawn.push(this.diagonal_transform([...position], [v as BasicDirections.right | BasicDirections.left, BasicDirections.top]))
                })
                return collective_pawn
            case (ChessPiece.Queen):
                return this.x_y_progression_host([...position]).concat(this.diagonal_proggression_host([...position]))
            case (ChessPiece.Rook):
                return this.x_y_progression_host(position)
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




    }






    prime_pieces_order = [ChessPiece.Rook, ChessPiece.Knight, ChessPiece.Bishop, ChessPiece.Queen, ChessPiece.King, ChessPiece.Bishop, ChessPiece.Knight, ChessPiece.Rook] as const
    set_pieces(): void {
        if (this.#positions.length) { return }
        this.#Grid.x.forEach((v, index) => {
            this.#positions.push({ owner: "MASTER", piece: ChessPiece.Pawn, position: [v, 2] })
            this.#positions.push({ owner: "MASTER", piece: this.prime_pieces_order[index], position: [v, 1] })
            this.#positions.push({ owner: "PRO", piece: ChessPiece.Pawn, position: [v, 7] })
            this.#positions.push({ owner: "PRO", piece: this.prime_pieces_order[index], position: [v, 8] })
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

    private knight_movement(position: Position) {
        return [
            this.knight_L([...position], [BasicDirections.right, BasicDirections.top]),
            this.knight_L([...position], [BasicDirections.right, BasicDirections.down]),
            this.knight_L([...position], [BasicDirections.left, BasicDirections.top]),
            this.knight_L([...position], [BasicDirections.left, BasicDirections.down]),
            this.knight_L([...position], [BasicDirections.top, BasicDirections.left]),
            this.knight_L([...position], [BasicDirections.top, BasicDirections.right]),
            this.knight_L([...position], [BasicDirections.down, BasicDirections.left]),
            this.knight_L([...position], [BasicDirections.down, BasicDirections.right]),
        ].filter((v) => v[0] != position[0])
    }








    private diagonal_progression(position: Position, set: [BasicDirections.right | BasicDirections.left, BasicDirections.down | BasicDirections.top]): Position[] {
        let i = 0;
        let coords: Position[] = [[...position]]
        while (i < 8) {
            coords.push([this.transform_x(coords[coords.length - 1][0], set[0]), this.transform_y(coords[coords.length - 1][1], set[1])])
            i++
        }
        coords.shift()
        coords.forEach((v, index) => {
            if (v[0] == "H" || v[1] == 8 || v[0] == "A" || v[1] == 1) {
                coords = coords.filter((_, idx) => idx <= index)
            }
        })
        // anny point that preseerves an aspect of the original position is invalid 
        return coords.filter((v) => v[0] != position[0]).filter((g) => g[1] != position[1])
    }
    private diagonal_proggression_host(position: Position) {
        let collection: Position[] = []
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.right, BasicDirections.top]))
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.right, BasicDirections.down]))
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.left, BasicDirections.top]));
        collection = collection.concat(this.diagonal_progression([...position], [BasicDirections.left, BasicDirections.down]))
        return collection
    }





    private x_y_progression(posistion: Position, direction: BasicDirections): Position[] {
        let coords: Position[] = [[...posistion]];

        let i: number = 0;


        while (i < 8) {
            if (direction == BasicDirections.left || direction == BasicDirections.right) {
                coords.push([this.transform_x(coords[coords.length - 1][0], direction), posistion[1]])
            } else {
                coords.push([posistion[0], this.transform_y(coords[coords.length - 1][1], direction)])
            }
            i++
        }
        coords.shift()

        coords.forEach((v, index) => {
            if (((direction == BasicDirections.right || direction == BasicDirections.left) && (v[0] == "A" || v[0] == "H")) || ((direction == BasicDirections.top || direction == BasicDirections.down) && (v[1] == 1 || v[1] == 8))) {
                coords = coords.filter((_, idx) => idx <= index)
            }
        })

        if (direction == BasicDirections.down || direction == BasicDirections.top) {
            coords = coords.filter((v) => v[1] != posistion[1])
        } else {
            coords = coords.filter((v) => v[0] != posistion[0])

        }
        return coords
    }

    private x_y_progression_host(position: Position) {
        let collection: Position[] = [];
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.right))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.left))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.top))
        collection = collection.concat(this.x_y_progression([...position], BasicDirections.down))
        return collection

    }










}

const ch = new Chess()
ch.set_pieces()
console.log(ch.match(ChessPiece.King, ["C", 3]))
