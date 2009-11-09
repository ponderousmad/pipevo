/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;

import functional.type.FunctionType;
import functional.type.Type;

import junit.framework.TestCase;

public class TypeBuilderTest extends TestCase {
	private TypeBuilder.Probabilities TypeProbs() {
		return new TypeBuilder.Probabilities();
	}

	public void testCreate() {
		TypeBuilder builder = new TypeBuilder(false, TypeProbs());
		Random random = new Random();

		for( int i = 0; i < 1000; ++i ) {
			Type type = builder.createType(random);
			assertNotNull( type );
		}
	}

	public void testCreateFunction() {
		TypeBuilder builder = new TypeBuilder(false, TypeProbs());
		Random random = new Random();

		for( int i = 0; i < 100; ++i ) {
			Type r = builder.createType(new Random());
			assertNotNull( r );
			FunctionType rFunc = builder.createFunction(r, random);
			assertNotNull( rFunc );
		}
	}

	public void testCreateParameterized() {
		TypeBuilder builder = new TypeBuilder(true, TypeProbs());
		Random random = new Random();

		boolean someParameter = false;
		for( int i = 0; i < 2000; ++i ) {
			Type type = builder.createType(random);
			assertNotNull( type );
			if( type.isParameterized() ) {
				someParameter = true;
			}
		}
		assertTrue( someParameter );
	}

	public void testCreateParameterizedFunction() {
		TypeBuilder builder = new TypeBuilder(true, TypeProbs());
		Random random = new Random();

		boolean someParameter = false;
		for( int i = 0; i < 1000; ++i ) {
			Type r = builder.createType(random);
			assertNotNull( r );
			FunctionType rFunc = builder.createFunction(r, random);
			assertNotNull( rFunc );
			if( rFunc.isParameterized() ) {
				someParameter = true;
			}
		}
		assertTrue( someParameter );
	}
}
