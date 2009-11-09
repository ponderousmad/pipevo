/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.evolve;

import pipes.functional.GameType;
import pipes.root.PieceType;
import pipes.root.Side;
import evolve.ObjectRegistry;
import functional.Symbol;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Maybe;
import functional.type.Parameter;
import functional.type.Type;


public class GameRegistrar {
	private ObjectRegistry mReg;

	public static void registerGame(ObjectRegistry reg, boolean allowFollow) {
		GameRegistrar doReg = new GameRegistrar();
		doReg.register(reg, allowFollow);
	}

	void register(ObjectRegistry reg, boolean allowFollow) {
		mReg = reg;
		registerGame();
		registerPiece();
		registerStracetate();
		if( allowFollow ) {
			registerPipe();
		}
	}

	void add( String name, Type type ) {
		mReg.add( new Symbol(name), type );
	}

	void addFunction( String name, Type returnType ) {
		mReg.add( new Symbol(name), new FunctionType(returnType, new Type[]{}) );
	}

	void addFunction( String name, Type returnType, Type arg1Type ) {
		mReg.add( new Symbol(name), new FunctionType(returnType, new Type[]{arg1Type}));
	}

	void addFunction( String name, Type returnType, Type arg1Type, Type arg2Type ) {
		mReg.add( new Symbol(name), new FunctionType(returnType, new Type[]{arg1Type, arg2Type}));
	}

	void addFunction( String name, Type returnType, Type arg1Type, Type arg2Type, Type arg3Type ) {
		mReg.add( new Symbol(name), new FunctionType(returnType, new Type[]{arg1Type, arg2Type, arg3Type}));
	}

	void registerConstants() {
		for( PieceType pieceType : PieceType.values() ) {
			add( "pt" + pieceType.toString(), BaseType.FIXNUM );
		}
		for( Side side : Side.values() ) {
			add( "side" + side.toString(), BaseType.FIXNUM );
		}
	}

	void registerGame() {
		addFunction( "isGame?", BaseType.BOOL, new Parameter() );
		addFunction( "isGameOver?", BaseType.BOOL, GameType.GAME );
		addFunction( "gameWidth", BaseType.FIXNUM, GameType.GAME );
		addFunction( "gameHeight", BaseType.FIXNUM, GameType.GAME );
		addFunction( "gameIsValidPos?", BaseType.BOOL, GameType.GAME, GameType.POSITION );
		addFunction( "gameIsEmpty?", BaseType.BOOL, GameType.GAME, GameType.POSITION );
		addFunction( "gameSourceDirection", BaseType.FIXNUM, GameType.GAME );
		addFunction( "gameSourcePosition", GameType.POSITION, GameType.GAME );
		addFunction( "gamePieceAt", GameType.PIECE, GameType.STRACETATE, GameType.POSITION );
		addFunction( "gamePeekNext", GameType.PIECE, GameType.GAME );
		addFunction( "gamePeek", GameType.PIECE, GameType.GAME, BaseType.FIXNUM );
		addFunction( "oppositeSide", BaseType.FIXNUM, BaseType.FIXNUM );
	}

	void registerPiece() {
		addFunction( "isPiece?", BaseType.BOOL, new Parameter() );
		addFunction( "pieceIsFull?", BaseType.BOOL, GameType.PIECE, BaseType.FIXNUM );
		addFunction( "pieceType", BaseType.FIXNUM, GameType.PIECE );
		addFunction( "pieceIsSource?", BaseType.BOOL, GameType.PIECE );
		addFunction( "pieceIsSingle?", BaseType.BOOL, GameType.PIECE );
		addFunction( "pieceIsDual?", BaseType.BOOL, GameType.PIECE );
		addFunction( "pieceIsOpen?", BaseType.BOOL, GameType.PIECE, BaseType.FIXNUM );
		addFunction( "pieceFarSide", new Maybe(BaseType.FIXNUM), GameType.PIECE, BaseType.FIXNUM );
	}

	void registerStracetate() {
		addFunction( "isStracetate?", BaseType.BOOL, new Parameter() );
		addFunction( "gameStracetate", GameType.STRACETATE, GameType.GAME );
		addFunction( "stracetateIsEmpty?", BaseType.BOOL, GameType.STRACETATE, GameType.POSITION );
		addFunction( "gameTryNth", new Maybe(GameType.STRACETATE), GameType.STRACETATE, GameType.POSITION, BaseType.FIXNUM );
	}

	void registerPipe() {
		addFunction( "isPipe?", BaseType.BOOL, new Parameter() );
		addFunction( "followPipe", GameType.PIPE, GameType.GAME );
		addFunction( "followPipe", GameType.PIPE, GameType.STRACETATE );
		addFunction( "pipeLength", BaseType.FIXNUM, GameType.PIECE );
		addFunction( "pipeOutDirection", BaseType.FIXNUM, GameType.PIPE );
		addFunction( "pipeOutPosition", new Maybe(GameType.POSITION), GameType.PIPE );
	}

	void registerModifiers() {
		addFunction( "gamePlace", BaseType.BOOL, GameType.GAME, GameType.POSITION );
	}
}
