var AI = (function () {
    "use strict";
    
    function Acetate(base, piece, position) {
        this.base = base;
        this.piece = piece;
        this.position = position;
    }
    
    Acetate.prototype.at = function (position) {
		if (!position.valid()) {
			return null;
		}
		if (position.equals(this.position)) {
			return this.piece;
		}
		return this.base.at(position);        
    };
    
    Acetate.prototype.isEmpty = function (position) {
        return this.at(position) === null;
    };
    
    Acetate.prototype.empties = function () {
        return base.empties() - (this.base.isEmpty(this.position) ? 1 : 0);
    };
    
    function followPipe(game, overlay) {
        var board = overlay ? overlay : game.substrate,
            result = {
                outFlow: game.sourceOut(),
                position: game.sourcePosition().to(game.sourceOut()),
                openEnd: false,
                filled: 0,
                length: 0
            };
        
        do {
            if (board.isEmpty(result.position)) {
                result.openEnd = true;
                break;
            }
            var piece = board.at(result.position),
                inflow = result.outFlow.opposite();
                
            if (!piece.isPipeAt(inflow)) {
                break;
            }
            
            result.length += 1;
            if (piece.isFull(inflow)) {
                result.filled += 1;
            }
            
			result.outFlow = piece.getFarSide( inSide );
			result.position.moveTo(result.outFlow);
        } while (result.position.valid());
        
        return result;
    }
    
    function findEmptyPosFarFromOutput(game, overlay, followResult) {
        var board = overlay ? overlay : game.substrate,
            follow = followResult ? followResult : followPipe(game, board),
            bestDistance = -1,
            best = null;
            
        for (var i = 0; i < game.width(); ++i) {
            for (var j = 0; j < game.height(); ++j) {
                var pos = game.position(i, j);
                if (board.isEmpty(pos)) {
                    var distance = follow.outPosition.manhattanDistance(pos);
                    if (distance > bestDistance) {
                        bestDistance = distance;
                        best = pos;
                    }
                }
            }
        }
        
        return best;
    }
    
    function findFarCorner(game, overlay, position) {
		var bestDistance = -1,
            best = null;

		for (var name in PIPES.Corner) {
            if (PIPES.Corner.hasOwnProperty(name)) {
                var corner = game.substrate.corner(PIPES.Corner(name)),
                    distance = position.manhattanDistance(corner);
                if (distance >  bestDistance) {
                    bestDistance = distance;
                    best = corner;
                }
            }
		}

		return farCorner;
	}
    
    function RandomDiscarder(game, entropy) {
        this.game = game;
        this.entropy = entropy;
    }
    
    RandomDiscarder.prototype.discard = function () {
        var position = null;
        if (this.game.substrate.empties() === 0) {
            return position;
        }
        do {
            var i = PIPES.randomInt(this.entropy, 0, this.game.width()),
                j = PIPES.randomInt(this.entropy, 0, this.game.height());
            position = this.game.position(i, j);
        } while (!this.game.substrate.isEmpty(position));
        
        return position;
    };
    
    function BorderDiscarder(game, overlay) {
        this.game = game;
        this.board = overlay ? overlay : game.substrate;
        this.counter = 0;
        this.sideLength = game.width() - 1;
        this.edgeNumber = 3;
        this.dump = null;
        this.dumpNextSide = null;
    }
    
    BorderDiscarder.prototype.discard = function () {
        if( this.dump === null ) {
			this.findTheDump();
		}
		while (this.dump !== null && !board.isEmpty(this.dump)) {
			this.moveClockwise();
		}
		return this.dump;
    };
    
    BorderDiscarder.prototype.findTheDump = function () {
		var source = this.game.sourcePosition(),
            left = source.coord(0) > (this.game.width() / 2),
            top = source.coord(1) > (this.game.height() / 2);
		if (top && left) {
			this.dump = this.game.substrate.corner(PIPES.Corner.TOP_LEFT);
			this.dumpNextSide = Side.RIGHT;
		} else if (top) {
			this.dump = this.game.substrate.corner(PIPES.Corner.TOP_RIGHT);
			this.dumpNextSide = Side.BOTTOM;
		} else if (left) {
			this.dump = this.game.substrate.corner(PIPES.Corner.BOTTOM_LEFT);
			this.dumpNextSide = Side.TOP;
		} else {
			this.dump = this.game.substrate.corner(PIPES.Corner.BOTTOM_RIGHT);
			this.dumpNextSide = Side.LEFT;
		}
    };
    
    BorderDiscarder.prototype.moveClockwise = function () {
		this.dump = position.to(this.dumpNextSide);
		this.counter += 1;
		if (this.counter === this.sideLength) {
			this.counter = 0;
			this.dumpNextSide = PIPES.CLOCKWISE(this.dumpNextSide);
			if (this.edgeNumber === 1 ) {
				this.edgeNumber = 2;
				this.sideLength -= 1;
				if( this.ideLength === 0 ) {
					this.dump = null;
				}
			} else {
				this.edgeNumber -= 1;
			}
		}
		return nextSide;
    };
    
    function FarDiscarder(game, overlay) {
        this.game = game;
        this.board = overlay ? overlay : game.substrate;
    }
    
    FarDiscarder.prototype.discard = function () {
        return findEmptyPosFarFromOutput(this.game, this.board);
    };
    
    return {
        Acetate: Acetate,
        RandomDiscarder: RandomDiscarder,
        FarDiscarder: FarDiscarder,
        BorderDiscarder: BorderDiscarder,
        followPipe: followPipe
    };
}());
