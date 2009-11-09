/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Random;

import evolve.Chromasome.Phene;
import evolve.GenomeBuilder.ChromasomeStructure;
import functional.Symbol;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Type;

import junit.framework.TestCase;

public class GenomeBuilderTest extends TestCase {
	static class Helper {
		GenomeBuilder mBuilder;
		ObjectRegistry mReg;

		Helper() {
			mReg = new ObjectRegistry();
			BuiltinRegistrar.registerBuiltins(mReg);
			TypeBuilder typeBuilder = new TypeBuilder(
				true,
				new TypeBuilder.Probabilities()
			);
			mBuilder = new GenomeBuilder(mReg,typeBuilder, new GeneRandomizer(new GeneRandomizer.Probabilities()));
		}

		ChromasomeStructure[] buildStructure( FunctionType target, Random random ) {
			return mBuilder.buildGenomeStructure(target, random);
		}

		Genome build( ChromasomeStructure[] structure, Random random ) {
			return mBuilder.build(structure, random);
		}

		List<Phene> express( Genome genome ) {
			Context context = new Context(mReg);
			return genome.express(context);
		}
	}

	public void testBuildStructure() {
		Random random = new Random();
		Helper helper = new Helper();
		FunctionType target = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
		ChromasomeStructure[] structure = helper.buildStructure(target, random);
		assertNotNull( structure );
		assertTrue( structure.length > 1 );
		for( int i = 0; i < structure.length; ++i ) {
			GenomeBuilder.ChromasomeStructure cs = structure[i];
			assertNotNull(cs);
			assertNotNull(cs.name);
			assertNotNull(cs.geneTypes);
			assertTrue( cs.geneTypes.length > 0 );
			for( int j = 0; j < cs.geneTypes.length; ++j ) {
				assertNotNull(cs.geneTypes[j]);
			}
		}
	}

	public void testBuild() {
		Random random = new Random();
		Helper helper = new Helper();
		FunctionType target = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
		ChromasomeStructure[] structure = helper.buildStructure(target, random);
		Genome genome = helper.build(structure, random);
		assertNotNull(genome);
		List<Phene> phenome = helper.express(genome);
		assertNotNull(phenome);
		assertTrue(phenome.size() > 0);

		Symbol targetSymbol = genome.findLastMatching(target);
		assertNotNull(targetSymbol);

		Phene targetPhene = phenome.get(phenome.size()-1);
		assertEquals(targetSymbol.name(),targetPhene.name);
		assertNotNull(targetPhene.expression);
	}
}
