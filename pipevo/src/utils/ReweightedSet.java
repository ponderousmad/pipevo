/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package utils;

import java.util.List;
import java.util.Random;

/**
 * Allows selection of items from a set where each item has an associated weight.
 *
 * This class is similar to WeightedSet, but with two key differences:
 * -It is much less efficient (O(n) in the number of items, vs O(log n))
 * -Items (along with their weights) can be removed.
 * @param <T> The type of items in the set.
 */
public class ReweightedSet<T> {

	/**
	 * Construct an empty set.
	 */
	public ReweightedSet() {
		mBaseSet = null;
	}

	/**
	 * Construct a set with an initial set of values.
	 */
	public ReweightedSet( WeightedSet<T> set ){
		mBaseSet = set;
	}

	/**
	 * Add an item with the specified weight.
	 * Note that if the item already exists in the set this will effectively increase
	 * its weight by the specified amount.
	 */
	public void add(T item, int weight) {
		mExtra.add(new Pair<T,Integer>(item, weight));
		mExtraWeight += weight;
	}

	/**
	 * Remove the first occurence of the item from the set managed directly by this class.
	 * If the item is also in the base set, it will not affect the weight there.
	 * @param item The item to remove.
	 */
	public void remove(T item) {
		boolean allRemoved = false;
		while( !allRemoved ) {
			Pair<T,Integer> toRemove = find(item);
			if( toRemove != null ) {
				mExtraWeight -= toRemove.second;
				mExtra.remove(toRemove);
			} else {
				allRemoved = true;
			}
		}
	}

	private Pair<T,Integer> find(T item){
		for(Pair<T,Integer> entry : mExtra ) {
			if( entry.first == item ) {
				return entry;
			}
		}
		return null;
	}

	/**
	 * Get a seed value for the set given a source of randomness.
	 */
	long nextValue(Random random) {
		return Math.abs(random.nextLong()) % total();
	}

	private long baseTotal() {
		return mBaseSet != null ? mBaseSet.total() : 0;
	}

	/**
	 * Gets the sum of all the weights in the set.
	 */
	public long total() {
		return baseTotal() + mExtraWeight;
	}

	/**
	 * Select a value randomly, biased by the weights.
	 */
	public T select(Random random) {
		return select(nextValue(random));
	}

	/**
	 * Select a value based on a seed.
	 * @param seed A value in the range zero (inclusive) to total() (exclusive).
	 * If larger then total, will exagerate the bias of the last value added.
	 */
	public T select(long seed) {
		if(mBaseSet != null && seed < mBaseSet.total()) {
			return mBaseSet.select(seed);
		}
		seed -= baseTotal();
		for(Pair<T,Integer> entry : mExtra ) {
			if( seed < entry.second ) {
				return entry.first;
			}
			seed -= entry.second;
		}
		throw new RuntimeException("nextValue returned too large result.");
	}

	private WeightedSet<T> mBaseSet;
	private List<Pair<T,Integer>> mExtra = new java.util.ArrayList<Pair<T,Integer>>();
	private long mExtraWeight = 0;
}
