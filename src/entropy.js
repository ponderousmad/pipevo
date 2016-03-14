var ENTROPY = (function () {
    "use strict";
    
        // Port of this: https://en.wikipedia.org/wiki/Mersenne_Twister#Python_implementation
    function MersenneTwister(seed) {
        // Initialize the index to 0
        this.INDEX_COUNT = 624;
        this.index = 0;
        this.mt = [seed];  // Initialize the initial state to the seed
        for (var i = 1; i < this.INDEX_COUNT; ++i ) {
            this.mt.push(this.asInt32(1812433253 * (this.mt[i - 1] ^ this.mt[i - 1] >> 30) + i));
        }
    }

    MersenneTwister.prototype.asInt32 = function (x) {
        // Get the 32 least significant bits.
        return 0xFFFFFFFF & x;
    };

    MersenneTwister.prototype.next = function () {
        if (this.index >= this.INDEX_COUNT) {
            this.twist();
        }

        var y = this.mt[this.index];

        // Right shift by 11 bits
        y = y ^ y >> 11;
        // Shift y left by 7 and take the bitwise and of 2636928640
        y = y ^ y << 7 & 2636928640;
        // Shift y left by 15 and take the bitwise and of y and 4022730752
        y = y ^ y << 15 & 4022730752;
        // Right shift by 18 bits
        y = y ^ y >> 18;

        this.index += 1;

        return this.asInt32(y);
    };

    MersenneTwister.prototype.twist = function () {
        for (var i = 0; i < this.INDEX_COUNT; ++i ) {
            // Get the most significant bit and add it to the
            // less significant bits of the next number
            var y = this.asInt32(
                    (this.mt[i] & 0x80000000) +
                    (this.mt[(i + 1) % this.INDEX_COUNT] & 0x7fffffff)
                );
            this.mt[i] = this.mt[(i + 397) % this.INDEX_COUNT] ^ y >> 1;

            if (y % 2 !== 0) {
                this.mt[i] = this.mt[i] ^ 0x9908b0df;
            }
        }
        this.index = 0;
    };
    
    function Entropy(seed) {
        this.twister = new MersenneTwister(seed);
        this.maxValue = Math.pow(2, 31);
    }
    
    Entropy.prototype.random = function () {
        return this.twister.next() / this.maxValue;
    };
    
    Entropy.prototype.randomInt = function (min, max) {
        return Math.min(Math.floor(min + this.random() * (max - min)), max - 1);
    };
    
    Entropy.prototype.randomElement = function (list) {
        return list[this.randomInt(0, list.length)];
    };
    
    Entropy.prototype.select = function (bias) {
        return this.random() < bias;
    };
    
    // Produce a random string consisting of characters from the extended ascii code points.
    Entropy.prototype.randomAscii = function (length) {
        var text = "";
        for (var i = 0; i < length; ++i) {
            text += String.fromCharCode(this.randomInt(1, 256));
        }
        return text;
    };

	// Produce a random string consisting of letters from the lower case latin alphabet.
	Entropy.prototype.alphaString = function (length) {
        var text = "",
            start = "a".charCodeAt(0);
        for (var i = 0; i < length; ++i) {
            text += String.fromCharCode(start + this.randomInt(0, 26));
        }
        return text;
	};
    
    function makeRandom() {
        return new Entropy(Math.floor(Math.random() * 193401701));
    }
    
    // The set is implemented as a binary tree where each node knows the sum
    // of the weights in the left and right branches, so given a seed it either
	// returns the value from the left branch, the right branch, or the node itself.
    function WeightedNode(value, weight) {
		this.value = value;
		this.weight = weight;

		this.balanced = true;
		this.left = null;
		this.right = null;
    }
    
    WeightedNode.prototype.add = function (value, weight) {
		this.weight += weight;
        if (this.balanced) {
            this.balanced = false;
            if (this.left === null) {
                this.left = new WeightedNode(value, weight);
            } else {
                this.left.add(value, weight);
            }
        } else {
            this.balanced = true;
            if (this.right === null) {
                this.ight = new WeightedNode(value, weight);
            } else {
                this.right.add(value, weight);
            }
        }
    };

    // Given a seed within the sum of the weights of the set, return the value
    // where the sum of the weights to the left is less than the seed, but by
    // including the value's weight makes the sum greater or equal to the seed.
    WeightedNode.prototype.selectSeed = function(seed) {
        if (seed >= this.weight) {
            throw "seed out of bounds";
        }
        if (this.left !== null && seed < this.left.weight ) {
            return this.left.select(seed);
        }
        if (this.right !== null ) {
            var rightBorder = this.weight - this.right.weight;
            if (seed >= rightBorder) {
                return this.right.select(seed - rightBorder);
            }
        }
        return this.value;
    };

    // Gets a value at random, biased by the weight.
    WeightedNode.prototype.select = function (entropy) {
        return this.selectSeed(entropy.randomInt(0, this.weight));
    };
    
    // Allows selection of items from a set where each item has an associated weight.
    function WeightedSet() {
        this.root = null;
    }

	// Add a value with associated weight.
	WeightedSet.prototype.add = function (value, weight) {
        if (weight <= 0 || value === null) {
            throw "Invalid parameters";
        }
		if (this.root === null) {
			this.root = new WeightedNode(value, weight);
		} else {
			this.root.add(value, weight);
		}
	};

	// Gets the sum of the weights of all the values.
	WeightedSet.prototype.total = function () {
		return this.root ? this.root.weight : 0;
	};

	// Select a value based on a seed in the range zero (inclusive) to total() (exclusive).
	// If larger then total, will exagerate the bias of the last value added.
	WeightedSet.prototype.selectSeed = function (seed) {
		if (this.root !== null) {
			return this.root.selectSeed(seed);
		}
		return null;
	};

	WeightedSet.prototype.isEmpty = function () {
		return this.total() === 0;
	};

	// Select a value randomly, biased by the weights.
	WeightedSet.prototype.select = function(entropy) {
		if (this.root !== null) {
			return this.root.select(entropy);
		}
		return null;
	};
    
    return {
        Entropy: Entropy,
        makeRandom: makeRandom,
        WeightedSet: WeightedSet
    };
}());
