import { AvailableMove, BasicDirections, CheckPayload, ChessPiece, ChessPiecePosition, EventAtTurnPayload, EventLogger, Events, Grid, MoveMake, PinPayload, Position, PromotionDetails, SIDES, X, X_CEILLING, Y, Y_CEILLING } from "./chessutils";

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

    // we may intro duce a hash map for efficients position lookups but to be seen 
    #positions: ChessPiecePosition<ChessPiece>[] = [];
    // need to store prohin=bited moves 
    #prohibited: (MoveMake & { reason?: string | Events.Pin | Events.Check })[] = []

    is_move_prohibited = (move: MoveMake): boolean => this.#prohibited.some((v) => JSON.stringify(v.from) == JSON.stringify(move.from) && JSON.stringify(move.to) == JSON.stringify(v.to) && v.owner == move.owner && v.piece == move.piece)
    find_king_and_queen = (owner: SIDES): { king: Position, Queen: Position } => { return { king: this.#positions.filter((v) => v.owner == owner && v.piece == ChessPiece.King)[0].position, Queen: this.#positions.filter((v) => v.owner == owner && v.piece == ChessPiece.Queen)[0].position } }
    drop(piece: ChessPiece, owner: SIDES, position: Position) { this.#positions.push({ owner: owner, piece: piece, position: position, line_of_sight: [] }) }
    get_piece_at = (position: Position): ChessPiecePosition<ChessPiece> | undefined => this.#positions.filter((v) => JSON.stringify(v.position) == JSON.stringify(position)).at(0)

    readonly getGradient = (pi: Position, p2: Position): number => p2[1] == pi[1] ? Infinity : (pi[1] - p2[1]) / (this.#Grid.x.indexOf(pi[0]) - this.#Grid.x.indexOf(p2[0]))






    transform_x = (position_on_x: X, direction: BasicDirections.left | BasicDirections.right): X => direction == BasicDirections.left ? this.#Grid.x[this.#Grid.x.indexOf(position_on_x) - 1 >= 0 ? this.#Grid.x.indexOf(position_on_x) - 1 : 0] : this.#Grid.x[this.#Grid.x.indexOf(position_on_x) + 1 < 8 ? this.#Grid.x.indexOf(position_on_x) + 1 : 7]
    transform_y = (position_on_y: Y, direction: BasicDirections.top | BasicDirections.down): Y => direction == BasicDirections.down ? (position_on_y - 1 > 0 ? position_on_y - 1 as Y : 1 as Y) : (position_on_y + 1 <= 8 ? position_on_y + 1 as Y : 8 as Y)
    diagonal_transform = (position: Position, direction: [BasicDirections.right | BasicDirections.left, BasicDirections.top | BasicDirections.down]): Position => [this.transform_x(position[0], direction[0]), this.transform_y(position[1], direction[1])]






    match(piece: ChessPiece, position: Position, owner: SIDES, options: { include_all_for_pawn: boolean } = { include_all_for_pawn: false }): Position[] {
        switch (piece) {
            case (ChessPiece.Bishop):
                return this.diagonal_proggression_host([...position], owner)
            case (ChessPiece.King):
                let collective: Position[] = [];
                let x_axis = [BasicDirections.left, BasicDirections.right] as const;
                let y_axis = [BasicDirections.top, BasicDirections.down] as const
                x_axis.forEach((v) => {
                    y_axis.forEach((j) => {
                        let diagonaly: Position = [...this.diagonal_transform([...position], [v, j])]
                        if (!this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: diagonaly }) && this.get_piece_at([...diagonaly])?.owner != owner) {
                            collective.push(diagonaly)
                        }
                        // let holder: Position = [position[0], this.transform_y(position[1], j)]
                        // if (collective.some((v) => v[0] == holder[0] || v[1] == holder[1]) || this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] })) {
                        //     return
                        // }
                        // collective.push(holder)

                    })

                    let holder: Position = [this.transform_x(position[0], v), position[1]]
                    if (collective.some((v) => v[0] == holder[0] && v[1] == holder[1]) || this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] }) || this.get_piece_at([...holder])?.owner == owner) {
                        return
                    }
                    // console.log("REDSE", holder, (!!this.get_piece_at([...holder]) && this.get_piece_at([...holder])?.owner == owner))
                    collective.push(holder)
                });
                y_axis.forEach((v) => {
                    let holder: Position = [position[0], this.transform_y(position[1], v)]
                    if (collective.some((v) => v[0] == holder[0] && v[1] == holder[1]) || this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] }) || this.get_piece_at([...holder])?.owner == owner) {
                        // console.log("THIS ", !this.is_move_prohibited({ from: position, owner: owner, piece: ChessPiece.King, to: [...holder] }), holder)
                        return
                    }
                    // console.log("REDSE Y ", holder, (!!this.get_piece_at([...holder]) && this.get_piece_at([...holder])?.owner == owner))
                    collective.push(holder)
                })

                return collective
            case (ChessPiece.Knight):
                return this.knight_movement([...position], owner)
            case (ChessPiece.Pawn):
                let collective_pawn: Position[] = [[position[0], this.transform_y(position[1], owner == "MASTER" ? BasicDirections.top : BasicDirections.down)]];
                [BasicDirections.right, BasicDirections.left].forEach((v) => {
                    let hold: Position = this.diagonal_transform([...position], [v as BasicDirections.right | BasicDirections.left, owner == "MASTER" ? BasicDirections.top : BasicDirections.down])
                    if ((collective_pawn.some((v) => JSON.stringify(v) == JSON.stringify(hold))) || (!(this.get_piece_at([...hold]) && this.get_piece_at([...hold])?.owner != owner) && !options?.include_all_for_pawn) || this.is_move_prohibited({ from: position, owner: owner, piece: piece, to: hold })) { return }
                    collective_pawn.push(hold)
                })
                return collective_pawn
            case (ChessPiece.Queen):
                return this.x_y_progression_host([...position], owner).concat(this.diagonal_proggression_host([...position], owner))
            case (ChessPiece.Rook):
                return this.x_y_progression_host(position, owner)
        }
    }

    grid_itterator(call_back: (p1: Position) => void = (pi) => { }): Position[] {
        let collect: Position[] = []
        this.#Grid.y.forEach((v) => {
            this.#Grid.x.forEach((j) => {
                call_back([j, v])
                collect.push([j, v])
            })
        })
        return collect
    }

    // should evaluate piece moves 
    // should we evaluate possible and allowed piece moves ater evry play or should  a client send for us to evaluate 

    // to check wether a value is shared in botha arrays 

    // very inefficient code to refactor later 

    // need to impliment a function that gauges wether a point is between two point 
    readonly point_sum = (position: Position): number => this.#Grid.x.indexOf(position[0]) + position[1] + 1
    readonly is_between = (point_to_evaluate: Position, gauge: [Position, Position]): boolean => {
        // a point is between any two if it lies on the same line as the two 


        // need to impliment a special evaluation for points on the y axis 

        if (this.getGradient(point_to_evaluate, gauge[0]) != this.getGradient(gauge[0], gauge[1])) { return false }
        //  console.log(this.getGradient(point_to_evaluate, gauge[0]), this.getGradient(gauge[0], gauge[1]), "FAIL ");
        // console.log("JUST DEG ", this.point_sum(point_to_evaluate), this.point_sum(gauge[0]), this.point_sum(gauge[1]))
        return this.point_sum(point_to_evaluate) >= (this.point_sum(gauge[0]) > this.point_sum(gauge[1]) ? this.point_sum(gauge[1]) : this.point_sum(gauge[0])) && this.point_sum(point_to_evaluate) <= (this.point_sum(gauge[0]) > this.point_sum(gauge[1]) ? this.point_sum(gauge[0]) : this.point_sum(gauge[1]))
    }

    in_both<T>(arr1: T[], arr2: T[]): T {
        // lets use a hash set 
        let hashSet = new Set<string>()

        // should go over the itteration for the longest arr 
        let compose = {
            longest: arr1.length < arr2.length ? arr2 : arr1,
            shortest: arr1.length > arr2.length ? arr2 : arr1
        }
        for (let i = 0; i < compose.longest.length; i++) {
            if (i < compose.shortest.length) {
                hashSet.add(JSON.stringify(compose.shortest[i]))
            }
            if (hashSet.has(JSON.stringify(arr2[i]))) {
                return arr2[i]
            }
        }
        console.log(hashSet)
        throw new Error("NO SIMILAR FOUND, in 'in both '  ")

    }
    visualize_board = (event_: EventAtTurnPayload): EventAtTurnPayload => {
        // lets first go throught the board and check for checks
        // let make the move with original restrictions 
        const make_move = this.make_move({ ...event_.move_made });
        if (!make_move.done) {
            console.log("MOVE ISUUE ")
            // make move with original prohibited moves and if not vible return 
            return {
                move_made: event_.move_made,
                whos_turto_move: event_.whos_turto_move,
                is_move_accepted: false,
                check: undefined,
                check_mate: undefined,
                pin: undefined,
                promote: undefined,
                taken: undefined
            }
        }

        // console.log(this.#positions)
        this.#prohibited = [];
        let hold_line_of_sight: Position[];
        let event_log: EventLogger = new EventLogger()
        let xray = (piece: ChessPiece, actual: ChessPiece, position: ChessPiecePosition<ChessPiece>, line_of_sight: Position[]) => {
            let oppenets_king = this.find_king_and_queen(`${position.owner}` == "MASTER" ? "PRO" : "MASTER").king
            let opponents_: { owner: SIDES, king: Position, gradients: number[] } = {
                owner: `${position.owner}` == "MASTER" ? "PRO" : "MASTER",
                king: this.find_king_and_queen(`${position.owner}` == "MASTER" ? "PRO" : "MASTER").king,
                // for pieces located to the kings diagonal 
                gradients: [
                    this.diagonal_transform(oppenets_king, [BasicDirections.right, BasicDirections.top]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.left, BasicDirections.top]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.left, BasicDirections.down]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.right, BasicDirections.down]),
                ].filter((v) => v[0] != oppenets_king[0] && v[1] != oppenets_king[1]).flatMap((v) => this.getGradient(oppenets_king, v))
            }
            switch (piece) {
                case (ChessPiece.Rook):
                    if (!(position.position[0] == opponents_.king[0]) && !(position.position[1] == opponents_.king[1])) { return }
                    let pair = this.#positions.filter((v) => v.position[position.position[0] == opponents_.king[0] ? 0 : 1] == position.position[position.position[0] == opponents_.king[0] ? 0 : 1])
                    if (pair.length == 3 && pair.filter((v) => v.owner == `${position.owner}`).length == 1 && line_of_sight.some((v) => JSON.stringify(v) == JSON.stringify(pair.filter((v) => v.owner == `${position.owner}`)[0].position))) {
                        // console.log("XRAY ")
                        event_log.Pin({
                            piece_oppressing: { ...position, piece: actual as ChessPiece.Queen | ChessPiece.Bishop | ChessPiece.Rook },
                            pinned: { ...pair.filter((v) => v.owner != `${position.owner}` && v.piece != ChessPiece.King)[0], piece: pair.filter((v) => v.owner != `${position.owner}` && v.piece != ChessPiece.King)[0].piece as ChessPiece.Queen | ChessPiece.Bishop | ChessPiece.Rook | ChessPiece.Knight | ChessPiece.Pawn },
                        })
                    }
                    return
                case (ChessPiece.Bishop):
                    let b_grad = this.getGradient(opponents_.king, position.position)
                    if (!opponents_.gradients.includes(b_grad)) { return }
                    let pair_b = this.#positions.filter((v) => this.getGradient(v.position, opponents_.king) == b_grad)
                    if (pair_b.length == 3 && pair_b.filter((v) => v.owner == `${position.owner}`).length == 1 && line_of_sight.some((v) => JSON.stringify(v) == JSON.stringify(pair_b.filter((v) => v.owner == `${position.owner}`)[0].position))) {
                        event_log.Pin({
                            piece_oppressing: { ...position, piece: actual as ChessPiece.Queen | ChessPiece.Bishop | ChessPiece.Rook },
                            pinned: { ...pair_b.filter((v) => v.owner != `${position.owner}` && v.piece != ChessPiece.King)[0], piece: pair_b.filter((v) => v.owner != `${position.owner}` && v.piece != ChessPiece.King)[0].piece as ChessPiece.Queen | ChessPiece.Bishop | ChessPiece.Rook | ChessPiece.Knight | ChessPiece.Pawn },
                        })
                    }
                    return
                case (ChessPiece.Queen):
                    xray(ChessPiece.Bishop, ChessPiece.Queen, position, line_of_sight);
                    xray(ChessPiece.Rook, ChessPiece.Queen, position, line_of_sight);
                    return
                case (ChessPiece.Pawn):
                    if (position.position[1] == (position.owner == "MASTER" ? 8 : 1) && JSON.stringify(position.position) == JSON.stringify(event_.promote?.pawn_at)) {
                        console.log("PROMOTED ")
                        event_log.Promotion(event_.promote!)
                    }


                default: return
            }
        }








        this.#positions.map((position) => {
            hold_line_of_sight = position.piece == ChessPiece.Pawn ? this.match(position.piece, [...position.position], `${position.owner}`, { include_all_for_pawn: true }).filter((v) => v[0] != position.position[0]) : this.match(position.piece, position.position, `${position.owner}`)
            position.line_of_sight = hold_line_of_sight;
            let oppenets_king = this.find_king_and_queen(`${position.owner}` == "MASTER" ? "PRO" : "MASTER").king
            let opponents_: { owner: SIDES, king: Position, gradients: number[] } = {
                owner: `${position.owner}` == "MASTER" ? "PRO" : "MASTER",
                king: this.find_king_and_queen(`${position.owner}` == "MASTER" ? "PRO" : "MASTER").king,
                gradients: [
                    this.diagonal_transform(oppenets_king, [BasicDirections.right, BasicDirections.top]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.left, BasicDirections.top]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.left, BasicDirections.down]),
                    this.diagonal_transform(oppenets_king, [BasicDirections.right, BasicDirections.down]),
                ].filter((v) => v[0] != oppenets_king[0] && v[1] != oppenets_king[1]).flatMap((v) => this.getGradient(oppenets_king, v))
            }
            hold_line_of_sight.forEach((v) => {
                this.#prohibited.push({
                    from: opponents_.king,
                    owner: opponents_.owner,
                    piece: ChessPiece.King,
                    to: v,
                    reason: Events.Check
                })
            })
            xray(position.piece, position.piece, position, hold_line_of_sight)
            // to add to line of sight we must first check wether a move to that point is prohibited 
            if (hold_line_of_sight.some((v) => { return JSON.stringify(v) == JSON.stringify(opponents_.king) })) {
                event_log.Check({
                    oppressor: `${position.owner}`,
                    piece: position.piece,
                    position: position.position,
                    // this.getGradient(v, position.position) == this.getGradient(position.position, oppenets_king)
                    sight_to_king: [...hold_line_of_sight.filter((v) => this.is_between(v, [oppenets_king, position.position])), position.position]
                })
                // console.log([...hold_line_of_sight.filter((v) => this.is_between(v, [oppenets_king, position.position])), position.position], "RIGHT THING ")
            }
        })
        console.log(event_log.Events().flatMap((v) => [v[0], JSON.stringify(v[1])]))

        const event_construct: EventAtTurnPayload = {
            is_move_accepted: true,
            move_made: event_.move_made,
            whos_turto_move: event_.whos_turto_move == "MASTER" ? "PRO" : "MASTER",
            check: undefined,
            pin: undefined,
            promote: undefined,
            taken: make_move.take,
            check_mate: undefined,

        }
        const eval_event = (event: Events, any: any) => {
            // let any_: any
            switch (event) {

                case (Events.Check):
                    // for a check the lack of no more further moves for the king signifies a chek=ck mat 
                    // console.log("RADADADA ")

                    let any_ = any as Omit<CheckPayload, "available_moves_for_oppressed"> & { sight_to_king: Position[] };
                    let available_pieces = this.match(ChessPiece.King, this.find_king_and_queen(any_.oppressor == "MASTER" ? "PRO" : "MASTER").king, any_.oppressor == "MASTER" ? "PRO" : "MASTER");
                    console.log("match ds", available_pieces)

                    event_construct.check = {
                        available_moves_for_oppressed: available_pieces
                            .flatMap((v) => { return { piece: ChessPiece.King, position: v } })
                            // we basically want to see wether this is a double check if so the concat wont apply if not check wether there is any piece that can move in to block the check 
                            .concat(event_log.Events().filter((event: [Events, Omit<CheckPayload, "available_moves_for_oppressed"> & { sight_to_king: Position[] }]) => JSON.stringify(event[0]) == Events.Check && event[1].oppressor == any_.oppressor).length > 1 ? [] : this.#positions.filter((v) => v.piece != ChessPiece.King && v.line_of_sight.some((p) => any_.sight_to_king.find((position) => JSON.stringify(position) == JSON.stringify(p)))).flatMap((v) => { return { piece: v.piece, position: this.in_both(v.line_of_sight, any_.sight_to_king) } })),
                        ...any_
                    }
                    if (event_construct.check.available_moves_for_oppressed.length == 0) {
                        event_construct.check_mate = true;
                    }

                    return
                case (Events.Pin):
                    let any_p = any as PinPayload;
                    this.match(any_p.pinned.piece, any_p.pinned.position, any_p.pinned.owner).forEach((v) => {
                        this.#prohibited.push({ from: any_p.pinned.position, owner: any_p.pinned.owner, piece: any_p.pinned.piece, to: v, reason: Events.Check })
                    })
                    event_construct.pin = any_p;
                    return
                case (Events.Promotion):
                    let any_promo = any as PromotionDetails;
                    for (let i = 0; i < this.#positions.length; i++) {
                        if (this.#positions[i].owner == any_promo.owner && this.#positions[i].piece == ChessPiece.Pawn && JSON.stringify(this.#positions[i].position) == JSON.stringify(any_promo.pawn_at)) {
                            this.#positions[i].piece = any_promo.to
                            // console.log(this.#positions)
                            this.visualize_board(event_)
                            break
                        }
                    }
                    return

            }

        }
        // console.log(event_log.Events())

        event_log.Events(([event, any]) => {
            eval_event(event, any)
        })
        return event_construct








    }



    make_move(move: MoveMake): { reason: any, done: boolean, take?: AvailableMove } {
        if (this.is_move_prohibited({ ...move })) { return { done: false, reason: "MOVE PROHIBITED" } } // need to figure the output type of this message 
        if (!this.match(move.piece, move.from, move.owner)?.some((v) => JSON.stringify(v) == JSON.stringify(move.to))) { return { done: false, reason: "Invalid move " } }
        // if (!this.match(move.piece, move.from, move.owner).some((v) => JSON.stringify(v) == JSON.stringify(move.to))) { return { done: false, reason: "Invalid move " } }
        let status: { done: boolean, reason: any, take?: AvailableMove } = { done: false, reason: "PIECE NOT FOUND " }
        let without: ChessPiecePosition<ChessPiece>[];
        this.#positions.map((v) => {
            if (v.owner == move.owner && JSON.stringify(v.position) == JSON.stringify(move.from) && move.piece == v.piece) {
                without = this.#positions.filter((v) => JSON.stringify(move.to) != JSON.stringify(v.position))
                if (this.#positions.length - without.length == 1) {
                    this.#positions = without;
                    let hold = this.get_piece_at(move.to)
                    status.take = { piece: hold?.piece!, position: hold?.position! }
                } else if (this.#positions.length - without.length > 1) { console.log(this.#positions); console.log("console.log(this.#positions)", without); throw new Error("AN ERROR TWO PIECES WITHE SAME POSITIONS DETECTED. MAKE MOVE 298 ") }
                v.position = move.to
                status = { done: true, reason: "DONE" }
            }
            return v
        })

        return status

    }


    prime_pieces_order = [ChessPiece.Rook, ChessPiece.Knight, ChessPiece.Bishop, ChessPiece.Queen, ChessPiece.King, ChessPiece.Bishop, ChessPiece.Knight, ChessPiece.Rook] as const
    set_pieces(): void {
        if (this.#positions.length) { return }
        this.#Grid.x.forEach((v, index) => {
            this.#positions.push({ owner: "MASTER", piece: ChessPiece.Pawn, position: [v, 2], line_of_sight: this.match(ChessPiece.Pawn, [v, 2], "MASTER", { include_all_for_pawn: true }).filter((j) => j[0] != v[0]) })
            this.#positions.push({ owner: "MASTER", piece: this.prime_pieces_order[index], position: [v, 1], line_of_sight: [] })
            this.#positions.push({ owner: "PRO", piece: ChessPiece.Pawn, position: [v, 7], line_of_sight: this.match(ChessPiece.Pawn, [v, 7], "PRO", { include_all_for_pawn: true }).filter((j) => j[0] != v[0]) })
            this.#positions.push({ owner: "PRO", piece: this.prime_pieces_order[index], position: [v, 8], line_of_sight: [] })
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
        ].filter((v) => v[0] != position[0] && (!this.get_piece_at(v) || this.get_piece_at(v)?.owner != owner))
    }
    diagonal_progression(position: Position, set: [BasicDirections.right | BasicDirections.left, BasicDirections.down | BasicDirections.top], call_back: (position: Position) => { stop: boolean, pop: boolean }): Position[] {
        let i = 0;
        let coords: Position[] = [[...position]]
        while (i < 8) {
            let hold: Position = [this.transform_x(coords[coords.length - 1][0], set[0]), this.transform_y(coords[coords.length - 1][1], set[1])]
            if (hold[0] == position[0] || hold[1] == position[1]) {
                break
            }
            coords.push([...hold])
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
    diagonal_proggression_host(position: Position, owner: SIDES) {
        let collection: Position[] = []
        let hold_split = {
            own: this.#positions.filter((v) => v.owner == owner).flatMap((v) => JSON.stringify(v.position)),
            against: this.#positions.filter((v) => v.owner != owner).flatMap((v) => JSON.stringify(v.position)),
            includes: (position: Position) => hold_split.against.includes(JSON.stringify(position)) || hold_split.own.includes(JSON.stringify(position))
        }
        const call_back: (position_: Position) => { stop: boolean, pop: boolean } = (position_) => {

            return { pop: this.get_piece_at(position_)?.owner == owner, stop: !!this.get_piece_at(position_) }

        }
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
                if (hold[0] == posistion[0] || coords.some((v) => JSON.stringify(v) == JSON.stringify(hold))) { break }
                coords.push(hold)
            } else {
                hold = [posistion[0], this.transform_y(coords[coords.length - 1][1], direction)]
                if (hold[1] == posistion[1] || coords.some((v) => JSON.stringify(v) == JSON.stringify(hold))) { break }
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
    x_y_progression_host(position: Position, owner: SIDES) {
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

// const ch = new Chess()

// // ch.set_pieces()
// ch.drop(ChessPiece.King, "MASTER", ["A", 1])
// ch.drop(ChessPiece.Queen, "MASTER", ["A", 2])
// ch.drop(ChessPiece.Pawn, "MASTER", ["H", 1])
// ch.drop(ChessPiece.King, "PRO", ["D", 8])
// ch.drop(ChessPiece.Rook, "MASTER", ["B", 8])
// ch.drop(ChessPiece.Queen, "PRO", ["B", 1])
// console.log("Available moves for oppressed ", ch.visualize_board({ promote: { owner: "MASTER", pawn_at: ["H", 8], to: ChessPiece.Bishop }, move_made: { from: ["B", 1], owner: "PRO", piece: ChessPiece.Queen, to: ["B", 2] } }).check?.available_moves_for_oppressed)
// console.log(ch.in_both<String>(["RADA"], ["RADA"]))
// possibly a move can be made to escape a
// need to define a constraint to compare radients with retrospect to points given

// update make move to include takes
//  * .
//  *    Pro on this side
//  * 8
//  * 7
//  * 6
//  * 5
//  * 4 B             K
//  * 3
//  * 2
//  * 1               k
//  *  a    b    c    d    e    f     g     h
//  *      MAster on this side
//  *
//  *

