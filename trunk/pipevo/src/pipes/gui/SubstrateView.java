/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

import javax.swing.JPanel;
import javax.swing.Timer;

import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.PieceVisitor;
import pipes.root.Position;
import pipes.root.Side;
import pipes.root.Substrate;
import pipes.root.PieceType.SingleType;

/**
 * Manage the UI for the game board.
 * Draws tiles, handles mouse input.
 */
public class SubstrateView extends JPanel {

	/**
	 * Construct a view on the specified game and using the provided images.
	 */
	public SubstrateView( GamePlay game, Images images )
	{
		setGame( game, true );
		mImages = images;
		mTileWidth = mImages.tileWidth();
		mTileHeight = mImages.tileHeight();

		class ClickListener extends MouseAdapter {
			public void mouseClicked( MouseEvent event ) {
				if( !mPlaying ) {
					return;
				}
				if( event.getButton() != MouseEvent.BUTTON1 ) {
					return;
				}
				Position position = mGame.position( event.getX() / mTileWidth,
													event.getY() / mTileWidth );
				mGame.placeNext( position );
			}
		}
		addMouseListener( new ClickListener() );
		setPreferredSize( new Dimension( width(), height() ) );
	}

	/**
	 * Switch the game object being used by the substrate.
	 * @param game The new game to show.
	 * @param playing Indicate whether to accept mouse input.
	 */
	void setGame( GamePlay game, boolean playing ) {
		mGame = game;
		mPlaying = playing;
		mGame.addObserver( new GamePlay.GameplayObserver() {
			public void updateGameplay( Event event ) {
				if( event == Event.TAP ) {
					startTap();
				}
				repaint();
			}
		} );
		if( mTapTimer != null ) {
			mTapTimer.stop();
			mTapTimer = null;
		}
		mTapTurns = 0;
		mTap = 0;
	}

	private void startTap()
	{
		mTapTimer = new Timer(100, new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				++mTap;
				if( mTap == Images.TAP_COUNT ) {
					mTap = 0;
					++mTapTurns;
					if( mTapTurns == TAP_TURNS ) {
						mTapTimer.stop();
					}
				}
				repaint();
			}
		} );
		++mTap;
		repaint();
		mTapTimer.start();
	}

	public void paintComponent(Graphics g)
	{
		super.paintComponent(g);
		g.drawImage( mImages.background(), 0, 0, width(), height(), null );
		drawSubstrate( g );
	}

	public int width() { return mGame.width() * mTileWidth; }
	public int height() { return mGame.height() * mTileHeight; }

	public void drawSubstrate( Graphics g )
	{
		if( mGame == null ) {
			return;
		}
		class PieceDrawer implements PieceVisitor {
			PieceDrawer( Graphics2D g )
			{
				mG = g;
			}

			public void setOffset( int x, int y )
			{
				mX = x;
				mY = y;
			}

			public void visitSimple(SingleType type, boolean isFull) {
				mG.drawImage( mImages.piece( type, false ), mX, mY, mTileWidth, mTileHeight, null );
				if( isFull ) {
					mG.drawImage( mImages.piece( type, true ), mX, mY, mTileWidth, mTileHeight, null );
				}
			}

			public void visitSource(Side side, boolean isFull) {
				mG.drawImage( mImages.source( side, false ), mX, mY, mTileWidth, mTileHeight, null );
				if( isFull ) {
					mG.drawImage( mImages.source( side, true ), mX, mY, mTileWidth, mTileHeight, null );
				}
				mG.drawImage( mImages.tap( mTap ), mX, mY, mTileWidth, mTileHeight, null );
			}

			private Graphics2D mG = null;
			private int mX = 0;
			private int mY = 0;
		}

		PieceDrawer drawer = new PieceDrawer( (Graphics2D)g );

		Substrate substrate = mGame.substrate();
		for( int i = 0; i < mGame.width(); ++i ) {
			for( int j = 0; j < mGame.height(); ++j ) {
				Piece piece = substrate.at( mGame.position( i, j ) );
				if( piece != null ) {
					drawer.setOffset( i * mTileWidth, j * mTileHeight );
					piece.accept( drawer );
				}
			}
		}
		if( mGame.isGameOver() ) {
			g.setColor( OVER_COLOR );
			g.fillRect( 0, 0, width(), height() );
		}
	}

	private GamePlay mGame = null;
	private boolean mPlaying = true;
	private Images mImages = null;
	private int mTileWidth = 0;
	private int mTileHeight = 0;
	private int mTap = 0;
	private int mTapTurns = 0;
	private Timer mTapTimer = null;

	private static final Color OVER_COLOR = new Color( 1.0f, 0.0f, 0.0f, 0.5f );
	private static final int TAP_TURNS = 5;

	private static final long serialVersionUID = 7634563485954447648L;
}
