const n4j = require('./Neo4jController');

const stopWordsPT = "a, agora, ainda, alguem, algum, alguma, algumas, alguns, ampla, amplas, amplo, amplos, ante, antes, ao, aos, após, aquela, aquelas, aquele, aqueles, aquilo, as, ate, atraves, cada, coisa, coisas, com, como, contra, contudo, da, daquele, daqueles, das, de, dela, delas, dele, deles, depois, dessa, dessas, desse, desses, desta, destas, deste, deste, destes, deve, devem, devendo, dever, deverá, deverão, deveria, deveriam, devia, deviam, disse, disso, disto, dito, diz, dizem, do, dos, e, ela, elas, ele, eles, em, enquanto, entre, era, essa, essas, esse, esses, esta, está, estamos, estão, estas, estava, estavam, estávamos, este, estes, estou, eu, fazendo, fazer, feita, feitas, feito, feitos, foi, for, foram, fosse, fossem, grande, grandes, há, isso, isto, já, la, lá, lhe, lhes, lo, mas, me, mesma, mesmas, mesmo, mesmos, meu, meus, minha, minhas, muita, muitas, muito, muitos, na, nas, nem, nessa, nessas, nesta, nestas, ninguem, no, nos, nós, nossa, nossas, nosso, nossos, num, numa, nunca, o, os, ou, outra, outras, outro, outros, para, pela, pelas, pelo, pelos, pequena, pequenas, pequeno, pequenos, per, perante, pode, pude, podendo, poder, poderia, poderiam, podia, podiam, pois, por, porem, porque, posso, pouca, poucas, pouco, poucos, primeiro, primeiros, própria, próprias, próprio, próprios, quais, qual, quando, quanto, quantos, que, quem, são, se, seja, sejam, sem, sempre, sendo, será, serão, seu, seus, si, sido, só, sob, sobre, sua, suas, talvez, tambem, tampouco, te, tem, tendo, tenha, ter, teu, teus, ti, tido, tinha, tinham, toda, todas, todavia, todo, todos, tu, tua, tuas, tudo, última, últimas, último, últimos, um, uma, umas, uns, vendo, ver, vez, vindo, vir, vos, vós";
const stopWordsEN = "able, about, across, after, all, almost, also, am, among, an, and, any, are, as, at, be, because, been, but, by, can, cannot, could, dear, did, do, does, either, else, ever, every, for, from, get, got, had, has, have, he, her, hers, him, his, how, however, i, if, in, into, is, it, its, just, least, let, may, me, might, most, must, my, neither,of, off, often, on, only, or, other, our, own, rather, said, say, says, she, should, since, so, some, than, that, the, their, them, then, there, these, they, this, tis, to, too, twas, us, wants, was, we, were, what, when, where, which, while, who, whom, why, will, with, would, yet, you, your";
const negationWords = [' nao ', ' n ', ' nop ', ' not ', ' nada ', ' non '];
let positiveWords = [];
let negativeWords = [];
let str;

const convertDate = inputFormat => {
    const pad = (s) => (s < 10) ? '0' + s : s;
    let d = new Date(inputFormat);
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join('/');
};

