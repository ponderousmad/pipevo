/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;

import evolve.GenomeBuilder.ChromasomeStructure;
import evolve.GenomeBuilderTest.Helper;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Type;
import junit.framework.TestCase;

public class BreederTest extends TestCase {
	static class BuildHelper {
		Helper helper = new Helper();
		FunctionType target = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
		Genome genomeA;
		Genome genomeB;

		public BuildHelper( Random random )
		{
			ChromasomeStructure[] structure = helper.buildStructure(target, random);
			genomeA = helper.build(structure, random);
			genomeB = helper.build(structure, random);
		}
	}

	public void testBreedChromasome() {
		Random random = new Random();
		BuildHelper h = new BuildHelper(random);
		Chromasome a = h.genomeA.chromasomes().get(0);
		Chromasome b = h.genomeB.chromasomes().get(0);
		Chromasome offspring = Breeder.breed(a, b, random);

		assertNotNull(offspring);
		assertEquals(a.genes().length, offspring.genes().length);
		for( int i = 0; i < a.genes().length; ++i ) {
			assertEquals(a.genes()[i].gene.type(), offspring.genes()[i].gene.type());
		}
	}

	public void testBreedGenome() {
		Random random = new Random();
		BuildHelper h = new BuildHelper(random);
		Genome offspring = Breeder.breed(h.genomeA, h.genomeB, h.target, random);

		assertNotNull(offspring);
		assertEquals(h.genomeA.chromasomes().size(),offspring.chromasomes().size());
		for( int i = 0; i < offspring.chromasomes().size(); ++i ) {
			assertEquals(h.genomeA.chromasomes().get(i).genes().length,offspring.chromasomes().get(i).genes().length);
		}
	}
}
