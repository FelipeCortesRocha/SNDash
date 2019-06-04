const helpers = require('./Helpers')
const Twit = require('twit')

const conf = {
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret
}

const T = new Twit(conf)

const search = (req, res) => {
    let busca = req.body.busca
    if (Array.isArray(busca)) {
        if (busca[busca.length - 1] == '') busca.splice(-1, 1)
        let count = 0
        let tweets = []
        for (let i = 0; i < busca.length; i++) {
            T.get('search/tweets', { q: busca[i], tweet_mode: 'extended', count: 99, result_type: 'recent' })
                .then(response => {
                    response.data.statuses.forEach(tweet => {
                        tweets.push(tweet)
                    });

                    count++
                    if (count == busca.length) {
                        tweets = helpers.getUnique(tweets, 'id')
                        helpers.checkTweets(tweets).then(result => {
                            console.log(result)
                            res.send(result)
                        }).catch(err => {
                            res.status(err.code).send(err)
                        })
                    }
                }).catch(err => {
                    console.log(err)
                })
        }
    } else {
        res.status(400).send({
            code: 401,
            message: "Parâmetro de busca inválido"
        })
    }
}

// Fica recebendo todos os tweets
// let stream = T.stream('statuses/sample')
// stream.on('tweet', tweet => {
//     console.log(JSON.stringify(tweet))
//     console.log('--------------------------------------------')
// })

module.exports.search = search;