const formatTweet = tweet => {
    let date = new Date(tweet.created_at);
    return {
        created_at: `${convertDate(date)} - ${date.toLocaleTimeString('pt-BR')}`,
        text: tweet.full_text,
        url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`
    };
};

const getUnique = (arr, comp) => {
    return unique = arr
        .map(e => e[comp])
        .map((e, i, final) => final.indexOf(e) === i && i)
        .filter(e => arr[e]).map(e => arr[e]);
};

const removerAcentos = newStringComAcento => {
    let string = newStringComAcento;
    let mapaAcentosHex = {
        a: /[\xE0-\xE6]/g,
        e: /[\xE8-\xEB]/g,
        i: /[\xEC-\xEF]/g,
        o: /[\xF2-\xF6]/g,
        u: /[\xF9-\xFC]/g,
        c: /\xE7/g,
        n: /\xF1/g
    };

    for (let letra in mapaAcentosHex) {
        let expressaoRegular = mapaAcentosHex[letra];
        string = string.replace(expressaoRegular, letra);
    }

    return string;
};

const removeStopWords = str => {
    let x,
    y,
    word,
    stop_word,
    regex_str,
    regex,
    cleansed_string = str,
    stop_words = [...stopWordsPT.split(',')].concat([...stopWordsEN.split(',')])
    stop_words = stop_words.map(word => word.trim())

    // Split out all the individual words in the phrase
    words = cleansed_string.match(/[^\s]+|\s+[^\s+]$/g)

    // Review all the words
    for (x = 0; x < words.length; x++) {
        // For each word, check all the stop words
        for (y = 0; y < stop_words.length; y++) {
            // Get the current word
            word = words[x].replace(/\s+|[^a-z]+/ig, "") // Trim the word and remove non-alpha

            // Get the stop word
            stop_word = stop_words[y]

            // If the word matches the stop word, remove it from the keywords
            if (word.toLowerCase() == stop_word) {
                // Build the regex
                regex_str = "^\\s*" + stop_word + "\\s*$" // Only word
                regex_str += "|^\\s*" + stop_word + "\\s+" // First word
                regex_str += "|\\s+" + stop_word + "\\s*$" // Last word
                regex_str += "|\\s+" + stop_word + "\\s+" // Word somewhere in the middle
                regex = new RegExp(regex_str, "ig")

                // Remove the word from the keywords
                cleansed_string = cleansed_string.replace(regex, " ")
            }
        }
    }
    return cleansed_string.replace(/^\s+|\s+$/g, "");
};

const checkWord = word => {
    let haveWord = false;
    let wordWithNegation = false;

    if (!Array.isArray(word.portuguese)) word.portuguese = [word.portuguese];
    if (!Array.isArray(word.english)) word.english = [word.english];
    if (!Array.isArray(word.spanish)) word.spanish = [word.spanish];

    const check = w => {
        const indexOf = str.indexOf(w);
        if (indexOf != -1) {
            haveWord = w;
            let subStr = str.substr(indexOf-6, 6);
            for (const negWord of negationWords) {
                if(subStr.indexOf(negWord) !== -1) wordWithNegation = true;
            };
        }
    };

    word.portuguese.forEach(check);
    word.english.forEach(check);
    word.spanish.forEach(check);
    
    if (haveWord && !wordWithNegation) return haveWord
    return false;
};

const checkSentiment = tweetString => {

    str = tweetString.toLowerCase();
    str = removerAcentos(str);
    str = removeStopWords(str);

    let positives = positiveWords.filter(word => checkWord(word));
    let negatives = negativeWords.filter(word => checkWord(word));

    let totalWordsFound = positives.length + negatives.length;

    return {
        totalWordsFound,
        positiveRate: ((positives.length / totalWordsFound) * 100) || 0,
        negativeRate: ((negatives.length / totalWordsFound) * 100) || 0
    };
};

const checkTweets = tweets => {
    return new Promise(async(resolve) => {
        positiveWords = await n4j.getWords();
        negativeWords = await n4j.getWords(true);

        // Ordena pela data dos tweets
        tweets.sort((a, b) => {
            let aDate = new Date(a.created_at);
            let bDate = new Date(b.created_at);
            if (aDate < bDate) return -1;
            if (aDate > bDate) return 1;
            return 0;
        });

        const addTimeline = (analise, tweet, type) => {
            let data = new Date(tweet.created_at);
            if (!analise.timeline.labels.includes(convertDate(data))) {
                analise.timeline.labels.push(convertDate(data));
                analise.timeline.neutrals[analise.timeline.labels.length - 1] = 0;
                analise.timeline.positives[analise.timeline.labels.length - 1] = 0;
                analise.timeline.negatives[analise.timeline.labels.length - 1] = 0;
            }
            analise.timeline[type][analise.timeline.labels.length - 1]++;
        };

        const checkLocation = (analise, tweet, type) => {
            if (tweet.geo) {
                if (tweet.place.place_type == 'city') {

                    let existe = false;
                    let indice = -1;
                    for (let i = 0; i < analise.locations.length; i++) {
                        if (analise.locations[i].full_name == tweet.place.full_name) {
                            existe = true;
                            indice = i;
                            break;
                        }
                    }

                    if (!existe) {
                        analise.locations.push({
                            full_name: tweet.place.full_name,
                            coordinates: tweet.geo.coordinates,
                            positives: 0,
                            negatives: 0,
                            neutrals: 0
                        })
                        indice = analise.locations.length - 1;
                    }

                    analise.locations[indice][type]++;

                }
            }
            return false;
        };

        // Reduce para gerar o objeto da análise
        let result = tweets.reduce((analise, tweet) => {

            // Busca matchs de palavras chave
            let sentiment = checkSentiment(tweet.full_text);

            // Verifica se não encontrou, ou se a quantidade de palavras negativas e positivas é igual
            if (sentiment.totalWordsFound == 0 || sentiment.negativeRate == sentiment.positiveRate) {
                // Adiciona ao contador de neutros
                analise.neutralTweets++;
                // Adiciona a linha do tempo positiva do dia da publicação
                checkLocation(analise, tweet, 'neutrals');
                // Adiciona a linha do tempo neutra do dia da publicação
                addTimeline(analise, tweet, 'neutrals');
            }

            // Verifica se encontrou mais positivas do que negativas
            if (sentiment.positiveRate > sentiment.negativeRate) {
                // Adiciona ao contador de positivos
                analise.positiveTweets++;
                // Verifica se a publicação tem localização
                checkLocation(analise, tweet, 'positives');
                // Adiciona a linha do tempo positiva do dia da publicação
                addTimeline(analise, tweet, 'positives');
                // Coloca essa publicação como ultima positiva encontrada
                analise.lastPositive = formatTweet(tweet);
            }

            // Verifica se encontrou mais negativa do que positivas
            if (sentiment.negativeRate > sentiment.positiveRate) {
                // Adiciona ao contador de negativos
                analise.negativeTweets++;
                // Verifica se a publicação tem localização
                checkLocation(analise, tweet, 'negatives');
                // Adiciona a linha do tempo negativa do dia da publicação
                addTimeline(analise, tweet, 'negatives');
                // Coloca essa publicação como ultima negativa encontrada
                analise.lastNegative = formatTweet(tweet);
            }

            analise.totalTweets++;
            return analise;
        }, {
            timeline: {
                labels: [],
                positives: [],
                negatives: [],
                neutrals: []
            },
            locations: [],
            lastPositive: {},
            lastNegative: {},
            totalTweets: 0,
            positiveTweets: 0,
            neutralTweets: 0,
            negativeTweets: 0
        });
        resolve(result);
    });
}

module.exports.getUnique = getUnique;
module.exports.removeStopWords = removeStopWords;
module.exports.checkTweets = checkTweets;