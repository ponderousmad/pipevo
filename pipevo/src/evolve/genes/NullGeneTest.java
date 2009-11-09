/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.Gene;
import evolve.ObjectRegistry;
import functional.Obj;
import functional.type.BaseType;
import junit.framework.TestCase;

public class NullGeneTest extends TestCase {

	public void testType() {
		Gene gene = new NullGene();
		assertEquals(gene.type(), BaseType.NULL);
	}

	public void testExpress() {
		Gene gene = new NullGene();
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene.isNull());
	}
}
