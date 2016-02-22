package functional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public interface Environment {
	class AbortRef {
		private RuntimeException mAbort = null;
		synchronized public void abort(RuntimeException ex) {
			mAbort = ex;
		}

		synchronized public RuntimeException abort() {
			return mAbort;
		}
	}

	RuntimeException abort();
	AbortRef getAbort();

	Obj lookup( String name );
	Obj lookup( Symbol symbol );
	Obj tryLookup( String name );
	Obj tryLookup( Symbol symbol );
	Symbol add( String name, Obj value );
	Symbol add( Function function );
	Symbol set( String name, Obj value );
	void shadow( String name );

	List<String> context();

	boolean useTails();
	Tail getTail();
	void setTail(Cons cons, Environment env);
	void setupTail();
	void clearTail();
}

public class EvalException extends RuntimeException {
	private static final long serialVersionUID = 4855022780860455202L;
	private Environment mEnv;

	public EvalException( String message, Environment env ) {
		super( message );
		mEnv = env;
	}

	public String context() {
		List<String> c = mEnv.context();
		StringBuffer description = new StringBuffer();
		if( c.size() > 0 ) {
			description.append( "In functions " );
			boolean first = true;
			for( String s : c ) {
				if( !first ) {
					description.append( ", " );
				} else {
					first = false;
				}
				description.append( s );

			}
			description.append( ":\n" );
		}
		return description.toString();
	}
}

// Keep track of compilation errors (ie, errors which occur when optimizing s-expressions)
public class CompileException extends EvalException {
	private static final long serialVersionUID = -1299762129830845968L;

	public CompileException( String message, Environment env ) {
		super( message, env );
	}
}

// Defines an object that can be compiled or evaluated.
// Also provides type checking functionality.
public interface Obj {
	public boolean isFunction();
	public boolean isSpecialForm();
	public boolean isFixNum();
	public boolean isReal();
	public boolean isString();
	public boolean isSymbol();
	public boolean isCons();
	public boolean isNull();

	// Determine the value of the object given the environment.
	public Obj eval( Environment env );
	
	// Produce an efficent version of this object based on the environment.
	public Obj compile( Environment env );
}

// Convienience base class for object types with resonable defaults.
public class BaseObj implements Obj {

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile(Environment env) {
		return this;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isFixNum() {
		return false;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public boolean isReal() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isString() {
		return false;
	}

	public boolean isSymbol() {
		return false;
	}
}

// Explicitly represents null.
public class Null implements Obj {

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
		return false;
	}

	public boolean isNull() {
		return true;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return "()";
	}

	private Null() {
	}

	public static final Null NULL = new Null();
}

// The canonical 'True' value representation.
public class True implements Obj {

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
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return "#t";
	}

	private True() {
	}

	public static True TRUE = new True();
}

// Represents the integer primitive. Unlike some lisps, this is limited to a standard java int.
public class FixNum implements Obj {

	public FixNum( int value ) {
		mValue = value;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isFixNum() {
		return true;
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
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval( Environment env ) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return Integer.toString( mValue );
	}

	public int value() {
		return mValue;
	}

	private int mValue;
}

// Represent the floating point primitive (double precision).
public class Real implements Obj {

	public Real( double value ) {
		mValue = value;
	}

	public boolean isReal() {
		return true;
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

	public boolean isString() {
		return false;
	}

	public boolean isSymbol() {
		return false;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return Double.toString( mValue );
	}

	public double value() {
		return mValue;
	}

	private double mValue;
}

public class StringObj implements Obj {

	private String mString;

	public StringObj( String string ) {
		mString = string;
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
		return true;
	}

	public boolean isSymbol() {
		return false;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String value() {
		return mString;
	}

	public String toString() {
		return "\"" + mString + "\"";
	}
}

public class Symbol implements Obj {
	private String mName;

	public Symbol( String name ) {
		mName = name;
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
		return true;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval( Environment env ) {
		return env.lookup( this );
	}

	public Obj compile( Environment env ) {
		Obj found = env.tryLookup( this );
		if( found != null ) {
			return found;
		}
		return this;
	}

	public String toString() {
		return mName;
	}

	public String name() {
		return mName;
	}
}

// Define a cons cell.
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

public class Function implements Obj {
	public static interface Body
	{
		Obj invoke( Environment env );
	}

	public static interface CompileableBody extends Body {
		Body compile( Environment env );
	}

	public Function( String name, String[] argNames, String restName, Body body ) {
		mName = name;
		mArgNames = argNames;
		mRestName = restName;
		mBody = body;
		check();
	}

	public Function( String[] argNames, String restName, Body body ) {
		this( null, argNames, restName, body );
	}

	public String name() {
		return mName;
	}

	public String[] parameters() {
		return mArgNames;
	}

	public String restParameter() {
		return mRestName;
	}

	public Body body() {
		return mBody;
	}

	private void check() {
		assert( mArgNames != null );
		assert( mBody != null );
	}

