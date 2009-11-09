/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

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
