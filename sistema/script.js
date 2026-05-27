// ============================================
// SISTEMA BOA OPÇÃO - JAVASCRIPT COMPLETO
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
let contratosExistentes = [];

// Mapeamento de tipo de venda
const tipoVendaMap = {
    'cartao_alimentacao': 'Cartão Alimentação',
    'cartao_refeicao': 'Cartão Refeição',
    'cartao_credito_parcelado': 'Crédito Parcelado',
    'cartao_credito_vista': 'Crédito À Vista'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await verificarOrganizacao();
    await carregarImgBBApiKey();
    await carregarContratosExistentes();
    await gerarNumeroContrato();
    setupEventListeners();
    atualizarCamposRelatorio();
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
                desabilitarSistema();
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

async function carregarContratosExistentes() {
    try {
        const snapshot = await db.collection('contratos').get();
        contratosExistentes = snapshot.docs.map(doc => doc.data().numeroContrato);
    } catch (error) {
        console.error('Erro ao carregar contratos:', error);
    }
}

// ========== GERAR NÚMERO DO CONTRATO ÚNICO ==========
async function gerarNumeroContrato() {
    let numero;
    let tentativas = 0;
    
    do {
        const ano = new Date().getFullYear();
        const aleatorio = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        numero = `CT-${ano}-${aleatorio}`;
        tentativas++;
        
        // Verificar se o número já existe no Firestore
        const snapshot = await db.collection('contratos')
            .where('numeroContrato', '==', numero)
            .get();
        
        if (snapshot.empty && !contratosExistentes.includes(numero)) {
            break;
        }
    } while (tentativas < 100);
    
    document.getElementById('numeroContrato').value = numero;
}

// ========== VALIDAÇÃO DE CPF ==========
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto > 9 ? 0 : resto;
    
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto > 9 ? 0 : resto;
    
    if (parseInt(cpf.charAt(10)) !== digitoVerificador2) return false;
    
    return true;
}

// ========== CÁLCULO DO VALOR DA PARCELA ==========
function calcularValorParcela() {
    const valorCartao = parseFloat(document.getElementById('valorCartao').value) || 0;
    const parcelas = parseInt(document.getElementById('parcelas').value) || 0;
    
    if (valorCartao > 0 && parcelas > 0) {
        const valorParcela = valorCartao / parcelas;
        document.getElementById('valorParcelas').value = valorParcela.toFixed(2);
    } else {
        document.getElementById('valorParcelas').value = '';
    }
}

