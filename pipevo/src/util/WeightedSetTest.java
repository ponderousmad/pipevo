/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package util;

import java.util.Random;

import junit.framework.TestCase;

public class WeightedSetTest extends TestCase {
	public void testSelect() {
		WeightedSet<Integer> set = new WeightedSet<Integer>();
		int weight = 3;
		int allWeights = 0;
		final int kCount = 20;
		int[] counts = new int[kCount];
		int[] rCounts = new int[kCount];
		for( int i = 0; i < kCount; ++i ) {
			set.add( i, weight );
			allWeights += weight;
			weight *= 2;
			counts[i] = 0;
			rCounts[i] = 0;
		}

		Random random = new Random();
		for( long c = 0; c < allWeights; ++c ) {
			++rCounts[ set.select(random) ];
			++counts[ set.select(c) ];
		}

		weight = 3;
		int failures = 0;
		for( int i = 0; i < kCount; ++i ) {
			assertEquals( counts[i], weight );
			int error = Math.abs( rCounts[i] - weight );
			error = Math.max( error - 20, 0);
			double pError = ( error / (double)weight );
			if( pError > .02 ) {
				++failures;
			}
			weight *= 2;
		}

		assertTrue( failures < 3 );
	}
}
