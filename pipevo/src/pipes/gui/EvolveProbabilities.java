/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.awt.Component;
import java.awt.Container;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.MouseEvent;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.text.DecimalFormat;
import java.text.ParseException;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JDialog;
import javax.swing.JFormattedTextField;
import javax.swing.JLabel;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JFormattedTextField.AbstractFormatter;
import javax.swing.JFormattedTextField.AbstractFormatterFactory;
import javax.swing.event.MouseInputAdapter;
import javax.swing.table.AbstractTableModel;

import evolve.Darwin;
import evolve.GeneBuilder;
import evolve.GeneRandomizer;
import evolve.Mutation;
import evolve.TypeBuilder;
import evolve.genes.FixNumGenerator;
import evolve.genes.RealGenerator;


import functional.type.Type;
import util.Pair;

public class EvolveProbabilities {
	JDialog mOwner;

	JDialog mTypeDialog;
	TypeBuilder.Probabilities mTypeProbabilities;

	JDialog mGeneDialog;
	GeneRandomizer.Probabilities mGeneProbabilities;

	JDialog mMutateDialog;
	Mutation.Probabilities mMutationProbabilities;

	JDialog mSurvivalDialog;
	Darwin.SurvivalRatios mSurvivalRatios;

	public static class DefaultsBuilder {
		public TypeBuilder.Probabilities typeDefault() { return new TypeBuilder.Probabilities(); }
		public GeneRandomizer.Probabilities geneDefault() { return new GeneRandomizer.Probabilities(); }
		public Mutation.Probabilities mutationDefault() { return new Mutation.Probabilities(); }
		public Darwin.SurvivalRatios surviveDefault() { return new Darwin.SurvivalRatios(); }
	}

	public EvolveProbabilities(JDialog owner, DefaultsBuilder builder) {
		mOwner = owner;

		mTypeProbabilities = builder.typeDefault();
		mGeneProbabilities = builder.geneDefault();
		mMutationProbabilities = builder.mutationDefault();
		mSurvivalRatios = builder.surviveDefault();
	}

	public void adjustTypeProbabilities() {
		if( mTypeDialog != null ) {
			if( mTypeDialog.isVisible() ) {
				return;
			}
		}

		JDialog dialog = constructDialog("Type Probabilities");
		JPanel wholePanel = new JPanel();
		wholePanel.setLayout( new BoxLayout( wholePanel, BoxLayout.Y_AXIS ) );
		JPanel panel = new JPanel();
		panel.setBorder(BorderFactory.createTitledBorder("Concrete Weights"));
		panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
		addConcreteWeights(panel);
		wholePanel.add(panel);
		addFunctionWeight(wholePanel);
		addListWeight(wholePanel);
		addMaybeWeight(wholePanel);
		addConsWeight(wholePanel);
		addParameterWeight(wholePanel);
		addNewParameterProb(wholePanel);
		addArgCount(wholePanel);

		dialog.add(new JScrollPane(wholePanel));

		mTypeDialog = dialog;
		showDialog(dialog, true);
	}

	public void adjustGeneProbabilities() {
		if( mGeneDialog != null ) {
			if( mGeneDialog.isVisible() ) {
				return;
			}
		}
		JDialog dialog = constructDialog("Gene Probabilities");
		JPanel wholePanel = new JPanel();
		wholePanel.setLayout( new BoxLayout( wholePanel, BoxLayout.Y_AXIS ) );
		JPanel panel = new JPanel();
		panel.setBorder(BorderFactory.createTitledBorder("Build Type Weights"));
		panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
		addBuildTypeWeights(panel);
		wholePanel.add(panel);
		addGenomeSizeWeights(wholePanel);
		addChromasomeLengthWeights(wholePanel);
		addListLengthWeights(wholePanel);
		addStringLengthWeights(wholePanel);
		addMaybeIsNullProbability(wholePanel);

		addFixnumRangeProbabilities(wholePanel);
		addRealRangeProbabilities(wholePanel);
		dialog.add(new JScrollPane(wholePanel));

		mGeneDialog = dialog;
		showDialog(dialog, true);
	}

