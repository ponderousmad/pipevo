/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

import evolve.Chromasome.Phene;
import functional.Symbol;
import functional.type.Type;

public class Genome implements Serializable {
	private static final long serialVersionUID = 126738355774268224L;
	private List<Chromasome> mChromasomes = new ArrayList<Chromasome>();

	public Genome() {
	}

	public void add( Chromasome chromasome ) {
		assert( chromasome != null );
		mChromasomes.add(chromasome);
	}

	public List<Chromasome> chromasomes() {
		return mChromasomes;
	}

	public List<Phene> express(Context context) {
		List<Phene> phenome = new ArrayList<Phene>();
		for( Chromasome chromasome : mChromasomes ) {
			context.addChromasome(chromasome);
			Phene[] phenes = chromasome.express(context);
			for( Phene phene : phenes ) {
				phenome.add(phene);
			}
		}
		return phenome;
	}

	public Symbol findLastMatching( Type targetType ) {
		for( int i = mChromasomes.size() - 1; i >= 0; --i ) {
			Chromasome c = mChromasomes.get(i);
			Chromasome.NamedGene matching = c.findLastMatching(targetType);
			if( matching != null ) {
				return new Symbol(matching.name);
			}
		}
		return null;
	}
}
