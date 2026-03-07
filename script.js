function calcular() {

    let dados = {

        golCasa: Number(document.getElementById("golCasa").value),
        golVisitante: Number(document.getElementById("golFora").value),

        minuto: Number(document.getElementById("minuto").value),

        lambdaCasa: Number(document.getElementById("lambdaCasa").value),
        lambdaVisitante: Number(document.getElementById("lambdaFora").value),

        ataquesCasa: Number(document.getElementById("ataqueCasa").value),
        ataquesVisitante: Number(document.getElementById("ataqueFora").value),

        finalCasa: Number(document.getElementById("chuteCasa").value),
        finalVisitante: Number(document.getElementById("chuteFora").value),

        escanteios: Number(document.getElementById("escanteios").value)

    }

    let r = analisarJogo(dados)

    document.getElementById("probCasa").innerText = "Casa: " + r.probabilidades.casa
    document.getElementById("probEmpate").innerText = "Empate: " + r.probabilidades.empate
    document.getElementById("probFora").innerText = "Visitante: " + r.probabilidades.visitante

    document.getElementById("favorito").innerText = "🔥 Favorito ao vivo: " + r.favorito

    document.getElementById("pressao").innerText = r.indicePressao

    document.getElementById("probGol").innerHTML =
        r.probGol + "<br>" +
        "⏱ Gol próximos 5 min: " + r.probGol5Min + "<br><br>" +
        "🚨 Alerta Gol: " + r.alertaGol + "<br>" +
        "⚽ Over 1.5: " + r.over15 + "<br>" +
        "⚽ Over 2.5: " + r.over25 + "<br>" +
        "⚽ Próximo Gol: " + r.proximoGol + "<br>" +
        "💰 Sinal Trader: " + r.sinal

    let placarTexto = ""

    r.placaresProvaveis.forEach(p => {

        placarTexto += p.placar + " → " + p.prob.toFixed(1) + "% <br>"

    })

    document.getElementById("placares").innerHTML = placarTexto

}



