/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Define a cons cell.
 */
public class Cons implements Obj {

	public Cons( Obj first, Obj second ) {
		mFirst = first;
		mSecond = second;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isFixNum() {
		return false;
	}

	public boolean isReal() {
		return false;
	}

	public boolean isString() {
		return false;
	}

	public boolean isSymbol() {
		return false;
	}

	public boolean isCons() {
		return true;
	}

	public boolean isNull() {
		return false;
	}
	public Obj eval( Environment env ) {
		// Since a cons cell can contain a function or special form,
		// this provides us with a place to hook into the abort mechanism.
		// So every time a cons is evaluated, we check if the interpreter
		// has aborted, and throw the abort exception.
		RuntimeException abort = env.abort();
		if( abort != null ) {
			throw abort;
		}

		// Evaluate the cons cell as an application or a special form.
		// It also has support for limited tail call elimination, but
		// it's a little experimental.
		Obj result = null;
		Cons cons = this;
		boolean isTail;
		do {
			isTail = false;
			Obj firstEval = cons.mFirst.eval( env );
			env.setupTail();
			if( firstEval.isFunction() ) {
				result = ( (Function)firstEval ).invoke( env, cons.mSecond );
			} else if( firstEval.isSpecialForm() ) {
				result = ( (SpecialForm)firstEval ).invoke( env, cons.mSecond );
			} else {
				// Since this is neither an application or a special form,
				// it evaluates to itself.
				result = cons;
			}
			env.clearTail();
			if( result == null) {
				Tail tail = env.getTail();
				cons = tail.Cons();
				env = tail.Environment();
				isTail = true;
			}
		} while( isTail );
		return result;
	}

	public static Obj compileList(Environment env, Obj arguments) {
		if( arguments.isCons() ) {
			Cons args = (Cons)arguments;
			return Cons.prependList( args.car().compile( env ), compileList( env, args.cdr() ) );
		} else if( arguments.isNull() ) {
			return arguments;
		}
		throw new CompileException( "Malformed list", env );
	}

	public Obj compile(Environment env) {
		Obj firstCompile = mFirst.compile(env);
		if( firstCompile.isFunction() ) {
			Function firstFunction = (Function)firstCompile;
			return new Cons( firstFunction, compileList(env, mSecond ) );
		} else if( firstCompile.isSpecialForm() ) {
			SpecialForm firstSpecial = (SpecialForm)firstCompile;
			return firstSpecial.compile( env, mSecond );
		}
		return new Cons( firstCompile, mSecond.compile(env) );
	}

	public Obj car() {
		return mFirst;
	}

	public Obj cdr() {
		return mSecond;
	}

	private void restString( StringBuffer buffer ) {
		buffer.append( mFirst.toString() );
		if( mSecond.isCons() ) {
			buffer.append( ' ' );
			((Cons)mSecond).restString( buffer );
		} else if( !mSecond.isNull() ) {
			buffer.append( " . " );
			buffer.append( mSecond.toString() );
		}
	}

	public String toString() {
		StringBuffer buffer = new StringBuffer();
		buffer.append( '(' );
		restString( buffer );
		buffer.append( ')' );
		return buffer.toString();
	}

	public static Null list() {
		return Null.NULL;
	}

	public static Cons list(Obj obj) {
		return new Cons( obj, Null.NULL);
	}

	public static Cons list(Obj o1, Obj o2) {
		return new Cons(o1, new Cons(o2, Null.NULL));
	}

	public static Cons list(Obj o1, Obj o2, Obj o3) {
		return new Cons(o1, new Cons(o2, new Cons(o3, Null.NULL)));
	}

	public static Cons list(Obj o1, Obj o2, Obj o3, Obj o4) {
		return new Cons(o1, new Cons(o2, new Cons(o3, new Cons(o4, Null.NULL))));
	}

	public static Cons list(Obj o1, Obj o2, Obj o3, Obj o4, Obj o5) {
		return new Cons(o1, new Cons(o2, new Cons(o3, new Cons(o4, new Cons(o5, Null.NULL)))));
	}

	public static Cons prependList(Obj o1, Obj tail) {
		return new Cons(o1, tail);
	}

	public static Cons prependList(Obj o1, Obj o2, Obj tail) {
		return new Cons(o1, new Cons(o2, tail));
	}

	public static Cons prependList(Obj o1, Obj o2, Obj o3, Obj tail) {
		return new Cons(o1, new Cons(o2, new Cons(o3, tail)));
	}

	public static Cons prependList(Obj o1, Obj o2, Obj o3, Obj o4, Obj tail) {
		return new Cons(o1, new Cons(o2, new Cons(o3, new Cons(o4, tail))));
	}

	private Obj mFirst = Null.NULL;
	private Obj mSecond = Null.NULL;
}
