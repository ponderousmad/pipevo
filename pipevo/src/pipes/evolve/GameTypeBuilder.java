/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.evolve;

import java.util.List;

import pipes.functional.GameType;
import evolve.TypeBuilder;
import functional.type.Type;

import util.Pair;

public class GameTypeBuilder {
	public static TypeBuilder.Probabilities defaultProbabilities() {
		TypeBuilder.Probabilities probs = new TypeBuilder.Probabilities();
		java.util.List<Pair<Type, Integer>> typeWeights = probs.concreteWeights();
		typeWeights.add(new Pair<Type,Integer>(GameType.GAME, 10));
		typeWeights.add(new Pair<Type,Integer>(GameType.PIECE, 10));
		typeWeights.add(new Pair<Type,Integer>(GameType.PIPE, 10));
		typeWeights.add(new Pair<Type,Integer>(GameType.POSITION, 10));
		typeWeights.add(new Pair<Type,Integer>(GameType.STRACETATE, 10));
		return probs;
	}

	public static List<TypeBuilder.Constraint> typeConstraints() {
		List<TypeBuilder.Constraint> constraints = new java.util.ArrayList<TypeBuilder.Constraint>();
		constraints.add(new TypeBuilder.Constraint(GameType.GAME, new java.util.ArrayList<Type>()));
		List<Type> sourceTypes = new java.util.ArrayList<Type>();
		sourceTypes.add(GameType.GAME);
		constraints.add(new TypeBuilder.Constraint(GameType.STRACETATE, sourceTypes));

		sourceTypes = new java.util.ArrayList<Type>();
		sourceTypes.add(GameType.GAME);
		sourceTypes.add(GameType.STRACETATE);
		constraints.add(new TypeBuilder.Constraint(GameType.PIPE, sourceTypes));

		sourceTypes = new java.util.ArrayList<Type>();
		sourceTypes.add(GameType.GAME);
		sourceTypes.add(GameType.STRACETATE);
		sourceTypes.add(GameType.PIPE);
		constraints.add(new TypeBuilder.Constraint(GameType.PIECE, sourceTypes));
		return constraints;
	}
}
