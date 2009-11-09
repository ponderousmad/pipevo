/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;

import util.StringRandom;

import functional.type.FunctionType;
import functional.type.Type;

public class GenomeBuilder {
	ObjectRegistry mRegistry;
	TypeBuilder mTypeBuilder;
	GeneRandomizer mProbs;

	public GenomeBuilder(ObjectRegistry registry, TypeBuilder typeBuilder, GeneRandomizer probs) {
		mRegistry = registry;
		mTypeBuilder = typeBuilder;
		mProbs = probs;
	}

	public class ChromasomeStructure
	{
		public String name;
		public FunctionType[] geneTypes;
	}

	public ChromasomeStructure[] buildGenomeStructure( FunctionType target, Random random )
	{
		mTypeBuilder.allowAllConstrained();
		try {
			ChromasomeStructure[] structure = new ChromasomeStructure[mProbs.selectGenomeSize(random)];
			for( int i = 0; i < structure.length - 1; ++i ) {
				structure[i] = buildChromasomeStructure(random);
			}

			structure[structure.length-1] = buildTargetStructure( target );
			return structure;
		} finally {
			mTypeBuilder.clearDependentTypes();
		}
	}

	public Genome build( ChromasomeStructure[] genomeStructure, Random random ) {
		Genome genome = new Genome();
		Context context = new Context(mRegistry);
		GeneBuilder geneBuilder = new GeneBuilder(mTypeBuilder, mProbs, context);
		for( ChromasomeStructure structure : genomeStructure ) {
			genome.add( buildChromasome(context,geneBuilder,structure,random));
		}
		return genome;
	}

	private ChromasomeStructure buildChromasomeStructure( Random random ) {
		ChromasomeStructure structure = new ChromasomeStructure();
		structure.name = "cr" + StringRandom.alphaString( random, 5 );
		structure.geneTypes = new FunctionType[mProbs.selectChromasomeLength(random)];
		for( int i = 0; i < structure.geneTypes.length; ++i ) {
			Type returnType = mTypeBuilder.createType(random);
			structure.geneTypes[i] = mTypeBuilder.createFunction(returnType, random);
		}
		return structure;
	}

	private ChromasomeStructure buildTargetStructure( FunctionType target ) {
		ChromasomeStructure targetStructure = new ChromasomeStructure();
		targetStructure.name = "crTarget";
		targetStructure.geneTypes = new FunctionType[] { target };
		return targetStructure;
	}

	private Chromasome buildChromasome( Context context, GeneBuilder geneBuilder, ChromasomeStructure structure, Random random ) {
		Chromasome chromasome = new Chromasome( structure.name );
		context.addChromasome(chromasome);
		for( FunctionType geneType : structure.geneTypes ) {
			chromasome.addGene( geneBuilder.buildFunction(geneType, chromasome.nextGeneName(), random) );
		}
		return chromasome;
	}
}