	public void adjustMutateProbabilities() {
		if( mMutateDialog != null ) {
			if( mMutateDialog.isVisible() ) {
				return;
			}
		}
		JDialog dialog = constructDialog("Mutate Probabilities");
		addMutateTopLevelProbability(dialog);
		addMutateSeedProbability(dialog);
		addMutateStringLengthProbability(dialog);
		addMutateSymbolLengthProbability(dialog);
		addMutateListLengthProbability(dialog);
		addMutateSwapListProbability(dialog);
		addMutateReorderListProbability(dialog);
		addMutateFixnumRangeProbability(dialog);
		addMutateRealRangeProbability(dialog);
		addReplaceSubgeneProbability(dialog);
		addMutateAddGeneProbability(dialog);
		addMutateSkipChromasomeProbability(dialog);
		addMutateAddChromasomeProbability(dialog);
		addMutateAddTargetChromasomeProbability(dialog);

		mMutateDialog = dialog;
		showDialog(dialog, false);
	}

	public void adjustSurvivalRatios() {
		if( mSurvivalDialog != null ) {
			if( mSurvivalDialog.isVisible() ) {
				return;
			}
		}
		JDialog dialog = constructDialog("Survival Ratios");
		addSurvivorRatio(dialog);
		addMutatedSurvivorRatio(dialog);
		addMutantRatio(dialog);
		addPurebreadRatio(dialog);

		mSurvivalDialog = dialog;
		showDialog(dialog, false);
	}

	private JDialog constructDialog(String title) {
		JDialog dialog = new JDialog(mOwner, title);
		dialog.setLocationByPlatform(true);
		dialog.setDefaultCloseOperation(javax.swing.JFrame.DISPOSE_ON_CLOSE);
		dialog.setLayout( new BoxLayout( dialog.getContentPane(), BoxLayout.Y_AXIS ) );
		return dialog;
	}