// ========== VALIDAÇÃO E MÁSCARA DE NOME ==========
function validarNome(nome) {
    // Permite apenas letras (incluindo acentos), espaços e apóstrofos
    const regex = /^[A-ZÀ-Ú\s']+$/;
    return regex.test(nome);
}

function mascaraNome(e) {
    let value = e.target.value;
    
    // Remove caracteres não permitidos (apenas letras, acentos, espaços e apóstrofos)
    value = value.replace(/[^a-zA-ZÀ-ÿ\s']/g, '');
    
    // Converte para maiúsculo
    value = value.toUpperCase();
    
    e.target.value = value;
}

// ========== TOGGLE BANCO OUTROS ==========
function toggleBancoOutros() {
    const banco = document.getElementById('banco').value;
    const divBancoOutros = document.getElementById('divBancoOutros');
    
    if (banco === 'outros') {
        divBancoOutros.style.display = 'block';
        document.getElementById('bancoOutros').required = true;
    } else {
        divBancoOutros.style.display = 'none';
        document.getElementById('bancoOutros').value = '';
        document.getElementById('bancoOutros').required = false;
    }
}

// ========== TOGGLE BANDEIRA OUTROS ==========
function toggleBandeiraOutros() {
    const bandeira = document.getElementById('bandeiraCartao').value;
    const divBandeiraOutros = document.getElementById('divBandeiraOutros');
    
    if (bandeira === 'Outros') {
        divBandeiraOutros.style.display = 'block';
        document.getElementById('bandeiraOutros').required = true;
    } else {
        divBandeiraOutros.style.display = 'none';
        document.getElementById('bandeiraOutros').value = '';
        document.getElementById('bandeiraOutros').required = false;
    }
}

// ========== TOGGLE TIPO PAGAMENTO ==========
function toggleTipoPagamento() {
    const tipoPagamento = document.querySelector('input[name="tipoPagamento"]:checked').value;
    const divPixCampos = document.getElementById('divPixCampos');
    const divTransferenciaCampos = document.getElementById('divTransferenciaCampos');
    const pixInput = document.getElementById('pix');
    const nomeBeneficiario = document.getElementById('nomeBeneficiario');
    const dadosTransferencia = document.getElementById('dadosTransferencia');
    
    if (tipoPagamento === 'pix') {
        // Mostrar campos PIX
        divPixCampos.style.display = 'block';
        divTransferenciaCampos.style.display = 'none';
        
        // Tornar campos PIX disponíveis
        pixInput.required = false;
        nomeBeneficiario.required = false;
        
        // Limpar campo de transferência
        dadosTransferencia.value = '';
        dadosTransferencia.required = false;
        
        // Resetar beneficiário para mesmo titular
        document.getElementById('radioMesmoTitular').checked = true;
        toggleTipoBeneficiario();
        
    } else if (tipoPagamento === 'transferencia') {
        // Mostrar campo transferência
        divPixCampos.style.display = 'none';
        divTransferenciaCampos.style.display = 'block';
        
        // Tornar campo transferência obrigatório
        dadosTransferencia.required = true;
        
        // Limpar campos PIX
        pixInput.value = '';
        pixInput.required = false;
        nomeBeneficiario.value = '';
        nomeBeneficiario.required = false;
        
        // Esconder CPF terceiros
        document.getElementById('divCpfTerceiros').style.display = 'none';
        document.getElementById('cpfTerceiros').value = '';
        document.getElementById('cpfTerceiros').required = false;
        document.getElementById('cpfTerceiros').classList.remove('is-invalid', 'is-valid');
    }
}

// ========== TOGGLE TIPO BENEFICIÁRIO ==========
// ========== TOGGLE TIPO BENEFICIÁRIO ==========
function toggleTipoBeneficiario() {
    const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked').value;
    const nomeBeneficiario = document.getElementById('nomeBeneficiario');
    const divCpfTerceiros = document.getElementById('divCpfTerceiros');
    const cpfTerceiros = document.getElementById('cpfTerceiros');
    
    if (tipoBeneficiario === 'mesmo_titular') {
        // Modo: Mesmo titular do cartão
        // ATUALIZAÇÃO: Pegar o nome atual do cliente e aplicar ao beneficiário
        const nomeCliente = document.getElementById('nome').value;
        nomeBeneficiario.value = nomeCliente;
        nomeBeneficiario.readOnly = true;
        nomeBeneficiario.style.backgroundColor = '#f8f9fa';
        
        // Esconder CPF de terceiros
        divCpfTerceiros.style.display = 'none';
        cpfTerceiros.value = '';
        cpfTerceiros.required = false;
        cpfTerceiros.classList.remove('is-invalid');
        cpfTerceiros.classList.remove('is-valid');
        
    } else if (tipoBeneficiario === 'terceiros') {
        // Modo: Terceiros
        nomeBeneficiario.readOnly = false;
        nomeBeneficiario.style.backgroundColor = '';
        nomeBeneficiario.value = '';
        nomeBeneficiario.focus();
        
        // Mostrar CPF de terceiros
        divCpfTerceiros.style.display = 'block';
        cpfTerceiros.required = true;
    }
}

// ========== TOGGLE ENDEREÇO MANUAL ==========
function toggleEnderecoManual() {
    const manual = document.getElementById('flagEnderecoManual').checked;
    const camposEndereco = ['endereco', 'numeroEndereco', 'bairro', 'complemento', 'cidade', 'estado'];
    
    camposEndereco.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (manual) {
            elemento.readOnly = false;
            elemento.style.backgroundColor = '';
        } else {
            elemento.readOnly = true;
            elemento.style.backgroundColor = '#f8f9fa';
        }
    });
}

// ========== SETUP EVENT LISTENERS ==========
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
    
    // Máscaras para campos de nome (apenas letras e acentos, maiúsculo)
    document.getElementById('nome').addEventListener('input', function(e) {
        mascaraNome(e);
        // Atualizar nome do beneficiário se for mesmo titular
        const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
        if (tipoBeneficiario && tipoBeneficiario.value === 'mesmo_titular') {
            document.getElementById('nomeBeneficiario').value = this.value;
        }
    });
    
    // Garantir que o nome do beneficiário seja atualizado quando o campo nome perder o foco
    document.getElementById('nome').addEventListener('blur', function() {
        const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
        if (tipoBeneficiario && tipoBeneficiario.value === 'mesmo_titular') {
            document.getElementById('nomeBeneficiario').value = this.value;
        }
        
        // Validação do nome
        const nome = this.value.trim();
        if (nome.length < 3) {
            this.classList.add('is-invalid');
            mostrarStatus('Nome do cliente deve ter pelo menos 3 caracteres!', 'warning');
        } else if (!validarNome(nome)) {
            this.classList.add('is-invalid');
            mostrarStatus('Nome do cliente contém caracteres inválidos!', 'warning');
        } else {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
    
    document.getElementById('nomeBeneficiario').addEventListener('input', mascaraNome);
    
    // Máscaras CPF
    document.getElementById('cpf').addEventListener('input', mascaraCPF);
    document.getElementById('cpf').addEventListener('blur', function() {
        const cpf = this.value.replace(/\D/g, '');
        if (cpf.length === 11 && !validarCPF(cpf)) {
            this.classList.add('is-invalid');
            document.getElementById('cpfFeedback').textContent = 'CPF inválido!';
        } else if (cpf.length === 11) {
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        }
    });
    
    // Validação de CPF de terceiros
    document.getElementById('cpfTerceiros').addEventListener('input', mascaraCPF);
    document.getElementById('cpfTerceiros').addEventListener('blur', function() {
        const cpf = this.value.replace(/\D/g, '');
        const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
        
        if (tipoBeneficiario && tipoBeneficiario.value === 'terceiros') {
            if (cpf.length === 11 && !validarCPF(cpf)) {
                this.classList.add('is-invalid');
                document.getElementById('cpfTerceirosFeedback').textContent = 'CPF inválido!';
            } else if (cpf.length === 11) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        }
    });
    
    // Máscara telefone
    document.getElementById('numero').addEventListener('input', mascaraTelefone);
    
    // Máscara CEP
    document.getElementById('cep').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = value;
    });
    
    // Tipo de venda - ajustar parcelas automaticamente
    document.getElementById('tipoVenda').addEventListener('change', function() {
        const tipo = this.value;
        const parcelasInput = document.getElementById('parcelas');
        if (tipo === 'cartao_credito_vista') {
            parcelasInput.value = 1;
            parcelasInput.readOnly = true;
        } else {
            parcelasInput.readOnly = false;
        }
        calcularValorParcela();
    });
    
    // Validação de parcelas (apenas números inteiros, máximo 120)
    document.getElementById('parcelas').addEventListener('input', function(e) {
        let value = e.target.value;
        value = value.replace(/\D/g, '');
        
        if (value) {
            let numValue = parseInt(value);
            if (numValue > 120) numValue = 120;
            e.target.value = numValue;
        }
        
        calcularValorParcela();
    });
    
    // Validação de valores (apenas duas casas decimais)
    ['valorCartao', 'valorEmprestado'].forEach(id => {
        document.getElementById(id).addEventListener('input', function(e) {
            let value = e.target.value;
            value = value.replace(/[^\d.]/g, '');
            
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            if (parts.length === 2 && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            e.target.value = value;
            if (id === 'valorCartao') calcularValorParcela();
        });
    });
    
    // Flag endereço manual
    document.getElementById('flagEnderecoManual').addEventListener('change', toggleEnderecoManual);
    
    // Radio buttons tipo pagamento
    document.querySelectorAll('input[name="tipoPagamento"]').forEach(radio => {
        radio.addEventListener('change', toggleTipoPagamento);
    });
    
    // Radio buttons tipo beneficiário
    document.querySelectorAll('input[name="tipoBeneficiario"]').forEach(radio => {
        radio.addEventListener('change', toggleTipoBeneficiario);
    });
    
    // Busca CEP
    document.getElementById('cep').addEventListener('blur', function() {
        if (!document.getElementById('flagEnderecoManual').checked) {
            buscarCEP();
        }
    });
    
    // Bloquear navegação entre abas se organização inativa
    document.querySelectorAll('#myTab .nav-link').forEach(tab => {
        tab.addEventListener('click', function(e) {
            if (!organizacaoAtiva && this.id !== 'cadastro-tab') {
                e.preventDefault();
                e.stopPropagation();
                mostrarStatus('⚠️ Organização inativa! Apenas a aba de Cadastro está disponível.', 'warning');
                return false;
            }
        });
    });
    
    // Bloquear navegação via Bootstrap Tab API
    document.getElementById('consulta-tab').addEventListener('show.bs.tab', function(e) {
        if (!organizacaoAtiva) {
            e.preventDefault();
            mostrarStatus('⚠️ Organização inativa! Apenas a aba de Cadastro está disponível.', 'warning');
        }
    });
    
    document.getElementById('relatorios-tab').addEventListener('show.bs.tab', function(e) {
        if (!organizacaoAtiva) {
            e.preventDefault();
            mostrarStatus('⚠️ Organização inativa! Apenas a aba de Cadastro está disponível.', 'warning');
        }
    });
    
    // Busca em tempo real
    document.querySelectorAll('#searchCPF, #searchNome, #searchTelefone, #searchContrato').forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(window.timeoutBusca);
            window.timeoutBusca = setTimeout(buscarContratos, 500);
        });
    });
    
    document.getElementById('searchCartaoRetido').addEventListener('change', buscarContratos);
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

