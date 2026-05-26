// ============================================
// SISTEMA BOA OPÇÃO - JAVASCRIPT
// ============================================

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
let contratoAtualId = null;
let dataTable = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await verificarOrganizacao();
    await carregarImgBBApiKey();
    gerarNumeroContrato();
    setupEventListeners();
    inicializarDataTable();
});

// ========== FUNÇÕES DE VERIFICAÇÃO ==========
async function verificarOrganizacao() {
    try {
        const orgDoc = await db.collection('config').doc('org').get();
        
        if (orgDoc.exists) {
            const orgData = orgDoc.data();
            organizacaoAtiva = orgData.org_atv === true;
            
            document.getElementById('orgName').textContent = orgData.nome_org || 'BOA OPÇÃO';
            document.getElementById('orgSubName').textContent = orgData.sub_nome_org || 'SOLUÇÕES DE CRÉDITO';
            
            if (!organizacaoAtiva) {
                mostrarStatus('⚠️ Organização inativa! Contate o administrador.', 'danger');
                desabilitarFormulario();
            }
        }
    } catch (error) {
        console.error('Erro ao verificar organização:', error);
    }
}

async function carregarImgBBApiKey() {
    try {
        const apiKeyDoc = await db.collection('config').doc('api_key').get();
        if (apiKeyDoc.exists) {
            imgbbApiKey = apiKeyDoc.data().imgbb_api_key;
        }
    } catch (error) {
        console.error('Erro ao carregar API Key:', error);
    }
}

// ========== GERAR NÚMERO DO CONTRATO ==========
function gerarNumeroContrato() {
    const ano = new Date().getFullYear();
    const aleatorio = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    const numero = `CT-${ano}-${aleatorio}`;
    document.getElementById('numeroContrato').value = numero;
}

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
    // Form submit
    document.getElementById('formEmprestimo').addEventListener('submit', salvarContrato);
    
    // Upload areas
    document.getElementById('uploadFicha').addEventListener('click', () => {
        document.getElementById('fichaCliente').click();
    });
    
    document.getElementById('uploadDocumento').addEventListener('click', () => {
        document.getElementById('documentoCliente').click();
    });
    
    // File inputs
    document.getElementById('fichaCliente').addEventListener('change', function(e) {
        previewImagem(e.target, 'previewFicha', 'uploadFicha');
    });
    
    document.getElementById('documentoCliente').addEventListener('change', function(e) {
        previewImagem(e.target, 'previewDocumento', 'uploadDocumento');
    });
    
    // Máscaras
    document.getElementById('cpf').addEventListener('input', mascaraCPF);
    document.getElementById('numero').addEventListener('input', mascaraTelefone);
    
    // Relatório
    document.getElementById('relatorioTipo').addEventListener('change', atualizarCamposRelatorio);
}

// ========== PREVIEW DE IMAGENS ==========
function previewImagem(input, previewId, uploadAreaId) {
    const preview = document.getElementById(previewId);
    const uploadArea = document.getElementById(uploadAreaId);
    const icon = uploadArea.querySelector('.upload-icon');
    const text = uploadArea.querySelector('p');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
            text.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// ========== UPLOAD IMGBB ==========
async function uploadImagemParaImgBB(file) {
    if (!imgbbApiKey) throw new Error('API Key do ImgBB não configurada');
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', imgbbApiKey);
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) throw new Error('Falha no upload');
    
    const data = await response.json();
    return data.data.url;
}

