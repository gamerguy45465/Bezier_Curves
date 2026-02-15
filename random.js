class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}
const seededRandom = new SeededRandom(5);

function myRandom() {
    return Math.random();
}

function randomDouble(low, high) {
    const scale = high - low;
    const r = myRandom() * scale + low;
    return r;
}


export { randomDouble };