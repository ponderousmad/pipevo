/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Image;
import java.io.IOException;
import java.io.InputStream;

import javax.imageio.ImageIO;

import pipes.root.PieceType.SingleType;
import pipes.root.Side;

/**
 * Manage loading the image resources used by th game.
 */
public class Images {

	public Images()
	{
		loadImages();
	}

	public Image background() { return mBackground; }
	public Image source( Side side, boolean goo ) { return goo ? mSourcesGoo[ side.ordinal() ] : mSources[ side.ordinal() ]; }
	public Image tap( int i ) { return mTaps[i]; }
	public Image piece( SingleType type, boolean goo ) { return goo ? mSimpleGoo[ type.ordinal() ] : mSimple[ type.ordinal() ]; }

	/**
	 * If not yet loaded, load all the images needed to draw the game
	 */
	private void loadImages() {
		if( mBackground != null ) {
			return;
		}
		mBackground = loadImage("images/background.jpeg");
		mSources[Side.   TOP.ordinal()] = loadImage("images/sourceTop.png");
		mSources[Side.BOTTOM.ordinal()] = loadImage("images/sourceBottom.png");
		mSources[Side.  LEFT.ordinal()] = loadImage("images/sourceLeft.png");
		mSources[Side. RIGHT.ordinal()] = loadImage("images/sourceRight.png");
		mSourcesGoo[Side.   TOP.ordinal()] = loadImage("images/sourceTopGoo.png");
		mSourcesGoo[Side.BOTTOM.ordinal()] = loadImage("images/sourceBottomGoo.png");
		mSourcesGoo[Side.  LEFT.ordinal()] = loadImage("images/sourceLeftGoo.png");
		mSourcesGoo[Side. RIGHT.ordinal()] = loadImage("images/sourceRightGoo.png");

		for( int i = 0; i < TAP_COUNT; ++i ) {
			mTaps[i] = loadImage("images/tap" + Integer.toString( i ) + ".png");
		}

		mSimple[SingleType.  HORIZONTAL.ordinal()] = loadImage("images/horizontal.png");
		mSimple[SingleType.    VERTICAL.ordinal()] = loadImage("images/vertical.png");
		mSimple[SingleType.    TOP_LEFT.ordinal()] = loadImage("images/topLeft.png");
		mSimple[SingleType.   TOP_RIGHT.ordinal()] = loadImage("images/topRight.png");
		mSimple[SingleType. BOTTOM_LEFT.ordinal()] = loadImage("images/bottomLeft.png");
		mSimple[SingleType.BOTTOM_RIGHT.ordinal()] = loadImage("images/bottomRight.png");
		mSimpleGoo[SingleType.  HORIZONTAL.ordinal()] = loadImage("images/horizontalGoo.png");
		mSimpleGoo[SingleType.    VERTICAL.ordinal()] = loadImage("images/verticalGoo.png");
		mSimpleGoo[SingleType.    TOP_LEFT.ordinal()] = loadImage("images/topLeftGoo.png");
		mSimpleGoo[SingleType.   TOP_RIGHT.ordinal()] = loadImage("images/topRightGoo.png");
		mSimpleGoo[SingleType. BOTTOM_LEFT.ordinal()] = loadImage("images/bottomLeftGoo.png");
		mSimpleGoo[SingleType.BOTTOM_RIGHT.ordinal()] = loadImage("images/bottomRightGoo.png");
	}

	/**
	 * Load an image from disk using paths relative to this class.
	 */
	private Image loadImage( String path ) {
		Image image = null;
		try {
			InputStream stream = getClass().getResourceAsStream( path );
			if( stream != null ) {
				image = ImageIO.read( stream );
			}
		} catch (IOException e) {
			e.printStackTrace();
		}
		return image;
	}

	public int tileWidth() { return mSimple[0].getWidth( null ); }
	public int tileHeight() { return mSimple[0].getHeight( null ); }
	public static final int TAP_COUNT = 6;

	private Image mBackground = null;
	private Image mSources[] = new Image[Side.values().length];
	private Image mSourcesGoo[] = new Image[Side.values().length];
	private Image mTaps[] = new Image[TAP_COUNT];
	private Image mSimple[] = new Image[SingleType.values().length];
	private Image mSimpleGoo[] = new Image[SingleType.values().length];

}
