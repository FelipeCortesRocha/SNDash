const TC = require('../controllers/TwitterController')

module.exports = (app) => {

    app.get("/", (req, res) => {
        res.render("index", { pageTitle: "SNDash" })
    })

    app.post("/search", (req, res) => {
        TC.search(req, res)
    })
}