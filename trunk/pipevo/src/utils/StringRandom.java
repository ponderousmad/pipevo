/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package utils;

import java.util.Random;

/**
 * Static utility class for producing randomized character strings.
 */
public class StringRandom {
	/**
	 * Produce a random string consisting of characters from the extended ascii code points.
	 */
	public static String asciiString( Random random, int length ) {
		StringBuffer buffer = new StringBuffer();
		for(int i = 0; i < length; ++i) {
			buffer.append((char)(random.nextInt(256)));
		}
		return buffer.toString();
	}

	/**
	 * Produce a random string consisting of letters from the lower case latin alphabet.
	 */
	public static String alphaString( Random random, int length ) {
		StringBuffer buffer = new StringBuffer();
		for(int i = 0; i < length; ++i) {
			buffer.append((char)('a' + random.nextInt(26)));
		}
		return buffer.toString();
	}
}
