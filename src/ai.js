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

/*
public class BorderAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new BorderDiscarder( game );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.BORDER;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

public class FarAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new FarDiscarder( game );

	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.FAR;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

public class RandomAI implements PipeAI {
	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mDiscarder = new RandomDiscarder( game, seed );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	private GamePlay mGame;
	private Discarder mDiscarder;

	public Player player() {
		return Player.RANDOM;
	}
}

public class RandomEndAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mRandom.setGame( game, seed );
	}

	public boolean performMove() {
		PipeFollower pipe = new PipeFollower( mGame );

		if( pipe.follow() ) {
			if( mGame.peek()[0].isPipeAt( pipe.outDirection().opposite() ) ) {
				mGame.placeNext( pipe.outPosition() );
			} else {
				return mRandom.performMove();
			}
			return true;
		}
		return false;
	}

	public Player player() {
		return Player.RANDOM_END;
	}

	GamePlay mGame = null;
	RandomAI mRandom = new RandomAI();
}

public class Susan implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mDiscarder = new BorderDiscarder( game );
	}

	public boolean performMove() {
		PipeFollower pipe = new PipeFollower( mGame );

		if( pipe.follow() ) {
			Piece nextPiece = mGame.peek()[0];
			if( nextPiece.getFarSide( pipe.outDirection().opposite() ) != null ) {
				Side outDirection = nextPiece.getFarSide( pipe.outDirection().opposite() );
				Position nextOut = pipe.outPosition().to( outDirection );
				if( canPlace( nextOut, outDirection ) ) {
					mGame.placeNext( pipe.outPosition() );
				} else {
					return discard();
				}
			} else {
				return discard();
			}
			return true;
		}
		return false;
	}

	private boolean discard()
	{
		return mGame.placeNext( mDiscarder.discard() );
	}

	private boolean canPlace( Position position, Side direction ) {
		if( !position.valid() ) {
			return false;
		}
		Substrate substrate = mGame.substrate();
		return substrate.isEmpty( position ) ||	canFlowInto( substrate.at( position ), direction );
	}



	private boolean canFlowInto(Piece piece, Side fromDirection ) {
		return piece.isPipeAt( fromDirection.opposite() );
	}

	public Player player() {
		return Player.SUSAN;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

public class Bob implements PipeAI {
	static private class Attempt {
		private Position mPosition = null;

		Attempt( Position target ) {
			mPosition = target;
		}

		void set( int index, Position target ) {
			if(index == 0) {
				mPosition = target;
			}
		}

		Position target() {
			return mPosition;
		}
	};

	private GamePlay mGame;
	private Position mBest;
	private double mBestLength;

	private void updateBest( Position position, double length ) {
		if( length > mBestLength ) {
			mBest = position;
			mBestLength = length;
		}
	}

	private List<Integer> buildPeeks() {
		List<Integer> peek = new ArrayList<Integer>();
		for( int i = 0; i < mGame.peek().length; i++ ) {
			peek.add(i);
		}
		return peek;
	}

	private List<Integer> remainingPeeks(List<Integer> peeks, int toRemove) {
		List<Integer> result = new ArrayList<Integer>();
		for (int peek: peeks) {
			if (peek != toRemove) {
				result.add(peek);
			}
		}
		return result;
	}

	Position discard( Stracetate stracetate ) {
		return new FarDiscarder(mGame, stracetate).discard();
	}

	private class Discard {
		// Optimization to prevent recomputing the discard location if it is needed
		// multiple times at the same recursion depth.
		public Discard( Stracetate stracetate ) { mStracetate = stracetate; }

		public Position position() {
			if( mDiscard == null ) {
				mDiscard = discard(mStracetate);
			}
			return mDiscard;
		}
		private Stracetate mStracetate;
		private Position mDiscard = null;
	}

	private Acetate tryPlace(Stracetate stracetate, int peek, Position target) {
		return new Acetate( stracetate, mGame.peek()[peek], target );
	}

	private void tryPlaces(Stracetate stracetate, List<Integer> peeks, Position first, Position hint) {
		if( !hint.valid() || !stracetate.isEmpty( hint ) ) {
			return;
		}

		Discard discard = new Discard( stracetate );
		Attempt attempt = new Attempt( first );
		for( int peek : peeks ) {
			Position target = hint;
			Stracetate acetate = tryPlace(stracetate, peek, target);
			PipeFollower pipe = PipeFollower.follow( mGame, acetate );

			if( !pipe.isEndOpen() ) {
				target = discard.position();
				acetate = tryPlace(stracetate, peek, target);
				pipe = PipeFollower.follow( mGame, acetate );
			}
			attempt.set(peek,target);
			tryPlaces(acetate, remainingPeeks(peeks, peek), attempt.target(), pipe.outPosition());
			updateBest(attempt.target(),pipe.length());
		}
	}

	private PipeFollower followPipe(Stracetate stracetate, Piece piece, Position position) {
		return PipeFollower.follow( mGame, new Acetate( stracetate, piece, position ) );
	}

	static Piece[] sPiecePrototypes;
	static {
		sPiecePrototypes = new Piece[ PieceType.nonSourceCount() ];
		for( PieceType type : PieceType.values() ) {
			if( !type.isSource() ) {
				sPiecePrototypes[ type.ordinal() ] = PieceFactory.buildPiece( type );
			}
		}
	}

	private int findMaxPipeLength(Stracetate stracetate, Position position) {
		int maxLength = 0;
		for( Piece piece : sPiecePrototypes ) {
			PipeFollower pipe = followPipe(stracetate, piece, position);
			if( pipe.isEndOpen() ) {
				return Integer.MAX_VALUE;
			}
			if( pipe.length() > maxLength ) {
				maxLength = pipe.length();
			}
		}
		return maxLength;
	}

	private boolean isNoPoint( Stracetate stracetate, Piece piece, Position position ) {
		return followPipe(stracetate, piece, position).length() == findMaxPipeLength(stracetate, position);
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	public void setGame( GamePlay game, long seed ) {
		mGame = game;
	}

	public boolean performMove() {
		PipeFollower pipe = PipeFollower.follow( mGame );
		if( !pipe.isEndOpen() ) {
			return false;
		}
		Stracetate stracetate = new SubstrateWrapper(mGame.substrate());
		if( isNoPoint( stracetate, mGame.peek()[0], pipe.outPosition() ) ) {
			return mGame.placeNext( pipe.outPosition() );
		}

		mBestLength = 0;
		mBest = null;
		tryPlaces(stracetate, buildPeeks(), null, pipe.outPosition());

		return mGame.placeNext( mBest != null ? mBest : discard( stracetate ) );
	}

	public Player player() {
		return Player.BOB;
	}
}
*/
