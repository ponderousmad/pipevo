/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.InputEvent;
import java.awt.event.KeyEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.util.Random;

import javax.swing.*;
import javax.swing.filechooser.FileFilter;

import evolve.TypeBuilder;


import pipes.ai.PipeFollower;
import pipes.ai.players.*;
import pipes.evolve.GameTypeBuilder;
import pipes.root.GamePlay;
import pipes.root.GamePlay.GameplayObserver;
import pipes.stats.StatsManager;

public class App {
	public App()
	{
		mImages = new Images();
		restart();
	}

	/**
	 * Create the GUI and show it.  For thread safety,
	 * this method should be invoked from the
	 * event-dispatching thread.
	 */
	private static void createAndShowGUI() {
		sApp.setup();
	}

	private void setup() {
		//Make sure we have nice window decorations.
		JFrame.setDefaultLookAndFeelDecorated(true);

		//Create and set up the window.
		mFrame = new JFrame("PipesFrame");
		mFrame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

		mFrame.addWindowListener( new WindowAdapter() {
			public void windowClosing( WindowEvent e ) {
				if( mWriteStats ) {
					writeStats();
				}
			}
		} );

		JPanel panel = new JPanel();

		mSubstrateView = new SubstrateView( mGame, mImages );
		panel.add( mSubstrateView );

		JPanel subPanel = new JPanel();
		subPanel.setLayout( new BoxLayout(subPanel, BoxLayout.Y_AXIS ) );

		mQueueView = new QueueView( mGame, mImages );
		subPanel.add( mQueueView );

		mScore = new JLabel( "0" );
		subPanel.add( mScore );

		panel.add( subPanel );
		panel.setPreferredSize( new Dimension( 530, 480 ) );

		mFrame.add( panel );

		 //Display the window.
		mFrame.setPreferredSize( new Dimension( 550, 545 ) );
		mFrame.pack();

		buildMenus();

		mFrame.setVisible(true);
	}

	private static class GameDefaultsBuilder extends EvolveProbabilities.DefaultsBuilder {
		public TypeBuilder.Probabilities typeDefault() { return GameTypeBuilder.defaultProbabilities(); }
	}

