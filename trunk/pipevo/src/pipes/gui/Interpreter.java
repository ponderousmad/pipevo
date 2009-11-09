/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Component;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.List;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JButton;

import javax.swing.JFrame;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;

import pipes.functional.Game;
import pipes.functional.GameFunctions;
import pipes.root.GamePlay;
import functional.Environment;
import functional.EvalException;
import functional.Obj;
import functional.repl.Initialize;
import functional.repl.Parser;

/**
 * UI for running the interpreter.
 */
class Interpreter {
	private Environment mEnv = null;
	private JFrame mFrame = null;
	private JTextArea mCodeArea;

	class CodeRunner implements ActionListener
	{
		JTextArea mCode;
		JTextArea mParse;
		JTextArea mResult;

		CodeRunner(
			JTextArea code,
			JTextArea parse,
			JTextArea result
		) {
			mCode = code;
			mParse = parse;
			mResult = result;
		}

		public void actionPerformed(ActionEvent e) {
			StringBuffer buffer = new StringBuffer();

			Parser parser = new Parser( mCode.getText() );
			List<Obj> parsed = new ArrayList<Obj>();
			try {
				Obj item;
				while( (item = parser.parse()) != null ) {
					parsed.add( item );
					buffer.append( item.toString() );
					buffer.append( "\n" );
				}
			} catch( Parser.ParseException ex ) {
				ex.printStackTrace();
				buffer.append( ex.getMessage() );
			}
			mParse.setText( buffer.toString() );

			buffer = new StringBuffer();
			try {
				for( Obj obj : parsed ) {
					Obj result = obj.eval( mEnv );
					buffer.append( result.toString() );
					buffer.append( "\n" );
				}
			} catch( EvalException ex ) {
				ex.printStackTrace();
				buffer.append( ex.context() + ex.getMessage() );
			}
			mResult.setText( buffer.toString() );
		}
	}

	private void buildMenus() {
		JMenuBar menuBar = new JMenuBar();

		JMenu fileMenu = new JMenu( "File" );
		fileMenu.setMnemonic(KeyEvent.VK_F);

		JMenuItem loadItem = new JMenuItem( "Load" );
		loadItem.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { loadFile(); }
		} );
		fileMenu.add( loadItem );

		JMenuItem saveItem = new JMenuItem( "Save" );
		saveItem.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent event) { saveFile(); }
		} );
		fileMenu.add( saveItem );

		menuBar.add( fileMenu );
		mFrame.setJMenuBar( menuBar );
	}

	protected void saveFile() {
		File dest = App.fileDialog( mFrame, false, "slur", "slur", "Slur Files" );
		if( dest == null ) {
			return;
		}
		try {
			BufferedWriter writer = new BufferedWriter( new FileWriter( dest ) );
			BufferedReader reader = new BufferedReader( new StringReader( mCodeArea.getText() ) );
			String line = null;
			while( (line = reader.readLine()) != null ) {
				writer.write( line );
				writer.newLine();
			}
			reader.close();
			writer.close();
		} catch (IOException e) {
			System.out.println( "Error writing file." );
		}
	}

	protected void loadFile() {
		File source = App.fileDialog( mFrame, true, "slur", "slur", "Slur Files" );
		if( source == null ) {
			return;
		}
		try {
			BufferedReader reader = new BufferedReader( new FileReader( source ) );
			String line = null;
			StringBuffer contents = new StringBuffer();
			do {
				line = reader.readLine();
				if( line != null ) {
					contents.append( line );
					contents.append( '\n' );
				}
			}
			while( line != null );
			mCodeArea.setText( contents.toString() );
			reader.close();
		} catch (FileNotFoundException e) {
			System.out.println( "File open dialog somehow returned bad file." );
		} catch (IOException e) {
			System.out.println( "Error reading from file." );
		}
	}

	protected void launch( GamePlay game ) {
		if( mFrame != null ) {
			mFrame.setVisible( true );
			return;
		}
		mEnv = Initialize.initWithLibraries();
		GameFunctions.install( mEnv );
		setGame( game );
		JFrame dialog = new JFrame( "Interpreter" );
		mFrame = dialog;
		dialog.setDefaultCloseOperation( JFrame.HIDE_ON_CLOSE );
		dialog.setLayout( new BoxLayout( dialog.getContentPane(), BoxLayout.Y_AXIS ) );
		Font font = new Font("Monaco", Font.PLAIN, 12);

		mCodeArea = buildCodeEditor(font);
		JTextArea parsedArea = createTextOutput( font, 100, "Parse Result:");
		JTextArea resultArea = createTextOutput( font, 100, "Execution Result:");

		JPanel panel = new JPanel();
		panel.setAlignmentX(Component.CENTER_ALIGNMENT);
		JButton runButton = new JButton( "Run" );
		runButton.setAlignmentX(Component.CENTER_ALIGNMENT);
		runButton.addActionListener( new CodeRunner( mCodeArea, parsedArea, resultArea ) );
		panel.add( runButton );
		dialog.add( panel );
		dialog.pack();

		buildMenus();

		dialog.setVisible( true );
	}

	void setGame( GamePlay game ) {
		if( mEnv != null ) {
			mEnv.set( "game", new Game( game ) );
		}
	}

	private JTextArea buildCodeEditor(Font font) {
		return createTextArea(font, 400, "Enter Program:", true);
	}

	private JTextArea createTextOutput(Font font, int height, String title) {
		return createTextArea(font, height, title, false);
	}

	private JTextArea createTextArea(Font font, int height, String title, boolean editable) {
		JTextArea textArea = new JTextArea();
		textArea.setEditable(editable);
		textArea.setFont(font);

		JScrollPane scroll = new JScrollPane(textArea);
		scroll.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
		scroll.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);

		JPanel panel = new JPanel();
		panel.setLayout(new GridLayout());
		panel.setAlignmentX(Component.CENTER_ALIGNMENT);
		panel.setBorder(BorderFactory.createTitledBorder(title));
		panel.setPreferredSize(new Dimension(1000,height));
		panel.add(scroll);

		mFrame.add(panel);
		return textArea;
	}
}