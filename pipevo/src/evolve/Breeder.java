/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Random;

import functional.type.FunctionType;

public class Breeder {
	/*
	 * Given two Genomes, produce an offspring
	 */
	static public Genome breed( Genome a, Genome b, FunctionType target, Random random ) {
		// Avoid making the problem O(n*n) by creating a hash of one set of chromasomes
		Map<String, Chromasome> lookup = new java.util.HashMap<String, Chromasome>();
		for( Chromasome chromasome : a.chromasomes() ) {
			lookup.put(chromasome.name(), chromasome);
		}

		// Keep track of the chromasomes in b which we haven't paired.
		List<Chromasome> bUnpaired = new java.util.ArrayList<Chromasome>();

		// Assume all 'a' chromasomes unpaired to start with.
		Set<String> aUnpaired = new java.util.HashSet<String>(lookup.keySet());

		List<Chromasome> child = new java.util.ArrayList<Chromasome>();
		// Keep track of the last chromasome matching the target.
		Chromasome crTarget = null;

		for( Chromasome chromasome : b.chromasomes() ) {
			Chromasome pair = lookup.get(chromasome.name());
			if( pair != null ) {
				Chromasome result = breed(pair, chromasome, random);
				if( result.findLastMatching(target) != null ) {
					crTarget = result;
				}
				child.add(result);

				// If we found a matching one in a, then it is now paired.
				aUnpaired.remove(pair.name());
			} else {
				// If we didn't find a matching one in a, then the b one is marked as unpaired.
				bUnpaired.add(chromasome);
			}
		}
		if( !bUnpaired.isEmpty() ) {
			// Pair unpaired ones in order.
			for( Chromasome chromasome : bUnpaired ) {
				if( aUnpaired.isEmpty() ) {
					if( chromasome.findLastMatching(target) != null ) {
						crTarget = chromasome;
					}
					child.add( chromasome );
				} else {
					// Retrieve the next unpaired a chromasome
					String next = aUnpaired.iterator().next();
					aUnpaired.remove(next);
					Chromasome pair = lookup.get(next);

					assert( pair != null );
					Chromasome result = breed(chromasome, pair, random);
					if( chromasome.findLastMatching(target) != null ) {
						crTarget = result;
					}
					child.add(result);
				}
			}
		}
		Genome result = new Genome();
		// Make sure that a chromasome matching the target is last, by skipping it as we add, then
		// adding it explicitly afterwards.
		for( Chromasome chromasome : child ) {
			if( chromasome != crTarget ) {
				result.add(chromasome);
			}
		}
		if( crTarget == null ) {
			throw new RuntimeException("No target!");
		}
		result.add(crTarget);
		return result;
	}

	static public Chromasome breed( Chromasome a, Chromasome b, Random random ) {
		if( a.name() != b.name() ) {
			if( random.nextBoolean() ) {
				return a;
			} else {
				return b;
			}
		}
		Chromasome result = new Chromasome( a.name() );
		int i = 0;
		int j = 0;
		List<Gene> aGenes = a.mGenes;
		List<Gene> bGenes = b.mGenes;
		while( i < aGenes.size() && j < bGenes.size() ) {
			boolean useA = random.nextBoolean();
			Gene aGene = aGenes.get(i);
			Gene bGene = bGenes.get(j);
			if( aGene.type().equals(bGene.type()) ) {
				if( useA ) {
					result.addGene(aGene);
				} else {
					result.addGene(bGene);
				}
			} else if( (aGenes.size() > i+1) && aGenes.get(i+1).type().equals(bGene.type()) ) {
				result.addGene(aGene);
				if( useA ) {
					result.addGene(aGenes.get(i+1));
				} else {
					result.addGene(bGene);
				}
				++i;
			} else if( (bGenes.size() > j+1) && aGene.type().equals(bGenes.get(j+1).type())) {
				result.addGene(bGene);
				if( useA ) {
					result.addGene(aGene);
				} else {
					result.addGene(bGenes.get(j+1));
				}
				++j;
			} else {
				if( useA ) {
					result.addGene(aGene);
				} else {
					result.addGene(bGene);
				}
			}
			++i;
			++j;
		}
		return result;
	}
}