	private void buildMenus() {
		JMenuBar menuBar = new JMenuBar();
		JMenu gameMenu = new JMenu( "Game" );
		gameMenu.setMnemonic(KeyEvent.VK_G);

		JMenuItem restartItem = new JMenuItem( "New Game" );
		restartItem.setAccelerator( KeyStroke.getKeyStroke( KeyEvent.VK_F2, 0 ) );
		gameMenu.add( restartItem );
		restartItem.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { setupGame( null ); }
		} );

		JMenuItem fillItem = new JMenuItem( "Fill All" );
		fillItem.setAccelerator( KeyStroke.getKeyStroke( KeyEvent.VK_F, InputEvent.ALT_MASK ) );
		gameMenu.add( fillItem );
		fillItem.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { fillAll(); }
		} );

		menuBar.add( gameMenu );

		JMenu aiMenu = new JMenu( "AI" );
		aiMenu.setMnemonic(KeyEvent.VK_A);

		addAI( aiMenu, new RandomAI(), "Random Game", null );
		addAI( aiMenu, new RandomEndAI(), "Simple Game", null );
		addAI( aiMenu, new BorderAI(), "Border Game", null );
		addAI( aiMenu, new FarAI(), "Far Game", null );
		addAI( aiMenu, new Susan(), "Susan", KeyStroke.getKeyStroke( KeyEvent.VK_S, InputEvent.ALT_MASK ) );
		addAI( aiMenu, new Bob(), "Bob", KeyStroke.getKeyStroke( KeyEvent.VK_B, InputEvent.ALT_MASK ) );

		final JCheckBoxMenuItem writeStatsToggle = new JCheckBoxMenuItem( "Write Stats On Close" );
		writeStatsToggle.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				mWriteStats = !mWriteStats;
				writeStatsToggle.setState( mWriteStats );
			}
		});
		aiMenu.add( writeStatsToggle );

		menuBar.add( aiMenu );

		JMenu runMenu = new JMenu( "Run" );
		runMenu.setMnemonic(KeyEvent.VK_R);

		JMenuItem performRuns = new JMenuItem( "Test AI" );
		performRuns.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { launchAIRunner(); }
		} );
		runMenu.add( performRuns );

		JMenuItem setSeed = new JMenuItem( "Set Seed" );
		setSeed.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { setSeedDialog(); }
		});
		runMenu.add( setSeed );

		JMenuItem interpreter = new JMenuItem( "Interpreter" );
		interpreter.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { launchInterpreter(); }
		});
		runMenu.add( interpreter );

		JMenuItem evolve = new JMenuItem( "Evolve X^2 + 2*X" );
		evolve.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				new EvolveLauncher().show(mFrame, new XsqdPlus2XRunner(), new EvolveProbabilities.DefaultsBuilder(), nextSeed());
			}
		});
		runMenu.add( evolve );

		JMenuItem evolvePipes = new JMenuItem( "Evolve Pipes" );
		evolvePipes.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				new EvolveLauncher().show(mFrame, new PipeGameRunner(true), new GameDefaultsBuilder(), nextSeed());
			}
		});
		runMenu.add( evolvePipes );

		evolvePipes = new JMenuItem( "Evolve Pipes - No Follow" );
		evolvePipes.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				new EvolveLauncher().show(mFrame, new PipeGameRunner(false), new GameDefaultsBuilder(), nextSeed());
			}
		});
		runMenu.add( evolvePipes );

		menuBar.add( runMenu );

		mFrame.setJMenuBar( menuBar );
	}

	protected void setSeedDialog() {
		JDialog dialog = new JDialog( mFrame, "Set Seed", true );
		dialog.setLocationByPlatform(true);
		dialog.setLayout( new FlowLayout() );
		final JFormattedTextField field = new JFormattedTextField();
		field.setValue( new Long(mNextSeed) );
		Dimension prefSize = field.getPreferredSize();
		field.setPreferredSize( new Dimension( 200, prefSize.height ) );
		dialog.add( field );
		JButton setButton = new JButton( "Set");
		setButton.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				Long value = (Long) field.getValue();
				if( value != null ) {
					setNextSeed( value.longValue() );
				}
			}
		});
		dialog.add( setButton );
		JButton randomButton = new JButton( "Randomize" );
		randomButton.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				long next = new Random().nextLong();
				setNextSeed( next );
				field.setValue( new Long( next ) );
			}
		});
		dialog.add( randomButton );
		dialog.pack();
		dialog.setVisible( true );
	}

	AIRunner mAIRunner = new AIRunner();
	protected void launchAIRunner() {
		mAIRunner.launch( nextSeed() );
	}

	Interpreter mInterpreter = new Interpreter();
	protected void launchInterpreter() {
		mInterpreter.launch( mGame );
	}

	private void addAI( JMenu menu, final PipeAI ai, String name, KeyStroke stroke ) {
		JMenuItem item = new JMenuItem( name );
		if( stroke != null ) {
			item.setAccelerator( stroke );
		}
		item.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				setupGame( ai );
			}
		} );
		menu.add( item );
	}

	private void updateStats() {
		if( mStarted ) {
			PipeFollower follower = new PipeFollower( mGame );
			follower.follow();
			StatsManager.getSession().addRun( mPlayer, follower.length(), mSeed );
		}
		mStarted = false;
	}

	private void writeStats() {
		updateStats();
		StatsManager.writeStats();
	}

	private void restart() {
		stopAITimer();
		stopFillAllTimer();

		updateStats();

		if( mGame != null ) {
			mGame.clearObservers();
		}
		mGame = GamePlay.create( nextSeed() );
		mInterpreter.setGame( mGame );

		mPlayer = Player.HUMAN;

		mGame.addObserver( new GameplayObserver() {
			public void updateGameplay(Event event) {
				if( event == Event.FILL ) {
					mStarted = true;
					if( mScore != null ) {
						mScore.setText( Integer.toString( mGame.score() ) );
					}
				}
			}
		});

		if( mScore != null ) {
			mScore.setText( "0" );
		}
	}

	private void stopFillAllTimer() {
		if( mFillAllTimer != null ) {
			mFillAllTimer.stop();
			mFillAllTimer = null;
		}
	}

	private void stopAITimer() {
		if( mAITimer != null ) {
			mAITimer.stop();
			mAITimer = null;
		}
	}

	private void fillAll() {
		stopAITimer();
		if( mGame.isGameOver() ) {
			return;
		}
		mFillAllTimer = new Timer( 10, new ActionListener() {
			public void actionPerformed(ActionEvent event) {
				mGame.updateFlow();
				if( mGame.isGameOver() ) {
					stopFillAllTimer();
				}
			}
		} );
		mFillAllTimer.start();
	}

	private void setupGame( PipeAI ai ) {
		restart();
		mSubstrateView.setGame( mGame, ai == null );
		mQueueView.setGame( mGame );

		mAI = ai;
		if( mAI != null ) {
			mPlayer = mAI.player();
			mAI.setGame( mGame, mSeed );
			mAITimer = new Timer( 50, new ActionListener() {
				public void actionPerformed(ActionEvent event) {
					if( !mAI.performMove() ) {
						fillAll();
					}
					if( mGame.isGameOver() ) {
						stopAITimer();
					}
				}
			} );
			mAITimer.start();
		}
		mFrame.repaint();
	}

	public static void main(String[] args) {
		//Schedule a job for the event-dispatching thread:
		//creating and showing this application's GUI.
			sApp = new App();
		javax.swing.SwingUtilities.invokeLater(
				new Runnable() {
					public void run() {
						createAndShowGUI();
					}
				}
			);
	}

	private void setNextSeed( long next ) {
		mNextSeed = next;
	}

	private long nextSeed() {
		mSeed = mNextSeed;
		++mNextSeed;
		return mSeed;
	}

	private static File sPrevLoc = new File( System.getProperty("user.dir") );
	static File fileDialog(java.awt.Component owner, boolean load, String subPath, final String extension, final String type) {
		JFileChooser chooser = new JFileChooser();
		chooser.addChoosableFileFilter( new FileFilter() {
			public boolean accept(File f) {
				return f != null && ( f.isDirectory() || f.getName().toLowerCase().endsWith( "." + extension.toLowerCase() ) );
			}
			public String getDescription() { return type + " (." + extension + ")";}
		});
		if( sPrevLoc != null ) {
			chooser.setCurrentDirectory( new File( sPrevLoc, subPath) );
		}
		int returnVal = load ? chooser.showOpenDialog(owner) : chooser.showSaveDialog(owner);
		if(returnVal == JFileChooser.APPROVE_OPTION) {
			File selected = chooser.getSelectedFile();
			if( !load && !( selected.getName().toLowerCase().endsWith("." + extension.toLowerCase()) ) ) {
				selected = new File( selected.getAbsolutePath() + "." + extension );
			}
			sPrevLoc = selected.getParentFile().getParentFile();
			return selected;
		}
		return null;
	}

	private static App sApp;

	private GamePlay mGame = null;
	private PipeAI mAI = null;
	private Timer mAITimer = null;
	private Timer mFillAllTimer = null;
	private Images mImages = null;
	private SubstrateView mSubstrateView = null;
	private QueueView mQueueView = null;
	private JFrame mFrame = null;
	private JLabel mScore = null;
	private Player mPlayer = Player.HUMAN;
	private boolean mStarted = false;
	private boolean mWriteStats = false;

	private long mSeed = 0;
	private long mNextSeed = new Random().nextLong();
}
