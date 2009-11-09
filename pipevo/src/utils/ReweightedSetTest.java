/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package utils;

import java.util.Random;

import junit.framework.TestCase;

public class ReweightedSetTest extends TestCase {
	public void testSelect() {
		WeightedSet<Integer> set = new WeightedSet<Integer>();
		int weight = 3;
		int allWeights = 0;
		final int kCount = 20;
		final int kMax = 36;
		int[] counts = new int[kMax];
		int[] rCounts = new int[kMax];
		for( int i = 0; i < kCount; ++i ) {
			set.add( i, weight );
			allWeights += weight;
			weight *= 2;
			counts[i] = 0;
			rCounts[i] = 0;
		}
		ReweightedSet<Integer> reset = new ReweightedSet<Integer>(set);
		int weight25 = 1000;
		reset.add(25, weight25);
		allWeights += weight25;
		int weight35 = 2000;
		reset.add(35, weight35);
		allWeights += weight35;


		Random random = new Random();
		for( long c = 0; c < allWeights; ++c ) {
			++rCounts[ reset.select(random) ];
			++counts[ reset.select(c) ];
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

		assertEquals(counts[25], weight25);
		assertEquals(counts[35], weight35);

		double ratio = rCounts[35] / (double)rCounts[25];
		assertTrue(1.8 < ratio && ratio < 2.2);

		reset.remove(25);
		allWeights -= weight25;
		rCounts[25] = 0;
		counts[25] = 0;
		rCounts[35] = 0;
		counts[35] = 0;
		for( long c = 0; c < allWeights; ++c ) {
			++rCounts[ reset.select(random) ];
			++counts[ reset.select(c) ];
		}

		assertEquals(counts[25], 0);
		assertEquals(counts[35],weight35);
		assertEquals(rCounts[25],0);
		assertTrue(weight35 * .8 < rCounts[35] && rCounts[35] < weight35 * 1.2);
	}
}
