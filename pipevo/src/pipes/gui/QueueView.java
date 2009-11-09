/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;

import javax.swing.JPanel;

import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.PieceType;
import pipes.root.PieceVisitor;
import pipes.root.Side;

/**
 * Manage the display of the piece queue.
 */
public class QueueView extends JPanel {

	public QueueView( GamePlay gameplay, Images images ) {
		mImages = images;
		setGame( gameplay );
	}

	public void setGame( GamePlay gameplay ) {
		mGameplay = gameplay;
		mGameplay.addObserver( new GamePlay.GameplayObserver() { public void updateGameplay( Event event ) { repaint(); } } );
		mQueueSize = mGameplay.peek().length;
		setPreferredSize( new Dimension( width(), height() ) );
	}

	public int width() { return mImages.tileWidth() + 2; }
	public int height() { return ( mImages.tileHeight() + 1 ) * mQueueSize + 1; }


	public void paint( Graphics g ) {
		super.paint( g );
		Piece[] queue = mGameplay.peek();

		final int kWidth = mImages.tileWidth();
		final int kHeight = mImages.tileHeight();

		class PieceDrawer implements PieceVisitor {
			PieceDrawer( Graphics g ) { mG = g; }

			public void setOffset( int x, int y ) { mX = x; mY = y; }

			public void visitSimple(PieceType.SingleType type, boolean isFull) {
				mG.drawImage( mImages.piece( type, false ), mX, mY, kWidth, kHeight, null );
			}

			public void visitSource(Side side, boolean isFull) {}

			private Graphics mG = null;
			private int mX = 0;
			private int mY = 0;
		}
		PieceDrawer drawer = new PieceDrawer( g );
		for( int i = 0; i < mQueueSize; ++i ) {
			drawer.setOffset( 1, i * kHeight + i + 1 );
			g.setColor( BORDER_COLOR );
			g.drawRect( 0, i * kHeight + i, kWidth + 1, kHeight + 1 );
			queue[ mQueueSize - i - 1 ].accept( drawer );
			if( i == queue.length - 1 ) {
				g.setColor( NEXT_COLOR );
				g.fillRect( 1, i * kHeight + i + 1, kWidth, kHeight );
			}
		}
	}

	private GamePlay mGameplay;
	private Images mImages;
	private int mQueueSize;
	private static final long serialVersionUID = -952616893004335725L;
	private static final Color BORDER_COLOR = new Color( 0, 0, 0 );
	private static final Color NEXT_COLOR = new Color( 0.0f, 0.0f, 1.0f, 0.25f );
}