	public boolean isFunction() {
		return true;
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
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval( Environment env ) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	Environment shadowArgs( Environment env ) {
		if( mArgNames.length == 0 && mRestName == null ) {
			return env;
		}
		Environment frame = new Frame( env, mName );
		for( String name : mArgNames ) {
			frame.shadow(name);
		}
		if( mRestName != null ) {
			frame.shadow( mRestName );
		}
		return frame;
	}

	public void compileBody(Environment env) {
		if( mBody instanceof CompileableBody ) {
			mBody = ((CompileableBody)mBody).compile(shadowArgs(env));
		}
	}

	public Obj invoke( Environment env, Obj args ) {
		Frame frame = bindArgs( env, args );
		frame.useTail(env);
		return mBody.invoke( frame );
	}

	public class InvocationException extends EvalException {
		private static final long serialVersionUID = 8327649146617403150L;

		InvocationException( String description, Function func, Environment env, Obj args ) {
			super( description, env );
			mFunc = func;
			mArgs = args;
		}
		public Function mFunc;
		public Obj mArgs;
	}

	protected Frame bodyFrame( Environment env, String name ) {
		return new Frame(env, name);
	}

	public Frame bindArgs( Environment env, Obj args ) {
		Frame frame = bodyFrame(env, mName );
		Obj argsIn = args;
		for( String name : mArgNames ) {
			if( args.isNull() ) {
				throw new InvocationException( "Insufficient Arguments", this, env, argsIn );
			}
			if( !args.isCons() ) {
				throw new InvocationException( "Malformed expression", this, env, argsIn );
			}
			Cons tail = (Cons)args;
			frame.add( name, tail.car().eval( env ) );
			args = tail.cdr();
		}
		if( mRestName != null ) {
			frame.add( mRestName, evalList( env, args ) );
		} else if( !args.isNull() ) {
			throw new InvocationException( "Too many arguments", this, env, argsIn );
		}
		return frame;
	}

	public Obj evalList( Environment env, Obj object ) {
		if( object.isNull() ) {
			return object;
		}
		if( !object.isCons() ) {
			throw new InvocationException( "Malformed expression", this, env, object );
		}
		Cons cons = (Cons)object;
		return new Cons( cons.car().eval( env ), evalList( env, cons.cdr() ) );
	}

	public String toString() {
		return mName == null ? "lambda@" + hashCode(): mName;
	}

	private String mName = null;
	private String[] mArgNames;
	private String mRestName;
	private Body mBody;
}

public class SpecialForm implements Obj {

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return true;
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
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile(Environment env) {
		return this;
	}

	public Obj compile(Environment env, Obj arguments) {
		return Cons.prependList(this, compileArgs(env, arguments));
	}

	public Obj compileArgs(Environment env, Obj arguments) {
		return Cons.compileList(env, arguments);
	}

	public Obj invoke(Environment env, Obj arguments) {
		return Null.NULL;
	}
}

// Attempt to implement tail call elimination in limited cases.
public class Tail {
	private Cons mCons;
	private Environment mEnv;

	public Tail() {
		mCons = null;
		mEnv = null;
	}

	public void set(Cons cons, Environment env)	{
		mCons = cons;
		mEnv = env;
	}

	public Cons Cons() {
		return mCons;
	}

	public Environment Environment() {
		return mEnv;
	}
}

public class Frame implements Environment {
	private String mContext;
	private Map< String, Obj > mMap;
	private Environment mEnv = null;
	private AbortRef mAbort;
	private boolean mUseTail = false;
	private Tail mTail = null;

	public Frame() {
		mContext = null;
		mMap = new TreeMap< String, Obj >();
		mAbort = new AbortRef();
	}

	public void abort(RuntimeException ex) {
		mAbort.abort(ex);
	}

	public RuntimeException abort() {
		return mAbort.abort();
	}

	public AbortRef getAbort() {
		return mAbort;
	}

	public Frame( Environment env, String context ) {
		mContext = context;
		mMap = new TreeMap< String, Obj >();
		mEnv = env;
		mAbort = mEnv.getAbort();
		mUseTail = env.useTails();
	}

	public static Frame enableTails(Environment env) {
		Frame frame = new Frame(env, "TailFrame");
		frame.mUseTail = true;
		return frame;
	}

	public Obj lookup( String name ) {
		Obj result = tryLookup( name );
		if( result == null ) {
			throw new EvalException( "Symbol not found: " + name, this );
		}
		return result;
	}

	public Obj lookup(Symbol symbol) {
		return lookup( symbol.name() );
	}

	static private class Shadow extends BaseObj {
		private Shadow() {}
		public static Shadow SHADOW = new Shadow();
	}

	public Obj tryLookup(String name) {
		if( mMap.containsKey( name ) ) {
			Obj binding = mMap.get( name );
			if( binding == Shadow.SHADOW ) {
				return null;
			}
			return binding;
		}
		if( mEnv != null ) {
			return mEnv.tryLookup( name );
		}
		return null;
	}

	public Obj tryLookup(Symbol symbol) {
		return tryLookup(symbol.name());
	}

	public Symbol add(String name, Obj value) {
		assert( name != null );
		assert( value != null );
		mMap.put( name, value );
		return new Symbol( name );
	}

	public Symbol add( Function function ) {
		assert( function != null );
		return add( function.name(), function );
	}

	public Symbol set( String name, Obj value ) {
		if( mEnv != null ) {
			return mEnv.set( name, value );
		}
		return add( name, value );
	}

	public void shadow( String name ) {
		add( name, Shadow.SHADOW );
	}

	public List<String> context() {
		List<String> c = null;
		if( mEnv != null ) {
			c = mEnv.context();
		} else {
			c = new ArrayList<String>();
		}
		if( mContext != null ) {
			c.add( mContext );
		}
		return c;
	}

	public boolean useTails() {
		return mUseTail;
	}

	public Tail getTail() {
		return mTail;
	}

	public void setTail(Cons cons, Environment env) {
		if( mTail == null ) {
			throw new EvalException("Tails not active.", this);
		}
		mTail.set(cons, env);
	}

	public void setupTail() {
		if( mUseTail ) {
			mTail = new Tail();
		}
	}

	public void clearTail() {
		mTail = null;
	}

	void useTail(Environment env) {
		mTail = env.getTail();
	}
}