var SLUR_PIPES = (function() {
    "use strict";
/*
public class PieceObj extends BaseObj {

    private Piece mPiece;

    public PieceObj( Piece piece ) {
        mPiece = piece;
    }

    public Piece value() {
        return mPiece;
    }
}

public class Game extends BaseObj {
    GamePlay mGame;

    public Game( GamePlay game ) {
        mGame = game;
    }

    public GamePlay value() {
        return mGame;
    }
}

public class StracetateObj extends BaseObj {

    private GamePlay mGame;
    private Stracetate mStracetate;

    public StracetateObj( GamePlay game ) {
        mGame = game;
        mStracetate = new SubstrateWrapper( game.substrate() );
    }

    public StracetateObj( GamePlay game, Stracetate stracetate ) {
        mGame = game;
        mStracetate = stracetate;
    }

    public Stracetate stracetate() {
        return mStracetate;
    }

    public GamePlay game() {
        return mGame;
    }
}

public class Pipe extends BaseObj {
    public Pipe( PipeFollower follower ) {
        mFollower = follower;
    }

    public PipeFollower value() {
        return mFollower;
    }

    private PipeFollower mFollower;

}


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

public class GameType {
    public static final BaseType GAME = new BaseType( Game.class );
    public static final BaseType PIPE = new BaseType( Pipe.class );
    public static final BaseType PIECE = new BaseType( PieceObj.class );
    public static final BaseType STRACETATE = new BaseType( StracetateObj.class );
    public static final ConsType POSITION = new ConsType( BaseType.FIXNUM, BaseType.FIXNUM );
}

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

public class GameTypeBuilder {
    public static TypeBuilder.Probabilities defaultProbabilities() {
        TypeBuilder.Probabilities probs = new TypeBuilder.Probabilities();
        java.util.List<Pair<Type, Integer>> typeWeights = probs.concreteWeights();
        typeWeights.add(new Pair<Type,Integer>(GameType.GAME, 10));
        typeWeights.add(new Pair<Type,Integer>(GameType.PIECE, 10));
        typeWeights.add(new Pair<Type,Integer>(GameType.PIPE, 10));
        typeWeights.add(new Pair<Type,Integer>(GameType.POSITION, 10));
        typeWeights.add(new Pair<Type,Integer>(GameType.STRACETATE, 10));
        return probs;
    }

    public static List<TypeBuilder.Constraint> typeConstraints() {
        List<TypeBuilder.Constraint> constraints = new java.util.ArrayList<TypeBuilder.Constraint>();
        constraints.add(new TypeBuilder.Constraint(GameType.GAME, new java.util.ArrayList<Type>()));
        List<Type> sourceTypes = new java.util.ArrayList<Type>();
        sourceTypes.add(GameType.GAME);
        constraints.add(new TypeBuilder.Constraint(GameType.STRACETATE, sourceTypes));

        sourceTypes = new java.util.ArrayList<Type>();
        sourceTypes.add(GameType.GAME);
        sourceTypes.add(GameType.STRACETATE);
        constraints.add(new TypeBuilder.Constraint(GameType.PIPE, sourceTypes));

        sourceTypes = new java.util.ArrayList<Type>();
        sourceTypes.add(GameType.GAME);
        sourceTypes.add(GameType.STRACETATE);
        sourceTypes.add(GameType.PIPE);
        constraints.add(new TypeBuilder.Constraint(GameType.PIECE, sourceTypes));
        return constraints;
    }
}
*/
    return {
    };
}());
