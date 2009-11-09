/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Cons;
import functional.Null;
import functional.Obj;
import functional.Symbol;
import functional.type.FunctionType;
import functional.type.Maybe;
import functional.type.Type;
import functional.special.If.IfExpression;

public class PassMaybeGene implements Gene, Serializable {
	private static final long serialVersionUID = 7584683815234892086L;
	private FunctionType mFunctionType;
	private Maybe mType;
	private Gene mFunction;
	private Gene[] mArguments;
	private String mVarName;

	public PassMaybeGene( Type type, Gene function, Gene[] arguments, String varName ) {
		assert( type instanceof Maybe );
		mType = (Maybe)type;
		assert( function.type() instanceof FunctionType );
		mFunctionType = (FunctionType)function.type();
		assert( mType.match(mFunctionType.returnType()).matches() );
		assert( arguments.length == mFunctionType.argumentTypes().length );
		mFunction = function;
		mArguments = arguments;
		mVarName = varName;
	}

	public Obj express(Context context) {
		Obj bindings = buildBindings(context, 0);

		Obj arguments = buildArguments(0);
		Cons application = Cons.prependList(mFunction.express(context), arguments);

		Obj predicate = buildPredicate();
		Cons body;
		if( predicate.isNull() ) {
			body = Cons.list(application);
		} else {
			body = Cons.list(new IfExpression(predicate, application, Null.NULL));
		}

		return Cons.prependList(new Symbol("let"), bindings, body);
	}

	private Obj buildArguments( int index ) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		return Cons.prependList(varSymbol(index), buildArguments(index+1));
	}

	private Symbol varSymbol(int index) {
		return new Symbol("pm_" + mVarName + Integer.toString(index));
	}

	private Obj buildPredicate() {
		Obj checks = buildPredicate(0);
		if( checks.isCons() ) {
			return Cons.prependList(new Symbol("and"), checks);
		}
		return checks;
	}

	private Obj buildPredicate(int index) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		Obj rest = buildPredicate(index + 1);
		if( !check(index) ) {
			return rest;
		}
		Obj self = varSymbol(index);
		if( rest.isNull() ) {
			return self;
		}
		if( !rest.isCons() ) {
			rest = Cons.list(rest);
		}
		return Cons.prependList(self, rest);
	}

	private boolean check(int index) {
		return !(mFunctionType.argumentTypes()[index] instanceof Maybe);
	}

	private Obj buildBindings(Context context, int index) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		return Cons.prependList(buildBinding(context, index), buildBindings(context,index+1));
	}

	private Cons buildBinding(Context context, int index) {
		return Cons.list(varSymbol(index), mArguments[index].express(context));
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedFunction = mutation.mutateGene(mFunctionType, mFunction, context, random);
		boolean isMutated = mutatedFunction != mFunction;
		Gene[] mutatedArgs = new Gene[mArguments.length];
		for( int i = 0; i < mArguments.length; ++i ) {
			mutatedArgs[i] = mutation.mutateGene(mFunctionType.argumentTypes()[i], mArguments[i], context, random);
			if( mutatedArgs[i] != mArguments[i] ) {
				isMutated = true;
			}
		}
		if( isMutated ) {
			return new PassMaybeGene(mType, mutatedFunction, mutatedArgs, mVarName);
		} else {
			return this;
		}
	}

	public Type type() {
		return mType;
	}
}