// ========== TOGGLE CARTÃO RETIDO ==========
function toggleCartaoRetido() {
    const isRetido = document.getElementById('cartaoRetido').checked;
    
    document.getElementById('divBandeiraCartao').style.display = isRetido ? 'block' : 'none';
    document.getElementById('divUltimosDigitos').style.display = isRetido ? 'block' : 'none';
    document.getElementById('divDataRetirada').style.display = isRetido ? 'block' : 'none';
    document.getElementById('divObservacaoCartao').style.display = isRetido ? 'block' : 'none';
    
    if (!isRetido) {
        document.getElementById('bandeiraCartao').value = '';
        document.getElementById('bandeiraOutros').value = '';
        document.getElementById('ultimosDigitos').value = '';
        document.getElementById('dataRetirada').value = '';
        document.getElementById('observacaoCartao').value = '';
        document.getElementById('divBandeiraOutros').style.display = 'none';
    }
}

// ========== BUSCAR CEP ==========
async function buscarCEP() {
    const cep = document.getElementById('cep').value.replace(/\D/g, '');
    const feedback = document.getElementById('cepFeedback');
    
    if (cep.length !== 8) return;
    
    try {
        document.getElementById('cep').disabled = true;
        feedback.style.display = 'block';
        feedback.textContent = 'Buscando...';
        feedback.className = 'form-text text-info';
        
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            feedback.textContent = 'CEP não encontrado!';
            feedback.className = 'form-text text-danger';
            return;
        }
        
        // Preencher campos
        document.getElementById('endereco').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
        document.getElementById('numeroEndereco').focus();
        
        feedback.textContent = 'CEP encontrado!';
        feedback.className = 'form-text text-success';
        
        // Permitir edição após busca
        if (!document.getElementById('flagEnderecoManual').checked) {
            toggleEnderecoManual();
        }
        
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        feedback.textContent = 'Erro ao buscar CEP';
        feedback.className = 'form-text text-danger';
    } finally {
        document.getElementById('cep').disabled = false;
    }
}

