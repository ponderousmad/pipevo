/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.TestCase;

public class ConsTypeTest extends TestCase {
	public void testParameter() {
		ConsType cons = new ConsType(BaseType.REAL, BaseType.STRING);
		assertFalse(cons.isParameterized());
		assertFalse(cons.involves(new Parameter()));

		ConsType pcar = new ConsType(new Parameter(), BaseType.REAL);
		ConsType pcdr = new ConsType(BaseType.SYMBOL, new Parameter());

		assertTrue( pcar.isParameterized() );
		assertTrue( pcdr.isParameterized() );
		assertTrue( pcar.involves( (Parameter)pcar.carType() ) );
		assertTrue( pcdr.involves( (Parameter)pcdr.cdrType() ) );

		assertTrue(ParameterUtils.findParameters(cons).isEmpty());
		assertEquals(ParameterUtils.findParameters(pcar).size(),1);
		assertEquals(ParameterUtils.findParameters(pcdr).size(),1);
	}

	public void testEquals() {
		ConsType cons = new ConsType(BaseType.REAL, BaseType.STRING);
		ConsType pcar = new ConsType(new Parameter(), BaseType.STRING);
		ConsType pcdr = new ConsType(BaseType.REAL, new Parameter());

		assertEquals( cons, cons );
		assertEquals( cons, new ConsType(BaseType.REAL, BaseType.STRING));
		assertFalse( cons.equals(pcar) );
		assertFalse( pcar.equals(pcdr) );
	}

	public void testMatch() {
		ConsType cons = new ConsType(BaseType.REAL, BaseType.STRING);
		ConsType pcar = new ConsType(new Parameter(), BaseType.STRING);
		ConsType pcdr = new ConsType(BaseType.REAL, new Parameter());

		assertTrue( cons.match(cons).matches() );
		assertFalse( cons.match(pcar).matches() );
		assertFalse( cons.match(pcdr).matches() );
		assertFalse( pcar.match(pcdr).matches() );
		assertFalse( pcdr.match(pcar).matches() );


		Match match = pcar.match(cons);
		assertTrue( match.matches() );
		assertEquals( match.mappings().size(), 1 );
		assertEquals( match.mappings().get(0).parameter(), pcar.carType() );
		assertEquals( match.mappings().get(0).type(), cons.carType() );

		match = pcdr.match(cons);
		assertTrue( match.matches() );
		assertEquals( match.mappings().size(), 1 );
		assertEquals( match.mappings().get(0).parameter(), pcdr.cdrType() );
		assertEquals( match.mappings().get(0).type(), cons.cdrType() );

		assertFalse( pcar.match( BaseType.REAL ).matches() );
		assertFalse( pcar.match( new ConsType(BaseType.REAL, BaseType.SYMBOL) ).matches() );
	}

	public void testSubsitute() {
		Parameter p = new Parameter();
		ConsType cons = new ConsType( p, BaseType.REAL );
		ConsType target = new ConsType( BaseType.STRING, BaseType.REAL );
		Match match = cons.match( target );
		Type result = cons.substitute( match.mappings() );
		assertEquals( result, target );

		p = new Parameter();
		cons = new ConsType( BaseType.SYMBOL, p );
		target = new ConsType( BaseType.SYMBOL, BaseType.FIXNUM );
		match = cons.match( target );
		result = cons.substitute( match.mappings() );
		assertEquals( result, target );
	}

	public void testToString() {
		assertEquals(
			new ConsType(BaseType.REAL,BaseType.FIXNUM).toString(),
			"Cons[functional.Real, functional.FixNum]"
		);
	}
}
