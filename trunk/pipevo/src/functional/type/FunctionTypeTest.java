/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.Set;

import junit.framework.TestCase;

public class FunctionTypeTest extends TestCase {
	public void testParameter() {
		FunctionType function = new FunctionType( BaseType.FIXNUM, new Type[] {BaseType.FIXNUM});
		assertFalse( function.isParameterized() );
		assertFalse( function.involves( new Parameter() ) );
		assertTrue(ParameterUtils.findParameters(function).isEmpty());

		Parameter p = new Parameter();
		Parameter q = new Parameter();
		FunctionType funcP = new FunctionType( p, new Type[]{p,q} );
		assertTrue( funcP.isParameterized() );
		assertTrue( funcP.involves(p) );
		assertTrue( funcP.involves(q) );
		assertFalse( funcP.involves(new Parameter()) );
		Set<Parameter> parameters = ParameterUtils.findParameters(funcP);
		assertTrue(parameters.contains(q));
		assertTrue(parameters.contains(p));
		assertEquals(parameters.size(),2);

		Parameter r = new Parameter();
		FunctionType funcR = new FunctionType( r, new Type[]{BaseType.FIXNUM} );
		assertTrue( funcR.isParameterized() );
		assertTrue( funcR.involves(r) );
		assertFalse( funcR.involves(p) );
		assertTrue(ParameterUtils.findParameters(funcR).contains(r));
	}

	public void testEquals() {
		FunctionType function = new FunctionType( BaseType.FIXNUM, new Type[] {BaseType.FIXNUM});
		FunctionType again = new FunctionType( BaseType.FIXNUM, new Type[] {BaseType.FIXNUM});
		assertTrue( function.equals(again) );
		assertFalse( function.equals(BaseType.FIXNUM) );

		Parameter p = new Parameter();
		Parameter q = new Parameter();
		FunctionType funcP = new FunctionType( p, new Type[]{p} );
		assertFalse( function.equals( funcP ) );

		FunctionType funcQ = new FunctionType( q, new Type[]{q} );
		assertFalse( funcP.equals(funcQ) );

		FunctionType func2 = new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.STRING} );
		FunctionType again2= new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.STRING} );
		assertTrue( func2.equals(again2) );
		FunctionType another2= new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.SYMBOL} );
		assertFalse( func2.equals(another2) );

	}

	public void testMatch() {
 		FunctionType function = new FunctionType( BaseType.FIXNUM, new Type[] {BaseType.FIXNUM});
		FunctionType again = new FunctionType( BaseType.FIXNUM, new Type[] {BaseType.FIXNUM});
		assertTrue( function.match(again).matches() );
		assertFalse( function.match(BaseType.FIXNUM).matches() );

		Parameter p = new Parameter();
		Parameter q = new Parameter();
		FunctionType funcP = new FunctionType( p, new Type[]{p} );
		assertFalse( function.match( funcP ).matches() );

		Match match = funcP.match(function);
		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p);
		assertEquals( match.mappings().get(0).type(), BaseType.FIXNUM );

		FunctionType funcQ = new FunctionType( q, new Type[]{q} );
		match = funcP.match(funcQ);
		assertTrue( match.matches() );
		assertEquals( match.mappings().get(0).parameter(), p);
		assertEquals( match.mappings().get(0).type(), q );

		FunctionType func2 = new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.STRING} );
		FunctionType again2= new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.STRING} );
		assertTrue( func2.match(again2).matches() );
		FunctionType another2= new FunctionType( BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.SYMBOL} );
		assertFalse( func2.match(another2).matches() );

		assertFalse( func2.match(funcP).matches() );
	}

	public void testSubstitute() {
		Parameter p = new Parameter();
		Parameter q = new Parameter();
		Parameter r = new Parameter();
		FunctionType func = new FunctionType( p, new Type[]{ q } );
		FunctionType target = new FunctionType( BaseType.FIXNUM, new Type[]{ BaseType.FIXNUM } );
		Match match = func.match(target);
		Type result = func.substitute(match.mappings());
		assertEquals( result, target );

		assertSame( target.substitute(match.mappings()), target );

		func = new FunctionType( p, new Type[]{q, r} );
		target = new FunctionType( BaseType.BOOL, new Type[]{ BaseType.REAL, BaseType.STRING } );
		match = func.match(target);
		result = func.substitute(match.mappings());
		assertEquals( result, target );

		assertSame( target.substitute(match.mappings()), target );
	}

	public void testToString() {
		FunctionType funcVoid = new FunctionType(BaseType.FIXNUM, new Type[] {});
		assertEquals(funcVoid.toString(),"F[]->[functional.FixNum]");

		FunctionType func = new FunctionType(BaseType.FIXNUM, new Type[] {BaseType.REAL});
		assertEquals(func.toString(),"F[functional.Real]->[functional.FixNum]");

		FunctionType func2 = new FunctionType(BaseType.BOOL, new Type[]{BaseType.STRING,BaseType.STRING});
		assertEquals(func2.toString(),"F[functional.StringObj, functional.StringObj]->[Maybe[functional.True]]");
	}
}