function analisarJogo(dados) {

    let golCasa = dados.golCasa
    let golVisitante = dados.golVisitante

    let lambdaCasa = dados.lambdaCasa
    let lambdaVisitante = dados.lambdaVisitante

    let ataquesCasa = dados.ataquesCasa
    let ataquesVisitante = dados.ataquesVisitante

    let finalCasa = dados.finalCasa
    let finalVisitante = dados.finalVisitante

    let escanteios = dados.escanteios

    let minuto = dados.minuto


    // TEMPO RESTANTE

    let tempoRestante = Math.max(1, 90 - minuto)

    let lambdaCasaAjustado = lambdaCasa * (tempoRestante / 90)
    let lambdaVisitanteAjustado = lambdaVisitante * (tempoRestante / 90)

    let lambdaTotal = lambdaCasaAjustado + lambdaVisitanteAjustado


    // PRESSÃO

    let pressaoCasa =
        (ataquesCasa / 10) +
        (finalCasa / 3) +
        (escanteios / 6)

    let pressaoVisitante =
        (ataquesVisitante / 10) +
        (finalVisitante / 3)

    let indicePressao = pressaoCasa / (pressaoVisitante + 0.01)


    // MOMENTUM

    let momentum = pressaoCasa - pressaoVisitante


    // FUNÇÕES POISSON

    function poisson(lambda, k) {

        return (Math.pow(lambda, k) * Math.exp(-lambda)) / fatorial(k)

    }

    function fatorial(n) {

        if (n == 0) return 1
        return n * fatorial(n - 1)

    }


    // PROBABILIDADE RESULTADO

    let probCasa = 0
    let probEmpate = 0
    let probVisitante = 0

    for (let casa = 0; casa <= 5; casa++) {

        for (let visitante = 0; visitante <= 5; visitante++) {

            let prob =
                poisson(lambdaCasaAjustado, casa) *
                poisson(lambdaVisitanteAjustado, visitante)

            let finalCasaPlacar = golCasa + casa
            let finalVisitantePlacar = golVisitante + visitante

            if (finalCasaPlacar > finalVisitantePlacar) probCasa += prob
            else if (finalCasaPlacar == finalVisitantePlacar) probEmpate += prob
            else probVisitante += prob

        }

    }

    probCasa *= 100
    probEmpate *= 100
    probVisitante *= 100


    // FAVORITO

    let favorito = "Empate"

    if (probCasa > probVisitante && probCasa > probEmpate) favorito = "Casa"
    if (probVisitante > probCasa && probVisitante > probEmpate) favorito = "Visitante"


    // PROBABILIDADE DE GOL

    let ataquesTotal = ataquesCasa + ataquesVisitante
    let finalTotal = finalCasa + finalVisitante

    let fatorPressao =
        (ataquesTotal / 20) +
        (finalTotal / 10) +
        (escanteios / 12)

    let probGol = 1 - Math.exp(-(lambdaTotal * fatorPressao))

    probGol = probGol * 100


    // GOL NOS PRÓXIMOS 5 MIN

    let taxaPorMinuto = lambdaTotal / tempoRestante

    let probGol5Min = 1 - Math.exp(-(taxaPorMinuto * 5))

    let fatorMomento = 1 + (Math.abs(momentum) * 0.15)

    probGol5Min = probGol5Min * fatorMomento

    if (probGol5Min > 1) probGol5Min = 1

    probGol5Min = probGol5Min * 100


    // ALERTA GOL

    let alertaGol = "BAIXO"

    if (probGol > 60) alertaGol = "MÉDIO"
    if (probGol > 75 || Math.abs(momentum) > 1.2) alertaGol = "ALTO"
    if (probGol > 85 || Math.abs(momentum) > 2) alertaGol = "GOL IMINENTE"


    // OVER

    let over15 = "Baixo"
    let over25 = "Baixo"

    if (lambdaTotal > 0.9) over15 = "Bom"
    if (lambdaTotal > 1.4) over15 = "Muito forte"

    if (lambdaTotal > 1.8) over25 = "Bom"
    if (lambdaTotal > 2.2) over25 = "Muito forte"


    // PRÓXIMO GOL

    let forcaCasa = lambdaCasaAjustado + (pressaoCasa * 0.15)
    let forcaVisitante = lambdaVisitanteAjustado + (pressaoVisitante * 0.15)

    let proximoGol = "Equilibrado"

    if (momentum > 1) proximoGol = "Casa"
    else if (momentum < -1) proximoGol = "Visitante"
    else {

        if (forcaCasa > forcaVisitante) proximoGol = "Casa"
        if (forcaVisitante > forcaCasa) proximoGol = "Visitante"

    }


    // SINAL TRADER

    let sinal = "WAIT"

    if (probGol > 80 && minuto > 20) sinal = "BUY GOAL"

    if (indicePressao > 2 || Math.abs(momentum) > 2) sinal = "PRESSÃO FORTE"

    if (probGol > 85 && minuto > 70) sinal = "LAY UNDER"


    // PLACARES PROVÁVEIS

    let placares = []

    for (let casa = 0; casa <= 3; casa++) {

        for (let visitante = 0; visitante <= 3; visitante++) {

            let prob =
                poisson(lambdaCasaAjustado, casa) *
                poisson(lambdaVisitanteAjustado, visitante)

            placares.push({

                placar: (golCasa + casa) + "-" + (golVisitante + visitante),
                prob: prob * 100

            })

        }

    }

    placares.sort((a, b) => b.prob - a.prob)

    let topPlacares = placares.slice(0, 4)


    return {

        indicePressao: indicePressao.toFixed(2),

        probabilidades: {

            casa: probCasa.toFixed(1) + "%",
            empate: probEmpate.toFixed(1) + "%",
            visitante: probVisitante.toFixed(1) + "%"

        },

        favorito: favorito,

        probGol: probGol.toFixed(1) + "%",

        probGol5Min: probGol5Min.toFixed(1) + "%",

        alertaGol: alertaGol,

        over15: over15,

        over25: over25,

        proximoGol: proximoGol,

        sinal: sinal,

        placaresProvaveis: topPlacares

    }

}