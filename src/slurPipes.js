var SLUR_PIPES = (function() {
    "use strict";

    function gameException(message, environment) {
        return new SLUR.SlurException("GameEvalException", message, environment);
    }

    var GameType = {
        GAME: 2048,
        PIPE: 4096,
        PIECE: 8192,
        BOARD: 16384
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
    function getBoard(env, name) { return env.nameLookup(name).board; }
    function getPiece(env, name) { return env.nameLookup(name).piece; }
    function getSide(env, name) { return env.nameLookup(name).value; }
    function getPipe(env, name) { return env.nameLookup(name).pipe; }
    function getPosition(env, game, name) {
        var p = env.nameLookup(name);
        if (SLUR.isCons(p) && SLUR.isInt(p.car) && SLUR.isInt(p.cdr)) {
            return game.position(p.car.value, p.cdr.value);
        }
        throw gameException("Position must be of the form '(i . j)' where i and j are integers.", env);
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
            return env.nameLookup("g").game ? T : F;
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
            return game.substrate.isEmpty(pos) ? T : F;
        });

        SLUR.define(env, "gameSourceDirection", ["g"], null, function (env) {
            return new SLUR.FixNum(getGame(env, "g").source.type.outflow);
        });

        SLUR.define(env, "gameSourcePosition", ["g"], null, function (env) {
            return createPosition(getGame(env, "g").sourcePosition);
        });

        SLUR.define(env, "gamePieceAt", ["s", "pos"], null, function (env) {
            var piece = getBoard(env, "s").at(getPosition(env, getGame(env, "s"), "pos"));
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
            throw gameException("Peek index out of range.", env);
        });

        SLUR.define(env, "oppositeSide", ["s"], null, function (env) {
            return new SLUR.FixNum(PIPES.OPPOSITES[getSide(env, "s")]);
        });
    }

    function installPiece(env, typeLookup) {
        SLUR.define(env, "isPiece?", ["p"], null, function (env) {
            return env.nameLookup("p").piece ? T : F;
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
            return farSide === null ? SLUR.NULL : new SLUR.FixNum(farSide);
        });
    }

    function installBoard(env) {
        SLUR.define(env, "isBoard?", ["b"], null, function (env) {
            return env.nameLookup("b").board ? T : F;
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
                n = env.nameLookup("n").value;
            if (n >= 0 && n < board.game.peek().length && pos.valid()) {
                return new Board(board.game, new AI.Acetate(board.board, board.game.peek()[n], pos));
            }
            return SLUR.NULL;
        });
    }

    function installPipe(env) {
        SLUR.define(env, "followPipe", ["x"], null, function (env) {
            var board = env.nameLookup("x");
            return new Pipe(board.game.followPipe(board.board));
        });

        SLUR.define(env, "isPipe?", ["p"], null, function (env) {
            return env.nameLookup("p").pipe ? T : F;
        });

        SLUR.define(env, "pipeLength", ["p"], null, function (env) {
            return new SLUR.FixNum(getPipe(env, "p").length);
        });

        SLUR.define(env, "pipeFilled", ["p"], null, function (env) {
            return new SLUR.FixNum(getPipe(env, "p").filled);
        });

        SLUR.define(env, "pipeOutDirection", ["p"], null, function (env) {
            return new SLUR.FixNum(getPipe(env, "p").outflow);
        });

        SLUR.define(env, "pipeOutPosition", ["p"], null, function (env) {
            return createPosition(getPipe(env, "p").position);
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

    var GameTypes = {};

    (function () {
        for (var type in GameType) {
            if (GameType.hasOwnProperty(type) && GameType[type]) {
                GameTypes[type] = new SLUR_TYPES.BaseType(GameType[type], type);
            }
        }
        GameTypes.POSITION = new SLUR_TYPES.ConsType(SLUR_TYPES.Primitives.FIX_NUM, SLUR_TYPES.Primitives.FIX_NUM);
    }());

    function register(registry, allowModify, allowFollow) {
        function add(name, type) {
            registry.register(name, type);
        }

        function addFunction(name, returnType, parameterTypes) {
            add(name, new SLUR_TYPES.FunctionType(returnType, parameterTypes));
        }

        var Primitives = SLUR_TYPES.Primitives;

        // Register constants
        for (var pieceType in PIPES.PieceTypes) {
            if (PIPES.PieceTypes.hasOwnProperty(pieceType)) {
                add("pt" + pieceType, Primitives.STRING);
            }
        }
        for (var side in PIPES.Side) {
            if (PIPES.Side.hasOwnProperty(side)) {
                add("side" + side, Primitives.FIX_NUM);
            }
        }

        // Register Game
        addFunction("isGame?", Primitives.BOOL, [new SLUR_TYPES.Parameter()]);
        addFunction("isGameOver?", Primitives.BOOL, [GameTypes.GAME]);
        addFunction("gameWidth", Primitives.FIX_NUM, [GameTypes.GAME]);
        addFunction("gameHeight", Primitives.FIX_NUM, [GameTypes.GAME]);
        addFunction("gameIsValidPos?", Primitives.BOOL, [GameTypes.GAME, GameTypes.POSITION]);
        addFunction("gameIsEmpty?", Primitives.BOOL, [GameTypes.GAME, GameTypes.POSITION]);
        addFunction("gameSourceDirection", Primitives.FIX_NUM, [GameTypes.GAME]);
        addFunction("gameSourcePosition", GameTypes.POSITION, [GameTypes.GAME]);
        addFunction("gamePieceAt", GameTypes.PIECE, [GameTypes.BOARD, GameTypes.POSITION]);
        addFunction("gamePeekNext", GameTypes.PIECE, [GameTypes.GAME]);
        addFunction("gamePeek", GameTypes.PIECE, [GameTypes.GAME, Primitives.FIX_NUM]);
        addFunction("oppositeSide", Primitives.FIX_NUM, [Primitives.FIX_NUM]);

        // Register Piece
        addFunction("isPiece?", Primitives.BOOL, [new SLUR_TYPES.Parameter()]);
        addFunction("pieceIsFull?", Primitives.BOOL, [GameTypes.PIECE, Primitives.FIX_NUM]);
        addFunction("pieceType", Primitives.FIX_NUM, [GameTypes.PIECE]);
        addFunction("pieceIsSource?", Primitives.BOOL, [GameTypes.PIECE]);
        addFunction("pieceIsSingle?", Primitives.BOOL, [GameTypes.PIECE]);
        addFunction("pieceIsDual?", Primitives.BOOL, [GameTypes.PIECE]);
        addFunction("pieceIsOpen?", Primitives.BOOL, [GameTypes.PIECE, Primitives.FIX_NUM]);
        addFunction("pieceFarSide", new SLUR_TYPES.Maybe(Primitives.FIX_NUM), [GameTypes.PIECE, Primitives.FIX_NUM]);

        // Register Board
        addFunction("isBoard?", Primitives.BOOL, [new SLUR_TYPES.Parameter()]);
        addFunction("gameBoard", GameTypes.BOARD, [GameTypes.GAME]);
        addFunction("boardIsEmpty?", Primitives.BOOL, [GameTypes.BOARD, GameTypes.POSITION]);
        addFunction("gameTryNth", new SLUR_TYPES.Maybe(GameTypes.BOARD), [GameTypes.BOARD, GameTypes.POSITION, Primitives.FIX_NUM]);

        if (allowModify) {
            addFunction("gamePlace", Primitives.BOOL, [GameTypes.GAME, GameTypes.POSITION]);
        }

        // Pipe follow functions
        if (!allowFollow) {
            return;
        }
        addFunction("isPipe?", Primitives.BOOL, [new SLUR_TYPES.Parameter()]);
        addFunction("followPipe", GameTypes.PIPE, [GameTypes.GAME]);
        addFunction("followPipe", GameTypes.PIPE, [GameTypes.BOARD]);
        addFunction("pipeLength", Primitives.FIX_NUM, [GameTypes.PIPE]);
        addFunction("pipeFilled", Primitives.FIX_NUM, [GameTypes.PIPE]);
        addFunction("pipeOutDirection", Primitives.FIX_NUM, [GameTypes.PIPE]);
        addFunction("pipeOutPosition", new SLUR_TYPES.Maybe(GameTypes.POSITION), [GameTypes.PIPE]);
    }

/*
public class GameTypeBuilder {
    public static TypeBuilder.Probabilities defaultProbabilities() {
        TypeBuilder.Probabilities probs = new TypeBuilder.Probabilities();
        java.util.List<Pair<Type, Integer>> typeWeights = probs.concreteWeights();
        typeWeights.add(new Pair<Type,Integer>(GameTypes.GAME, 10));
        typeWeights.add(new Pair<Type,Integer>(GameTypes.PIECE, 10));
        typeWeights.add(new Pair<Type,Integer>(GameTypes.PIPE, 10));
        typeWeights.add(new Pair<Type,Integer>(GameTypes.POSITION, 10));
        typeWeights.add(new Pair<Type,Integer>(GameTypes.BOARD, 10));
        return probs;
    }
*/

    function typeConstraints(Constraint) {
        var constraints = [];
        constraints.push(new Constraint(GameTypes.GAME, []));
        constraints.push(new Constraint(GameTypes.BOARD, [GameTypes.GAME]));
        constraints.push(new Constraint(GameTypes.PIPE, [GameTypes.GAME, GameTypes.BOARD]));
        constraints.push(new Constraint(GameTypes.PIECE, [GameTypes.GAME, GameTypes.BOARD, GameTypes.PIPE]));
        return constraints;
    }

    function testSuite() {
        var registryTests = [
            function testRegisterBasic() {
                var reg = new SLUR_TYPES.Registry();
                register(reg, false, false);
                TEST.equals(reg.entries.length, 41);
            },
            function testRegisterModify() {
                var reg = new SLUR_TYPES.Registry();
                register(reg, true, false);
                TEST.equals(reg.entries.length, 42);
            },
            function testRegisterPipe() {
                var reg = new SLUR_TYPES.Registry();
                register(reg, false, true);
                TEST.equals(reg.entries.length, 48);
            }
        ];

        TEST.run("Game Registry", registryTests);
    }

    return {
        GameTypes: GameTypes,
        Game: Game,
        typeConstraints: typeConstraints,
        install: install,
        register: register,
        testSuite: testSuite
    };
}());
