/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.repl;

import functional.Environment;
import functional.FixNum;
import functional.Frame;
import functional.Null;
import functional.Obj;
import functional.Real;
import functional.StringObj;
import functional.Symbol;
import functional.True;
import functional.special.If;
import junit.framework.TestCase;

public class TestEval extends TestCase {
	public void testFixNum() {
		Environment env = new Frame();
		Obj num = new FixNum( 1 );
		Obj eval = num.eval( env );
		assertSame( num, eval );
		assertEquals( ((FixNum)eval).value(), 1 );
	}

	public void testReal() {
		Environment env = new Frame();
		Obj num = new Real( 1. );
		Obj eval = num.eval( env );
		assertSame( num, eval );
		assertEquals( ((Real)eval).value(), 1. );
	}

	public void testString() {
		Environment env = new Frame();
		Obj string = new StringObj( "a" );
		assertSame( string, string.eval( env ) );
	}

	public void testSymbol() {
		Environment env = new Frame();
		Obj num = new FixNum( 1 );
		env.add( "a", num );
		Obj symbol = new Symbol( "a" );
		Obj eval = symbol.eval( env );
		assertSame( num, eval );
	}

	public void testNull() {
		Environment env = new Frame();
		assertSame( Null.NULL.eval( env ), Null.NULL );
	}

	public void testTrue() {
		Environment env = new Frame();
		assertSame( True.TRUE.eval( env ), True.TRUE );
	}

	public void testSpecial() {
		Environment env = new Frame();
		Obj obj = new If();
		Obj eval = obj.eval( env );
		assertSame( obj, eval );
	}

	public void testRecurse() {
		Environment env = Initialize.init();
		Parser.parse("(define (square x) (* x x))").eval( env );
		Parser.parse("(define (map fn list) (if (isNull? list) () (cons (fn (car list)) (map fn (cdr list)))))").eval( env );
		assertEquals( Parser.parse("(map square '(1 2 3))").eval( env ).toString(), "(1 4 9)" );
	}

	public void testReverse() {
		Environment env = Initialize.init();
		Parser.parse("(define (reverse list) (labels ((revAcc (list acc) (if (isNull? list) acc (revAcc (cdr list) (cons (car list) acc))))) (revAcc list ())))").eval( env );
		assertEquals( Parser.parse( "(reverse '(1 2 3))").eval( env ).toString(), "(3 2 1)");
	}

	public void testRemove() {
		Environment env = Initialize.init();
		Parser.parse("(define (remove l pred) (cond ((isNull? l) l) ((pred (car l)) (remove (cdr l) pred)) (#t (cons (car l) (remove (cdr l) pred)))))").eval( env );
		assertEquals( Parser.parse( "(remove (list 1 2 3 4) (lambda (x) (= x 2)))").eval( env ).toString(), "(1 3 4)");
	}

	public void testLambda() {
		Environment env = Initialize.init();
		Parser.parse("(define (bar x) (lambda (y) (+ x y)))").eval(env);
		assertEquals( Parser.parse("((bar 6) 5)").eval(env).toString(), "11" );
	}
}
