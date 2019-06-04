let app = require("./config/server");

let porta = process.env.PORT || 9000;

app.listen(porta, () => {

	console.log("|----------------------------------------------------------|");
	console.log(" ");
	console.log(`|             SNMap rodando na porta ${porta}                  |`);
	console.log(" ");
	console.log("|----------------------------------------------------------|");
});
