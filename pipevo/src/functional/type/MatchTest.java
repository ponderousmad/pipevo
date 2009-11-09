/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.List;

import junit.framework.TestCase;

public class MatchTest extends TestCase {
	public void testResult() {
		assertTrue( Match.result(true).matches() );
		assertTrue( Match.result(true).mappings().isEmpty() );
		assertFalse( Match.result(false).matches() );
		assertTrue( Match.result(false).mappings().isEmpty() );
	}

	public void testConstruct() {
		Parameter p = new Parameter();
		Match match = new Match( p, BaseType.FIXNUM );
		assertTrue( match.matches() );
		assertEquals( match.mappings().size(), 1 );
		assertSame( match.mappings().get(0).parameter(), p );
		assertEquals( match.mappings().get(0).type(), BaseType.FIXNUM );

		Parameter q = new Parameter();
		match.map( q, BaseType.STRING );
		assertTrue( match.matches() );
		assertEquals( match.mappings().size(), 2 );
		assertSame( match.mappings().get(1).parameter(), q );
	}

	public void testCombinePassFail() {
		Match pass = Match.result(true);
		Match fail = Match.result(false);

		assertTrue( pass.combine( pass ).matches() );
		assertFalse( pass.combine( fail ).matches() );
		assertFalse( fail.combine( pass ).matches() );
		assertFalse( fail.combine( fail ).matches() );
	}

	public void testCombineMatchPassFail() {
		Match pass = Match.result(true);
		Match fail = Match.result(false);

		Parameter p = new Parameter();
		Match match = new Match( p, BaseType.FIXNUM );

		assertFalse( match.combine( fail ).matches() );
		assertFalse( fail.combine( match ).matches() );
		assertTrue( match.combine( pass ).matches() );
		assertTrue( pass.combine( match ).matches() );
		assertEquals( match.combine(pass).mappings(), match.mappings() );
		assertEquals( pass.combine(match).mappings(), match.mappings() );
	}

	public void testCombine() {
		Parameter p = new Parameter();
		Match match = new Match( p, BaseType.FIXNUM );

		Parameter q = new Parameter();
		Match other = new Match( q, BaseType.REAL );

		Match combined = match.combine(other);
		assertTrue( combined.matches() );
		assertEquals( combined.mappings().size(), 2 );

		List<ParameterMapping> mappings = combined.mappings();
		assertEquals( mappings.size(), 2 );
		ParameterMapping m1 = mappings.get(0);
		ParameterMapping m2 = mappings.get(1);
		if( m1.parameter() == q ) {
			ParameterMapping temp = m1;
			m1 = m2;
			m2 = temp;
		}
		assertEquals( m1.parameter(), p );
		assertEquals( m1.type(), BaseType.FIXNUM );
		assertEquals( m2.parameter(), q );
		assertEquals( m2.type(), BaseType.REAL );
	}

	public void testCombineIncompatible() {
		Parameter p = new Parameter();
		Match match = new Match( p, BaseType.FIXNUM );
		Match other = new Match( p, BaseType.REAL );

		assertFalse( match.combine( other ).matches() );
	}

	public void testCombineNested() {
		for( int i = 0; i < 2; ++i ) {
			Parameter p = new Parameter();
			Parameter q = new Parameter();

			Match match = new Match( p, i == 0 ? new ListType( q ) : new ListType( BaseType.STRING ) );
			Match other = new Match( p, i != 0 ? new ListType( q ) : new ListType( BaseType.STRING ) );

			Match combined = match.combine( other );
			assertTrue( combined.matches() );

			List<ParameterMapping> mappings = combined.mappings();
			assertEquals( mappings.size(), 2 );
			ParameterMapping m1 = mappings.get(0);
			ParameterMapping m2 = mappings.get(1);
			if( m1.parameter() == q ) {
				ParameterMapping temp = m1;
				m1 = m2;
				m2 = temp;
			}
			assertEquals( m1.parameter(), p );
			assertEquals( m1.type(), new ListType( BaseType.STRING ) );
			assertEquals( m2.parameter(), q );
			assertEquals( m2.type(), BaseType.STRING );
		}
	}
}
