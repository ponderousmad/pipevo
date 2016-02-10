var PIPES = (function () {
    "use strict";
    
    var Side = {
            TOP: 0,
            BOTTOM: 1,
            LEFT: 2,
            RIGHT: 3
        },
        Corner = {
            TOP_LEFT: 0,
            TOP_RIGHT: 1,
            BOTTOM_LEFT: 2,
            BOTTOM_RIGHT: 3 
        },
        OPPOSITES = [ BOTTOM, TOP, RIGHT, LEFT ],
        CLOCKWISE = [ RIGHT, LEFT, TOP, BOTTOM ],
        COUNTER_CLOCKWISE = [ LEFT, RIGHT, BOTTOM, TOP ],
        INVALID = -1;
        
    function SubstrateSize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    function Position(sizeOrOther, i, j) {
        if (sizeOrOther.hasOwnProperty("size")) {
            this.size = sizeOrOther.size
            this.i = sizeOrOther.i
            this.j = sizeOrOther.j
        } else {
            this.size = size;
            this.i = i;
            this.j = j;
        }
    }
    
    Position.prototype.clone = function () {
        return new Position(this);
    };
    
    Position.prototype.coord = function (index) {
        return index === 0 ? this.i : this.j;
    };
    
    Position.prototype.valid = function () {
        return this.i !== INVALID && this.j !== INVALID;
    };
    
    Position.prototype.equals = function (other) {
        if (this.i !== other.i) {
            return false;
        }
        if (this.j != other.j) {
            return false;
        }
        if (this.size.width != other.size.width || this.size.height != other.size.height) {
            return false;
        }
        return true;
    };
    
    Position.prototype.moveTo = function (side) {
		if (!this.valid()) {
			return this;
		}
		if (side === null) {
			this.i = INVALID;
            this.j = INVALID;
        }
		// If already at left/top, will make invalid: ( 0 - 1 = INVALID )
		if (side == Side.LEFT) {
			this.i -= 1;
		} else if (side == Side.TOP) {
			this.j -= 1;
		} else if (side == Side.RIGHT) {
			this.i += 1;
		} else if (side == Side.BOTTOM) {
			this.j += 1;
		}
		if (this.i >= this.size.width) {
			this.i = INVALID;
		}
		if (this.j >= this.size.height) {
			this.j = INVALID;
		}
		return this;
    };
    
    Position.prototype.to = function (side) {
        return this.clone().moveTo(side);
    };
    
    Position.prototype.manhattanDistance = function (other) {
        return ( Math.abs(other.i - this.i) + Math.abs(other.j - this.j));
    };
  
    function SingleType(start, end) {
        this.start = start;
        this.end = end;
    }
    
    SingleType.prototype.isSingle = function() { return true; };
    SingleType.prototype.isDual   = function() { return false; };
    SingleType.prototype.isSource = function() { return false; };
    
    function DualType(first, second) {
        this.first = first;
        this.second = second;
    }
    
    DualType.prototype.isSingle = function() { return false; };
    DualType.prototype.isDual   = function() { return true; };
    DualType.prototype.isSource = function() { return false; };
    
    function SourceType(side) {
        this.outflow = side;
    }
    
    SourceType.prototype.isSingle = function() { return false; };
    SourceType.prototype.isDual   = function() { return false; };
    SourceType.prototype.isSource = function() { return true; };

    var PieceTypes = {
            HORIZONTAL:    new SingleType(Side.LEFT,   Side.RIGHT)
            VERTICAL:      new SingleType(Side.TOP,    Side.BOTTOM),
            TOP_LEFT:      new SingleType(Side.TOP,    Side.LEFT),
            TOP_RIGHT:     new SingleType(Side.TOP,    Side.RIGHT),
            BOTTOM_LEFT:   new SingleType(Side.BOTTOM, Side.LEFT),
            BOTTOM_RIGHT:  new SingleType(Side.BOTTOM, Side.RIGHT)
            SOURCE_TOP:    new SourceType(Side.TOP),
            SOURCE_BOTTOM: new SourceType(Side.BOTTOM),
            SOURCE_LEFT:   new SourceType(Side.LEFT),
            SOURCE_RIGHT:  new SourceType(Side.RIGHT)
        };
    
    PieceTypes.CROSS =          new DualType(PieceType.HORIZONTAL, PieceType.VERTICAL);
    PieceTypes.DUAL_TOP_LEFT =  new DualType(PieceType.TOP_LEFT,   PieceType.BOTTOM_RIGHT);
    PieceTypes.DUAL_TOP_RIGHT = new DualType(PieceType.TOP_RIGHT,  PieceType.BOTTOM_LEFT);
    
    var SOURCE_TYPES = [
            PieceTypes.SOURCE_TOP,
            PieceTypes.SOURCE_BOTTOM,
            PieceTypes.SOURCE_LEFT,
            PieceTypes.SOURCE_RIGHT,
        ],
        NON_SOURCE_TYPES = [
            PieceTypes.HORIZONTAL,
            PieceTypes.VERTICAL,
            PieceTypes.TOP_LEFT,
            PieceTypes.TOP_RIGHT,
            PieceTypes.BOTTOM_LEFT,
            PieceTypes.BOTTOM_RIGHT,
            PieceTypes.CROSS,
            PieceTypes.DUAL_TOP_LEFT,
            PieceTypes.DUAL_TOP_RIGHT
        ];

    function Piece(type) {
        this.type = type;
        this.full = [false, false];
    }
    
    Piece.prototype.getFarSize = function (side) {
        if (this.type.isSingle()) {
            if (this.type.start == side) {
                return this.type.end;
            } else if (this.type.end == side) {
                return this.type.start;
            }
        } else if(this.type.isDual) {
            var firstFar = this.type.first.getFarSide(side);
            if (firstFar !== null) {
                return firstFar;
            }
            return this.type.second.getFarSide(side)
        }
        return null;
    };
    
    Piece.prototype.isPipeAt = function (side) {
        if (this.type.isSingle()) {
            return this.type.start === side || this.type.end === side;
        } else if(this.type.isDual()) {
            return side !== null; // We've got sides everywhere.
        } else if(this.type.isSource()) {
            return this.type.outflow = side;
        }
    };
    
    Piece.prototype.fill = function (side) {
        if (this.type.isSingle()) {
            if (this.isPipeAt(side)) {
                this.full[0] = true;
                return true;
            }
        } else if(this.type.isDual()) {
            if (this.type.first.start === side || this.type.first.end === side) {
                this.full[0] = true;
                return true;
            }
            if (this.type.second.start === side || this.type.second.end === side) {
                this.full[1] = true;
                return true;
            }
        } else if(this.type.isSource()) {
            if (this.side === null) {
                this.full[0] = true;
                return true;
            }
        }
        return false;
    };
    
    Piece.prototype.isFull = function (side) {
        if (this.type.isSingle()) {
            if (this.isPipeAt(side)) {
                return this.full[0];
            }
        } else if(this.type.isDual()) {
            if (this.type.first.start === side || this.type.first.end === side) {
                return this.full[0];
            }
            if (this.type.second.start === side || this.type.second.end === side) {
                return this.full[1];
            }
        } else if(this.type.isSource()) {
            return this.full[0];
        }
        return false;
    }
    
    Piece.prototype.accept = function (visitor) {
        if (this.type.isSingle()) {
            visitor.pipe(this.type, this.full[0]);
        } else if(this.type.isDual()) {
            visitor.pipe(this.type.first, this.full[0]);
            visitor.pipe(this.type.second, this.full[1]);
        } else if(this.type.isSource()) {
            visitor.source(this.type, this.full[0]);
        }
    };
    
    function Substrate(size) {
        this.size = size;
        this.pieces = [];
        for (var i = 0; i < size.width; ++i) {
            var column = [];
            for (var j = 0; j < size.height; ++j) {
                column.push(null);
            }
            this.pieces.push(column);
        }
        this.pieceCount = 0;
    }
    
    Substrate.prototype.corner = function (c) {
        switch (c) {
            case Corner.TOP_LEFT: return new Position(this.size, 0, 0);
            case Corner.TOP_RIGHT: return new Position(this.size, size.width - 1, 0);
            case Corner.BOTTOM_LEFT: return new Position(this.size, 0, size.height - 1);
            case Corner.BOTTOM_RIGHT: return new Position(this.size, size.width - 1, size.height - 1);
            default: return null;
        }
    };
    
    Substrate.prototype.at = function (position) {
        if (position.valid()) {
            return this.pieces[position.i][position.j];
        }
        return null;
    };
    
    Substrate.prototype.isEmpty = function (position) {
        return this.at(position) === null;
    };
    
    Substrate.prototype.empties = function () {
        return this.size.width * this.size.height - this.pieceCount;
    };
    
    Substrate.prototype.placePiece = function (position, piece) {
        if (position.valid() && this.isEmpty(position)) {
            this.pieceCount += 1;
            this.pieces[position.i][position.j] = piece;
        }
    };
    
    function randomInt(entropy, min, max) {
        return Math.floor(min + entropy() * (max - min) - 0.00001)
    }
    
    function getRandomElement(list, entropy) {
        return list[randomInt(0, list.length)];
    }
    
    function PieceQueue(size, entropy) {
        this.size = size;
        this.entropy = entropy;
        this.queue = [];
        
        this.fill();
    }
    
    function randomPiece(types, entropy) {
        return new Piece(getRandomElement(types, entropy));
    };
    
    PieceQueue.prototype.fill = function () {
        while (this.queue.length < this.size) {
            this.queue.push(randomPiece(NON_SOURCE_TYPES, this.entropy));
        }
    }
    
    PieceQueue.prototype.nextPiece = function () {
        var next = this.queue[0];
        this.queue.splice(0, 1);
        this.fill();
        return next;
    };
    
    function Game(width, height, queueSize, delay, entropy) {
        this.substrate = new Substrate(new SubstrateSize(width, height));
        this.queue = new PieceQueue(queueSize, entropy);
        this.delay = delay;
        this.entropy = entropy;
        
        this.setupSource();
        this.flowPiece = this.source;
        this.flowOut = this.source.type.outflow;
        this.flowPosition = this.sourcePosition;
        this.flowCount = -delay;
    }
    
    Game.prototype.setupSource = function() {
        this.source = randomPiece(SOURCE_TYPES, this.entropy);
        this.sourcePosition = new Position(this.substrate.size,
            randomInt(this.entropy, 0, this.substrate.size.width),
            randomInt(this.entropy, 0, this.substrate.size.height)
        );
        this.substrate.place(this.source, this.sourcePosition);
    };
}());

