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
        OPPOSITES = [ Side.BOTTOM, Side.TOP, Side.RIGHT, Side.LEFT ],
        CLOCKWISE = [ Side.RIGHT, Side.LEFT, Side.TOP, Side.BOTTOM ],
        COUNTER_CLOCKWISE = [ Side.LEFT, Side.RIGHT, Side.BOTTOM, Side.TOP ],
        INVALID = -1;

    function SubstrateSize(width, height) {
        this.width = width;
        this.height = height;
    }

    function Position(sizeOrOther, i, j) {
        if (sizeOrOther.hasOwnProperty("size")) {
            this.size = sizeOrOther.size;
            this.i = sizeOrOther.i;
            this.j = sizeOrOther.j;
        } else {
            this.size = sizeOrOther;
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

    SingleType.prototype.isSingle = function () { return true; };
    SingleType.prototype.isDual   = function () { return false; };
    SingleType.prototype.isSource = function () { return false; };
    SingleType.prototype.getFarSide = function (side) {
        if (this.start == side) {
            return this.end;
        } else if (this.end == side) {
            return this.start;
        }
        return null;
    };

    function DualType(first, second) {
        this.first = first;
        this.second = second;
    }

    DualType.prototype.isSingle = function () { return false; };
    DualType.prototype.isDual   = function () { return true; };
    DualType.prototype.isSource = function () { return false; };

    function SourceType(side) {
        this.outflow = side;
    }

    SourceType.prototype.isSingle = function () { return false; };
    SourceType.prototype.isDual   = function () { return false; };
    SourceType.prototype.isSource = function () { return true; };

    var PieceTypes = {
            HORIZONTAL:    new SingleType(Side.LEFT,   Side.RIGHT),
            VERTICAL:      new SingleType(Side.TOP,    Side.BOTTOM),
            TOP_LEFT:      new SingleType(Side.TOP,    Side.LEFT),
            TOP_RIGHT:     new SingleType(Side.TOP,    Side.RIGHT),
            BOTTOM_LEFT:   new SingleType(Side.BOTTOM, Side.LEFT),
            BOTTOM_RIGHT:  new SingleType(Side.BOTTOM, Side.RIGHT),
            SOURCE_TOP:    new SourceType(Side.TOP),
            SOURCE_BOTTOM: new SourceType(Side.BOTTOM),
            SOURCE_LEFT:   new SourceType(Side.LEFT),
            SOURCE_RIGHT:  new SourceType(Side.RIGHT)
        };

    PieceTypes.CROSS =          new DualType(PieceTypes.HORIZONTAL, PieceTypes.VERTICAL);
    PieceTypes.DUAL_TOP_LEFT =  new DualType(PieceTypes.TOP_LEFT,   PieceTypes.BOTTOM_RIGHT);
    PieceTypes.DUAL_TOP_RIGHT = new DualType(PieceTypes.TOP_RIGHT,  PieceTypes.BOTTOM_LEFT);

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

    function typeIndex(type) {
        for (var i = 0; i < NON_SOURCE_TYPES.length; ++i) {
            if (NON_SOURCE_TYPES[i] == type) {
                return i;
            }
        }
        return null;
    }

    function Piece(type) {
        this.type = type;
        this.full = [false, false];
    }

    Piece.prototype.getFarSide = function (side) {
        if (this.type.isSingle()) {
            return this.type.getFarSide(side);
        } else if (this.type.isDual()) {
            var firstFar = this.type.first.getFarSide(side);
            if (firstFar !== null) {
                return firstFar;
            }
            return this.type.second.getFarSide(side);
        }
        return null;
    };

    Piece.prototype.isPipeAt = function (side) {
        if (this.type.isSingle()) {
            return this.type.start === side || this.type.end === side;
        } else if (this.type.isDual()) {
            return side !== null; // We've got sides everywhere.
        } else if (this.type.isSource()) {
            return this.type.outflow === side;
        }
    };

    Piece.prototype.fill = function (side) {
        if (this.type.isSingle()) {
            if (this.isPipeAt(side)) {
                this.full[0] = true;
                return true;
            }
        } else if (this.type.isDual()) {
            if (this.type.first.start === side || this.type.first.end === side) {
                this.full[0] = true;
                return true;
            }
            if (this.type.second.start === side || this.type.second.end === side) {
                this.full[1] = true;
                return true;
            }
        } else if (this.type.isSource()) {
            if (side === null) {
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
        } else if (this.type.isDual()) {
            if (this.type.first.start === side || this.type.first.end === side) {
                return this.full[0];
            }
            if (this.type.second.start === side || this.type.second.end === side) {
                return this.full[1];
            }
        } else if (this.type.isSource()) {
            return this.full[0];
        }
        return false;
    };

    Piece.prototype.accept = function (visitor) {
        if (this.type.isSingle()) {
            visitor.pipe(this.type, this.full[0]);
        } else if (this.type.isDual()) {
            visitor.pipe(this.type.first, this.full[0]);
            visitor.pipe(this.type.second, this.full[1]);
        } else if (this.type.isSource()) {
            visitor.source(this.type.outflow, this.full[0]);
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
            case Corner.TOP_RIGHT: return new Position(this.size, this.size.width - 1, 0);
            case Corner.BOTTOM_LEFT: return new Position(this.size, 0, this.size.height - 1);
            case Corner.BOTTOM_RIGHT: return new Position(this.size, this.size.width - 1, this.size.height - 1);
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

    Substrate.prototype.place = function (position, piece) {
        if (position.valid() && this.isEmpty(position)) {
            this.pieceCount += 1;
            this.pieces[position.i][position.j] = piece;
        }
    };

    function PieceQueue(size, entropy) {
        this.size = size;
        this.entropy = entropy;
        this.queue = [];

        this.fill();
    }

    function randomPiece(types, entropy) {
        return new Piece(entropy.randomElement(types));
    }

    PieceQueue.prototype.fill = function () {
        while (this.queue.length < this.size) {
            this.queue.push(randomPiece(NON_SOURCE_TYPES, this.entropy));
        }
    };

    PieceQueue.prototype.nextPiece = function () {
        var next = this.queue[0];
        this.queue.splice(0, 1);
        this.fill();
        return next;
    };

    function Gameplay(width, height, queueSize, delay, entropy) {
        this.substrate = new Substrate(new SubstrateSize(width, height));
        this.queue = new PieceQueue(queueSize, entropy);
        this.delay = delay;
        this.entropy = entropy;

        this.setupSource();
        this.flowPiece = this.source;
        this.flowOut = this.source.type.outflow;
        this.flowPosition = this.sourcePosition.clone();
        this.flowCount = -delay;

        this.observers = [];
    }

    Gameplay.prototype.width = function () {
        return this.substrate.size.width;
    };

    Gameplay.prototype.height = function () {
        return this.substrate.size.height;
    };

    Gameplay.prototype.position = function (i, j) {
        return new Position(this.substrate.size, (0 <= i && i < this.width()) ? i : INVALID, (0 <= j && j < this.height()) ? j : INVALID);
    };

    Gameplay.prototype.setupSource = function() {
        this.source = randomPiece(SOURCE_TYPES, this.entropy);
        this.sourcePosition = this.position(
            this.entropy.randomInt(1, this.width() - 1),
            this.entropy.randomInt(1, this.height() - 1)
        );
        this.substrate.place(this.sourcePosition, this.source);
    };

    Gameplay.prototype.isGameOver = function () {
        if (this.flowPiece === null) {
            return true;
        }
        var nextPos = this.flowPosition.to(this.flowOut);
        if (!nextPos.valid()) {
            return true;
        }
        var next = this.substrate.at(nextPos);
        if (next !== null && !next.isPipeAt(OPPOSITES[this.flowOut]) ) {
            return true;
        }
        return false;
    };

    Gameplay.prototype.boardFull = function () {
        return this.substrate.empties() <= 0;
    };

    Gameplay.prototype.placeNext = function(position) {
        if (this.isGameOver()) {
            return false;
        }
        if (position.valid() && this.substrate.isEmpty(position)) {
            var next = this.queue.nextPiece();
            this.substrate.place(position, next);
            this.updateFlow();
            return true;
        }
        return false;
    };

    Gameplay.prototype.updateFlow = function () {
        this.flowCount += 1;
        // When we fill the source, we don't
        // update the flow in/out
        if (this.flowCount == -1) {
            this.notify("TAP");
        } else if (this.flowCount === 0) {
            this.flowPiece.fill(null);
        } else if (this.flowCount > 0) {
            // We have to wait till just before we
            // fill the next piece to find out what piece
            // is next, because it might have just
            // been placed.
            this.flowPosition.moveTo(this.flowOut);
            this.flowPiece = this.substrate.at(this.flowPosition);
            if (this.flowPiece !== null) {
                var flowIn = OPPOSITES[this.flowOut];
                this.flowPiece.fill(flowIn);
                this.flowOut = this.flowPiece.getFarSide(flowIn);
            }
        }
        this.notify("FILL");
    };

    Gameplay.prototype.score = function () {
        return this.flowCount > 0 ? this.flowCount : 0;
    };

    Gameplay.prototype.addObserver = function (observer) {
        this.observers.push(observer);
    };

    Gameplay.prototype.clearObservers = function () {
        this.observers.splice(0, this.observers.length);
    };

    Gameplay.prototype.notify = function (eventName) {
        for (var i = 0; i < this.observers.length; ++i) {
            this.observers[i](eventName);
        }
    };

    Gameplay.prototype.peek = function () {
        return this.queue.queue;
    };

    Gameplay.prototype.visit = function (i, j, visitor) {
        var piece = this.substrate.at(this.position(i, j));
        if (piece !== null) {
            piece.accept(visitor);
        }
    };

    Gameplay.prototype.setInfiniteTimeToFlow = function () {
        this.flowCount = -this.height() * this.width();
    };

    Gameplay.prototype.forceFlow = function() {
        if (this.flowCount < -2) {
            this.flowCount = -2;
        }
    };

    Gameplay.prototype.followPipe = function (overlay) {
        var board = overlay ? overlay : this.substrate,
            sourceOutflow = this.source.type.outflow,
            result = {
                outflow: sourceOutflow,
                position: this.sourcePosition.to(sourceOutflow),
                openEnd: false,
                filled: 0,
                length: 0,
                score: 0,
            },
            visited = [];

        do {
            if (board.isEmpty(result.position)) {
                result.openEnd = true;
                break;
            }
            var piece = board.at(result.position),
                inflow = OPPOSITES[result.outflow];

            if (!piece.isPipeAt(inflow)) {
                break;
            }

            result.length += 1;
            result.score += 1;
            for (var v = 0; v < visited.length; ++v) {
                if (visited[v] == piece) {
                    result.score += 1;
                }
            }
            visited.push(piece);
            if (piece.isFull(inflow)) {
                result.filled += 1;
            }

            result.outflow = piece.getFarSide(inflow);
            result.position.moveTo(result.outflow);
        } while (result.position.valid());

        return result;
    };

    Gameplay.prototype.isDeadEnd = function () {
        return !this.followPipe().openEnd;
    };

    var loader = new ImageBatch("images/", function () {
            tileWidth = sourceImages[0].width;
            tileHeight = sourceImages[0].height;
        }),
        background = loader.load("background.jpg"),
        sourceImages = [
            loader.load("sourceTop.png"),
            loader.load("sourceBottom.png"),
            loader.load("sourceLeft.png"),
            loader.load("sourceRight.png")
        ],
        sourceGooImages = [
            loader.load("sourceTopGoo.png"),
            loader.load("sourceBottomGoo.png"),
            loader.load("sourceLeftGoo.png"),
            loader.load("sourceRightGoo.png")
        ],
        pieceImages = [
            loader.load("horizontal.png"),
            loader.load("vertical.png"),
            loader.load("topLeft.png"),
            loader.load("topRight.png"),
            loader.load("bottomLeft.png"),
            loader.load("bottomRight.png")
        ],
        pieceGooImages = [
            loader.load("horizontalGoo.png"),
            loader.load("verticalGoo.png"),
            loader.load("topLeftGoo.png"),
            loader.load("topRightGoo.png"),
            loader.load("bottomLeftGoo.png"),
            loader.load("bottomRightGoo.png")
        ],
        tapbook = new Flipbook(loader, "tap", 6, 1),
        tileWidth = 10,
        tileHeight = 10,
        pointer = null,
        scores = null,
        TAP_TURN_TIME = 2000,
        TAP_FRAME_TIME = 80,
        PIPE_FILL_TIME = 100,
        QUEUE_DRAW_OFFSET = 20,
        OVER_COLOR = "rgba(255,0,0,0.5)";

    function createEmptyScores() {
        return {
            player: []
        };
    }

    (function () {
        loader.commit();

        try {
            scores = JSON.parse(window.localStorage.getItem("pipes_scores")) || createEmptyScores();
        } catch (error) {
            console.log("Error loading scores: " + error);
            scores = createEmptyScores();
        }
    }());

    function saveScore(score) {
        scores.player.push(score);
        try {
            window.localStorage.setItem("pipes_scores", JSON.stringify(scores));
        } catch (error) {
            console.log("Error storing scores: " + error);
        }
    }

    function SubstrateView(game) {
        this.setGame(game, true);
    }

    SubstrateView.prototype.setGame = function (game, playing) {
        var self = this;
        this.game = game;
        this.playing = playing;
        game.addObserver(function (eventName) {
            if (eventName == "TAP") {
                self.startTap();
            } else if (eventName == "FILL" && game.isGameOver() && self.playing) {
                saveScore(game.score());
            }
        });
        this.tapTimer = null;
        this.tap = tapbook.setupPlayback(80, true);
        this.fillTimer = null;
    };

    SubstrateView.prototype.update = function (now, elapsed, keyboard, pointer) {
        if (pointer.primary !== null) {
            if (pointer.primary.isStart && this.playing) {
                var i = Math.floor(pointer.primary.x / tileWidth),
                    j = Math.floor(pointer.primary.y / tileHeight),
                    position = this.game.position(i,j);

                this.game.placeNext(position);
            }
        }
        if (this.tapTimer > 0) {
            this.tapTimer -= elapsed;
            tapbook.updatePlayback(elapsed, this.tap);
        }

        if (this.game.isGameOver()) {
            if (keyboard.wasAsciiPressed("R")) {
                this.setGame(createDefault(this.game.entropy), true);
            }
        } else {
            if (this.playing && keyboard.wasAsciiPressed("F")) {
                this.startFilling();
            } else if (this.fillTimer !== null) {
                this.fillTimer += elapsed;
                if (this.fillTimer > PIPE_FILL_TIME) {
                    this.game.updateFlow();
                    this.fillTimer -= PIPE_FILL_TIME;
                }
            } else if (this.playing && (this.game.boardFull() || this.game.isDeadEnd())) {
                this.startFilling();
            }
        }
    };

    SubstrateView.prototype.startFilling = function () {
        this.game.forceFlow();
        this.fillTimer = 0;
    };

    SubstrateView.prototype.startTap = function () {
        this.tapTimer = TAP_TURN_TIME;
    };

    SubstrateView.prototype.width = function () { return this.game.width() * tileWidth; };
    SubstrateView.prototype.height = function () { return this.game.height() * tileHeight; };

    SubstrateView.prototype.totalWidth = function () { return this.width() + tileWidth + QUEUE_DRAW_OFFSET; };

    SubstrateView.prototype.tileWidth = function () { return tileWidth; };
    SubstrateView.prototype.tileHeight = function () { return tileHeight; };

    SubstrateView.prototype.draw = function (context) {
        context.drawImage(background, 0, 0, this.width(), this.height());
        this.drawSubstrate(context);
    };

    SubstrateView.prototype.drawSubstrate = function (context) {
        if (this.game === null || !loader.loaded) {
            return;
        }
        var x = 0, y = 0,
            tapDraw = this.tap,
            queue = this.game.peek(),
            drawVisitor = {
                pipe: function (type, isFull) {
                    var index = typeIndex(type);
                    context.drawImage(pieceImages[index], x, y);
                    if (isFull) {
                        context.drawImage(pieceGooImages[index], x, y);
                    }
                },
                source: function (side, isFull) {
                    context.drawImage(sourceImages[side], x, y);
                    if (isFull) {
                        context.drawImage(sourceGooImages[side], x, y);
                    }
                    tapbook.draw(context, tapDraw, x, y, ALIGN.Top | ALIGN.Left);
                }
            };

        for (var i = 0; i < this.game.width(); ++i) {
            for (var j = 0; j < this.game.height(); ++j) {
                x = i * tileWidth;
                y = j * tileWidth;
                this.game.visit(i, j, drawVisitor);
            }
        }

        x = this.game.width() * tileWidth + QUEUE_DRAW_OFFSET;
        y = QUEUE_DRAW_OFFSET;

        context.fillStyle = "rgb(128,128,128)";
        context.strokeStyle = "rgb(0,0,0)";
        for (var q = 0; q < queue.length; ++q) {
            var index = queue.length - (q + 1);
            if (index === 0) {
                context.fillStyle = "rgb(196,196,196)";
                context.strokeStyle = "rgb(0,128,0)";
            }
            context.fillRect(x, y, tileWidth, tileHeight);
            queue[index].accept(drawVisitor);
            context.strokeRect(x + 1, y + 1, tileWidth - 2, tileHeight - 2);
            y += tileHeight - 2;
        }

        if (this.game.isGameOver()) {
            context.fillStyle = OVER_COLOR;
            context.fillRect(0, 0, this.width(), this.height());
        }

        context.fillStyle = "rgb(64,64,64)";
        context.font = "15px mono";
        context.textAlign = "center";
        x += tileWidth * 0.5;
        y += tileWidth * 0.5;
        context.fillText("Score:", x, y);
        context.fillText(this.game.score(), x, y + 20);
    };

    // Constructs a gameplay object with the default setup.
    function createDefault(entropy) {
        return new Gameplay(12, 12, 5, 15, entropy);
    }

    function testSuite() {
        function testSimple(type) {
            var piece = new Piece(type);

            TEST.isFalse(piece.isFull(type.start));
            TEST.isFalse(piece.isFull(type.end));
            TEST.isFalse(piece.isFull(null));
            piece.fill(type.start);
            TEST.isTrue(piece.isFull(type.start));
            TEST.isTrue(piece.isFull(type.end));
            TEST.isFalse(piece.isFull(null));

            TEST.equals(piece.getFarSide(type.start), type.end);
            TEST.equals(piece.getFarSide(type.end), type.start);

            for (var s = 0; s < OPPOSITES.length; ++s) {
                var side = OPPOSITES[s];
                if (side !== type.start && side !== type.end) {
                    TEST.isNull(piece.getFarSide(side));
                    TEST.isFalse(piece.isPipeAt(side));
                }
            }
        }

        var simplePieceTests = [
            function testHorizontal()  { testSimple(PieceTypes.HORIZONTAL); },
            function testVertical()    { testSimple(PieceTypes.VERTICAL); },
            function testTopLeft()     { testSimple(PieceTypes.TOP_LEFT); },
            function testTopRight()    { testSimple(PieceTypes.TOP_RIGHT); },
            function testBottomLeft()  { testSimple(PieceTypes.BOTTOM_LEFT); },
            function testBottomRight() { testSimple(PieceTypes.BOTTOM_RIGHT); }
        ];

        function fullnessTest(piece, type) {
            TEST.isFalse(piece.isFull(null));
            TEST.isFalse(piece.isFull(Side.TOP));
            TEST.isFalse(piece.isFull(Side.BOTTOM));
            TEST.isFalse(piece.isFull(Side.LEFT));
            TEST.isFalse(piece.isFull(Side.RIGHT));

            var filled = piece.fill(null);
            TEST.isFalse(filled);
            TEST.isFalse(piece.isFull(null));

            filled = piece.fill(type.first.start);
            TEST.isTrue(filled);

            TEST.isFalse(piece.isFull(null));
            TEST.isTrue(piece.isFull(type.first.start));
            TEST.isTrue(piece.isFull(type.first.end));
            TEST.isFalse(piece.isFull(type.second.start));
            TEST.isFalse(piece.isFull(type.second.end));

            filled = piece.fill(type.second.end);
            TEST.isTrue(filled);

            TEST.isFalse(piece.isFull(null));
            TEST.isTrue(piece.isFull(Side.TOP));
            TEST.isTrue(piece.isFull(Side.BOTTOM));
            TEST.isTrue(piece.isFull(Side.LEFT));
            TEST.isTrue(piece.isFull(Side.RIGHT));
        }

        function dualSidesTest(piece, type) {
            TEST.isTrue(piece.isPipeAt(type.start));
            TEST.isTrue(piece.isPipeAt(type.end));
            TEST.equals(piece.getFarSide(type.start), type.end);
            TEST.equals(piece.getFarSide(type.end), type.start);
        }

        function testDual(type) {
            var piece = new Piece(type);
            fullnessTest(piece, type);
            dualSidesTest(piece, type.first);
            dualSidesTest(piece, type.second);
        }

        var dualPieceTests = [
            function testCross() { testDual(PieceTypes.CROSS); },
            function testDualTopLeft() { testDual(PieceTypes.DUAL_TOP_LEFT); },
            function testDualTopRight() { testDual(PieceTypes.DUAL_TOP_RIGHT); }
        ];

        function testSource(type) {
            var piece = new Piece(type);

            TEST.isFalse(piece.isFull(null));
            TEST.isFalse(piece.isFull(Side.TOP));

            var filled = piece.fill(Side.BOTTOM);
            TEST.isFalse(filled);

            TEST.isFalse(piece.isFull(null));
            TEST.isFalse(piece.isFull(Side.BOTTOM));

            filled = piece.fill(null);
            TEST.isTrue(filled);

            TEST.isTrue(piece.isFull(null));
            TEST.isTrue(piece.isFull(Side.LEFT));

            for (var s = 0; s < OPPOSITES.length; ++s) {
                var side = OPPOSITES[s];
                if (type.outflow === side) {
                    TEST.isTrue(piece.isPipeAt(side));
                } else {
                    TEST.isFalse(piece.isPipeAt(side));
                }
                TEST.isNull(piece.getFarSide(side));
            }
        }

        var sourcePieceTests = [
            function testSourceTop() { testSource(PieceTypes.SOURCE_TOP); },
            function testSourceBottom() { testSource(PieceTypes.SOURCE_BOTTOM); },
            function testSourceLeft() { testSource(PieceTypes.SOURCE_LEFT); },
            function testSourceRight() { testSource(PieceTypes.SOURCE_RIGHT); }
        ];

        var pieceQueueTests = [
            function testPeek() {
                var testSize = 3,
                    queue = new PieceQueue(testSize, ENTROPY.makeRandom()),
                    pieces = queue.queue;
                TEST.notNull(pieces);
                TEST.equals(pieces.length, testSize);
                for (var p = 0; p < pieces.length; ++p) {
                    TEST.notNull(pieces[p]);
                    if (p > 0) {
                        TEST.notSame(pieces[p], pieces[p-1]);
                    }
                }
            },
            function testNextPiece() {
                var testSize = 3,
                    queue = new PieceQueue(testSize, ENTROPY.makeRandom()),
                    peekPieces = queue.queue.slice();

                for (var p = 0; p < testSize; ++p) {
                    var nextPiece = queue.nextPiece();
                    TEST.notNull(nextPiece);
                    TEST.same(nextPiece, peekPieces[p]);
                }
            },
            function testSize() {
                var size = 4,
                    queue = new PieceQueue(size, ENTROPY.makeRandom());
                TEST.equals(queue.size, size);
            },
        ];

        var substrateTests = [
            function testPlace() {
                var WIDTH = 3,
                    HEIGHT = 4,
                    size = new SubstrateSize(WIDTH, HEIGHT),
                    substrate = new Substrate(size),

                    // Remember, this is an array of 3 "columns".
                    pieces =[
                        [
                            new Piece(PieceTypes.BOTTOM_RIGHT),
                            new Piece(PieceTypes.TOP_RIGHT),
                            new Piece(PieceTypes.HORIZONTAL),
                            new Piece(PieceTypes.HORIZONTAL)
                        ], [
                            new Piece(PieceTypes.HORIZONTAL),
                            new Piece(PieceTypes.BOTTOM_LEFT),
                            new Piece(PieceTypes.DUAL_TOP_RIGHT),
                            new Piece(PieceTypes.DUAL_CROSS)
                        ], [
                            new Piece(PieceTypes.BOTTOM_LEFT),
                            new Piece(PieceTypes.VERTICAL),
                            new Piece(PieceTypes.TOP_LEFT),
                            new Piece(PieceTypes.VERTICAL)
                    ]];

                for (var i = 0; i < WIDTH; ++i) {
                    for (var j = 0; j < HEIGHT; ++j) {
                        var position = new Position(size, i, j);
                        TEST.isTrue(substrate.isEmpty(position));
                        substrate.place(position, pieces[i][j]);
                        TEST.isFalse(substrate.isEmpty(position));
                        TEST.same(substrate.at(position), pieces[i][j]);
                    }
                }
            }
        ];

        TEST.run("SimplePiece", simplePieceTests);
        TEST.run("DualPiece", dualPieceTests);
        TEST.run("SourcePiece", sourcePieceTests);
        TEST.run("PieceQueue", pieceQueueTests);
        TEST.run("Substrate", substrateTests);
    }

    return {
        Side: Side,
        Corner: Corner,
        OPPOSITES: OPPOSITES,
        CLOCKWISE: CLOCKWISE,
        COUNTER_CLOCKWISE: COUNTER_CLOCKWISE,
        INVALID: INVALID,
        SOURCE_TYPES: SOURCE_TYPES,
        NON_SOURCE_TYPES: NON_SOURCE_TYPES,
        SubstrateSize: SubstrateSize,
        Position: Position,
        PieceTypes: PieceTypes,
        Piece: Piece,
        Substrate: Substrate,
        GamePlay: Gameplay,
        SubstrateView: SubstrateView,
        createDefault: createDefault,
        testSuite: testSuite
    };
}());
