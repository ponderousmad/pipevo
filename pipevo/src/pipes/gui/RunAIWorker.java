/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Dimension;
import java.awt.FlowLayout;

import javax.swing.JFrame;
import javax.swing.JProgressBar;

import com.sun.java.SwingWorker;

import pipes.ai.PipeFollower;
import pipes.ai.players.PipeAI;
import pipes.root.GamePlay;
import pipes.stats.StatsManager;

class RunAIWorker extends SwingWorker {
	private int mRunCount;
	private int mCurrent;
	private PipeAI mAI;
	private long mSeed;

	private JFrame mProgressFrame;
	private JProgressBar mProgress;
	private boolean mUIShown = false;

	void setupUI()
	{
		mProgressFrame = new JFrame();
		mProgressFrame.setDefaultCloseOperation( JFrame.DISPOSE_ON_CLOSE );
		mProgressFrame.setLayout( new FlowLayout() );

		mProgress = new JProgressBar( 0, mRunCount );
		mProgress.setStringPainted(true);
		mProgress.setPreferredSize( new Dimension( 300, 40 ) );
		mProgressFrame.add( mProgress );
		mProgressFrame.pack();

		mProgressFrame.setTitle( "Performing " + mRunCount + " runs of " + mAI.player().toString() );
		mProgressFrame.setVisible( true );
		mProgressFrame.toFront();

		mUIShown = true;
	}

	private void runAI( PipeAI ai ) {
		GamePlay game = GamePlay.create( mSeed );
		ai.setGame( game, mSeed );
		while( !game.isGameOver() ) {
			if( !ai.performMove() ) {
				break;
			}
		}

		PipeFollower follower = new PipeFollower( game );
		follower.follow();
		StatsManager.getSession().addRun( ai.player(), follower.length(), mSeed );
		++mSeed;
	}

	RunAIWorker( PipeAI ai, int runCount, long seed ) {
		mAI = ai;
		mRunCount = runCount;
		mCurrent = 0;
		mSeed = seed;
		setName(ai.player().name() + "Worker");
	}

	public int getCurrent() {
		return mCurrent;
	}

	public Object construct() {
		javax.swing.SwingUtilities.invokeLater(
				new Runnable() {
					public void run() {
						setupUI();
					}
				}
			);

		for( ; mCurrent < mRunCount; ++mCurrent ) {
			if( mUIShown && !mProgressFrame.isVisible() ) {
				return null;
			}
			runAI( mAI );
			if( mUIShown ) {
				mProgress.setValue( mCurrent );
			}
		}
		return mCurrent;
	}

	public void finished() {
		Integer result = (Integer) get();
		if( result != null ) {
			System.out.println( "Task finished:" + result.toString() );
		} else {
			System.out.println( "Task Aborted" );
		}

		mProgressFrame.setVisible( false );
		mProgressFrame.dispose();
	}
}