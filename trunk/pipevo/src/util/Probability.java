/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package util;

/**
 * Utility class for dealing with propabilities.
 */
public class Probability {
	/**
	 * Given a source of randomness, select between true and false based on the bias.
	 * @param random A source of random numbers.
	 * @param bias A value between zero and one indicating the probability of returning true.
	 */
	public static boolean select(java.util.Random random, double bias) {
		return (random.nextInt(10001) / 10000.0) < bias;
	}
}
