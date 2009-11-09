/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.util.Random;

import evolve.Context;
import evolve.Gene;
import evolve.ObjectRegistry;
import functional.Obj;
import functional.True;
import functional.type.BaseType;
import junit.framework.TestCase;

public class BoolGeneratorTest extends TestCase {

	public void testType() {
		Gene gene = new BoolGenerator(1);
		assertEquals(gene.type(),BaseType.BOOL);
	}

	public void testExpress() {
		Gene gene = new BoolGenerator(new Random().nextLong());
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene.isNull() || phene.equals(True.TRUE));
	}
}
