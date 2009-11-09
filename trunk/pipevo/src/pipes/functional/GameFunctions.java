/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import pipes.ai.Acetate;
import pipes.ai.BorderDiscarder;
import pipes.ai.PipeFollower;
import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.PieceType;
import pipes.root.Position;
import pipes.root.Side;
import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.FixNum;
import functional.Function;
import functional.Null;
import functional.Obj;
import functional.True;

public class GameFunctions {
	public static class GameEvalException extends EvalException {
		public GameEvalException(String message, Environment env) {
			super(message, env);
		}
		private static final long serialVersionUID = 8759685968118972801L;
	}

	static GamePlay asGame( Environment env, String gSym ) {
		Obj g = env.lookup( gSym );
		if( g instanceof Game ) {
			return ((Game)g).value();
		}
		throw new GameEvalException( "Value is not a game", env );
	}

	static int asInt( Environment env, String iSym ) {
		Obj i = env.lookup( iSym );
		if( i.isFixNum() ) {
			return ((FixNum)i).value();
		}
		throw new GameEvalException( "Value is not an integer", env );
	}

	static Position asPosition(Environment env, GamePlay game, String pSym) {
		Obj p = env.lookup( pSym );
		if( p.isCons() ) {
			Cons pair = (Cons)p;
			if( pair.car().isFixNum() && pair.cdr().isFixNum() ) {
				FixNum i = (FixNum)pair.car();
				FixNum j = (FixNum)pair.cdr();
				return game.position(i.value(), j.value());
			}
		}
		throw new GameEvalException( "Position must be of the form '(i . j)' where i and j are integers.", env );
	}

	static Obj createPosition( int i, int j ) {
		return new Cons( new FixNum(i), new FixNum(j) );
	}

	static Obj createPosition(Position pos) {
		if( !pos.valid() ) {
			return Null.NULL;
		}
		int[] coords = pos.coords();
		Obj result = createPosition(coords[0],coords[1]) ;
		return result;
	}

	static StracetateObj asStracetate( Environment env, String sSym ) {
		Obj s = env.lookup( sSym );
		if( s instanceof StracetateObj ) {
			return (StracetateObj)s;
		}
		throw new GameEvalException( "Value is not a stracetate", env );
	}

	protected static Side asSide( Environment env, String sSym ) {
		Obj s = env.lookup( sSym );
		if( s.isFixNum() ) {
			int ordinal = ((FixNum)s).value();
			if( 0 <= ordinal && ordinal < Side.values().length ) {
				return Side.values()[ordinal];
			}
		}
		throw new GameEvalException( "Value is not a side.", env );
	}

	protected static Piece asPiece( Environment env, String pSym ) {
		Obj p = env.lookup( pSym );
		if( p instanceof PieceObj ) {
			return ((PieceObj)p).value();
		}
		throw new GameEvalException( "Value is not a piece.", env );
	}

	protected static PipeFollower asPipe( Environment env, String pSym ) {
		Obj p = env.lookup(  pSym );
		if( p instanceof Pipe ) {
			return ((Pipe)p).value();
		}
		throw new GameEvalException( "Value is not a pipe", env );
	}

	static final Obj T = True.TRUE;
	static final Obj F = Null.NULL;

	public static void install( Environment env ) {
		installConstants( env );
		installGame( env );
		installPiece( env );
		installStracetate( env );
		installPipe( env );
		installDiscarder( env );
	}

	static void installConstants( Environment env ) {
		for( PieceType pieceType : PieceType.values() ) {
			env.add( "pt" + pieceType.toString(), new FixNum( pieceType.ordinal() ) );
		}
		for( Side side : Side.values() ) {
			env.add( "side" + side.toString(), new FixNum( side.ordinal() ) );
		}
	}