/**
 * Core Gameplay logic.
 * /
public class GamePlay {
	/**
	 * Create a new default sized game with the given seed.
	 * @param seed Random number generator seed.
	 * @return A new gameplay object.
	 * /
	static public GamePlay create( long seed ) {
		return new GamePlay( 12, 12, 5, 15, seed );
	}

	public boolean placeNext( Position position ) {
		if( isGameOver() ) {
			return false;
		}
		if( position.valid() && mSubstrate.isEmpty( position ) ) {
			Piece nextPiece = mQueue.nextPiece();
			mSubstrate.placePiece( position, nextPiece );
			updateFlow();
			return true;
		}
		return false;
	}

	public boolean isGameOver() {
		if( mFlowPiece == null ) {
			return true;
		}
		Position nextPos = mFlowPosition.to(mFlowOut);
		if( !nextPos.valid() ) {
			return true;
		}
		Piece next = mSubstrate.at(nextPos);
		if( next != null && !next.isPipeAt(mFlowOut.opposite()) ) {
			return true;
		}
		return false;
	}

	public int score() {
		return mFlowCount > 0 ? mFlowCount : 0;
	}

	public Position sourcePosition() {
		return mSourcePosition.clone();
	}

	public Side sourceOut() {
		return mSourceOut;
	}

	public void updateFlow() {
		++mFlowCount;
		// When we fill the source, we don't
		// update the flow in/out
		if( mFlowCount == -1 ) {
			notify( Event.TAP );
		} else if( mFlowCount == 0 ) {
			mFlowPiece.fill( null );
		} else if( mFlowCount > 0 ) {
			// We have to wait till just before we
			// fill the next piece to find out what piece
			// is next, because it might have just
			// been placed.
			mFlowPosition.moveTo( mFlowOut );
			mFlowPiece = mSubstrate.at( mFlowPosition );
			if( mFlowPiece != null ) {
				Side flowIn = mFlowOut.opposite();
				mFlowPiece.fill( flowIn );
				mFlowOut = mFlowPiece.getFarSide( flowIn );
			}
		}
		notify( Event.FILL );
	}

	public interface GameplayObserver {
		public enum Event { TAP, FILL }
		void updateGameplay( Event event );
	}

	public void addObserver( GameplayObserver observer ) {
		if( observer != null ) {
			mObservers.add( observer );
		}
	}

	public void clearObservers() {
		mObservers.clear();
	}

	private void notify( Event event ) {
		for( GameplayObserver observer : mObservers ) {
			observer.updateGameplay( event );
		}
	}

	/**
	 * Get a look at the upcoming pieces.
	 * @return
	 * /
	public Piece[] peek() {
		return mQueue.peek();
	}

	/**
	 * Gets the width of the board in tiles.
	 * /
	public int width() {
		return mSize.width();
	}

	/**
	 * Gets the height of the board in tiles.
	 * /
	public int height() {
		return mSize.height();
	}

	/**
	 * Construct a position object for this game board.
	 * @param i The horizontal tile index (zero based).
	 * @param j The vertial tile index (zero based).
	 * @return A game position, invalid if the i and j are not valid indices.
	 * /
	public Position position( int i, int j ) {
		return new Position( mSize, i, j );
	}

	/**
	 * Gets the current game board contents.
	 * /
	public Substrate substrate() {
		return mSubstrate;
	}

	/**
	 * Force the time to flow so that the tap never opens.
	 * /
	public void setInfiniteTimeToFlow() {
		mFlowCount = -1*(mSize.height()*mSize.width());
	}

	private SubstrateSize mSize;
	private Substrate mSubstrate;
	private PieceQueue mQueue;
	private List<GameplayObserver> mObservers = new ArrayList<GameplayObserver>();

	private int mFlowCount;
	private Piece mFlowPiece;
	private Side mFlowOut;
	private Position mFlowPosition;

	private Side mSourceOut;
	private Position mSourcePosition;
	private Random mRandom;
}
*/