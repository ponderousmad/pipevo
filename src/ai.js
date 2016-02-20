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
    
    function farthestEmptyFromOutput(game, overlay, followResult) {
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
        return farthestEmptyFromOutput(this.game, this.board);
    };
    
    function DiscarderAI(game, Discarder) {
        this.discarder = new Discarder(game);
        this.version = 1;
    }
    
    DiscarderAI.prototype.nextMove = function () {
        return this.discarder.discard();
    };
    
    function makeDiscarder(game, stopFlow, Discarder) {
        if (stopFlow) {
            game.setInfiniteTimeToFlow();
        }
        return new DiscarderAI(game, Discarder);
    }
    
    function FollowerAI(game, Discarder) {
        this.game = game;
        this.discarder = makeDiscarder(game, false, Discarder);
        this.version = 1;
    }
    
    FollowerAI.prototype.nextMove = function () {
        var follow = followPipe(this.game);
		if (follow.openEnd) {
			if (this.game.peek()[0].isPipeAt(PIPES.OPPOSITE(follow.outFlow))) {
				return follow.position;
			} else {
				return this.discarder.nextMove();
			}
		}
		return null;
    };
    
    function makeFollower(game, Discarder) {
        return new FollowerAI(game, Discarder);
    }
    
    function Susan(game) {
        this.game = game;
        this.discarder = makeDiscarder(game, BorderDiscarder);
        this.version = 2;
    }

	Susan.prototype.canPlace = function (position, flow) {
		if (!position.valid()) {
			return false;
		}
        var piece = this.game.substrate.at(position);
        return piece === null || piece.isPipeAt(flow);
	};
    
    Susan.prototype.nextMove = function () {
        var follow = followPipe(this.game);

		if (follow.openEnd) {
			var piece = mGame.peek()[0],
                flow = nextPiece.getFarSide(PIPES.OPPOSITE(follow.outFlow));
			if (flow !== null) {
				var next = follow.position.to(flow);
				if (this.canPlace(next, flow)) {
					return pipe.outPosition();
				}
			}
            return this.discarder.discard();
		}
		return null;
    };
    
    function Bob(game) {
        this.game = game;
        this.version = 8;
        this.best = null;
        this.bestLength = null;
        
        this.ALL_PIECES = [];        
        for (var t = 0; t < PIPES.NON_SOURCE_TYPES.length; ++t) {
            this.ALL_PIECES.push(new PIPES.Piece(PIPES.NON_SOURCE_TYPES[t]));
        }
        
    }
    
    Bob.prototype.updateBest = function	(position, length) {
		if (length > this.bestLength ) {
			this.best = position;
			this.bestLength = length;
		}
	};
    
    Bob.prototype.buildPeeks = function () {
		var peeks = [];
		for (var i = 0; i < this.game.peek().length; ++i) {
			peeks.push(i);
		}
		return peeks;
	};

	Bob.prototype.remainingPeeks = function (peeks, toRemove) {
		var result = [];
		for (var i = 0; i < peeks.length; ++i) {
            var peek = peeks[i];
            if (peek != toRemove) {
				result.push(peek);
			}
		}
		return result;
	};

	Bob.prototype.tryPlace = function (board, peek, target) {
		return new Acetate(board, this.game.peek()[peek], target);
	};
    
    Bob.prototype.tryPlaces = function (board, peeks, first, hint) {
		if (!hint.valid() || !board.isEmpty(hint)) {
			return;
		}

		var discard = null,
            attempt = first;
            
		for (var p = 0; p < peeks.length; ++p) {
            var peek = peeks[p];
			var target = hint,
                overlay = tryPlace(board, peek, target),
                follow = followPipe(this.game, overlay);

			if (!follow.isEndOpen) {
                if (discard === null) {
                    discard = farthestEmptyFromOutput(this.game, overlay);
                }
				target = discard;
				overlay = tryPlace(board, peek, target);
				follow = PipeFollower.follow(this.game, overlay);
			}
            if (peek === 0) {
                attempt = target;
            }
			this.tryPlaces(overlay, this.remainingPeeks(peeks, peek), attempt, follow.position);
			this.updateBest(attempt, follow.length);
		}
	};
    
    Bob.prototype.followPipe = function (board, piece, position) {
		return followPipe(this.game, new Acetate(board, piece, position));
	};
    
    Bob.prototype.findMaxPipeLength = function(board, position) {
		var maxLength = 0;
		for (var t = 0; t < this.ALL_PIECES.length; ++t) {
            piece = this.ALL_PIECES[t];
			var follow = followPipe(board, piece, position);
			if (follow.isEndOpen) {
				return this.game.width() * this.game.height();
			}
			if (follow.length > maxLength) {
				maxLength = follow.length;
			}
		}
		return maxLength;
	};

	Bob.prototype.isNoPoint = function (board, piece, position) {
		return this.followPipe(board, piece, position).length === this.findMaxPipeLength(board, position);
	};
    
    Bob.prototype.nextMove = function () {
        var follow = followPipe(this.game);
        if( !follow.isEndOpen ) {
            return null;
		}
		if (this.isNoPoint(this.game.substrate, this.game.peek()[0], follow.position)) {
			return follow.position;
		}

		this.bestLength = 0;
		this.best = null;
		this.tryPlaces(this.game.substrate, this.buildPeeks(), null, follow.position);

        if (this.best !== null) {
            return this.best;
        }
		return farthestEmptyFromOutput(this.game);
    };
    
    return {
        Acetate: Acetate,
        RandomDiscarder: RandomDiscarder,
        FarDiscarder: FarDiscarder,
        BorderDiscarder: BorderDiscarder,
        followPipe: followPipe,
        makeDiscarder: makeDiscarder,
        makeFollower: makeFollower,
        Susan: Susan,
        Bob: Bob
    };
}());

