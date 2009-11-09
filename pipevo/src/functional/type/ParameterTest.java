/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class ParameterTest extends TestCase {
	public void testParameter() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();

		assertTrue( p.isParameterized() );
		assertTrue( q.isParameterized() );

		assertTrue( p.involves(p) );
		assertTrue( q.involves(q) );
		assertFalse( p.involves(q) );
		assertFalse( q.involves(p) );

		assertTrue(ParameterUtils.findParameters(p).contains(p));
		assertEquals(ParameterUtils.findParameters(p).size(),1);
		assertTrue(ParameterUtils.findParameters(q).contains(q));
		assertEquals(ParameterUtils.findParameters(q).size(),1);
	}

	public void testEquals() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();

		assertEquals( p, p );
		assertFalse( p.equals(q) );
		assertFalse( q.equals(p) );
	}

	public void testMatch() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();

		Match match = p.match( BaseType.NULL );
		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p );
		assertEquals( match.mappings().get(0).type(), BaseType.NULL );

		match = p.match( new ListType( p ) );
		assertFalse( match.matches() );

		match = p.match( new ListType( q ) );
		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p);
		assertEquals( match.mappings().get(0).type(), new ListType(q) );
	}

	public void testSubstitute() {
		Parameter p = new Parameter();
		Match match = p.match( BaseType.STRING );
		Type result = p.substitute( match.mappings() );
		assertEquals( result, BaseType.STRING );

		Parameter q = new Parameter();
		result = q.substitute( match.mappings() );
		assertEquals( result, q );
	}

	public void testToString() {
		Parameter p = new Parameter();
		assertEquals(p.toString(), "P[" + p.hashCode() + "]");
	}
}
