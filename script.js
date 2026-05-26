// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCmTzre-Jh86Xh3KkH09DqxXs2J9nDZxFE",
    authDomain: "boaopcaosistema.firebaseapp.com",
    projectId: "boaopcaosistema",
    storageBucket: "boaopcaosistema.firebasestorage.app",
    messagingSenderId: "268788730410",
    appId: "1:268788730410:web:c8eb5828342f1a5d655153"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variáveis globais
let imgbbApiKey = '';
let organizacaoAtiva = false;
let nomeOrganizacao = '';
let subNomeOrganizacao = '';

// Verificar status da organização ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    await verificarOrganizacao();
    await carregarImgBBApiKey();
    setupEventListeners();
});

// Função para verificar se a organização está ativa
async function verificarOrganizacao() {
    try {
        const orgDoc = await db.collection('config').doc('org').get();
        
        if (orgDoc.exists) {
            const orgData = orgDoc.data();
            organizacaoAtiva = orgData.org_atv === true;
            nomeOrganizacao = orgData.nome_org || 'BOA OPÇÃO';
            subNomeOrganizacao = orgData.sub_nome_org || 'SOLUÇÕES DE CRÉDITO';
            
            // Atualizar interface
            document.getElementById('orgName').textContent = nomeOrganizacao;
            document.getElementById('orgSubName').textContent = subNomeOrganizacao;
            
            if (!organizacaoAtiva) {
                mostrarStatus('Organização inativa! Entre em contato com o administrador.', 'danger');
                desabilitarFormulario();
            } else {
                mostrarStatus('Sistema ativo - Organização verificada com sucesso!', 'success');
                habilitarFormulario();
            }
        } else {
            mostrarStatus('Configuração da organização não encontrada!', 'warning');
            desabilitarFormulario();
        }
    } catch (error) {
        console.error('Erro ao verificar organização:', error);
        mostrarStatus('Erro ao verificar status da organização.', 'danger');
        desabilitarFormulario();
    }
}

// Carregar API Key do ImgBB
async function carregarImgBBApiKey() {
    try {
        const apiKeyDoc = await db.collection('config').doc('api_key').get();
        
        if (apiKeyDoc.exists) {
            imgbbApiKey = apiKeyDoc.data().imgbb_api_key;
            console.log('API Key do ImgBB carregada com sucesso');
        } else {
            console.error('API Key do ImgBB não encontrada');
            mostrarStatus('Configuração de upload de imagens não encontrada.', 'warning');
        }
    } catch (error) {
        console.error('Erro ao carregar API Key:', error);
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Preview de imagens
    document.getElementById('fichaCliente').addEventListener('change', function(e) {
        previewImagem(e.target, 'previewFicha');
    });
    
    document.getElementById('documentoCliente').addEventListener('change', function(e) {
        previewImagem(e.target, 'previewDocumento');
    });
    
    // Máscara de CPF
    document.getElementById('cpf').addEventListener('input', function(e) {
        mascaraCPF(e.target);
    });
    
    // Máscara de telefone
    document.getElementById('numero').addEventListener('input', function(e) {
        mascaraTelefone(e.target);
    });
    
    // Submit do formulário
    document.getElementById('formEmprestimo').addEventListener('submit', async function(e) {
        e.preventDefault();
        await salvarEmprestimo();
    });
}

// Preview de imagem
function previewImagem(input, previewId) {
    const preview = document.getElementById(previewId);
    const container = document.getElementById('previewContainer');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.src = e.target.result;
            container.style.display = 'flex';
        }
        
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.src = '';
        container.style.display = 'none';
    }
}

// Upload de imagem para o ImgBB
async function uploadImagemParaImgBB(file) {
    if (!imgbbApiKey) {
        throw new Error('API Key do ImgBB não configurada');
    }
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', imgbbApiKey);
    
    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Falha no upload da imagem');
        }
        
        const data = await response.json();
        return data.data.url;
    } catch (error) {
        console.error('Erro ao fazer upload para ImgBB:', error);
        throw error;
    }
}

