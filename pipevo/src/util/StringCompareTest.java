/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package util;

import junit.framework.TestCase;

/**
 * Reminder of the differences between comparisions of strings.
 */
public class StringCompareTest extends TestCase {
	public void testStringCompare() {
		String apple = "apple";
		String orange = apple;
		String dynamic = "ap";
		dynamic += "ple";

		assertTrue( apple == orange );
		assertSame( apple, orange );
		assertEquals( apple, orange );

		assertFalse( apple == dynamic );
		assertNotSame( apple, dynamic );
		assertEquals( apple, dynamic );

		String pear = "apple";

		assertEquals( apple, pear );

		// This will depend on how smart the compiler is:
		if( apple == pear ) {
			System.out.println( "Compiler interred only one apple." );
		} else {
			System.out.println( "Compiler interred two apples." );
		}
	}
}
