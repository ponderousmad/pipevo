/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class ParameterUtilsTest extends TestCase {
	public void testUniqueFunction() {
		FunctionType func = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.STRING});
		assertEquals(ParameterUtils.uniqueParameters(func), func);

		Parameter p = new Parameter();
		func = new FunctionType(p,new Type[]{BaseType.STRING,BaseType.STRING});
		assertFalse(ParameterUtils.uniqueParameters(func).equals(func));
		assertTrue(ParameterUtils.uniqueParameters(func).match(func).matches());

		func = new FunctionType(BaseType.STRING, new Type[]{p,new Parameter()});
		assertFalse(ParameterUtils.uniqueParameters(func).equals(func));
		assertTrue(ParameterUtils.uniqueParameters(func).match(func).matches());

		func = new FunctionType(p, new Type[]{new Parameter(), p});
		assertFalse(ParameterUtils.uniqueParameters(func).equals(func));
		assertTrue(ParameterUtils.uniqueParameters(func).match(func).matches());
	}

	public void testUniqueBaseType() {
		assertEquals(ParameterUtils.uniqueParameters(BaseType.FIXNUM), BaseType.FIXNUM);
		assertEquals(ParameterUtils.uniqueParameters(BaseType.STRING), BaseType.STRING);
	}

	public void testUniqueMaybe() {
		assertEquals(ParameterUtils.uniqueParameters(new Maybe(BaseType.REAL)),new Maybe(BaseType.REAL));

		Parameter p = new Parameter();
		assertTrue(ParameterUtils.uniqueParameters(new Maybe(p)).match(new Maybe(p)).matches());

		Maybe maybe = new Maybe(p);
		assertNotSame(ParameterUtils.uniqueParameters(maybe), maybe);
		assertFalse(ParameterUtils.uniqueParameters(maybe).equals(maybe));
	}

	public void testUniqueList() {
		assertEquals(ParameterUtils.uniqueParameters(new ListType(BaseType.REAL)),new ListType(BaseType.REAL));

		Parameter p = new Parameter();
		assertTrue(ParameterUtils.uniqueParameters(new ListType(p)).match(new ListType(p)).matches());

		ListType list = new ListType(p);
		assertNotSame(ParameterUtils.uniqueParameters(list), list);
		assertFalse(ParameterUtils.uniqueParameters(list).equals(list));
	}

	public void testUniqueParameter() {
		Parameter p = new Parameter();
		assertNotSame(ParameterUtils.uniqueParameters(p),p);
		assertFalse(ParameterUtils.uniqueParameters(p).equals(p));
	}
}
