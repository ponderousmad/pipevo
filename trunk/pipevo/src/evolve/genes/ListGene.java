/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Cons;
import functional.Null;
import functional.Obj;
import functional.Symbol;
import functional.type.ListType;
import functional.type.Type;

public class ListGene implements Gene, Serializable {
	private static final long serialVersionUID = -6581933318180613868L;
	private ListType mType;
	private List<Gene> mItems;

	public ListGene( ListType type ) {
		mType = type;
		mItems = new ArrayList<Gene>();
	}

	public ListGene(ListType type, List<Gene> items) {
		mType = type;
		mItems = items;
		for( Gene item : mItems ) {
			assert( mType.elementType().match(item.type()).matches() );
		}
	}

	public void add(Gene item) {
		assert( mType.elementType().match(item.type()).matches() );
		mItems.add(item);
	}

	public Obj express(Context context) {
		Obj list = Null.NULL;
		for( int i = mItems.size() - 1; i >= 0; --i) {
			list = new Cons( mItems.get(i).express(context), list );
		}
		return Cons.prependList(new Symbol("list"), list);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		List<Gene> mutatedItems = mItems;
		if( mutation.reorderList(random) ) {
			mutatedItems = new ArrayList<Gene>(mItems);
			for( int i = 0; i < mutatedItems.size(); ++i ) {
				int j = i + random.nextInt( mutatedItems.size() - i );
				swapItems(mutatedItems, i, j);
			}
			mutatedItems = mutateItems(mutation, context, random, mutatedItems);
		} else if( !mItems.isEmpty() && mutation.swapListItems(random) ) {
			mutatedItems = new ArrayList<Gene>(mItems);
			int i = random.nextInt( mItems.size() );
			int j = random.nextInt( mItems.size() );
			swapItems(mutatedItems, i,j);
			mutatedItems = mutateItems(mutation, context, random, mutatedItems);
		} else if( mutation.mutateListLength(random) ) {
			int listLength = mutation.geneBuilderProbabilities().selectListLength(random);
			mutatedItems = mutateItems(mutation, context, random, mItems.subList(0, Math.min(listLength, mItems.size())));
			for( int i = mItems.size(); i < listLength; ++i ) {
				mutatedItems.add( mutation.createNewGene(mType.elementType(), context, random));
			}
		} else {
			mutatedItems = mutateItems(mutation, context, random, mItems);
		}
		if( mutatedItems != mItems ) {
			return new ListGene(mType, mutatedItems);
		} else {
			return this;
		}
	}

	private List<Gene> mutateItems(Mutation mutation, Context context, Random random, List<Gene> items) {
		boolean isMutated = false;
		List<Gene> mutated = new ArrayList<Gene>(items.size());
		for( int i = 0; i < items.size(); ++i ) {
			Gene item = mItems.get(i);
			Gene mutatedItem = mutation.mutateGene(mType.elementType(), item, context, random);
			if( mutatedItem != item ) {
				isMutated = true;
			}
			mutated.add(mutatedItem);
		}
		if( isMutated ) {
			return mutated;
		} else {
			return items;
		}
	}

	private static void swapItems(List<Gene> items, int i, int j) {
		Gene temp = items.get(i);
		items.set(i, items.get(j));
		items.set(j, temp);
	}

	public Type type() {
		return mType;
	}

	public Gene copy() {
		ListGene result = new ListGene( mType );
		for( Gene item : mItems ) {
			result.add(item);
		}
		return result;
	}

}
