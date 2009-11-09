/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

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