// Salvar empréstimo
async function salvarEmprestimo() {
    if (!organizacaoAtiva) {
        mostrarStatus('Organização inativa. Não é possível realizar cadastros.', 'danger');
        return;
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
    
    try {
        // Coletar dados do formulário
        const dadosEmprestimo = {
            nome: document.getElementById('nome').value,
            cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
            numero: document.getElementById('numero').value.replace(/\D/g, ''),
            pix: document.getElementById('pix').value,
            banco: document.getElementById('banco').value,
            valorCartao: parseFloat(document.getElementById('valorCartao').value),
            parcelas: parseInt(document.getElementById('parcelas').value),
            valorEmprestado: parseFloat(document.getElementById('valorEmprestado').value),
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'ativo'
        };
        
        // Upload das imagens
        const fichaClienteFile = document.getElementById('fichaCliente').files[0];
        const documentoClienteFile = document.getElementById('documentoCliente').files[0];
        
        if (fichaClienteFile) {
            mostrarStatus('Fazendo upload da ficha do cliente...', 'info');
            dadosEmprestimo.fichaClienteUrl = await uploadImagemParaImgBB(fichaClienteFile);
        }
        
        if (documentoClienteFile) {
            mostrarStatus('Fazendo upload do documento do cliente...', 'info');
            dadosEmprestimo.documentoClienteUrl = await uploadImagemParaImgBB(documentoClienteFile);
        }
        
        // Salvar no Firestore
        const docRef = await db.collection('emprestimos').add(dadosEmprestimo);
        
        mostrarStatus(`Empréstimo cadastrado com sucesso! ID: ${docRef.id}`, 'success');
        limparFormulario();
        
    } catch (error) {
        console.error('Erro ao salvar empréstimo:', error);
        mostrarStatus('Erro ao cadastrar empréstimo: ' + error.message, 'danger');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-check-circle"></i> Cadastrar Empréstimo';
    }
}

// Buscar empréstimos
async function buscarEmprestimos() {
    const cpf = document.getElementById('searchCPF').value.replace(/\D/g, '');
    
    if (!cpf) {
        mostrarStatus('Por favor, informe um CPF para busca.', 'warning');
        return;
    }
    
    const resultadosDiv = document.getElementById('resultadosConsulta');
    resultadosDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary"></div></div>';
    
    try {
        const snapshot = await db.collection('emprestimos')
            .where('cpf', '==', cpf)
            .orderBy('dataCadastro', 'desc')
            .get();
        
        if (snapshot.empty) {
            resultadosDiv.innerHTML = '<div class="alert alert-info">Nenhum empréstimo encontrado para este CPF.</div>';
            return;
        }
        
        let html = `
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Valor Cartão</th>
                        <th>Valor Emprestado</th>
                        <th>Parcelas</th>
                        <th>Data</th>
                        <th>Documentos</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            html += `
                <tr>
                    <td>${dados.nome}</td>
                    <td>R$ ${dados.valorCartao.toFixed(2)}</td>
                    <td>R$ ${dados.valorEmprestado.toFixed(2)}</td>
                    <td>${dados.parcelas}x</td>
                    <td>${dados.dataCadastro ? new Date(dados.dataCadastro.toDate()).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        ${dados.fichaClienteUrl ? `<a href="${dados.fichaClienteUrl}" target="_blank" class="btn btn-sm btn-outline-primary">Ficha</a>` : ''}
                        ${dados.documentoClienteUrl ? `<a href="${dados.documentoClienteUrl}" target="_blank" class="btn btn-sm btn-outline-info">Documento</a>` : ''}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        resultadosDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        resultadosDiv.innerHTML = '<div class="alert alert-danger">Erro ao buscar empréstimos.</div>';
    }
}

// Máscaras
function mascaraCPF(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    input.value = value;
}

function mascaraTelefone(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    input.value = value;
}

// Funções de interface
function mostrarStatus(mensagem, tipo) {
    const statusDiv = document.getElementById('statusOrg');
    const statusMessage = document.getElementById('statusMessage');
    
    statusDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    statusMessage.textContent = mensagem;
    statusDiv.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function desabilitarFormulario() {
    const form = document.getElementById('formEmprestimo');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

function habilitarFormulario() {
    const form = document.getElementById('formEmprestimo');
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
}

function limparFormulario() {
    document.getElementById('formEmprestimo').reset();
    document.getElementById('previewFicha').src = '';
    document.getElementById('previewDocumento').src = '';
    document.getElementById('previewContainer').style.display = 'none';
}