// ========== SALVAR CONTRATO ==========
async function salvarContrato(e) {
    e.preventDefault();
    
    if (!organizacaoAtiva) {
        mostrarStatus('Organização inativa. Não é possível cadastrar.', 'danger');
        return;
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
    
    try {
        const dadosContrato = {
            numeroContrato: document.getElementById('numeroContrato').value,
            status: document.getElementById('statusContrato').value,
            dataContrato: document.getElementById('dataContrato').value,
            nome: document.getElementById('nome').value.toUpperCase(),
            cpf: document.getElementById('cpf').value.replace(/\D/g, ''),
            telefone: document.getElementById('numero').value.replace(/\D/g, ''),
            pix: document.getElementById('pix').value,
            banco: document.getElementById('banco').value,
            bancoNome: document.getElementById('banco').options[document.getElementById('banco').selectedIndex].text,
            valorCartao: parseFloat(document.getElementById('valorCartao').value),
            parcelas: parseInt(document.getElementById('parcelas').value),
            valorEmprestado: parseFloat(document.getElementById('valorEmprestado').value),
            lucro: parseFloat(document.getElementById('valorCartao').value) - parseFloat(document.getElementById('valorEmprestado').value),
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Upload imagens
        const fichaFile = document.getElementById('fichaCliente').files[0];
        const docFile = document.getElementById('documentoCliente').files[0];
        
        if (fichaFile) {
            dadosContrato.fichaUrl = await uploadImagemParaImgBB(fichaFile);
        }
        if (docFile) {
            dadosContrato.documentoUrl = await uploadImagemParaImgBB(docFile);
        }
        
        await db.collection('contratos').add(dadosContrato);
        
        mostrarStatus('✅ Contrato cadastrado com sucesso!', 'success');
        limparFormulario();
        gerarNumeroContrato();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarStatus('❌ Erro ao cadastrar: ' + error.message, 'danger');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-check-circle"></i> Cadastrar Contrato';
    }
}

// ========== BUSCAR CONTRATOS ==========
async function buscarContratos() {
    const cpf = document.getElementById('searchCPF').value.replace(/\D/g, '');
    const nome = document.getElementById('searchNome').value.toUpperCase();
    const telefone = document.getElementById('searchTelefone').value.replace(/\D/g, '');
    const contrato = document.getElementById('searchContrato').value;
    const status = document.getElementById('searchStatus').value;
    const dataInicio = document.getElementById('searchDataInicio').value;
    const dataFim = document.getElementById('searchDataFim').value;
    
    let query = db.collection('contratos');
    
    // Aplicar filtros
    if (cpf) query = query.where('cpf', '==', cpf);
    if (nome) query = query.where('nome', '>=', nome).where('nome', '<=', nome + '\uf8ff');
    if (telefone) query = query.where('telefone', '==', telefone);
    if (contrato) query = query.where('numeroContrato', '==', contrato);
    if (status) query = query.where('status', '==', status);
    if (dataInicio) query = query.where('dataContrato', '>=', dataInicio);
    if (dataFim) query = query.where('dataContrato', '<=', dataFim);
    
    query = query.orderBy('dataCadastro', 'desc');
    
    try {
        const snapshot = await query.get();
        const tbody = document.getElementById('resultadosBusca');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhum contrato encontrado</td></tr>';
            return;
        }
        
        let totalCartoes = 0;
        let totalEmprestado = 0;
        let totalLucro = 0;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            const statusClass = `status-${dados.status}`;
            const statusTexto = {
                'pago': 'Pago',
                'pendente_documento': 'Pend. Doc.',
                'estornado': 'Estornado',
                'ativo': 'Ativo',
                'atrasado': 'Atrasado'
            }[dados.status] || dados.status;
            
            totalCartoes += dados.valorCartao || 0;
            totalEmprestado += dados.valorEmprestado || 0;
            totalLucro += dados.lucro || 0;
            
            const data = dados.dataContrato ? new Date(dados.dataContrato + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${dados.numeroContrato}</strong></td>
                    <td>${dados.nome}</td>
                    <td class="cpf-mask">${mascararCPF(dados.cpf)}</td>
                    <td class="tel-mask">${mascararTelefone(dados.telefone)}</td>
                    <td>R$ ${(dados.valorCartao || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorEmprestado || 0).toFixed(2)}</td>
                    <td>${dados.parcelas}x</td>
                    <td><span class="badge badge-status ${statusClass}">${statusTexto}</span></td>
                    <td>${data}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="verDetalhes('${doc.id}')" title="Ver detalhes">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editarContrato('${doc.id}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // Adicionar linha de totais
        tbody.innerHTML += `
            <tr class="table-active fw-bold">
                <td colspan="4">TOTAIS</td>
                <td>R$ ${totalCartoes.toFixed(2)}</td>
                <td>R$ ${totalEmprestado.toFixed(2)}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        `;
        
    } catch (error) {
        console.error('Erro na busca:', error);
        mostrarStatus('Erro ao buscar contratos: ' + error.message, 'danger');
    }
}

// ========== VER DETALHES ==========
async function verDetalhes(id) {
    try {
        const doc = await db.collection('contratos').doc(id).get();
        if (doc.exists) {
            const dados = doc.data();
            const modalBody = document.getElementById('detalhesContrato');
            
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Contrato: ${dados.numeroContrato}</h6>
                        <p><strong>Status:</strong> ${dados.status}</p>
                        <p><strong>Data:</strong> ${dados.dataContrato}</p>
                        <p><strong>Nome:</strong> ${dados.nome}</p>
                        <p><strong>CPF:</strong> ${mascararCPF(dados.cpf)}</p>
                        <p><strong>Telefone:</strong> ${mascararTelefone(dados.telefone)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Banco:</strong> ${dados.bancoNome}</p>
                        <p><strong>PIX:</strong> ${dados.pix}</p>
                        <p><strong>Valor Cartão:</strong> R$ ${dados.valorCartao.toFixed(2)}</p>
                        <p><strong>Valor Emprestado:</strong> R$ ${dados.valorEmprestado.toFixed(2)}</p>
                        <p><strong>Parcelas:</strong> ${dados.parcelas}x</p>
                        <p><strong>Lucro:</strong> R$ ${(dados.lucro || 0).toFixed(2)}</p>
                    </div>
                </div>
                ${dados.fichaUrl ? `<img src="${dados.fichaUrl}" class="img-fluid mt-3" alt="Ficha">` : ''}
                ${dados.documentoUrl ? `<img src="${dados.documentoUrl}" class="img-fluid mt-3" alt="Documento">` : ''}
            `;
            
            contratoAtualId = id;
            new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ========== RELATÓRIOS ==========
async function gerarRelatorio() {
    const tipo = document.getElementById('relatorioTipo').value;
    let query = db.collection('contratos');
    
    if (tipo === 'mensal') {
        const mes = document.getElementById('relatorioMes').value;
        if (!mes) {
            mostrarStatus('Selecione um mês!', 'warning');
            return;
        }
        const [ano, mesNum] = mes.split('-');
        const inicio = `${ano}-${mesNum}-01`;
        const fim = new Date(ano, mesNum, 0).toISOString().split('T')[0];
        query = query.where('dataContrato', '>=', inicio).where('dataContrato', '<=', fim);
    } else if (tipo === 'periodo') {
        const inicio = document.getElementById('relatorioDataInicio').value;
        const fim = document.getElementById('relatorioDataFim').value;
        if (inicio) query = query.where('dataContrato', '>=', inicio);
        if (fim) query = query.where('dataContrato', '<=', fim);
    }
    
    query = query.orderBy('dataContrato', 'desc');
    
    try {
        const snapshot = await query.get();
        const tbody = document.getElementById('dadosRelatorio');
        tbody.innerHTML = '';
        
        let totalCartoes = 0, totalEmprestado = 0, totalLucro = 0;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            
            if (tipo === 'status') {
                const statusFiltro = document.getElementById('searchStatus').value;
                if (statusFiltro && dados.status !== statusFiltro) return;
            }
            
            totalCartoes += dados.valorCartao || 0;
            totalEmprestado += dados.valorEmprestado || 0;
            totalLucro += dados.lucro || 0;
            
            tbody.innerHTML += `
                <tr>
                    <td>${dados.numeroContrato}</td>
                    <td>${dados.nome}</td>
                    <td>${mascararCPF(dados.cpf)}</td>
                    <td>R$ ${(dados.valorCartao || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorEmprestado || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.lucro || 0).toFixed(2)}</td>
                    <td>${dados.status}</td>
                    <td>${dados.dataContrato}</td>
                </tr>
            `;
        });
        
        // Atualizar cards
        document.getElementById('totalContratos').textContent = snapshot.size;
        document.getElementById('totalCartoes').textContent = `R$ ${totalCartoes.toFixed(2)}`;
        document.getElementById('totalEmprestado').textContent = `R$ ${totalEmprestado.toFixed(2)}`;
        document.getElementById('lucroTotal').textContent = `R$ ${totalLucro.toFixed(2)}`;
        
        document.getElementById('tabelaRelatorio').style.display = 'block';
        
        // Salvar dados para exportação
        window.dadosExportacao = {
            contratos: snapshot.docs.map(doc => doc.data()),
            totais: { totalCartoes, totalEmprestado, totalLucro }
        };
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarStatus('Erro ao gerar relatório', 'danger');
    }
}

// ========== EXPORTAR EXCEL ==========
function exportarParaExcel() {
    if (!window.dadosExportacao || !window.dadosExportacao.contratos.length) {
        mostrarStatus('Gere um relatório primeiro!', 'warning');
        return;
    }
    
    const dados = window.dadosExportacao.contratos.map(c => ({
        'Contrato': c.numeroContrato,
        'Nome': c.nome,
        'CPF': c.cpf,
        'Telefone': c.telefone,
        'Valor Cartão': c.valorCartao,
        'Valor Emprestado': c.valorEmprestado,
        'Lucro': c.lucro || 0,
        'Parcelas': c.parcelas,
        'Status': c.status,
        'Data': c.dataContrato,
        'Banco': c.bancoNome
    }));
    
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    
    const data = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `relatorio_contratos_${data}.xlsx`);
    
    mostrarStatus('✅ Relatório exportado com sucesso!', 'success');
}

// ========== UTILITÁRIOS ==========
function mascaraCPF(e) {
    let value = e.target ? e.target.value : e;
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    if (e.target) e.target.value = value;
    return value;
}

function mascaraTelefone(e) {
    let value = e.target ? e.target.value : e;
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }
    if (e.target) e.target.value = value;
    return value;
}

function mascararCPF(cpf) {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function mascararTelefone(tel) {
    if (!tel) return '';
    return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

function mostrarStatus(mensagem, tipo) {
    const statusDiv = document.getElementById('statusOrg');
    const statusMessage = document.getElementById('statusMessage');
    
    statusDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    statusMessage.innerHTML = mensagem;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function limparFormulario() {
    document.getElementById('formEmprestimo').reset();
    document.getElementById('previewFicha').style.display = 'none';
    document.getElementById('previewDocumento').style.display = 'none';
    document.querySelectorAll('.upload-icon').forEach(icon => icon.style.display = 'block');
    document.querySelectorAll('.upload-area p').forEach(p => p.style.display = 'block');
    gerarNumeroContrato();
}

function desabilitarFormulario() {
    const inputs = document.querySelectorAll('#formEmprestimo input, #formEmprestimo select, #formEmprestimo button');
    inputs.forEach(input => input.disabled = true);
}

function inicializarDataTable() {
    // DataTable será inicializado quando houver dados
}

function atualizarCamposRelatorio() {
    const tipo = document.getElementById('relatorioTipo').value;
    document.getElementById('relatorioMes').style.display = tipo === 'mensal' ? 'block' : 'none';
    document.getElementById('relatorioDataInicio').style.display = tipo === 'periodo' ? 'block' : 'none';
    document.getElementById('relatorioDataFim').style.display = tipo === 'periodo' ? 'block' : 'none';
}

// Busca em tempo real (opcional)
let timeoutBusca;
document.querySelectorAll('#searchCPF, #searchNome, #searchTelefone, #searchContrato').forEach(input => {
    input.addEventListener('input', function() {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(buscarContratos, 500);
    });
});
