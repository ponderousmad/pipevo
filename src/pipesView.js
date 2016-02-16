var PIPES_VIEW = (function () {
    "use strict";

    var loader = new ImageBatch("images/", function() {
            tileWidth = sourceImages[0].width;
            tileHeight = sourceImages[0].height;
        }),
        background = loader.load("background.jpeg"),
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
        pieceImages = {},
        pieceGooImages = {},
        tapbook = new Flipbook(loader, "tap", 6, 1),
        tileWidth = 10,
        tileHeight = 10,
        pointer = null,
        TAP_TURN_TIME = 2000,
        TAP_FRAME_TIME = 80,
        OVER_COLOR = "rgba(255,0,0,0.5)";

    (function () {
        pieceImages[PieceTypes.HORIZONTAL] =   loader.load("horizontal.png");
        pieceImages[PieceTypes.VERTICAL] =     loader.load("vertical.png");
        pieceImages[PieceTypes.TOP_LEFT] =     loader.load("topLeft.png");
        pieceImages[PieceTypes.TOP_RIGHT] =    loader.load("topRight.png");
        pieceImages[PieceTypes.BOTTOM_LEFT] =  loader.load("bottomLeft.png");
        pieceImages[PieceTypes.BOTTOM_RIGHT] = loader.load("bottomRight.png");
        
        pieceGooImages[PieceTypes.HORIZONTAL] =   loader.load("horizontalGoo.png");
        pieceGooImages[PieceTypes.VERTICAL] =     loader.load("verticalGoo.png");
        pieceGooImages[PieceTypes.TOP_LEFT] =     loader.load("topLeftGoo.png");
        pieceGooImages[PieceTypes.TOP_RIGHT] =    loader.load("topRightGoo.png");
        pieceGooImages[PieceTypes.BOTTOM_LEFT] =  loader.load("bottomLeftGoo.png");
        pieceGooImages[PieceTypes.BOTTOM_RIGHT] = loader.load("bottomRightGoo.png");
        
        loader.commit();      
    }());

    function SubstrateView(game) {
        this.setGame(game);
    }
    
    SubstrateView.prototype.setGame = function (game, playing) {
        var self = this;
        this.game = game;
		this.playing = playing;
		game.addObserver(function (eventName) {
            if (eventName == "TAP") {
                this.startTap();
            }
        });
        this.tapTimer = null;
        this.tap = tapbook.setupPlayback(80, true);
    };
    
    SubstrateView.prototype.update = function (now, elapsed, pointer) {        
        if (pointer.primary !== null) {
            if (pointer.primary.isStart && this.playing) {
                var position = this.game.position(pointer.primary.x / tileWidth,
                                                  pointer.primary.y / tileHeight );
                this.game.placeNext(position);
            }
        }
        if (this.tapTimer > 0) {
            this.tapTime -= elapsed;
            tapbook.updatePlayback(elapsed, this.tap);
        }
    };

	SubstrateView.prototype.startTap = function () {
		this.tapTimer = TAP_TURN_TIME;
	};

	SubstrateView.prototype.width = function () { return this.game.width() * tileWidth; };
	SubstrateView.prototype.height = function () { return this.game.height() * tileHeight; };

    SubstrateView.prototype.draw = function (context) {
        context.drawImage(background, 0, 0, this.width(), this.height());
        this.drawSubstrate(context);
    };

	SubstrateView.prototype.drawSubstrate = function (context) {
		if (this.game === null || !loader.loaded) {
			return;
		}
		var i = 0, j = 0,
            drawVisitor = {
                pipe: function (type, isFull) {
                    context.drawImage(pieceImages[type], i * tileWidth, j * tileHeight);
                    if (isFull) {
                        context.drawImage(pieceGooImages[type], i * tileWidth, j * tileHeight);
                    }
                },
                source: function (side, isFull) {
                    context.drawImage(sourceImages[side], i * tileWidth, j * tileHeight);
                    if (isFull) {
                        context.drawImage(sourceImageGoos[side], i * tileWidth, j * tileHeight);
                    }
                }
            };
        
        for (i = 0; i < this.game.width(); ++i) {
            for (j = 0; j < this.game.height(); ++j) {
                game.visit(i, j, drawVisitor);
            }
        }
        if (this.game.isGameOver()) {
            context.fillStyle = OVER_COLOR;
            context.fillRect(0, 0, this.width(), this.height());
        }
	};
}());
