const { resolve } = require('path');
const { app, Menu, Tray, BrowserWindow } = require('electron');
const dns = require('dns');
const axios = require('axios');


const { exec } = require('child_process');
const Store = require('electron-store')

const schema = {
    pontos: {
        type: 'array'
    },
    passwords: {
        type: 'array'
    },
}

const store = new Store({ schema });


function appStart() {
    const window = new BrowserWindow({
        width: 1024,
        height: 800,
        webPreferences: {
            contextIsolation: false, // desativar a isolamento de contexto
            nodeIntegration: true, // permitir integração com Node.js
        }
    })
    window.loadFile('index.html');
}


function verificarConexaoInternet() {
    dns.resolve('www.google.com', function (err) {
        if (err) {
            console.log("Sem conexão com a Internet");
        } else {
            console.log("Conectado à Internet");
            getPasswords();
        }
    });
}

async function getPasswords() {
    try {
        const response = await axios.get('https://timetech-api.onrender.com/usuario/passwords');
        const passwordsApi = response.data.map(obj => obj.password); // Extrair senhas da resposta da API

        const passwordsLocal = store.get('passwords', []);

        // Encontrar novas senhas que não estão no banco local
        const novasPasswords = passwordsApi.filter(password => 
            password && !passwordsLocal.includes(password)
        );

        if (novasPasswords.length > 0) {
            // Atualizar o banco local com as novas senhas
            store.set('passwords', [...passwordsLocal, ...novasPasswords]);
            console.log("Senhas atualizadas no banco local.");
        } else {
            console.log("Nenhuma senha nova para adicionar.");
        }
    } catch (error) {
        console.error("Erro ao sincronizar com a API:", error);
    }
}


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
            console.error('Erro na sincronização:', error);
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
}

app.whenReady().then(() => {

    verificarConexaoInternet();
    sincronizarPontos();
    appStart();

});


module.exports = { sincronizarPontos, removerPontosSincronizados };

// app.on('ready' , () => {
//     const tray = new Tray(resolve(__dirname, 'assets', 'testeicon.png'))
// });



console.log("electron is running")