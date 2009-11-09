/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class MaybeTest extends TestCase {
	public void testParameter() {
		Maybe maybe = new Maybe( BaseType.FIXNUM );
		assertFalse( maybe.isParameterized() );
		assertFalse( maybe.involves( new Parameter() ) );
		assertTrue(ParameterUtils.findParameters(maybe).isEmpty());

		Parameter p = new Parameter();
		maybe = new Maybe( p );

		assertTrue( maybe.isParameterized() );
		assertTrue( maybe.involves(p) );
		assertTrue(ParameterUtils.findParameters(maybe).contains(p));
	}

	public void testEquals() {
		Maybe maybe = new Maybe( BaseType.REAL );

		assertFalse( maybe.equals( BaseType.REAL ) );
		assertTrue( maybe.equals( new Maybe( BaseType.REAL ) ) );

		Parameter p = new Parameter();
		Maybe maybeP = new Maybe( p );
		assertFalse( maybe.equals( maybeP ) );

		assertTrue( maybeP.equals( new Maybe( p ) ) );
	}

	public void testMatch() {
		Maybe maybe = new Maybe( BaseType.STRING );

		assertTrue( maybe.match( BaseType.NULL ).matches() );
		assertTrue( maybe.match( BaseType.STRING ).matches() );
		assertTrue( maybe.match( new Maybe( BaseType.STRING ) ).matches() );
		assertFalse( maybe.match( BaseType.FIXNUM ).matches() );

		Parameter p = new Parameter();
		Maybe maybeP = new Maybe( p );
		Match match = maybeP.match( maybe );

		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p );
		assertEquals( match.mappings().get(0).type(), BaseType.STRING );
	}

	public void testSubstitute() {
		Parameter p = new Parameter();
		Maybe maybe = new Maybe( p );
		Maybe target = new Maybe( BaseType.SYMBOL );
		Match match = maybe.match( target );
		Type result = maybe.substitute( match.mappings() );
		assertEquals( result, target );
	}

	public void testToString() {
		assertEquals(new Maybe(BaseType.SYMBOL).toString(), "Maybe[functional.Symbol]");
	}
}
