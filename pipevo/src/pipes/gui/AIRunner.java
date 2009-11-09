/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.FlowLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JSlider;

import pipes.ai.players.Bob;
import pipes.ai.players.BorderAI;
import pipes.ai.players.PipeAI;
import pipes.ai.players.Player;
import pipes.ai.players.RandomAI;
import pipes.ai.players.RandomEndAI;
import pipes.ai.players.Susan;

/**
 * Manage dialog for selecting an AI to run.
 */
class AIRunner {
	JFrame mFrame = null;

	private static PipeAI[] sAIs = null;

	protected static PipeAI aiForPlayer( Player player ) {
		if( player == null ) {
			return null;
		}

		if( sAIs == null ) {
			sAIs = new PipeAI[ Player.values().length ];
			sAIs[ Player.SUSAN.ordinal() ] = new Susan();
			sAIs[ Player.BOB.ordinal() ] = new Bob();
			sAIs[ Player.BORDER.ordinal() ] = new BorderAI();
			sAIs[ Player.RANDOM.ordinal() ] = new RandomAI();
			sAIs[ Player.RANDOM_END.ordinal() ] = new RandomEndAI();
		}
		return sAIs[ player.ordinal() ];
	}

	void launch( final long seed ) {
		if( mFrame != null ) {
			mFrame.setVisible( true );
			return;
		}
		JFrame dialog = new JFrame( "Test AI" );
		mFrame = dialog;
		dialog.setDefaultCloseOperation( JFrame.HIDE_ON_CLOSE );
		dialog.setLayout( new FlowLayout() );
		dialog.add( new JLabel( "AI" ) );

		Player ais[] = new Player[ Player.values().length - 1 ];
		int i = 0;
		for( Player player : Player.values() ) {
			if( !player.equals( Player.HUMAN ) ) {
				ais[i] = player;
				++i;
			}
		}
		final JComboBox players = new JComboBox( ais );
		dialog.add( players );

		dialog.add( new JLabel( "Number of runs") );
		final JSlider slider = new JSlider( 0, 1000 );
		dialog.add( slider );

		JButton runButton = new JButton( "Run" );
		runButton.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				PipeAI ai = aiForPlayer( (Player)players.getSelectedItem() );
				if( ai != null ) {
					new RunAIWorker( ai, slider.getValue(), seed ).start();
				}
			}
		});
		dialog.add( runButton );
		dialog.pack();
		dialog.setVisible( true );
	}
}