	private void showDialog(final JDialog dialog, boolean centerDone) {
		JButton done = new JButton("Done");
		done.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				dialog.setVisible(false);
			}
		});
		dialog.add(done);
		if( centerDone ) {
			done.setAlignmentX(Component.CENTER_ALIGNMENT);
		}
		dialog.pack();
		dialog.setVisible(true);
	}

	private void addFixnumRangeProbabilities(Container container) {
		JLabel label = new JLabel("FixNum Range Weights");
		container.add(label);
		final JPopupMenu menu = new JPopupMenu();
		JTable table = new JTable( new AbstractTableModel() {
			private static final long serialVersionUID = 7578144496123174583L;
			private final String[] mColumnNames = new String[] {"Min", "Max", "Weight"};
			public String getColumnName(int col) {
				return mColumnNames[col].toString();
			}

			{
				JMenuItem addItem = new JMenuItem("Add Row");
				menu.add(addItem);
				addItem.addActionListener(new ActionListener(){
					public void actionPerformed(ActionEvent arg0) {
						addRow();
					}
				});
			}

			private void addRow() {
				mGeneProbabilities.fixnumRangeWeights.add(new Pair<FixNumGenerator.Range,Integer>(
					new FixNumGenerator.Range(0,0), 1
				));
				fireTableRowsInserted(
					mGeneProbabilities.fixnumRangeWeights.size()-1,
					mGeneProbabilities.fixnumRangeWeights.size()-1
				);
			};

			public int getColumnCount() {
				return 3;
			}

			public int getRowCount() {
				return mGeneProbabilities.fixnumRangeWeights.size();
			}

			public boolean isCellEditable(int row, int col) { return true; }

			public Object getValueAt(int row, int column) {
				Pair<FixNumGenerator.Range,Integer> entry = mGeneProbabilities.fixnumRangeWeights.get(row);
				switch(column) {
				case 0:
					return entry.first.min;
				case 1:
					return entry.first.max;
				}
				return entry.second;
			}
			public void setValueAt(Object value, int row, int col) {
				Pair<FixNumGenerator.Range,Integer> entry = mGeneProbabilities.fixnumRangeWeights.get(row);
				switch(col) {
				case 0:
					entry.first.min = Integer.parseInt(value.toString());
					break;
				case 1:
					entry.first.max = Integer.parseInt(value.toString());
					break;
				case 2:
					entry.second = Integer.parseInt(value.toString());
					break;
				}
				fireTableCellUpdated(row, col);
			}
		});
		table.addMouseListener(new MouseInputAdapter() {
			public void mousePressed(MouseEvent e) {
				maybeShowPopup(menu, e);
			}

			public void mouseReleased(MouseEvent e) {
				maybeShowPopup(menu, e);
			}

			private void maybeShowPopup(final JPopupMenu menu, MouseEvent e) {
				if( e.isPopupTrigger() ) {
					menu.show(e.getComponent(),
					e.getX(), e.getY());
				}
			}
		});
		container.add(table.getTableHeader());
		container.add(table);
	}

	private void addRealRangeProbabilities(Container container) {
		JLabel label = new JLabel("Real Range Weights");
		container.add(label);

		final JPopupMenu menu = new JPopupMenu();
		JTable table = new JTable( new AbstractTableModel() {
			private static final long serialVersionUID = 7578144496123174583L;
			private final String[] mColumnNames = new String[] {"Min", "Max", "Weight"};

			{
				JMenuItem addItem = new JMenuItem("Add Row");
				menu.add(addItem);
				addItem.addActionListener(new ActionListener(){
					public void actionPerformed(ActionEvent arg0) {
						addRow();
					}
				});
			}

			private void addRow() {
				mGeneProbabilities.realRangeWeights.add(new Pair<RealGenerator.Range,Integer>(
					new RealGenerator.Range(0,0), 1
				));
				fireTableRowsInserted(
					mGeneProbabilities.realRangeWeights.size()-1,
					mGeneProbabilities.realRangeWeights.size()-1
				);
			};

			public String getColumnName(int col) {
				return mColumnNames[col].toString();
			}

			public int getColumnCount() {
				return 3;
			}

			public int getRowCount() {
				return mGeneProbabilities.realRangeWeights.size();
			}

			public boolean isCellEditable(int row, int col) { return true; }

			public Object getValueAt(int row, int column) {
				Pair<RealGenerator.Range,Integer> entry = mGeneProbabilities.realRangeWeights.get(row);
				switch(column) {
				case 0:
					return entry.first.min;
				case 1:
					return entry.first.max;
				}
				return entry.second;
			}

			public void setValueAt(Object value, int row, int col) {
				Pair<RealGenerator.Range,Integer> entry = mGeneProbabilities.realRangeWeights.get(row);
				switch(col) {
				case 0:
					entry.first.min = Double.parseDouble(value.toString());
					break;
				case 1:
					entry.first.max = Double.parseDouble(value.toString());
					break;
				case 2:
					entry.second = Integer.parseInt(value.toString());
					break;
				}
				fireTableCellUpdated(row, col);
			}
		});
		table.addMouseListener(new MouseInputAdapter() {
			public void mousePressed(MouseEvent e) {
				maybeShowPopup(menu, e);
			}

			public void mouseReleased(MouseEvent e) {
				maybeShowPopup(menu, e);
			}

			private void maybeShowPopup(final JPopupMenu menu, MouseEvent e) {
				if( e.isPopupTrigger() ) {
					menu.show(e.getComponent(),
					e.getX(), e.getY());
				}
			}
		});
		container.add(table.getTableHeader());
		container.add(table);
	}

	interface IntArrayValue {
		int[] get();
		void set(int[] value);
	}

	private void addGenomeSizeWeights(Container container) {
		addIntArrayAdjustor(container, "Genome Size Weights (0,1,2,3,...) (0 must be zero)", new IntArrayValue() {
			public int[] get() { return mGeneProbabilities.genomeSizeWeights; }
			public void set(int[] value) { mGeneProbabilities.genomeSizeWeights = value; }}
		);
	}

	private void addChromasomeLengthWeights(Container container) {
		addIntArrayAdjustor(container, "Chromasome Length Weights (0,1,2,...) (0 must be zero)", new IntArrayValue() {
			public int[] get() { return mGeneProbabilities.chromasomeLengthWeights; }
			public void set(int[] value) { mGeneProbabilities.chromasomeLengthWeights = value; }}
		);
	}

	private void addStringLengthWeights(Container container) {
		addIntArrayAdjustor(container, "String Length Weights (0,1,2,...) (0 should be zero)", new IntArrayValue() {
			public int[] get() { return mGeneProbabilities.stringLengthWeights; }
			public void set(int[] value) { mGeneProbabilities.stringLengthWeights = value; }}
		);
	}

	private void addListLengthWeights(Container container) {
		addIntArrayAdjustor(container, "List Length Weights (0,1,2,...) (0 should be zero)", new IntArrayValue() {
			public int[] get() { return mGeneProbabilities.listLengthWeights; }
			public void set(int[] value) { mGeneProbabilities.listLengthWeights = value; }}
		);
	}

	private void addArgCount(Container container) {
		addIntArrayAdjustor(container, "Argument Count Weights (0,1,2,...)", new IntArrayValue() {
			public int[] get() { return mTypeProbabilities.argCountDistribution(); }
			public void set(int[] value) { mTypeProbabilities.setArgCountDistribution(value); }
		});
	}

	private void addIntArrayAdjustor(Container container, String title, final IntArrayValue value) {
		JLabel label = new JLabel(title);
		container.add(label);

		final JFormattedTextField field = new JFormattedTextField(value.get());
		setIntArrayFormatter(field);
		container.add(field);
		field.addPropertyChangeListener("value", new PropertyChangeListener() {
			public void propertyChange(PropertyChangeEvent arg0) {
				value.set((int[])field.getValue());
			}
		});
	}

	private void setIntArrayFormatter(final JFormattedTextField field) {
		field.setFormatterFactory(new AbstractFormatterFactory() {
			public AbstractFormatter getFormatter(JFormattedTextField arg0) {
				return new AbstractFormatter() {
					private static final long serialVersionUID = 2961509070081384425L;
					public Object stringToValue(String string) throws ParseException {
						return intArrayFromString(string);
					}

					public String valueToString(Object value) throws ParseException {
						return intArrayToString((int[])value);
					}
				};
			}
		});
	}

	private String intArrayToString(int[] value) {
		StringBuilder builder = new StringBuilder();
		for( int i = 0; i < value.length; ++i ) {
			if( i > 0 ) { builder.append(","); }
			builder.append(value[i]);
		}
		return builder.toString();
	}

	private int[] intArrayFromString(String string) throws ParseException {
		String[] valueStrings = string.split(" *, *");
		int[] values = new int[valueStrings.length];
		for( int i = 0; i < values.length; ++i ) {
			try {
				values[i] = Integer.parseInt(valueStrings[i]);
			} catch (NumberFormatException ex) {
				throw new ParseException("Non-integer encountered.",i);
			}
		}
		return values;
	}

	private void addSurvivorRatio(Container container) {
		addDoubleAdjustor(container, "Survivor Ratio (0-1)", new DoubleValue() {
			public double get() { return mSurvivalRatios.survivalRatio; }
			public void set(double value) { mSurvivalRatios.survivalRatio = value; }
		});
	}

	private void addMutatedSurvivorRatio(Container container) {
		addDoubleAdjustor(container, "Mutated Survivor Ratio (0-1)", new DoubleValue() {
			public double get() { return mSurvivalRatios.mutatedSurvivorRatio; }
			public void set(double value) { mSurvivalRatios.mutatedSurvivorRatio = value; }
		});
	}

	private void addMutantRatio(Container container) {
		addDoubleAdjustor(container, "Mutant Ratio (0-1)", new DoubleValue() {
			public double get() { return mSurvivalRatios.mutantRatio; }
			public void set(double value) { mSurvivalRatios.mutantRatio = value; }
		});
	}

	private void addPurebreadRatio(Container container) {
		addDoubleAdjustor(container, "Purebread Ratio - within offspring (0-1)", new DoubleValue() {
			public double get() { return mSurvivalRatios.purebreadRatio; }
			public void set(double value) { mSurvivalRatios.purebreadRatio = value; }
		});
	}

	private void addMutateTopLevelProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Top Level Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateTopLevel; }
			public void set(double value) { mMutationProbabilities.mutateTopLevel = value; }
		});
	}

	private void addMutateSeedProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Seed Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateSeed; }
			public void set(double value) { mMutationProbabilities.mutateSeed = value; }
		});
	}

	private void addMutateStringLengthProbability(Container container) {
		addDoubleAdjustor(container, "Mutate String Length Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateStringLength; }
			public void set(double value) { mMutationProbabilities.mutateStringLength = value; }
		});
	}

	private void addMutateSymbolLengthProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Symbol Length Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateSymbolLength; }
			public void set(double value) { mMutationProbabilities.mutateSymbolLength = value; }
		});
	}

	private void addMutateListLengthProbability(Container container) {
		addDoubleAdjustor(container, "Mutate List Length Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateListLength; }
			public void set(double value) { mMutationProbabilities.mutateListLength = value; }
		});
	}

	private void addMutateSwapListProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Swap List Items Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateSwapListItems; }
			public void set(double value) { mMutationProbabilities.mutateSwapListItems = value; }
		});
	}

	private void addMutateReorderListProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Reorder List Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateReorderList; }
			public void set(double value) { mMutationProbabilities.mutateReorderList = value; }
		});
	}

	private void addMutateFixnumRangeProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Fixnum Range Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateFixnumRange; }
			public void set(double value) { mMutationProbabilities.mutateFixnumRange = value; }
		});
	}

	private void addMutateRealRangeProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Real Range Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateRealRange; }
			public void set(double value) { mMutationProbabilities.mutateRealRange = value; }
		});
	}

	private void addReplaceSubgeneProbability(Container container) {
		addDoubleAdjustor(container, "Replace Subgene Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.replaceSubgene; }
			public void set(double value) { mMutationProbabilities.replaceSubgene = value; }
		});
	}

	private void addMutateAddGeneProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Add Gene Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateAddGene; }
			public void set(double value) { mMutationProbabilities.mutateAddGene = value; }
		});
	}

	private void addMutateSkipChromasomeProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Skip Chromasome Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateSkipChromasome; }
			public void set(double value) { mMutationProbabilities.mutateSkipChromasome = value; }
		});
	}

	private void addMutateAddChromasomeProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Add Chromasome Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateAddChromasome; }
			public void set(double value) { mMutationProbabilities.mutateAddChromasome = value; }
		});
	}

	private void addMutateAddTargetChromasomeProbability(Container container) {
		addDoubleAdjustor(container, "Mutate Add Target Chromasome Probability (0-1)", new DoubleValue() {
			public double get() { return mMutationProbabilities.mutateAddTargetChromasome; }
			public void set(double value) { mMutationProbabilities.mutateAddTargetChromasome = value; }
		});
	}

	private void addMaybeIsNullProbability(Container container) {
		addDoubleAdjustor(container, "Maybe Is Null Probability (0-1)", new DoubleValue() {
			public double get() { return mGeneProbabilities.maybeIsNullProbability; }
			public void set(double value) { mGeneProbabilities.maybeIsNullProbability = value; }
		});
	}

	private void addNewParameterProb(Container container) {
		addDoubleAdjustor(container, "New Parameter Probability (0-1)", new DoubleValue() {
			public double get() { return mTypeProbabilities.newParameterProbability; }
			public void set(double value) { mTypeProbabilities.newParameterProbability = value; }
		});
	}

	private void addParameterWeight(Container container) {
		addIntAdjustor(container, "Parameter Weight", new IntValue() {
			public int get() { return mTypeProbabilities.parameterWeight; }
			public void set(int value) { mTypeProbabilities.parameterWeight = value; }
		});
	}

	private void addConsWeight(Container container) {
		addIntAdjustor(container, "Cons Weight", new IntValue() {
			public int get() { return mTypeProbabilities.consWeight; }
			public void set(int value) { mTypeProbabilities.consWeight = value; }
		});
	}

	private void addMaybeWeight(Container container) {
		addIntAdjustor(container, "Maybe Weight", new IntValue() {
			public int get() { return mTypeProbabilities.maybeWeight; }
			public void set(int value) { mTypeProbabilities.maybeWeight = value; }
		});
	}

	private void addListWeight(Container container) {
		addIntAdjustor(container, "List Weight", new IntValue() {
			public int get() { return mTypeProbabilities.listWeight; }
			public void set(int value) {mTypeProbabilities.listWeight = value; }
		});
	}

	private void addFunctionWeight(Container container) {
		addIntAdjustor(container, "Function Weight", new IntValue() {
			public int get() { return mTypeProbabilities.functionWeight; }
			public void set(int value) { mTypeProbabilities.functionWeight = value; }
		});
	}

	private void addBuildTypeWeights(Container container) {
		for( Pair<GeneBuilder.BuildType,Integer> entry : mGeneProbabilities.buildTypeWeights ) {
			addBuildTypeWeightAdjustor(container, entry);
		}
	}

	private void addBuildTypeWeightAdjustor(Container container, final Pair<GeneBuilder.BuildType,Integer> entry) {
		addIntAdjustor(container, entry.first.toString(), new IntValue(){
			public int get() { return entry.second; }
			public void set(int value) { entry.second = value; }
		});
	}

	private void addConcreteWeights(Container container) {
		for( Pair<Type,Integer> entry : mTypeProbabilities.concreteWeights() ) {
			addTypeWeightAdjustor(container, entry);
		}
	}

	private void addTypeWeightAdjustor(Container container, final Pair<Type,Integer> entry) {
		addIntAdjustor(container, entry.first.toString(), new IntValue(){
			public int get() { return entry.second; }
			public void set(int value) { entry.second = value; }
		});
	}

	interface IntValue {
		int get();
		void set(int value);
	}

	private void addIntAdjustor(Container container, String title, final IntValue value ) {
		JLabel label = new JLabel(title);
		container.add(label);
		final JFormattedTextField field = new JFormattedTextField(value.get());
		container.add(field);
		field.addPropertyChangeListener("value", new PropertyChangeListener() {
			public void propertyChange(PropertyChangeEvent arg0) {
				value.set( (Integer)field.getValue() );
			}
		});
	}

	interface DoubleValue {
		double get();
		void set(double value);
	}

	private void addDoubleAdjustor(Container container, String title, final DoubleValue value ) {
		JLabel label = new JLabel(title);
		container.add(label);

		DecimalFormat format = new DecimalFormat("0.############");
		final JFormattedTextField field = new JFormattedTextField(format);
		field.setValue(value.get());
		container.add(field);
		field.addPropertyChangeListener("value", new PropertyChangeListener() {
			public void propertyChange(PropertyChangeEvent arg0) {
				value.set( (Double)field.getValue() );
			}
		});
	}

	public TypeBuilder.Probabilities getTypeProbabilities() {
		return mTypeProbabilities;
	}

	public GeneRandomizer.Probabilities getGeneProbabilities() {
		return mGeneProbabilities;
	}

	public Mutation.Probabilities getMutationProbabilities() {
		return mMutationProbabilities;
	}

	public Darwin.SurvivalRatios getSurvivalRatios() {
		return mSurvivalRatios;
	}

	public void store(File path) {
		FileOutputStream f;
		try {
			f = new FileOutputStream(path);
			ObjectOutput s = new ObjectOutputStream(f);
			s.writeObject(mTypeProbabilities);
			s.writeObject(mGeneProbabilities);
			s.writeObject(mMutationProbabilities);
			s.writeObject(mSurvivalRatios);
			s.flush();
			f.flush();
			s.close();
			f.close();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void load(File path) {
		try {
			FileInputStream in = new FileInputStream(path);
			ObjectInputStream s = new ObjectInputStream(in);
			mTypeProbabilities = (TypeBuilder.Probabilities)s.readObject();
			mGeneProbabilities = (GeneRandomizer.Probabilities)s.readObject();
			mMutationProbabilities = (Mutation.Probabilities)s.readObject();
			mSurvivalRatios = (Darwin.SurvivalRatios)s.readObject();
			s.close();
			in.close();
			if( mTypeDialog != null ) {
				mTypeDialog.setVisible(false);
				mTypeDialog = null;
			}
			if( mGeneDialog != null ) {
				mGeneDialog.setVisible(false);
				mGeneDialog = null;
			}
			if( mMutateDialog != null) {
				mMutateDialog.setVisible(false);
				mMutateDialog = null;
			}
			if( mSurvivalDialog != null) {
				mSurvivalDialog.setVisible(false);
				mSurvivalDialog = null;
			}
		} catch (IOException e) {
			e.printStackTrace();
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
	}
}
