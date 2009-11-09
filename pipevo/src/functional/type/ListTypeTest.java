/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class ListTypeTest extends TestCase {
	public void testParameter() {
		ListType list = new ListType( BaseType.STRING );
		assertFalse( list.isParameterized() );
		assertFalse( list.involves( new Parameter() ) );
		assertTrue(ParameterUtils.findParameters(list).isEmpty());

		Parameter p = new Parameter();
		ListType listP = new ListType( p );
		assertTrue( listP.isParameterized() );
		assertTrue( listP.involves(p) );
		assertTrue(ParameterUtils.findParameters(listP).contains(p));
	}

	public void testEquals() {
		ListType list = new ListType( BaseType.STRING );
		assertFalse( list.equals(BaseType.STRING) );
		assertTrue( list.equals( new ListType(BaseType.STRING) ) );

		Parameter p = new Parameter();
		ListType listP = new ListType( p );

		assertFalse( list.equals( listP ) );
		assertTrue( listP.equals( new ListType(p) ) );
	}

	public void testMatch() {
		ListType list = new ListType( BaseType.STRING );
		assertFalse( list.match( BaseType.STRING ).matches() );
		assertTrue( list.match( new ListType(BaseType.STRING) ).matches() );

		Parameter p = new Parameter();
		ListType listP = new ListType(p);
		assertFalse( listP.match( BaseType.STRING ).matches() );

		Match match = listP.match( list );
		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p );
		assertEquals( match.mappings().get(0).type(), BaseType.STRING );
	}

	public void testSubstitute() {
		Parameter p = new Parameter();
		ListType list = new ListType( p );
		ListType target = new ListType( BaseType.STRING );
		Match match = list.match(target);
		Type result = list.substitute( match.mappings() );
		assertEquals( result, target );

		list = new ListType( new Parameter() );
		result = list.substitute( match.mappings() );
		assertEquals( list, result );
	}

	public void testToString() {
		assertEquals(new ListType(BaseType.NULL).toString(), "List[functional.Null]");
	}
}
