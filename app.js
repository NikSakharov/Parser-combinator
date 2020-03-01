const updateParserState = (state, index, result) => ([
    ...state,
    index,
    result
]);

const updateParserResult = (state, result) => ([
    ...state,
    result
]);

const updateParserError = (state, errorMsg) => ([
    ...state,
    isError: true,
    error: errorMsg
]);

class Parser {
    constructor(parserStateTransformerFn) {
        this.parserStateTransformerFn = parserStateTransformerFn;
    }

    run(targetString) {
        const intialState = {
            targetString,
            index: 0,
            result: null,
            isError: false,
            error: null
        };
        return this.parserStateTransformerFn(intialState);
    }

    map(fn) {
        return new parser(parserState => {
            const nextState = this.parserTransformerFn(parserState);

            if (nextState.isError) return nextState;

            return updateParserResult(nextState, fn(nextState.result));
        });
    }

    errorMap(fn) {
        return new parser(parserState => {
            const nextState = this.parserTransformerFn(parserState);

            if (!nextState.isError) return nextState;

            return updateParserError(nextState, fn(nextState.error, nextState.index));
        });
    }   
}

const str = s => new Parser(parserState => {
    const {
        targetingString,
        index,
        isError
    } = parserState;

    if (isError) {
        return parserState;
    }

    const slicedTarget = targetString.slice(index)

    if (slicedtarget.lenght === 0) {
        return updateParserError(parserState, 'str: Tried to match "${s}", but got Unexpected end of input.');
    }

    if (slicedTarget.startsWith(s)) {
        return updateParserState(parserState, index + s.length, s);
    }

    return updateParserError(
        parserState,
        'str: Tried to match "${s}", but got "${targetString.slice(index, index + 10)}"'
    );
})

const lettersRegex = /^[A-Za-z]+/;
const letters = new Parser(parserState => {
    const {
        targetString,
        index,
        isError
    } = parserState;

    if (isError) {
        return parserState;
    }

    const slicedTarget = targetString.slice(index)

    if (slicedtarget.lenght === 0) {
        return updateParserError(parserState, 'letters: Got Unexpected end of input.');
    }

    const regexMatch = slicedTarget.match(lettersRegex);

    if (regexMatch) {
        return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
    }

    return updateParserError(
        parserState,
        'letters: Couldn`t match letters at index ${index}'
    );
});

const digitsRegex = /^[0-9]+/;
const digits = new Parser(parserState => {
    const {
        targetString,
        index,
        isError
    } = parserState;

    if (isError) {
        return parserState;
    }

    const slicedTarget = targetString.slice(index)

    if (slicedtarget.lenght === 0) {
        return updateParserError(parserState, 'digits: Got Unexpected end of input.');
    }

    const regexMatch = slicedTarget.match(digits);

    if (regexMatch) {
        return updateParserState(parserState, index + regexMatch[0].length, regexMatch[0]);
    }

    return updateParserError(
        parserState,
        'digits: Couldn`t match digits at index ${index}'
    );
});

const sequenceOf = parsers => new Parser(parserState => {
    if (parserState.isError) {
        return parserState;
    }

    const results = [];
    let nextState = parserState;

    for (let p of parsers) {
        nextState = p.parserStateTransformerFn(nextState);
        results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
})

const choice = parsers => new Parser(parserState => {
    if (parserState.isError) {
        return parserState;
    }

    for (let p of parsers) {
        const nextState = p.parserStateTransformerFn(parserState);
        if (!nextState.isError) {
            return nextState;
        }
    }

    return updateParserError(
        parserState,
        `choice: Unable to match with any parser at index ${parserState.index}`
    );
});

const many = parser => new Parser(parserState => {
    if (parserState.isError) {
        return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
        let testState = parser.parserStateTransformerFn(nextState);

        if (!testState.isError) {
            results.push(testState.result);
            nextState = testState;
        } else {
            done = true;
        }
    }

    return updateParserResult(nextState, results);
});

const many1 = parser => new Parser(parserState => {
    if (parserState.isError) {
        return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
        const nextState = parser.parserStateTransformerFn(nextState);
        if (!nextState.isError) {
            results.push(nextState.result);
        } else {
            done = true;
        }
    }

    if (results.length === 0) {
        return updateParserError(
            parserState,
            `many1: Unable to match any input using parser @ index ${parserState.index}`
        );
    }

    return updateParserResult(nextState, results);
});

const between = (leftparser, rightParser) => contentParser => sequenceOf([
    leftParser,
    contentParser,
    rightParser
]).map(result => results[1]);

const betweenBrackets = between(str('('), str(')');

const parser = betweenBrackets(letters);

const stringParser = letters.map(result => ({
    type: 'string',
    value: result
}));

const numberParser = digits.map(result => ({
    type: 'string',
    value: result
}));

const stringResult = { type: 'string', value: 'hello'};
const numberResult = { type: 'number', value: 42 };
const dicerollResults = { type: 'diceroll', value: [2, 8]};

console.log(
    parser.run('1d2')
)

    