	static void installGame( Environment env ) {
		env.add( new Function( "isGame?", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup( "g" ) instanceof Game ? T : F;
			}
		}));

		env.add( new Function( "isGameOver?", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return asGame( env, "g" ).isGameOver() ? T : F;
			}
		}));

		env.add( new Function( "gameWidth", new String[]{"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				return new FixNum( game.width() );
			}
		}));

		env.add( new Function( "gameHeight", new String[]{"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				return new FixNum( game.height() );
			}
		}));

		env.add( new Function( "gamePlace", new String[] {"g", "pos"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				if( game.placeNext( asPosition( env, game, "pos" ) ) ) {
					return T;
				}
				return F;
			}
		}));

		env.add( new Function( "gameIsValidPos?", new String[] {"g", "pos"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Position pos = asPosition( env, asGame( env, "g" ), "pos" );
				return pos.valid() ? T : F;
			}
		}));

		env.add( new Function( "gameIsEmpty?", new String[] {"g", "pos"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				Position pos = asPosition( env, game, "pos" );
				return game.substrate().isEmpty( pos ) ? T : F;
			}
		}));

		env.add( new Function( "gameSourceDirection", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				return new FixNum( game.sourceOut().ordinal() );
			}
		}));

		env.add( new Function( "gameSourcePosition", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				return createPosition(game.sourcePosition());
			}
		}));

		env.add( new Function( "gamePieceAt", new String[] {"s", "pos"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				StracetateObj s = asStracetate( env, "s");
				Piece piece = s.stracetate().at( asPosition( env, s.game(), "pos"));
				if( piece == null ) {
					return Null.NULL;
				}
				return new PieceObj( piece );
			}
		}));

		env.add( new Function( "gamePeekNext", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				return new PieceObj( game.peek()[0] );
			}
		}));

		env.add( new Function( "gamePeek", new String[] {"g", "i"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				GamePlay game = asGame( env, "g" );
				int index = asInt( env, "i" );
				if( 0 <= index && index < game.peek().length ) {
					return new PieceObj( game.peek()[index] );
				}
				throw new GameEvalException( "Peek index out of range.", env );
			}
		}));

		env.add( new Function( "oppositeSide", new String[] {"s"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Side side = asSide( env, "s" );
				return new FixNum( side.opposite().ordinal() );
			}
		}));
	}

	static void installPiece( Environment env ) {
		env.add( new Function( "isPiece?", new String[]{ "p" }, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup( "p" ) instanceof PieceObj ? T : F;
			}
		}));
		env.add( new Function( "pieceIsFull?", new String[] {"p", "side"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return piece.isFull(asSide( env, "side")) ? T : F;
			}
		}));

		env.add( new Function( "pieceType", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return new FixNum( piece.type().ordinal() );
			}
		}));

		env.add( new Function( "pieceIsSource?", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return piece.type().isSource() ? T : F;
			}
		}));

		env.add( new Function( "pieceIsSingle?", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return piece.type().isSingle() ? T : F;
			}
		}));

		env.add( new Function( "pieceIsDual?", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return piece.type().isDual() ? T : F;
			}
		}));

		env.add( new Function( "pieceIsOpen?", new String[] {"p", "side"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				return piece.isPipeAt( asSide(env, "side") ) ? T : F;
			}
		}));

		env.add( new Function( "pieceFarSide", new String[] {"p", "side"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Piece piece = asPiece( env, "p" );
				Side farSide = piece.getFarSide( asSide(env, "side") );
				return farSide == null ? Null.NULL : new FixNum( farSide.ordinal() );
			}
		}));
	}

	static void installStracetate( Environment env ) {
		env.add( new Function( "isStracetate?", new String[] {"s"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup( "s" ) instanceof StracetateObj ? T : F;
			}
		}));

		env.add( new Function( "gameStracetate", new String[] {"g"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new StracetateObj( asGame( env, "g" ) );
			}
		}));

		env.add( new Function( "stracetateIsEmpty?", new String[] {"s", "pos"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				StracetateObj s = asStracetate( env, "s" );
				Position pos = asPosition( env, s.game(), "pos" );
				return s.stracetate().isEmpty( pos ) ? T : F;
			}
		}));

		env.add( new Function( "gameTryNth", new String[] {"stracetate", "pos", "n"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				StracetateObj s = asStracetate( env, "stracetate" );
				Position position = asPosition( env, s.game(), "pos" );
				int n = asInt( env, "n" );
				if( n >= 0 && n < s.game().peek().length  && position.valid()) {
					return new StracetateObj( s.game(), new Acetate( s.stracetate(), s.game().peek()[n], position ) );
				}
				return Null.NULL;
			}
		}));
	}

	static void installPipe( Environment env ) {
		env.add( new Function( "isPipe?", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup("p") instanceof Pipe ? T : F;
			}
		}));

		env.add( new Function( "followPipe", new String[] {"x"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				PipeFollower follower = null;

				if( env.lookup("x") instanceof Game ) {
					follower = new PipeFollower( asGame( env, "x" ) );
				} else {
					StracetateObj s = asStracetate( env, "x" );
					follower = new PipeFollower( s.game(), s.stracetate() );
				}
				follower.follow();
				return new Pipe( follower );
			}
		}));

		env.add( new Function( "pipeLength", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				PipeFollower pipe = asPipe( env, "p" );
				return new FixNum( pipe.length() );
			}
		}));

		env.add( new Function( "pipeOutDirection", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				PipeFollower pipe = asPipe( env, "p" );
				return new FixNum( pipe.outDirection().ordinal() );
			}
		}));

		env.add( new Function( "pipeOutPosition", new String[] {"p"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				PipeFollower pipe = asPipe( env, "p" );
				return createPosition(pipe.outPosition());
			}
		}));
	}

	private static void installDiscarder(Environment env) {
		env.add( new Function( "borderDiscard", new String[] {"x"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				BorderDiscarder border = null;
				Obj x = env.lookup("x");
				if( x instanceof StracetateObj ) {
					StracetateObj s = (StracetateObj)x;
					border = new BorderDiscarder( s.game(), s.stracetate() );
				} else {
					border = new BorderDiscarder( asGame( env, "x" ) );
				}
				Position pos = border.discard();
				return pos == null ? Null.NULL : createPosition( pos );
			}
		}));
	}
}
