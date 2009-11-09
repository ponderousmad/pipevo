/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.Gene;
import evolve.ObjectRegistry;
import functional.Obj;
import functional.True;
import functional.type.BaseType;
import junit.framework.TestCase;

public class TrueGeneTest extends TestCase {
	public void testType() {
		Gene gene = new TrueGene();
		assertEquals(gene.type(), BaseType.TRUE);
	}

	public void testExpress() {
		Gene gene = new TrueGene();
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene.equals(True.TRUE));
	}
}
