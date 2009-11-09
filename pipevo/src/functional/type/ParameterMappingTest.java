/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class ParameterMappingTest extends TestCase {

	public void testEquals() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();
		ParameterMapping m1 = new ParameterMapping( p, BaseType.STRING );

		ParameterMapping m2 = new ParameterMapping( q, BaseType.FIXNUM );
		assertFalse( m1.equals(m2) );
		assertFalse( m2.equals(m1) );

		m2 = new ParameterMapping( p, BaseType.FIXNUM );
		assertFalse( m1.equals(m2) );
		assertFalse( m2.equals(m1) );

		m2 = new ParameterMapping( p, BaseType.STRING );
		assertTrue( m1.equals(m2) );
	}
}
