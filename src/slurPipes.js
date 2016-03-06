var SLUR_PIPES = (function() {
    "use strict";

    var GameType = {
        GAME: 2048,
        PIPE: 4096,
        PIECE: 8192,
        BOARD: 16384,
        POSITION: 32768
    };

    function PieceObj(piece) {
        this.piece = piece;
    }
    SLUR.makeType(PieceObj, GameType.PIECE);
    PieceObj.prototype.toString = function () { return "PIECE"; };

    function Game(game) {
        this.game = game;
    }
    SLUR.makeType(Game, GameType.GAME);
    Game.prototype.toString = function () { return "GAME"; };

    function Board(game, board) {
        this.game = game;
        this.board = board;
    }
    SLUR.makeType(Board, GameType.BOARD);
    Board.prototype.toString = function () { return "BOARD"; };

    function Pipe(pipe) {
        this.pipe = pipe;
    }
    SLUR.makeType(Pipe, GameType.BOARD);
    Pipe.prototype.toString = function () { return "PIPE"; };

    function getGame(env, name) { return env.nameLookup(name).game; }
    function getPiece(env, name) { return env.nameLookup(name).piece; }
    function getSide(env, name) { return env.nameLookup(name).value; }
    function getPipe(env, name) { return env.nameLookup(name).pipe; }
    function getPosition(env, game, name) {
        var p = env.nameLookup(name);
        if (SLUR.isCons(p) && SLUR.isInt(p.car) && SLUR.isInt(p.cdr)) {
            return game.position(p.car.value, p.cdr.value);
        }
        throw SLUR.evalException("Position must be of the form '(i . j)' where i and j are integers.", env);
    }

    function createPosition(i, j) {
        if (typeof j !== 'undefined') {
            return new SLUR.Cons(new SLUR.FixNum(i), new SLUR.FixNum(j));
        }
        var pos = i;
        return createPosition(pos.i, pos.j);
    }

    function installConstants(env) {
        var typeLookup = {};
        for (var pieceType in PIPES.PieceTypes) {
            if (PIPES.PieceTypes.hasOwnProperty(pieceType)) {
                typeLookup[PIPES.PieceTypes[pieceType]] = pieceType;
                env.bind("pt" + pieceType, new SLUR.StringValue(pieceType));
            }
        }
        for (var side in PIPES.Side) {
            if (PIPES.Side.hasOwnProperty(side)) {
                env.bind("side" + side, new SLUR.FixNum(PIPES.Side[side]));
            }
        }
        return typeLookup;
    }

    var T = SLUR.TRUE,
        F = SLUR.NULL;

    function installGame(env) {
        SLUR.define(env, "isGame?", ["g"], null, function (env) {
            return env.nameLookup("g").type() === GameType.GAME ? T : F;
        });

        SLUR.define(env, "isGameOver?", ["g"], null, function (env) {
            return getGame(env, "g").isGameOver() ? T : F;
        });

        SLUR.define(env, "gameWidth", ["g"], null, function (env) {
            return new SLUR.FixNum(getGame(env, "g").width());
        });

        SLUR.define(env, "gameHeight", ["g"], null, function (env) {
            return new SLUR.FixNum(getGame(env, "g").height());
        });

        SLUR.define(env, "gamePlace", ["g", "pos"], null, function (env) {
            var game = getGame(env, "g");
            return game.placeNext(getPosition(env, game, "pos")) ? T : F;
        });

        SLUR.define(env, "gameIsValidPos?", ["g", "pos"], null, function (env) {
            return getPosition(env, getGame(env, "g"), "pos").valid() ? T : F;
        });

        SLUR.define(env, "gameIsEmpty?", ["g", "pos"], null, function (env) {
            var game = getGame(env, "g"),
                pos = getPosition(env, game, "pos");
            return game.substrate().isEmpty(pos) ? T : F;
        });

        SLUR.define(env, "gameSourceDirection", ["g"], null, function (env) {
            return new SLUR.FixNum(getGame(env, "g").source.type.outflow);
        });

        SLUR.define(env, "gameSourcePosition", ["g"], null, function (env) {
            return createPosition(getGame(env, "g").sourcePosition());
        });

        SLUR.define(env, "gamePieceAt", ["s", "pos"], null, function (env) {
            var piece = getBoard(env, "s").at(getPosition(env, s.game(), "pos"));
            if (piece === null) {
                return SLUR.NULL;
            }
            return new PieceObj(piece);
        });

        SLUR.define(env, "gamePeekNext", ["g"], null, function (env) {
            return new PieceObj(getGame(env, "g").peek()[0]);
        });

        SLUR.define(env, "gamePeek", ["g", "i"], null, function (env) {
            var game = getGame(env, "g"),
                index = env.nameLookup("i").value;
            if (0 <= index && index < game.peek().length) {
                return new PieceObj(game.peek()[index]);
            }
            throw SLUR.evalException("Peek index out of range.", env);
        });

        SLUR.define(env, "oppositeSide", ["s"], null, function (env) {
            return new SLUR.FixNum(PIPES.OPPOSITES[getSide(env, "s")]);
        });
    }

    function installPiece(env, typeLookup) {
        SLUR.define(env, "isPiece?", ["p"], null, function (env) {
            return env.nameLookup("p").type() === GameType.PIECE ? T : F;
        });

        SLUR.define(env, "pieceIsFull?", ["p", "side"], null, function (env) {
            return getPiece(env, "p").isFull(getSide(env, "side")) ? T : F;
        });

        SLUR.define(env, "pieceType", ["p"], null, function (env) {
            return new SLUR.StringValue(typeLookup[getPiece(env, "p").type]);
        });

        SLUR.define(env, "pieceIsSource?", ["p"], null, function (env) {
            return getPiece(env, "p").type.isSource() ? T : F;
        });

        SLUR.define(env, "pieceIsSingle?", ["p"], null, function (env) {
            return getPiece(env, "p").type.isSingle() ? T : F;
        });

        SLUR.define(env, "pieceIsDual?",   ["p"], null, function (env) {
            return getPiece(env, "p").type.isDual() ? T : F;
        });

        SLUR.define(env, "pieceIsOpen?", ["p", "side"], null, function (env) {
            return getPiece(env, "p").isPipeAt(getSide(env, "side")) ? T : F;
        });

        SLUR.define(env, "pieceFarSide", ["p", "side"], null, function (env) {
            var farSide = getPiece(env, "p").getFarSide(getSide(env, "side"));
            return farSide === null ? SLUR.NULL : new FixNum(farSide);
        });
    }

    function installBoard(env) {
        SLUR.define(env, "isBoard?", ["b"], null, function (env) {
            return env.nameLookup("b").type() === GameType.BOARD ? T : F;
        });

        SLUR.define(env, "gameBoard", ["g"], null, function (env) {
            var game = getGame(env, "g");
            return new Board(game, game.substrate);
        });

        SLUR.define(env, "boardIsEmpty?", ["board", "pos"], null, function (env) {
            var board = env.nameLookup("board"),
                pos = getPosition(env, board.game, "pos");
            return board.board.isEmpty(pos) ? T : F;
        });

        SLUR.define(env, "gameTryNth", ["board", "pos", "n"], null, function (env) {
            var board = env.nameLookup("board"),
                pos = getPosition(env, board.game, "pos"),
                n = env.lookup("n").value;
            if (n >= 0 && n < board.game.peek().length && position.valid()) {
                return new Board(board.game, new PIPES.Acetate(board.board, board.game.peek()[n], position));
            }
            return SLUR.NULL;
        });
    }

    function installPipe(env) {
        SLUR.define(env, "followPipe", ["x"], null, function (env) {
            var board = env.nameLookup("x");
            return new Pipe(AI.followPipe(board.game, board.board));
        });

        SLUR.define(env, "isPipe?", ["p"], null, function (env) {
            return env.nameLookup("p").type() === GameType.PIPE ? T : F;
        });

        SLUR.define(env, "pipeLength", ["p"], null, function (env) {
            return new FixNum(getPipe(env, "p").length);
        });

        SLUR.define(env, "pipeFilled", ["p"], null, function (env) {
            return new FixNum(getPipe(env, "p").filled);
        });

        SLUR.define(env, "pipeOutDirection", ["p"], null, function (env) {
            return new FixNum(getPipe(env, "p").outflow);
        });

        SLUR.define(env, "pipeOutPosition", ["p"], null, function (env) {
            return createPosition(asPipe(env, "p").position);
        });

        SLUR.define(env, "pipeOpenEnd", ["p"], null, function (env) {
            return getPipe(env, "p").openEnd ? T : F;
        });
    }

    function installDiscarder(env) {
        SLUR.define(env, "borderDiscard", ["x"], null, function (env) {
            var board = env.nameLookup("x"),
                border = new AI.BorderDiscarder(board.game, board.board),
                pos = border.discard;
            return pos === null ? SLUR.NULL : createPosition(pos);
        });
    }

    function install(env) {
        var typeLookup = installConstants(env);
        installGame(env);
        installPiece(env, typeLookup);
        installBoard(env);
        installPipe(env);
        installDiscarder(env);
    }

/*
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
        registerBoard();
        if (allowFollow) {
            registerPipe();
        }
    }

    void add(String name, Type type) {
        mReg.add(new Symbol(name), type);
    }

    void addFunction(String name, Type returnType) {
        mReg.add(new Symbol(name), new FuncType(returnType, new Type[]{}));
    }

    void addFunction(String name, Type returnType, Type arg1Type) {
        mReg.add(new Symbol(name), new FuncType(returnType, new Type[]{arg1Type}));
    }

    void addFunction(String name, Type returnType, Type arg1Type, Type arg2Type) {
        mReg.add(new Symbol(name), new FuncType(returnType, new Type[]{arg1Type, arg2Type}));
    }

    void addFunction(String name, Type returnType, Type arg1Type, Type arg2Type, Type arg3Type) {
        mReg.add(new Symbol(name), new FuncType(returnType, new Type[]{arg1Type, arg2Type, arg3Type}));
    }

    void registerConstants() {
        for (PieceType pieceType : PieceType.values()) {
            add("pt" + pieceType.toString(), BaseType.FIXNUM);
        }
        for (Side side : Side.values()) {
            add("side" + side.toString(), BaseType.FIXNUM);
        }
    }

    void registerGame() {
        addFunction("isGame?", BaseType.BOOL, new Parameter());
        addFunction("isGameOver?", BaseType.BOOL, GameType.GAME);
        addFunction("gameWidth", BaseType.FIXNUM, GameType.GAME);
        addFunction("gameHeight", BaseType.FIXNUM, GameType.GAME);
        addFunction("gameIsValidPos?", BaseType.BOOL, GameType.GAME, GameType.POSITION);
        addFunction("gameIsEmpty?", BaseType.BOOL, GameType.GAME, GameType.POSITION);
        addFunction("gameSourceDirection", BaseType.FIXNUM, GameType.GAME);
        addFunction("gameSourcePosition", GameType.POSITION, GameType.GAME);
        addFunction("gamePieceAt", GameType.PIECE, GameType.STRACETATE, GameType.POSITION);
        addFunction("gamePeekNext", GameType.PIECE, GameType.GAME);
        addFunction("gamePeek", GameType.PIECE, GameType.GAME, BaseType.FIXNUM);
        addFunction("oppositeSide", BaseType.FIXNUM, BaseType.FIXNUM);
    }

    void registerPiece() {
        addFunction("isPiece?", BaseType.BOOL, new Parameter());
        addFunction("pieceIsFull?", BaseType.BOOL, GameType.PIECE, BaseType.FIXNUM);
        addFunction("pieceType", BaseType.FIXNUM, GameType.PIECE);
        addFunction("pieceIsSource?", BaseType.BOOL, GameType.PIECE);
        addFunction("pieceIsSingle?", BaseType.BOOL, GameType.PIECE);
        addFunction("pieceIsDual?", BaseType.BOOL, GameType.PIECE);
        addFunction("pieceIsOpen?", BaseType.BOOL, GameType.PIECE, BaseType.FIXNUM);
        addFunction("pieceFarSide", new Maybe(BaseType.FIXNUM), GameType.PIECE, BaseType.FIXNUM);
    }

    void registerBoard() {
        addFunction("isBoard?", BaseType.BOOL, new Parameter());
        addFunction("gameBoard", GameType.STRACETATE, GameType.GAME);
        addFunction("stracetateIsEmpty?", BaseType.BOOL, GameType.STRACETATE, GameType.POSITION);
        addFunction("gameTryNth", new Maybe(GameType.STRACETATE), GameType.STRACETATE, GameType.POSITION, BaseType.FIXNUM);
    }

    void registerPipe() {
        addFunction("isPipe?", BaseType.BOOL, new Parameter());
        addFunction("followPipe", GameType.PIPE, GameType.GAME);
        addFunction("followPipe", GameType.PIPE, GameType.STRACETATE);
        addFunction("pipeLength", BaseType.FIXNUM, GameType.PIECE);
        addFunction("pipeOutDirection", BaseType.FIXNUM, GameType.PIPE);
        addFunction("pipeOutPosition", new Maybe(GameType.POSITION), GameType.PIPE);
    }

    void registerModifiers() {
        addFunction("gamePlace", BaseType.BOOL, GameType.GAME, GameType.POSITION);
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
        Game: Game,
        install: install
    };
}());
