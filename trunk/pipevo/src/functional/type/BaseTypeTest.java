/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.ArrayList;
import java.util.List;

import functional.Null;
import junit.framework.TestCase;

public class BaseTypeTest extends TestCase {
	public void testParameter() {
		assertEquals(BaseType.NULL.isParameterized(), false);
		assertEquals(BaseType.FIXNUM.involves( new Parameter() ), false);
		assertTrue(ParameterUtils.findParameters(BaseType.FIXNUM).isEmpty());
	}

	public void testEquals() {
		assertEquals(BaseType.NULL,new BaseType(Null.class));
		assertFalse(BaseType.FIXNUM.equals(BaseType.REAL));
	}

	public void testMatch() {
		assertTrue(BaseType.STRING.match(BaseType.STRING).matches());
		assertFalse(BaseType.SYMBOL.match(BaseType.NULL).matches());
	}

	public void testSubstitute() {
		List<ParameterMapping> mapping = new ArrayList<ParameterMapping>();
		assertEquals( BaseType.STRING.substitute( mapping ), BaseType.STRING );
	}

	public void testToString() {
		assertEquals(BaseType.NULL.toString(),"functional.Null");
		assertEquals(BaseType.SYMBOL.toString(),"functional.Symbol");
	}
}
