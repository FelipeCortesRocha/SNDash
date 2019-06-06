let $ = document.querySelector.bind(document);
let pieChart, lineChart;
let markers = [];

// Inicialização do mapa
let map = L.map('map', {
    minZoom: 1,
    maxZoom: 10,
    preferCanvas: true
}).setView([41.0122, 28.976], 1)

// Copyright obrigatório do mapa
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

let layerGroup = L.layerGroup().addTo(map);


// Executado quando os elementos do DOM forem carregados
document.addEventListener("DOMContentLoaded", () => {

    // Cria animações do Lottie
    let initialAnimation = bodymovin.loadAnimation({
        container: document.querySelector('#openLottie'),
        path: './js/search.json',
        renderer: 'svg/canvas/html',
        loop: true,
        autoplay: true
    });

    // Cria animação do Lottie
    let loadingAnimation = bodymovin.loadAnimation({
        container: document.querySelector('#loading'),
        path: './js/loading.json',
        renderer: 'svg/canvas/html',
        loop: true,
        autoplay: true
    });

    // Exibe o loading
    showLoading = () => {
        $("#initialLottie").classList.add("hide");
        $("#loadingLottie").classList.remove("hide");
        $('#container').classList.add('hide');
    };

    // Oculta o loading
    hideLoading = () => {
        $("#loadingLottie").classList.add("hide");
        $("#container").classList.remove("hide");
    };

    setTimeout(() => {
        $('#container').classList.add('hide');
    })

    const createLineChart = timeline => {
        try {
            lineChart.destroy();
        } catch (err) {
            console.log(err);
        }
        let ctx = document.querySelector('#lineChart');
        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeline.labels,
                datasets: [{
                        label: 'Positivos',
                        fill: false,
                        data: timeline.positives,
                        backgroundColor: 'rgb(95, 169, 222)',
                        borderColor: 'rgb(95, 169, 222)'
                    },
                    {
                        label: 'Negativos',
                        fill: false,
                        data: timeline.negatives,
                        backgroundColor: 'rgb(255, 125, 122)',
                        borderColor: 'rgb(255, 125, 122)'
                    },
                    {
                        label: 'Neutros',
                        fill: false,
                        data: timeline.neutrals,
                        backgroundColor: 'rgb(255, 255, 140)',
                        borderColor: 'rgb(255, 255, 140)'
                    }
                ]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Linha do tempo'
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    };

    const createPieChart = data => {
        try {
            pieChart.destroy();
        } catch (err) {
            console.log(err);
        }
        let ctx = document.querySelector('#pieChart');
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Negativos', 'Positivos', 'Neutros'],
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgb(255, 125, 122)',
                        'rgb(95, 169, 222)',
                        'rgb(255, 255, 140)'
                    ]
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Sentimento das postagens'
                },
            }
        });
    };

    const populateLocations = locations => {
        try {
            layerGroup.clearLayers();
        } catch (err) {
            console.log(err);
        }
        $('#txtNoLocation').classList.add("hide")
        $('#tableLocations').classList.remove("hide")
        if (locations.length > 0) {
            $('#tableBody').innerHTML =
                locations.reduce((html, location, index) => {

                    // Incluindo marcador
                    markers[index] = L.marker(location.coordinates).addTo(layerGroup)
                        .bindPopup(`
                            <p>${location.full_name}<br>
                            Neutros: ${location.neutrals}<br>
                            <strong>Positivos:</strong> ${location.positives}<br>
                            <strong>Negativos:</strong> ${location.negatives}<br>
                            </p> 
                        `);

                    return html += `
                    <tr onClick="markers[${index}].togglePopup()" class="location" style="cursor: pointer">
                        <td>${location.full_name}</td>
                        <td>${location.positives + location.negatives + location.neutrals}</td>
                    </tr>
                    `
                }, '');
            return false;
        }
        $('#tableLocations').classList.add("hide")
        $('#txtNoLocation').classList.remove("hide")
    };

    const populateScreen = data => {
        $("#divDataPositive").classList.add("hide");
        $("#divDataNegative").classList.add("hide");
        $('#txtPositive').textContent = '';
        $('#txtNegative').textContent = '';

        $("#container").classList.remove("hide");
        $('#totalResult').textContent = `Publicações analisadas: ${data.totalTweets}`;

        populateLocations(data.locations);

        createLineChart(data.timeline);
        createPieChart([data.negativeTweets, data.positiveTweets, data.neutralTweets]);

        if (data.lastPositive.text) {
            $("#divDataPositive").classList.remove("hide")
            $('#txtPositive').textContent = data.lastPositive.text;
            $('#txtPositiveData').textContent = data.lastPositive.created_at;
            $('#linkPositive').href = data.lastPositive.url;
        }

        if (data.lastNegative.text) {
            $("#divDataNegative").classList.remove("hide")
            $('#txtNegative').textContent = data.lastNegative.text;
            $('#txtNegativeData').textContent = data.lastNegative.created_at;
            $('#linkNegative').href = data.lastNegative.url;
        }

    };

    const executarBusca = () => {
        let busca = $('#txtBusca').value

        if (!busca) {
            swal.fire('É necessário preencher o campo de busca')
            return false
        }

        busca = busca.split(",")
        busca = busca.map(item => item.trim())

        // for (item of busca) {
        //     console.log(item)
        //     if (!item.startsWith('@') && !item.startsWith('#')) {
        //         swal.fire('A busca não está no formato correto.')
        //         return false
        //     }
        // }

        showLoading();
        $("#container").classList.add("hide");
        $("#txtBusca").value = '';
        $("#txtBusca").disabled = true;
        $('#btnBusca').disabled = true;
        fetch('/search', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ busca: busca })
            })
            .then(resp => resp.json())
            .then(data => {
                $("#txtBusca").disabled = false;
                $('#btnBusca').disabled = false;
                hideLoading();
                $('#searchTitle').textContent = `Busca: ${busca}`;
                populateScreen(data);
            })
            .catch(erro => {
                console.log(erro)
            });
    }

    $('#tableLocations').addEventListener('click', () => {
        window.scrollTo(0,document.body.scrollHeight);
    })

    $('#btnBusca').addEventListener('click', () => {
        executarBusca();
    });

    $("#txtBusca").addEventListener('keyup', e => {
        if (e.keyCode == 13) {
            executarBusca();
        }
    });

    // let elems = document.querySelectorAll('select')
    // M.FormSelect.init(elems)

});