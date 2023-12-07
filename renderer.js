const Store = require('electron-store');
const store = new Store();
const dadosSalvos = store.get('pontos');
const passwords = store.get('passwords');
const dns = require('dns');




document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('testParagraph').textContent = "Timetech funcionando!";

    //lógica pra registra o ponto
    document.getElementById('saveButton').addEventListener('click', () => {
        const inputData = document.getElementById('inputData').value;
        const passwordsLocal = store.get('passwords', []);

        // Verificar se a senha existe
        if (passwordsLocal.includes(inputData)) {
            const ponto = {
                password: inputData,
                timestamp: new Date().toLocaleString() // Data e hora no formato local
            };

            // Registrar o ponto
            store.set('pontos', [...store.get('pontos', []), ponto]);
            alert('Ponto registrado com sucesso');
            atualizarContadorNaoSincronizados();
            document.getElementById('inputData').value = '';
            console.log("Ponto registrado:", ponto);
        } else {
            alert('Senha não encontrada!');
            console.log("Senha não encontrada.");
        }
    });


 


    // Função para exibir a hora atual sem segundos
    function atualizarHora() {
        const elementoHora = document.getElementById('horaAtual');
        const opcoes = { hour: '2-digit', minute: '2-digit' };
        elementoHora.textContent = new Date().toLocaleTimeString([], opcoes);
    }


    // Atualizar a hora imediatamente ao carregar a página
    atualizarHora();


    // Atualizar a hora a cada 15s
    setInterval(atualizarHora, 15000);



    //Função de sincronizar ponto //
    function sincronizarPontos() {
        const pontos = store.get('pontos', []);

        let promessas = pontos.map((ponto, index) => {
            return fetch('https://timetech-api.onrender.com/registro', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ponto),
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Ponto sincronizado:', data);
                    return index; // Retorna o índice do ponto sincronizado
                })
                .catch(error => {
                    console.log('Erro na sincronização:', error);
                    return null; // Retorna null para indicar falha na sincronização
                });
        });

        Promise.all(promessas).then(indicesSincronizados => {
            removerPontosSincronizados(indicesSincronizados.filter(index => index !== null));
        });

    }


    function removerPontosSincronizados(indices) {
        let pontos = store.get('pontos', []);
        // Remove os pontos de trás para frente para evitar problemas com a mudança de índices
        for (let i = indices.length - 1; i >= 0; i--) {
            pontos.splice(indices[i], 1);
        }
        store.set('pontos', pontos);
        atualizarContadorNaoSincronizados();
    }


    document.getElementById('syncButton').addEventListener('click', () => {
        sincronizarPontos();
        atualizarContadorNaoSincronizados();
    });


    //Contador de dados não-sincronizados//
    function atualizarContadorNaoSincronizados() {
        const pontos = store.get('pontos', []);
        const contadorElemento = document.getElementById('contadorNaoSincronizados');
        contadorElemento.textContent = `Pontos não sincronizados: ${pontos.length}`;
    }


    atualizarContadorNaoSincronizados();


// Função para verificar a conexão com a Internet e atualizar o estado do botão
function verificarConexaoInternet() {
    dns.resolve('www.google.com', function (err) {
        const botaoSincronizar = document.getElementById('syncButton');
        if (err) {
            console.log("Sem conexão com a Internet");
            botaoSincronizar.disabled = true;
        } else {
            console.log("Conectado à Internet");
            botaoSincronizar.disabled = false;
        }
    });
}


// Chama a função imediatamente para verificar o estado inicial da conexão
verificarConexaoInternet();


// Configura um intervalo para verificar a conexão a cada 5 minutos
setInterval(verificarConexaoInternet, 300000); // 300000 ms = 5 minutos


});

