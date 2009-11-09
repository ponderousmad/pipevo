/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import functional.Obj;
import functional.type.Type;

public class Chromasome implements Serializable {
	private static final long serialVersionUID = -1621188220491889894L;
	String mName;
	List<Gene> mGenes = new ArrayList<Gene>();

	public Chromasome( String name ) {
		mName = name;
	}

	public String name() {
		return mName;
	}

	public int size() {
		return mGenes.size();
	}

	public class NamedGene {
		NamedGene( Gene aGene, String itsName ) {
			gene = aGene;
			name = itsName;
		}
		public Gene gene;
		public String name;
	}

	public String nextGeneName() {
		return geneName(mGenes.size());
	}

	private String geneName( int i ) {
		return mName + Integer.toString(i+1);
	}

	public NamedGene[] genes() {
		NamedGene[] genes = new NamedGene[mGenes.size()];
		int i = 0;
		for( Gene gene : mGenes ) {
			genes[i] = new NamedGene(gene, geneName(i));
			++i;
		}
		return genes;
	}

	public void addGene( Gene gene ) {
		mGenes.add(gene);
	}

	public static class Phene {
		public String name;
		public Obj expression;

		Phene( String name, Obj expression ) {
			this.name = name;
			this.expression = expression;
		}
	}

	public Phene[] express( Context context ) {
		Phene[] phenes = new Phene[mGenes.size()];
		for( int i = 0; i < mGenes.size(); ++i ) {
			phenes[i] = new Phene( geneName(i), mGenes.get(i).express(context) );
		}
		return phenes;
	}

	public Chromasome.NamedGene findLastMatching(Type targetType) {
		NamedGene[] genes = genes();
		for( int j = genes.length - 1; j >= 0; --j ) {
			if( genes[j].gene.type().equals(targetType) ) {
				return genes[j];
			}
		}
		return null;
	}
}
