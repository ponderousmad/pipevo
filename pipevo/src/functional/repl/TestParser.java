/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.repl;

import functional.Cons;
import functional.FixNum;
import functional.Obj;
import functional.Real;
import functional.StringObj;
import functional.Symbol;
import functional.True;
import junit.framework.TestCase;

public class TestParser extends TestCase {
	static private Obj parse( String string ) {
		return Parser.parse( string );
	}

	public void testEmpty() {
		assertNull(parse(""));
	}

	public void testFixNum() {
		Obj number = parse( "1" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), 1 );

		number = parse( "10" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), 10 );

		number = parse( "-1" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), -1 );

		number = parse( "9" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), 9 );

		number = parse( "0" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), 0 );

		number = parse( "-2345" );
		assertTrue( number.isFixNum() );
		assertEquals( ((FixNum)number).value(), -2345 );
	}

	public void testReal() {
		Obj number = parse( ".1" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), .1 );

		number = parse( "-.1" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), -.1 );

		number = parse( "1e5" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), 1e5 );

		number = parse( "1." );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), 1. );

		number = parse( "1.6" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), 1.6 );

		number = parse( "1.7e2" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), 1.7e2 );

		number = parse( "-1e4" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), -1e4 );

		number = parse( "-1.8e5" );
		assertTrue( number.isReal() );
		assertEquals( ((Real)number).value(), -1.8e5 );
	}

	public void testString() {
		Obj string = parse( "\"Hello\"" );
		assertTrue( string.isString() );
		assertEquals( ((StringObj)string).value(), "Hello" );

		string = parse( "\"\"" );
		assertTrue( string.isString() );
		assertEquals( ((StringObj)string).value(), "" );

		string = parse( "\"\\\"\"" );
		assertTrue( string.isString() );
		assertEquals( ((StringObj)string).value(), "\"" );
	}

	public void testSymbol() {
		Obj symbol = parse( "symbol" );
		assertTrue( symbol.isSymbol() );
		assertEquals( ((Symbol)symbol).name(), "symbol" );
	}

	public void testTrue() {
		Obj truth = parse( "#t" );
		assertSame( truth, True.TRUE );
	}

	public void testCons() {
		Obj obj = parse( "()" );
		assertTrue( obj.isNull() );

		obj = parse( "(1)" );
		assertTrue( obj.isCons() );
		Cons cons = (Cons)obj;
		assertTrue( cons.car().isFixNum() );
		assertTrue( cons.cdr().isNull() );

		obj = parse( "(1 2)" );
		assertTrue( obj.isCons() );
		cons = (Cons)obj;
		assertTrue( cons.car().isFixNum() );
		assertTrue( cons.cdr().isCons() );
		assertTrue( ((Cons)cons.cdr() ).cdr().isNull() );

		obj = parse( "(1 . 2)");
		assertTrue( obj.isCons() );
		cons = (Cons)obj;
		assertFalse( cons.car().isCons() );
		assertFalse( cons.cdr().isCons() );
	}

	public void testBadCons() {
		try {
			parse( ")" );
			fail( "Exception expected" );
		} catch( Parser.ParseException e ) {
		}
	}

	public void testNestedCons() {
		Obj obj = parse( "((1) (2))" );
		assertTrue( obj.isCons() );
		Cons cons = (Cons)obj;
		assertTrue( cons.car().isCons() );
		assertTrue( cons.cdr().isCons() );
		assertTrue( ((Cons)cons.car()).car().isFixNum() );
		assertTrue( ((Cons)cons.car()).cdr().isNull() );
		cons = (Cons)cons.cdr();
		assertTrue( cons.car().isCons() );
		assertTrue( ((Cons)cons.car()).car().isFixNum() );
		assertTrue( ((Cons)cons.car()).cdr().isNull() );
		assertTrue( cons.cdr().isNull() );
	}

	public void testDeepCons() {
		Obj obj = parse( "((((5 4) (1 2 3 4) ((-1) . 2) ) \"Hello\" (goodbye)))" );
		assertEquals( obj.toString(), "((((5 4) (1 2 3 4) ((-1) . 2)) \"Hello\" (goodbye)))" );

		obj = parse( "(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))" );
		assertEquals( obj.toString(), "(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))");
	}

	public void testParseNestedConsDot() {
		Obj obj = parse( "((lambda (a . b) b) 1 2 3)" );
		assertEquals( obj.toString(), "((lambda (a . b) b) 1 2 3)" );
	}

	public void testParseSkipComments() {
		Obj obj = parse( ";Nothing to see here\n(foo)" );
		assertEquals( obj.toString(), "(foo)" );
		obj = parse( "(foo);Nothing to see here" );
		assertEquals( obj.toString(), "(foo)" );
		obj = parse( "(foo ;Nothing to see here \n)" );
		assertEquals( obj.toString(), "(foo)" );
		obj = parse( "(;Nothing to see here \n foo )" );
		assertEquals( obj.toString(), "(foo)" );
		obj = parse( "(foo . ;Nothing to see here \n bar )" );
		assertEquals( obj.toString(), "(foo . bar)" );
	}

	public void testParseMultiple() {
		Parser parser = new Parser( "(+ 1 2) (- 3 4)" );
		assertEquals( parser.parse().toString(), "(+ 1 2)" );
		assertEquals( parser.parse().toString(), "(- 3 4)" );
		assertNull( parser.parse() );
	}
}
