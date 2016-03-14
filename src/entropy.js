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

    function makeEntropy(seed) {
        var twister = new MersenneTwister(seed),
            maxValue = Math.pow(2, 31);

        return function() {
            return twister.next() / maxValue;
        };
    }

    function randomEntropy() {
        return makeEntropy(Math.floor(Math.random() * 193401701));
    }
    
    return {
        makeEntropy: makeEntropy,
        random: randomEntropy
    };
}());
