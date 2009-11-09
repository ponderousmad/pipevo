/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.util.Random;

import utils.StringRandom;

import evolve.Chromasome.Phene;
import functional.Obj;
import functional.type.FunctionType;
import functional.type.Type;

import junit.framework.TestCase;

public class GeneBuilderTest extends TestCase {
	public static void testBuildFunction() {
		long baseSeed = new Random().nextLong();
		Random testRandom = new Random( baseSeed );

		ObjectRegistry reg = new ObjectRegistry();
		BuiltinRegistrar.registerBuiltins(reg);
		Chromasome c = new Chromasome(StringRandom.alphaString( testRandom, 5 ));
		final int kTestCount = 20;
		long[] seeds = new long[kTestCount];

		for( int i = 0; i < kTestCount; ++i ) {
			long seed = testRandom.nextLong();
			seeds[i] = seed;
			Random random = new Random( seed );
			TypeBuilder typeBuilder = new TypeBuilder(
				true,
				new TypeBuilder.Probabilities()
			);
			Context context = new Context(reg);
			context.addChromasome( c );

			GeneRandomizer randomizer = new GeneRandomizer(new GeneRandomizer.Probabilities());
			GeneBuilder geneBuilder = new GeneBuilder( typeBuilder, randomizer, context );
			Type returnType = typeBuilder.createType(random);
			FunctionType funcType = typeBuilder.createFunction(returnType, random);
			Gene gene = geneBuilder.buildFunction(funcType, c.nextGeneName(), random);
			assertNotNull( gene );

			c.addGene( gene );

			Obj obj = gene.express(context);
			assertNotNull( obj );
		}
		expressTest( reg, c );

		String path = "tmp";
		storeChromasome( c, path );
		expressTest(reg, loadChromasome( path ));
	}

	private static void expressTest(ObjectRegistry reg, Chromasome chromasome) {
		Context context = new Context(reg);
		context.addChromasome( chromasome );
		Phene[] expressions = chromasome.express(context);
		assertNotNull(expressions);
		assertTrue(expressions.length>0);
		for( Phene expression : expressions) {
			assertNotNull(expression);
			assertNotNull(expression.name);
			assertNotNull(expression.expression);
		}
	}

	private static Chromasome loadChromasome(String path) {
		try {
			FileInputStream in = new FileInputStream(path);
			ObjectInputStream s = new ObjectInputStream(in);
			return (Chromasome)s.readObject();
		} catch (IOException e) {
			e.printStackTrace();
		} catch (ClassNotFoundException e) {
			e.printStackTrace();
		}
		return null;
	}

	private static void storeChromasome(Chromasome c, String path) {
		FileOutputStream f;
		try {
			f = new FileOutputStream(path);
			ObjectOutput s = new ObjectOutputStream(f);
			s.writeObject(c);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
