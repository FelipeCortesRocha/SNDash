const neo4j = require('neo4j-driver').v1
const driver = neo4j.driver(process.env.neo4jURL, neo4j.auth.basic(process.env.neo4jAuthName, process.env.neo4jAuthPass))

const session = driver.session()

const run = (query) => {
    return new Promise(async(resolve, reject) => {
        session
            .run(query)
            .then(result => {
                resolve(result.records)
                session.close()
            })
            .catch(error => {
                console.log(error)
            });
    })
}

const getWords = (negative) => {
    return new Promise(async(resolve, reject) => {
        let query
        if (!negative) query = await run("MATCH (PositiveBegin:PositiveWord{portuguese : 'PositiveBegin'})-[*]-(connected) RETURN connected")
        else query = await run("MATCH (NegativeBegin:NegativeWord{portuguese : 'NegativeBegin'})-[*]-(connected) RETURN connected")
        resolve(query.map(elem => {
            return elem._fields[0].properties
        }))
    })
}

module.exports.getWords = getWords