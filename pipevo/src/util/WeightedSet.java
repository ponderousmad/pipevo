/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package util;

import java.io.Serializable;
import java.util.Random;

/**
 * Allows selection of items from a set where each item has an associated weight.
 * @param <T> The type of items in the set.
 */
public class WeightedSet<T> implements Serializable {
	private static final long serialVersionUID = -4119925287310065955L;

	/**
	 * The set is implemented as a binary tree where each node knows the sum
	 * of the weights in the left and right branches, so given a seed it either
	 * returns the value from the left branch, the right branch, or the node itself.
	 */
	static class Node<Type> implements Serializable {
		private static final long serialVersionUID = -2318795942038837842L;
		private Type mValue = null;
		private long mWeight;

		private boolean mBalanced = true;
		private Node<Type> mLeft = null;
		private Node<Type> mRight = null;

		Node( Type value, int weight ) {
			mValue = value;
			mWeight = weight;
		}

		void add( Type value, int weight ) {
			mWeight += weight;
			if( mBalanced ) {
				mBalanced = false;
				if( mLeft == null ) {
					mLeft = new Node<Type>( value, weight );
				} else {
					mLeft.add( value, weight );
				}
			} else {
				mBalanced = true;
				if( mRight == null ) {
					mRight = new Node<Type>( value, weight );
				} else {
					mRight.add( value, weight );
				}
			}
		}

		/**
		 * Given a seed within the sum of the weights of the set, return the value
		 * where the sum of the weights to the left is less than the seed, but by
		 * including the value's weight makes the sum greater or equal to the seed.
		 */
		Type select( long seed ) {
			assert( seed < mWeight );
			if( mLeft != null && seed < mLeft.mWeight ) {
				return mLeft.select( seed );
			}
			if( mRight != null ) {
				long rightBorder = mWeight - mRight.mWeight;
				if( seed >= rightBorder ) {
					return mRight.select( seed - rightBorder );
				}
			}
			return mValue;
		}

		/**
		 * Gets the weight for this value.
		 */
		long weight() {
			return mWeight;
		}

		private long nextValue( Random random )
		{
			return Math.abs( random.nextLong() );
		}

		/**
		 * Gets a value at random, biased by the weight.
		 */
		Type select( Random random ) {
			return select( nextValue( random ) % mWeight );
		}
	}

	private Node<T> mRoot = null;

	/**
	 * Add a value with associated weight.
	 */
	public void add( T value, int weight ) {
		assert( weight > 0 );
		assert( value != null );
		if( mRoot == null ) {
			mRoot = new Node<T>( value, weight );
		} else {
			mRoot.add(value, weight);
		}
	}

	/**
	 * Gets the sum of the weights of all the values.
	 */
	long total() {
		if( mRoot != null ) {
			return mRoot.weight();
		}
		return 0;
	}

	/**
	 * Select a value based on a seed.
	 * @param seed A value in the range zero (inclusive) to total() (exclusive).
	 * If larger then total, will exagerate the bias of the last value added.
	 */
	T select( Long seed ) {
		if( mRoot != null ) {
			return mRoot.select(seed);
		}
		return null;
	}

	/**
	 * Check if there are any values in the set.
	 */
	public boolean isEmpty() {
		return total() == 0;
	}

	/**
	 * Select a value randomly, biased by the weights.
	 */
	public T select( Random random ) {
		if( mRoot != null ) {
			return mRoot.select(random);
		}
		return null;
	}
}
