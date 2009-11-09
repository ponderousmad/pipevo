/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class CompareTypesTest extends TestCase {
	public static void testBaseTypes() {
		assertTrue( CompareTypes.equalModuloParameters(BaseType.STRING, BaseType.STRING));
		assertFalse(CompareTypes.equalModuloParameters(BaseType.FIXNUM, BaseType.REAL));
	}

	public static void testMaybe() {
		assertTrue(CompareTypes.equalModuloParameters(new Maybe(BaseType.STRING), new Maybe(BaseType.STRING)));
		assertFalse(CompareTypes.equalModuloParameters(new Maybe(BaseType.FIXNUM), new Maybe(BaseType.REAL)));
		assertFalse(CompareTypes.equalModuloParameters(new Maybe(BaseType.FIXNUM), BaseType.FIXNUM));
	}

	public static void testCons() {
		assertTrue( CompareTypes.equalModuloParameters(new ConsType(BaseType.STRING,BaseType.NULL),
													   new ConsType(BaseType.STRING,BaseType.NULL)));
		assertFalse(CompareTypes.equalModuloParameters(new ConsType(BaseType.REAL,BaseType.NULL),
													   new ConsType(BaseType.FIXNUM,BaseType.NULL)));
		assertFalse(CompareTypes.equalModuloParameters(new ConsType(BaseType.REAL,BaseType.NULL),
													   new Maybe(BaseType.REAL)));
		assertTrue( CompareTypes.equalModuloParameters(new ConsType(BaseType.STRING,new ConsType(BaseType.BOOL,BaseType.NULL)),
													   new ConsType(BaseType.STRING,new ConsType(BaseType.BOOL,BaseType.NULL))));
	}

	public static void testList() {
		assertTrue(CompareTypes.equalModuloParameters(new ListType(BaseType.STRING), new ListType(BaseType.STRING)));
		assertFalse(CompareTypes.equalModuloParameters(new ListType(BaseType.FIXNUM), new ListType(BaseType.REAL)));
		assertFalse(CompareTypes.equalModuloParameters(new ListType(BaseType.FIXNUM), new ConsType(BaseType.FIXNUM, BaseType.NULL)));
		assertTrue(CompareTypes.equalModuloParameters(new ListType(new ListType(BaseType.REAL)), new ListType(new ListType(BaseType.REAL))));
	}

	public static void testFunction() {
		assertTrue(CompareTypes.equalModuloParameters(
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} ),
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} )
		));
		assertFalse(CompareTypes.equalModuloParameters(
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} ),
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.REAL,BaseType.FIXNUM), BaseType.BOOL} )
		));
		assertFalse(CompareTypes.equalModuloParameters(
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} ),
			new FunctionType( new ListType(BaseType.SYMBOL), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} )
		));
		assertFalse(CompareTypes.equalModuloParameters(
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} ),
			new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM)} )
		));
		assertFalse(CompareTypes.equalModuloParameters(
				new FunctionType( new ListType(BaseType.STRING), new Type[]{new ConsType(BaseType.FIXNUM,BaseType.FIXNUM), BaseType.BOOL} ),
				new ListType(BaseType.STRING)
		));
	}

	public static void testParameter() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();
		assertTrue(CompareTypes.equalModuloParameters(p, p));
		assertTrue(CompareTypes.equalModuloParameters(p, q));
		assertFalse(CompareTypes.equalModuloParameters(p, BaseType.TRUE));
		assertTrue(CompareTypes.equalModuloParameters(new Maybe(p), new Maybe(p)));
		assertTrue(CompareTypes.equalModuloParameters(new ListType(p), new ListType(q)));
	}

	public static void testMultiParameter() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();
		Parameter r = new Parameter();
		assertTrue(CompareTypes.equalModuloParameters(new ConsType(p,p), new ConsType(q,q)));
		assertFalse(CompareTypes.equalModuloParameters(new ConsType(p,p), new ConsType(q,r)));
		assertTrue(CompareTypes.equalModuloParameters(new FunctionType(p, new Type[]{p}), new FunctionType(q, new Type[]{q})));
		assertTrue(CompareTypes.equalModuloParameters(new FunctionType(p, new Type[]{p,q}), new FunctionType(r, new Type[]{r,q})));
	}
}