// ========== SALVAR CONTRATO ==========
async function salvarContrato(e) {
    e.preventDefault();
    
    if (!organizacaoAtiva) {
        mostrarStatus('Organização inativa. Não é possível cadastrar.', 'danger');
        return;
    }
    
    // Validar CPF do cliente
    const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
    if (!validarCPF(cpf)) {
        mostrarStatus('CPF do cliente inválido! Verifique e tente novamente.', 'danger');
        document.getElementById('cpf').focus();
        return;
    }
    
    // Validar tipo de pagamento
    const tipoPagamento = document.querySelector('input[name="tipoPagamento"]:checked').value;
    
    // Validar CPF de terceiros (apenas se for PIX e terceiros)
    const tipoBeneficiario = tipoPagamento === 'pix' ? 
        document.querySelector('input[name="tipoBeneficiario"]:checked').value : null;
    let cpfTerceiros = '';
    
    if (tipoPagamento === 'pix' && tipoBeneficiario === 'terceiros') {
        cpfTerceiros = document.getElementById('cpfTerceiros').value.replace(/\D/g, '');
        
        if (!cpfTerceiros) {
            mostrarStatus('CPF do terceiro é obrigatório!', 'danger');
            document.getElementById('cpfTerceiros').focus();
            return;
        }
        
        if (!validarCPF(cpfTerceiros)) {
            mostrarStatus('CPF do terceiro inválido! Verifique e tente novamente.', 'danger');
            document.getElementById('cpfTerceiros').focus();
            return;
        }
        
        // Verificar se CPF do terceiro é igual ao do cliente
        if (cpfTerceiros === cpf) {
            mostrarStatus('O CPF do terceiro não pode ser igual ao CPF do cliente!', 'danger');
            document.getElementById('cpfTerceiros').focus();
            return;
        }
    }
    
    // Validar dados da transferência se for o caso
    if (tipoPagamento === 'transferencia') {
        const dadosTransferencia = document.getElementById('dadosTransferencia').value.trim();
        if (!dadosTransferencia) {
            mostrarStatus('Informe os detalhes da transferência!', 'danger');
            document.getElementById('dadosTransferencia').focus();
            return;
        }
    }
    
    // Validar parcelas
    const parcelas = parseInt(document.getElementById('parcelas').value);
    if (isNaN(parcelas) || parcelas < 1 || parcelas > 120) {
        mostrarStatus('Quantidade de parcelas deve ser entre 1 e 120!', 'danger');
        document.getElementById('parcelas').focus();
        return;
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
    
    try {
        const enderecoCompleto = {
            cep: document.getElementById('cep').value,
            logradouro: document.getElementById('endereco').value,
            numero: document.getElementById('numeroEndereco').value,
            bairro: document.getElementById('bairro').value,
            complemento: document.getElementById('complemento').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
            completo: `${document.getElementById('endereco').value}, ${document.getElementById('numeroEndereco').value} - ${document.getElementById('bairro').value}, ${document.getElementById('cidade').value}/${document.getElementById('estado').value}`
        };
        
        const cartaoRetido = document.getElementById('cartaoRetido').checked;
        const bandeiraSelecionada = document.getElementById('bandeiraCartao').value;
        const bandeiraFinal = bandeiraSelecionada === 'Outros' ? 
            document.getElementById('bandeiraOutros').value : bandeiraSelecionada;
        
        const dadosCartaoRetido = cartaoRetido ? {
            retido: true,
            bandeira: bandeiraFinal,
            ultimosDigitos: document.getElementById('ultimosDigitos').value,
            dataRetirada: document.getElementById('dataRetirada').value,
            observacao: document.getElementById('observacaoCartao').value,
            dataDevolucao: null,
            statusDevolucao: 'retido'
        } : {
            retido: false
        };
        
        const tipoVenda = document.getElementById('tipoVenda').value;
        const bancoSelecionado = document.getElementById('banco').value;
        const bancoFinal = bancoSelecionado === 'outros' ? 
            document.getElementById('bancoOutros').value : 
            document.getElementById('banco').options[document.getElementById('banco').selectedIndex].text;
        
        const valorCartao = parseFloat(document.getElementById('valorCartao').value) || 0;
        const parcelasCount = parseInt(document.getElementById('parcelas').value) || 0;
        const valorParcelas = valorCartao / parcelasCount;
        const valorEmprestado = parseFloat(document.getElementById('valorEmprestado').value) || 0;
        
        // Montar dados de pagamento
        const dadosPagamento = {
            tipo: tipoPagamento
        };
        
        if (tipoPagamento === 'pix') {
            dadosPagamento.pix = document.getElementById('pix').value;
            
            // Montar dados do beneficiário
            dadosPagamento.beneficiario = {
                tipo: tipoBeneficiario,
                nome: document.getElementById('nomeBeneficiario').value
            };
            
            if (tipoBeneficiario === 'terceiros') {
                dadosPagamento.beneficiario.cpf = cpfTerceiros;
            }
        } else if (tipoPagamento === 'transferencia') {
            dadosPagamento.dadosTransferencia = document.getElementById('dadosTransferencia').value;
        }
        
        const dadosContrato = {
            numeroContrato: document.getElementById('numeroContrato').value,
            statusValorCartao: document.getElementById('statusValorCartao').value,
            statusValorEmprestado: document.getElementById('statusValorEmprestado').value,
            tipoVenda: tipoVenda,
            tipoVendaNome: tipoVendaMap[tipoVenda] || tipoVenda,
            dataContrato: document.getElementById('dataContrato').value,
            nome: document.getElementById('nome').value.toUpperCase(),
            cpf: cpf,
            telefone: document.getElementById('numero').value.replace(/\D/g, ''),
            endereco: enderecoCompleto,
            pagamento: dadosPagamento,
            banco: bancoFinal,
            valorCartao: valorCartao,
            parcelas: parcelasCount,
            valorParcelas: valorParcelas,
            valorEmprestado: valorEmprestado,
            lucro: valorCartao - valorEmprestado,
            cartaoRetido: dadosCartaoRetido,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const fichaFile = document.getElementById('fichaCliente').files[0];
        const docFile = document.getElementById('documentoCliente').files[0];
        
        if (fichaFile) {
            dadosContrato.fichaUrl = await uploadImagemParaImgBB(fichaFile);
        }
        if (docFile) {
            dadosContrato.documentoUrl = await uploadImagemParaImgBB(docFile);
        }
        
        await db.collection('contratos').add(dadosContrato);
        
        // Adicionar à lista de contratos existentes
        contratosExistentes.push(dadosContrato.numeroContrato);
        
        if (cartaoRetido) {
            mostrarStatus('✅ Contrato cadastrado! Cartão registrado como RETIDO.', 'warning');
        } else {
            mostrarStatus('✅ Contrato cadastrado com sucesso!', 'success');
        }
        
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

// ========== ATUALIZAR STATUS DO CARTÃO ==========
async function atualizarStatusCartao(id, novoStatus) {
    const statusTexto = {
        'recebido': 'Recebido',
        'cancelado': 'Cancelado'
    }[novoStatus];
    
    if (!confirm(`Confirmar alteração do status do cartão para "${statusTexto}"?`)) return;
    
    try {
        await db.collection('contratos').doc(id).update({
            statusValorCartao: novoStatus,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarStatus(`✅ Status do cartão atualizado para "${statusTexto}" com sucesso!`, 'success');
        buscarContratos();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarStatus('❌ Erro ao atualizar status: ' + error.message, 'danger');
    }
}

// ========== ATUALIZAR STATUS DO EMPRÉSTIMO ==========
async function atualizarStatusEmprestado(id, novoStatus) {
    const statusTexto = {
        'pago': 'Pago',
        'cancelado': 'Cancelado'
    }[novoStatus];
    
    if (!confirm(`Confirmar alteração do status do empréstimo para "${statusTexto}"?`)) return;
    
    try {
        await db.collection('contratos').doc(id).update({
            statusValorEmprestado: novoStatus,
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarStatus(`✅ Status do empréstimo atualizado para "${statusTexto}" com sucesso!`, 'success');
        buscarContratos();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarStatus('❌ Erro ao atualizar status: ' + error.message, 'danger');
    }
}

// ========== BUSCAR CONTRATOS ==========
async function buscarContratos() {
    const cpf = document.getElementById('searchCPF').value.replace(/\D/g, '');
    const nome = document.getElementById('searchNome').value.toUpperCase();
    const telefone = document.getElementById('searchTelefone').value.replace(/\D/g, '');
    const contrato = document.getElementById('searchContrato').value;
    const statusCartao = document.getElementById('searchStatusCartao').value;
    const statusEmprestado = document.getElementById('searchStatusEmprestado').value;
    const tipoVenda = document.getElementById('searchTipoVenda').value;
    const dataInicio = document.getElementById('searchDataInicio').value;
    const dataFim = document.getElementById('searchDataFim').value;
    const cartaoRetido = document.getElementById('searchCartaoRetido').checked;
    
    let query = db.collection('contratos');
    
    if (cpf) query = query.where('cpf', '==', cpf);
    if (nome) query = query.where('nome', '>=', nome).where('nome', '<=', nome + '\uf8ff');
    if (telefone) query = query.where('telefone', '==', telefone);
    if (contrato) query = query.where('numeroContrato', '==', contrato);
    if (statusCartao) query = query.where('statusValorCartao', '==', statusCartao);
    if (statusEmprestado) query = query.where('statusValorEmprestado', '==', statusEmprestado);
    if (tipoVenda) query = query.where('tipoVenda', '==', tipoVenda);
    if (dataInicio) query = query.where('dataContrato', '>=', dataInicio);
    if (dataFim) query = query.where('dataContrato', '<=', dataFim);
    if (cartaoRetido) query = query.where('cartaoRetido.retido', '==', true);
    
    query = query.orderBy('dataCadastro', 'desc').limit(100);
    
    try {
        const snapshot = await query.get();
        const tbody = document.getElementById('resultadosBusca');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="14" class="text-center py-4">Nenhum contrato encontrado</td></tr>';
            return;
        }
        
        let totalCartoes = 0, totalEmprestado = 0, totalLucro = 0, totalCartoesRetidos = 0;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            
            // Status Valor Cartão
            const statusCartaoClass = `status-cartao-${dados.statusValorCartao || 'processamento'}`;
            const statusCartaoTexto = {
                'processamento': 'Processamento',
                'recebido': 'Recebido',
                'cancelado': 'Cancelado'
            }[dados.statusValorCartao] || 'Processamento';
            
            // Status Valor Emprestado
            const statusEmprestadoClass = `status-emprestado-${dados.statusValorEmprestado || 'processamento'}`;
            const statusEmprestadoTexto = {
                'processamento': 'Processamento',
                'pago': 'Pago',
                'cancelado': 'Cancelado'
            }[dados.statusValorEmprestado] || 'Processamento';
            
            totalCartoes += dados.valorCartao || 0;
            totalEmprestado += dados.valorEmprestado || 0;
            totalLucro += dados.lucro || 0;
            
            let cartaoInfo = '<span class="text-muted">-</span>';
            if (dados.cartaoRetido?.retido) {
                totalCartoesRetidos++;
                if (dados.cartaoRetido.statusDevolucao === 'devolvido') {
                    cartaoInfo = '<span class="cartao-devolvido-badge"><i class="bi bi-check-circle"></i> Devolvido</span>';
                } else {
                    cartaoInfo = '<span class="cartao-retido-badge"><i class="bi bi-lock-fill"></i> Retido</span>';
                }
            }
            
            const tipoVendaNome = dados.tipoVendaNome || dados.tipoVenda || 'N/A';
            const tipoVendaClass = dados.tipoVenda ? `tipo-${dados.tipoVenda}` : '';
            
            const data = dados.dataContrato ? new Date(dados.dataContrato + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
            
            const rowClass = dados.cartaoRetido?.retido && dados.cartaoRetido?.statusDevolucao !== 'devolvido' ? 'cartao-retido-row' : '';
            
            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td><strong>${dados.numeroContrato}</strong></td>
                    <td>${dados.nome}</td>
                    <td class="cpf-mask">${mascararCPF(dados.cpf)}</td>
                    <td class="tel-mask">${mascararTelefone(dados.telefone)}</td>
                    <td><span class="tipo-venda-badge ${tipoVendaClass}">${tipoVendaNome}</span></td>
                    <td>R$ ${(dados.valorCartao || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorParcelas || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorEmprestado || 0).toFixed(2)}</td>
                    <td>${dados.parcelas || 0}x</td>
                    <td>${cartaoInfo}</td>
                    <td><span class="badge badge-status ${statusCartaoClass}">${statusCartaoTexto}</span></td>
                    <td><span class="badge badge-status ${statusEmprestadoClass}">${statusEmprestadoTexto}</span></td>
                    <td>${data}</td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="verDetalhes('${doc.id}')" title="Ver detalhes">
                                <i class="bi bi-eye"></i>
                            </button>
                            <div class="btn-group btn-group-sm dropend">
                                <button class="btn btn-warning dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="true" aria-expanded="false" title="Alterar status">
                                    <i class="bi bi-arrow-repeat"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end" style="position: absolute; z-index: 9999;">
                                    <li><h6 class="dropdown-header">Status Valor Cartão</h6></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); atualizarStatusCartao('${doc.id}', 'recebido')">
                                        <i class="bi bi-check-circle text-success"></i> Marcar como Recebido
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); atualizarStatusCartao('${doc.id}', 'cancelado')">
                                        <i class="bi bi-x-circle text-danger"></i> Cancelar Cartão
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><h6 class="dropdown-header">Status Valor Emprestado</h6></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); atualizarStatusEmprestado('${doc.id}', 'pago')">
                                        <i class="bi bi-check-circle text-success"></i> Marcar como Pago
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); atualizarStatusEmprestado('${doc.id}', 'cancelado')">
                                        <i class="bi bi-x-circle text-danger"></i> Cancelar Empréstimo
                                    </a></li>
                                </ul>
                            </div>
                            ${dados.cartaoRetido?.retido && dados.cartaoRetido?.statusDevolucao === 'retido' ? `
                                <button class="btn btn-success" onclick="registrarDevolucao('${doc.id}')" title="Registrar devolução">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML += `
            <tr class="table-active fw-bold">
                <td colspan="5">TOTAIS (${snapshot.size} contratos | ${totalCartoesRetidos} cartões retidos)</td>
                <td>R$ ${totalCartoes.toFixed(2)}</td>
                <td></td>
                <td>R$ ${totalEmprestado.toFixed(2)}</td>
                <td></td>
                <td></td>
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

// ========== REGISTRAR DEVOLUÇÃO ==========
async function registrarDevolucao(id) {
    if (!confirm('Confirmar a devolução deste cartão ao cliente?')) return;
    
    try {
        await db.collection('contratos').doc(id).update({
            'cartaoRetido.statusDevolucao': 'devolvido',
            'cartaoRetido.dataDevolucao': new Date().toISOString().split('T')[0],
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarStatus('✅ Devolução do cartão registrada com sucesso!', 'success');
        buscarContratos();
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarStatus('❌ Erro ao registrar devolução: ' + error.message, 'danger');
    }
}

// ========== VER DETALHES ==========
async function verDetalhes(id) {
    try {
        const doc = await db.collection('contratos').doc(id).get();
        if (doc.exists) {
            const dados = doc.data();
            const modalBody = document.getElementById('detalhesContrato');
            
            const tipoVendaNome = dados.tipoVendaNome || dados.tipoVenda || 'N/A';
            const tipoVendaClass = dados.tipoVenda ? `tipo-${dados.tipoVenda}` : '';
            
            const statusCartaoTexto = {
                'processamento': 'Processamento',
                'recebido': 'Recebido',
                'cancelado': 'Cancelado'
            }[dados.statusValorCartao] || 'Processamento';
            
            const statusEmprestadoTexto = {
                'processamento': 'Processamento',
                'pago': 'Pago',
                'cancelado': 'Cancelado'
            }[dados.statusValorEmprestado] || 'Processamento';
            
            const statusCartaoClass = `status-cartao-${dados.statusValorCartao || 'processamento'}`;
            const statusEmprestadoClass = `status-emprestado-${dados.statusValorEmprestado || 'processamento'}`;
            
            const enderecoHTML = dados.endereco?.logradouro ? `
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <i class="bi bi-geo-alt"></i> <strong>Endereço Completo</strong>
                    </div>
                    <div class="card-body">
                        <p><strong>CEP:</strong> ${dados.endereco.cep || 'N/A'}</p>
                        <p><strong>Logradouro:</strong> ${dados.endereco.logradouro || 'N/A'}, ${dados.endereco.numero || 'S/N'}</p>
                        ${dados.endereco.complemento ? `<p><strong>Complemento:</strong> ${dados.endereco.complemento}</p>` : ''}
                        <p><strong>Bairro:</strong> ${dados.endereco.bairro || 'N/A'}</p>
                        <p><strong>Cidade/Estado:</strong> ${dados.endereco.cidade || 'N/A'}/${dados.endereco.estado || 'N/A'}</p>
                    </div>
                </div>
            ` : '';
            
            const cartaoHTML = dados.cartaoRetido?.retido ? `
                <div class="card mb-3 border-danger">
                    <div class="card-header bg-danger text-white">
                        <i class="bi bi-credit-card"></i> <strong>Cartão Retido</strong>
                    </div>
                    <div class="card-body">
                        <p><strong>Bandeira:</strong> ${dados.cartaoRetido.bandeira || 'N/A'}</p>
                        <p><strong>Últimos dígitos:</strong> ${dados.cartaoRetido.ultimosDigitos || 'N/A'}</p>
                        <p><strong>Data da Retirada:</strong> ${dados.cartaoRetido.dataRetirada || 'N/A'}</p>
                        <p><strong>Status:</strong> ${dados.cartaoRetido.statusDevolucao === 'devolvido' ? '✅ Devolvido' : '⚠️ Pendente de Devolução'}</p>
                        ${dados.cartaoRetido.dataDevolucao ? `<p><strong>Data Devolução:</strong> ${dados.cartaoRetido.dataDevolucao}</p>` : ''}
                        ${dados.cartaoRetido.observacao ? `<p><strong>Observações:</strong> ${dados.cartaoRetido.observacao}</p>` : ''}
                    </div>
                </div>
            ` : '';
            
            const pagamentoHTML = dados.pagamento ? `
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <i class="bi bi-cash-stack"></i> <strong>Dados do Pagamento</strong>
                    </div>
                    <div class="card-body">
                        <p><strong>Modalidade:</strong> ${dados.pagamento.tipo === 'pix' ? 
                            '<span class="badge bg-info">PIX</span>' : 
                            '<span class="badge bg-primary">Transferência Bancária</span>'}</p>
                        
                        ${dados.pagamento.tipo === 'pix' ? `
                            <p><strong>Chave PIX:</strong> ${dados.pagamento.pix || 'N/A'}</p>
                            <p><strong>Tipo Beneficiário:</strong> ${dados.pagamento.beneficiario?.tipo === 'terceiros' ? 'Terceiros' : 'Mesmo titular do cartão'}</p>
                            <p><strong>Beneficiário:</strong> ${dados.pagamento.beneficiario?.nome || 'N/A'}</p>
                            ${dados.pagamento.beneficiario?.tipo === 'terceiros' && dados.pagamento.beneficiario?.cpf ? 
                                `<p><strong>CPF Terceiro:</strong> ${mascararCPF(dados.pagamento.beneficiario.cpf)}</p>` : ''}
                        ` : ''}
                        
                        ${dados.pagamento.tipo === 'transferencia' ? `
                            <p><strong>Detalhes da Transferência:</strong></p>
                            <div class="alert alert-light border">
                                <pre class="mb-0" style="white-space: pre-wrap; font-family: inherit;">${dados.pagamento.dadosTransferencia || 'N/A'}</pre>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : '';
            
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6 class="text-primary">Contrato: ${dados.numeroContrato}</h6>
                        <p><strong>Status Cartão:</strong> <span class="badge badge-status ${statusCartaoClass}">${statusCartaoTexto}</span></p>
                        <p><strong>Status Empréstimo:</strong> <span class="badge badge-status ${statusEmprestadoClass}">${statusEmprestadoTexto}</span></p>
                        <p><strong>Tipo de Venda:</strong> <span class="tipo-venda-badge ${tipoVendaClass}">${tipoVendaNome}</span></p>
                        <p><strong>Data:</strong> ${dados.dataContrato}</p>
                        <p><strong>Nome:</strong> ${dados.nome}</p>
                        <p><strong>CPF:</strong> ${mascararCPF(dados.cpf)}</p>
                        <p><strong>Telefone:</strong> ${mascararTelefone(dados.telefone)}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Banco:</strong> ${dados.banco || 'N/A'}</p>
                        <p><strong>Valor Cartão:</strong> R$ ${(dados.valorCartao || 0).toFixed(2)}</p>
                        <p><strong>Parcelas:</strong> ${dados.parcelas || 0}x</p>
                        <p><strong>Valor Parcela:</strong> R$ ${(dados.valorParcelas || 0).toFixed(2)}</p>
                        <p><strong>Valor Emprestado:</strong> R$ ${(dados.valorEmprestado || 0).toFixed(2)}</p>
                        <p><strong>Lucro:</strong> R$ ${(dados.lucro || 0).toFixed(2)}</p>
                    </div>
                </div>
                ${pagamentoHTML}
                ${enderecoHTML}
                ${cartaoHTML}
                ${dados.fichaUrl ? `<div class="mb-3"><strong>Ficha do Cliente:</strong><br><img src="${dados.fichaUrl}" class="img-fluid mt-2 rounded" alt="Ficha"></div>` : ''}
                ${dados.documentoUrl ? `<div class="mb-3"><strong>Documento:</strong><br><img src="${dados.documentoUrl}" class="img-fluid mt-2 rounded" alt="Documento"></div>` : ''}
            `;
            
            contratoAtualId = id;
            new bootstrap.Modal(document.getElementById('modalDetalhes')).show();
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ========== RELATÓRIOS ==========
function atualizarCamposRelatorio() {
    const tipo = document.getElementById('relatorioTipo').value;
    document.getElementById('relatorioMes').style.display = tipo === 'mensal' ? 'block' : 'none';
    document.getElementById('relatorioDataInicio').style.display = tipo === 'periodo' ? 'block' : 'none';
    document.getElementById('relatorioDataFim').style.display = tipo === 'periodo' ? 'block' : 'none';
    document.getElementById('divTipoVendaRelatorio').style.display = tipo === 'tipo_venda' ? 'block' : 'none';
}

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
        const ultimoDia = new Date(ano, mesNum, 0).getDate();
        const fim = `${ano}-${mesNum}-${ultimoDia}`;
        query = query.where('dataContrato', '>=', inicio).where('dataContrato', '<=', fim);
    } else if (tipo === 'periodo') {
        const inicio = document.getElementById('relatorioDataInicio').value;
        const fim = document.getElementById('relatorioDataFim').value;
        if (inicio) query = query.where('dataContrato', '>=', inicio);
        if (fim) query = query.where('dataContrato', '<=', fim);
    } else if (tipo === 'tipo_venda') {
        const tipoVenda = document.getElementById('relatorioTipoVenda').value;
        if (tipoVenda) query = query.where('tipoVenda', '==', tipoVenda);
    }
    
    query = query.orderBy('dataContrato', 'desc');
    
    try {
        const snapshot = await query.get();
        const tbody = document.getElementById('dadosRelatorio');
        tbody.innerHTML = '';
        
        let totalCartoes = 0, totalEmprestado = 0, totalLucro = 0;
        let cartoesRetidosPendentes = 0, cartoesDevolvidos = 0, cartoesRetidosTotal = 0;
        
        // Agrupar por tipo de venda se for relatório completo
        const porTipoVenda = {};
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            
            totalCartoes += dados.valorCartao || 0;
            totalEmprestado += dados.valorEmprestado || 0;
            totalLucro += dados.lucro || 0;
            
            // Agrupamento
            const tv = dados.tipoVenda || 'outros';
            if (!porTipoVenda[tv]) {
                porTipoVenda[tv] = { 
                    nome: dados.tipoVendaNome || tv, 
                    quantidade: 0, 
                    valorCartao: 0, 
                    valorEmprestado: 0, 
                    lucro: 0 
                };
            }
            porTipoVenda[tv].quantidade++;
            porTipoVenda[tv].valorCartao += dados.valorCartao || 0;
            porTipoVenda[tv].valorEmprestado += dados.valorEmprestado || 0;
            porTipoVenda[tv].lucro += dados.lucro || 0;
            
            let cartaoInfo = 'Não';
            if (dados.cartaoRetido?.retido) {
                cartoesRetidosTotal++;
                if (dados.cartaoRetido.statusDevolucao === 'devolvido') {
                    cartoesDevolvidos++;
                    cartaoInfo = 'Devolvido';
                } else {
                    cartoesRetidosPendentes++;
                    cartaoInfo = 'Retido';
                }
            }
            
            const tipoVendaNome = dados.tipoVendaNome || dados.tipoVenda || 'N/A';
            const statusCartaoTexto = {
                'processamento': 'Processamento',
                'recebido': 'Recebido',
                'cancelado': 'Cancelado'
            }[dados.statusValorCartao] || 'Processamento';
            
            const statusEmprestadoTexto = {
                'processamento': 'Processamento',
                'pago': 'Pago',
                'cancelado': 'Cancelado'
            }[dados.statusValorEmprestado] || 'Processamento';
            
            tbody.innerHTML += `
                <tr>
                    <td>${dados.numeroContrato}</td>
                    <td>${dados.nome}</td>
                    <td>${mascararCPF(dados.cpf)}</td>
                    <td>${tipoVendaNome}</td>
                    <td>R$ ${(dados.valorCartao || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorParcelas || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.valorEmprestado || 0).toFixed(2)}</td>
                    <td>R$ ${(dados.lucro || 0).toFixed(2)}</td>
                    <td>${cartaoInfo}</td>
                    <td>${statusCartaoTexto}</td>
                    <td>${statusEmprestadoTexto}</td>
                    <td>${dados.dataContrato}</td>
                </tr>
            `;
        });
        
        // Se for relatório completo, adicionar resumo por tipo de venda
        if (tipo === 'completo' && Object.keys(porTipoVenda).length > 0) {
            tbody.innerHTML += `
                <tr class="table-secondary fw-bold">
                    <td colspan="12">RESUMO POR TIPO DE VENDA</td>
                </tr>
            `;
            Object.values(porTipoVenda).forEach(tv => {
                tbody.innerHTML += `
                    <tr class="table-light">
                        <td colspan="2">${tv.nome}</td>
                        <td>${tv.quantidade} contrato(s)</td>
                        <td></td>
                        <td>R$ ${tv.valorCartao.toFixed(2)}</td>
                        <td></td>
                        <td>R$ ${tv.valorEmprestado.toFixed(2)}</td>
                        <td>R$ ${tv.lucro.toFixed(2)}</td>
                        <td colspan="4"></td>
                    </tr>
                `;
            });
        }
        
        // Atualizar cards
        document.getElementById('totalContratos').textContent = snapshot.size;
        document.getElementById('totalCartoes').textContent = `R$ ${totalCartoes.toFixed(2)}`;
        document.getElementById('totalEmprestado').textContent = `R$ ${totalEmprestado.toFixed(2)}`;
        document.getElementById('lucroTotal').textContent = `R$ ${totalLucro.toFixed(2)}`;
        
        document.getElementById('totalCartoesRetidosPendentes').textContent = cartoesRetidosPendentes;
        document.getElementById('totalCartoesDevolvidos').textContent = cartoesDevolvidos;
        document.getElementById('totalCartoesRetidos').textContent = cartoesRetidosTotal;
        document.getElementById('cardsCartoesRetidos').style.display = cartoesRetidosTotal > 0 ? 'flex' : 'none';
        
        document.getElementById('tabelaRelatorio').style.display = 'block';
        
        window.dadosExportacao = {
            contratos: snapshot.docs.map(doc => doc.data()),
            totais: { totalCartoes, totalEmprestado, totalLucro, cartoesRetidosPendentes, cartoesDevolvidos },
            porTipoVenda: porTipoVenda
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
        'Tipo Venda': c.tipoVendaNome || c.tipoVenda || '',
        'Endereço': c.endereco?.completo || '',
        'CEP': c.endereco?.cep || '',
        'Cidade': c.endereco?.cidade || '',
        'Estado': c.endereco?.estado || '',
        'Valor Cartão': c.valorCartao,
        'Parcelas': c.parcelas,
        'Valor Parcela': c.valorParcelas || 0,
        'Valor Emprestado': c.valorEmprestado,
        'Lucro': c.lucro || 0,
        'Modalidade Pagamento': c.pagamento?.tipo === 'pix' ? 'PIX' : 'Transferência',
        'Chave PIX': c.pagamento?.pix || '',
        'Tipo Beneficiário': c.pagamento?.beneficiario?.tipo === 'terceiros' ? 'Terceiros' : c.pagamento?.tipo === 'pix' ? 'Mesmo Titular' : '',
        'Beneficiário': c.pagamento?.beneficiario?.nome || '',
        'CPF Terceiro': c.pagamento?.beneficiario?.cpf || '',
        'Detalhes Transferência': c.pagamento?.dadosTransferencia || '',
        'Banco': c.banco || '',
        'Status Cartão': c.statusValorCartao || 'processamento',
        'Status Empréstimo': c.statusValorEmprestado || 'processamento',
        'Cartão Retido': c.cartaoRetido?.retido ? 'SIM' : 'NÃO',
        'Bandeira Cartão': c.cartaoRetido?.bandeira || '',
        'Últimos Dígitos': c.cartaoRetido?.ultimosDigitos || '',
        'Status Devolução': c.cartaoRetido?.statusDevolucao === 'devolvido' ? 'Devolvido' : c.cartaoRetido?.retido ? 'Pendente' : '',
        'Data Retirada': c.cartaoRetido?.dataRetirada || '',
        'Data Devolução': c.cartaoRetido?.dataDevolucao || '',
        'Data Contrato': c.dataContrato
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
    if (!cpf || cpf.length !== 11) return cpf || '';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function mascararTelefone(tel) {
    if (!tel || tel.length < 10) return tel || '';
    if (tel.length === 11) return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
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
    
    document.getElementById('divBandeiraCartao').style.display = 'none';
    document.getElementById('divBandeiraOutros').style.display = 'none';
    document.getElementById('divUltimosDigitos').style.display = 'none';
    document.getElementById('divDataRetirada').style.display = 'none';
    document.getElementById('divObservacaoCartao').style.display = 'none';
    document.getElementById('divBancoOutros').style.display = 'none';
    document.getElementById('divCpfTerceiros').style.display = 'none';
    document.getElementById('divTransferenciaCampos').style.display = 'none';
    document.getElementById('divPixCampos').style.display = 'block';
    
    document.getElementById('parcelas').readOnly = false;
    document.getElementById('cpf').classList.remove('is-valid', 'is-invalid');
    document.getElementById('cpfTerceiros').classList.remove('is-valid', 'is-invalid');
    
    // Resetar flags
    document.getElementById('flagEnderecoManual').checked = false;
    document.getElementById('radioMesmoTitular').checked = true;
    document.getElementById('radioPix').checked = true;
    
    // Resetar status para padrão "processamento"
    document.getElementById('statusValorCartao').value = 'processamento';
    document.getElementById('statusValorEmprestado').value = 'processamento';
    
    // Limpar campos
    document.getElementById('cpfTerceiros').value = '';
    document.getElementById('dadosTransferencia').value = '';
    document.getElementById('nomeBeneficiario').readOnly = true;
    document.getElementById('nomeBeneficiario').style.backgroundColor = '#f8f9fa';
    
    gerarNumeroContrato();
}

// ========== DESABILITAR SISTEMA COMPLETO ==========
function desabilitarSistema() {
    // Desabilitar navegação das abas
    const tabButtons = document.querySelectorAll('#myTab .nav-link');
    tabButtons.forEach(button => {
        if (button.id !== 'cadastro-tab') {
            button.classList.add('disabled');
            button.setAttribute('disabled', 'disabled');
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';
        }
    });
    
    // Forçar navegação para aba de cadastro
    const cadastroTab = document.getElementById('cadastro-tab');
    const bsTab = new bootstrap.Tab(cadastroTab);
    bsTab.show();
    
    // Desabilitar todos os campos do formulário
    desabilitarFormulario();
    
    // Desabilitar botões de busca nas outras abas
    document.querySelectorAll('#consulta button, #relatorios button').forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
    });
    
    // Desabilitar inputs de busca
    document.querySelectorAll('#consulta input, #consulta select, #relatorios input, #relatorios select').forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
        input.style.opacity = '0.5';
    });
}

function desabilitarFormulario() {
    const inputs = document.querySelectorAll('#formEmprestimo input, #formEmprestimo select, #formEmprestimo button, #formEmprestimo textarea');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
    });
    
    // Desabilitar upload areas
    document.querySelectorAll('.upload-area').forEach(area => {
        area.style.pointerEvents = 'none';
        area.style.opacity = '0.5';
        area.style.cursor = 'not-allowed';
    });
}
