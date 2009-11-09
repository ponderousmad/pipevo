/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Component;
import java.awt.Dimension;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;

import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JFormattedTextField;
import javax.swing.JFrame;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JTextField;

import pipes.gui.EvolveProbabilities.DefaultsBuilder;

import evolve.Runner;
import evolve.Evaluator.Evaluation;

public class EvolveLauncher {
	JDialog mDialog;
	JTextField mPopPath;
	JTextField mPopStorePath;
	EvolveProbabilities mProbabilities;
	EvolveProgress mEvolve;

	public void show(JFrame owner, final Runner runner, final DefaultsBuilder probabilites, final Long initialSeed ) {
		final int kWidth = 500;

		mDialog = new JDialog(owner, "Evolve Parameters");
		mDialog.setLocationByPlatform(true);
		mDialog.setDefaultCloseOperation( JFrame.DISPOSE_ON_CLOSE );
		mDialog.setLayout( new BoxLayout( mDialog.getContentPane(), BoxLayout.Y_AXIS ) );

		JButton typeProbabilities = new JButton("Type Probabilities");
		typeProbabilities.setAlignmentX(Component.LEFT_ALIGNMENT);
		typeProbabilities.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent arg0) {
				mProbabilities.adjustTypeProbabilities();
			}
		});
		mDialog.add(typeProbabilities);

		JButton geneProbabilities = new JButton("Gene Probabilities");
		geneProbabilities.setAlignmentX(Component.LEFT_ALIGNMENT);
		geneProbabilities.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent arg0) {
				mProbabilities.adjustGeneProbabilities();
			}
		});
		mDialog.add(geneProbabilities);

		JButton mutationProbabilities = new JButton("Mutation Probabilities");
		mutationProbabilities.setAlignmentX(Component.LEFT_ALIGNMENT);
		mutationProbabilities.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent arg0) {
				mProbabilities.adjustMutateProbabilities();
			}
		});
		mDialog.add(mutationProbabilities);

		JButton survivalRatios = new JButton("Survival Ratios");
		survivalRatios.setAlignmentX(Component.LEFT_ALIGNMENT);
		survivalRatios.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent arg0) {
				mProbabilities.adjustSurvivalRatios();
			}
		});
		mDialog.add(survivalRatios);

		JButton loadProb = new JButton("Load Probabilities");
		loadProb.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(loadProb);
		loadProb.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				File path = App.fileDialog( mDialog, true, "probabilities", "prob", "Probabilities" );
				if( path != null ) {
					mProbabilities.load(path);
				}
			}
		});

		JButton storeProb = new JButton("Save Probabilities");
		storeProb.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(storeProb);
		storeProb.addActionListener(new ActionListener(){
			public void actionPerformed(ActionEvent e) {
				File path = App.fileDialog( mDialog, false, "probabilities", "prob", "Probabilities" );
				if( path != null ) {
					mProbabilities.store(path);
				}
			}
		});

		final JLabel seedLabel = new JLabel("Seed:");
		seedLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(seedLabel);

		final JFormattedTextField setSeed = new JFormattedTextField();
		setSeed.setValue(initialSeed);
		Dimension prefSize = setSeed.getPreferredSize();
		setSeed.setPreferredSize(new Dimension(kWidth, prefSize.height));
		mDialog.add(setSeed);

		JButton newSeed = new JButton("New seed");
		newSeed.setAlignmentX(Component.LEFT_ALIGNMENT);
		newSeed.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {
				setSeed.setValue(new java.util.Random().nextLong());
			}});
		mDialog.add(newSeed);

		final JLabel generationsLabel = new JLabel("Generations:");
		generationsLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(generationsLabel);

		final JFormattedTextField setGenerations = new JFormattedTextField();
		setGenerations.setValue(new Integer(100));
		prefSize = setSeed.getPreferredSize();
		setGenerations.setPreferredSize(new Dimension(kWidth, prefSize.height));
		mDialog.add(setGenerations);

		final JLabel popSizeLabel = new JLabel("Population Size:");
		popSizeLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(popSizeLabel);

		final JFormattedTextField setPopSize = new JFormattedTextField();
		setPopSize.setValue(new Integer(100));
		prefSize = setSeed.getPreferredSize();
		setPopSize.setPreferredSize(new Dimension(kWidth, prefSize.height));
		mDialog.add(setPopSize);

		final JLabel popPathLabel = new JLabel("Load Population:");
		mDialog.add(popPathLabel);
		mPopPath = new JTextField();
		mDialog.add(mPopPath);
		final JButton browsePop = new JButton("Browse");
		browsePop.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {
				File path = App.fileDialog( mDialog, true, "populations", "pop", "Population Files" );
				if( path != null ) {
					mPopPath.setText(path.getAbsolutePath());
				}
			}
		});
		browsePop.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(browsePop);

		File popFile = new File(System.getProperty("user.dir"));
		popFile = new File(popFile, "populations");
		popFile = new File(popFile, "temp.pop");

		final JLabel popStorePathLabel = new JLabel("Population store location:");
		mDialog.add(popStorePathLabel);
		mPopStorePath = new JTextField();
		mPopStorePath.setText(popFile.getAbsolutePath());
		mDialog.add(mPopStorePath);
		final JButton browseStorePop = new JButton("Browse");
		browseStorePop.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {
				File path = App.fileDialog( mDialog, false, "populations", "pop", "Population Files" );
				if( path != null ) {
					mPopStorePath.setText(path.getAbsolutePath());
				}
			}
		});
		browseStorePop.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(browseStorePop);

		mProbabilities = new EvolveProbabilities(mDialog, probabilites);

		final JButton run = new JButton("Run");
		run.setAlignmentX(Component.LEFT_ALIGNMENT);
		mDialog.add(run);

		run.addActionListener( new ActionListener() {
			public void actionPerformed(ActionEvent arg0) {
				if(run.getText().equals("Run")) {
					start(run, runner, (Integer)setPopSize.getValue(), (Integer)setGenerations.getValue(), (Long)setSeed.getValue());
				} else {
					stop();
					run.setText("Run");
				}
			}
		});

		mDialog.pack();
		mDialog.setVisible(true);
	}

	private synchronized void start(final JButton runButton, Runner runner, Integer popSize, Integer generations, Long seed) {
		mEvolve = new EvolveProgress(runner, new EvolveProgress.Reciever() {
			public void recieve(Evaluation best) {
				runButton.setText("Run");
				clearEvolve();
			}
		});

		String path = mPopStorePath.getText();
		if( path != null && path.length() > 0 ) {
			mEvolve.setPopulationStorePath(path);
		}
		runButton.setText("Stop");
		mEvolve.run(mDialog, popSize, mPopPath.getText(), generations, mProbabilities, seed);
	}

	private synchronized void stop() {
		mEvolve.abort();
		clearEvolve();
	}

	private synchronized void clearEvolve() {
		mEvolve = null;
	}
}
