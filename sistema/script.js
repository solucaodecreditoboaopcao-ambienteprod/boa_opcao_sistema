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
const auth = firebase.auth();

// Constantes de autenticação
const EMAIL_DOMAIN = "@solucaodecreditoboaopcao.com.br";

// Variáveis globais
let imgbbApiKey = '';
let organizacaoAtiva = false;
let contratoAtualId = null;
let contratosExistentes = [];
let currentUser = null;

// Mapeamento de tipo de venda
const tipoVendaMap = {
    'cartao_alimentacao': 'Cartão Alimentação',
    'cartao_refeicao': 'Cartão Refeição',
    'cartao_credito_parcelado': 'Crédito Parcelado',
    'cartao_credito_vista': 'Crédito À Vista'
};

// ========== SISTEMA DE AUTENTICAÇÃO ==========

// Função para alternar visibilidade da senha
function togglePassword() {
    const senhaInput = document.getElementById('senhaUsuario');
    const toggleBtn = document.querySelector('.toggle-password-btn');
    
    if (!senhaInput || !toggleBtn) return;
    
    if (senhaInput.type === 'password') {
        // Senha oculta → mostrar senha
        senhaInput.type = 'text';
        toggleBtn.innerHTML = '<i class="bi bi-eye-fill"></i>'; // Olho aberto
        toggleBtn.title = 'Ocultar senha';
    } else {
        // Senha visível → ocultar senha
        senhaInput.type = 'password';
        toggleBtn.innerHTML = '<i class="bi bi-eye-slash-fill"></i>'; // Olho cortado
        toggleBtn.title = 'Mostrar senha';
    }
}

// Função para fazer login
async function fazerLogin() {
    const loginInput = document.getElementById('loginUsuario');
    const senhaInput = document.getElementById('senhaUsuario');
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.querySelector('.btn-login-action');
    
    if (!loginInput || !senhaInput || !errorDiv || !loginBtn) {
        console.error('Elementos de login não encontrados');
        return;
    }
    
    const login = loginInput.value.trim();
    const senha = senhaInput.value;
    
    errorDiv.textContent = '';
    
    if (!login) {
        errorDiv.textContent = '⚠️ Digite o login';
        loginInput.focus();
        return;
    }
    
    if (!senha) {
        errorDiv.textContent = '⚠️ Digite a senha';
        senhaInput.focus();
        return;
    }
    
    loginBtn.disabled = true;
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="login-loading"></span> Entrando...';
    
    try {
        const email = `${login}${EMAIL_DOMAIN}`;
        const userCredential = await auth.signInWithEmailAndPassword(email, senha);
        currentUser = userCredential.user;
        errorDiv.textContent = '';
    } catch (error) {
        console.error('Erro no login:', error);
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorDiv.textContent = '❌ Login inválido';
                break;
            case 'auth/user-disabled':
                errorDiv.textContent = '❌ Usuário desabilitado';
                break;
            case 'auth/user-not-found':
                errorDiv.textContent = '❌ Usuário não encontrado';
                break;
            case 'auth/wrong-password':
                errorDiv.textContent = '❌ Senha incorreta';
                break;
            case 'auth/invalid-credential':
                errorDiv.textContent = '❌ Credenciais inválidas';
                break;
            case 'auth/too-many-requests':
                errorDiv.textContent = '❌ Muitas tentativas. Aguarde.';
                break;
            default:
                errorDiv.textContent = '❌ Erro ao fazer login. Tente novamente.';
        }
        
        senhaInput.value = '';
        senhaInput.focus();
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
}

// Função para fazer logout
async function fazerLogout() {
    try {
        await auth.signOut();
        currentUser = null;
        
        const loginInput = document.getElementById('loginUsuario');
        const senhaInput = document.getElementById('senhaUsuario');
        if (loginInput) loginInput.value = '';
        if (senhaInput) senhaInput.value = '';
    } catch (error) {
        console.error('Erro no logout:', error);
        mostrarStatus('Erro ao fazer logout', 'danger');
    }
}

// Função para mostrar o sistema (após login)
function mostrarSistema(user) {
    const loginFormArea = document.getElementById('loginFormArea');
    const userInfoArea = document.getElementById('userInfoArea');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const conteudoSistema = document.getElementById('conteudoSistema');
    const bloqueioOverlay = document.getElementById('bloqueioOverlay');
    
    if (loginFormArea) loginFormArea.style.display = 'none';
    
    if (userInfoArea) {
        userInfoArea.style.display = 'flex';
        if (userNameDisplay) {
            userNameDisplay.textContent = user.email.split('@')[0];
        }
    }
    
    if (conteudoSistema) conteudoSistema.style.display = 'block';
    if (bloqueioOverlay) bloqueioOverlay.style.display = 'none';
}

// Função para esconder o sistema (logout)
function esconderSistema() {
    const loginFormArea = document.getElementById('loginFormArea');
    const userInfoArea = document.getElementById('userInfoArea');
    const conteudoSistema = document.getElementById('conteudoSistema');
    const bloqueioOverlay = document.getElementById('bloqueioOverlay');
    
    if (loginFormArea) loginFormArea.style.display = 'flex';
    if (userInfoArea) userInfoArea.style.display = 'none';
    if (conteudoSistema) conteudoSistema.style.display = 'none';
    if (bloqueioOverlay) bloqueioOverlay.style.display = 'flex';
}

// Observer de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        mostrarSistema(user);
    } else {
        currentUser = null;
        esconderSistema();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    await verificarOrganizacao();
    await carregarImgBBApiKey();
    await carregarContratosExistentes();
    await gerarNumeroContrato();
    setupEventListeners();
    atualizarCamposRelatorio();
    initFooterModal();
    
    // Enter para login
    const senhaInput = document.getElementById('senhaUsuario');
    if (senhaInput) {
        senhaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }
    
    const loginInput = document.getElementById('loginUsuario');
    if (loginInput) {
        loginInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const senhaEl = document.getElementById('senhaUsuario');
                if (senhaEl) senhaEl.focus();
            }
        });
    }
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
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digitoVerificador1 = resto > 9 ? 0 : resto;
    
    if (parseInt(cpf.charAt(9)) !== digitoVerificador1) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digitoVerificador2 = resto > 9 ? 0 : resto;
    
    if (parseInt(cpf.charAt(10)) !== digitoVerificador2) return false;
    
    return true;
}

// ========== INICIALIZAR MODAL DO FOOTER ==========
// ========== INICIALIZAR MODAL DO FOOTER ==========
function initFooterModal() {
    const copyrightElement = document.getElementById('copyrightLink');
    const logoElement = document.getElementById('logoApptech');
    const modalElement = document.getElementById('contatoModal');
    
    if (!modalElement) {
        console.error('Modal de contato não encontrado');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement, {
        backdrop: true,
        keyboard: true,
        focus: true
    });
    
    // Função para abrir o modal
    function abrirModal(e) {
        e.preventDefault();
        e.stopPropagation();
        modal.show();
    }
    
    // Adicionar evento de clique no container do copyright
    if (copyrightElement) {
        copyrightElement.addEventListener('click', abrirModal);
        console.log('Evento de clique adicionado ao copyrightElement');
    }
    
    // Adicionar evento de clique na logo
    if (logoElement) {
        logoElement.addEventListener('click', abrirModal);
        console.log('Evento de clique adicionado ao logoElement');
    }
    
    // WhatsApp link
    const whatsappLink = document.getElementById('whatsappLink');
    if (whatsappLink) {
        whatsappLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.open('https://wa.me/5571985101828', '_blank');
        });
    }
    
    console.log('Footer modal inicializado com sucesso');
}

// Chamar a função IMEDIATAMENTE, não apenas no DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initFooterModal();
    });
} else {
    // DOM já carregado
    initFooterModal();
}

// ========== CÁLCULO DO VALOR DA PARCELA ==========
function calcularValorParcela() {
    const valorCartaoStr = document.getElementById('valorCartao').value;
    const valorCartao = parseFloat(valorCartaoStr.replace(/\./g, '').replace(',', '.')) || 0;
    const parcelas = parseInt(document.getElementById('parcelas').value) || 0;
    
    if (valorCartao > 0 && parcelas > 0) {
        const valorParcela = valorCartao / parcelas;
        document.getElementById('valorParcelas').value = valorParcela.toFixed(2).replace('.', ',');
    } else {
        document.getElementById('valorParcelas').value = '';
    }
}

// ========== VALIDAÇÃO E MÁSCARA DE NOME ==========
function validarNome(nome) {
    const regex = /^[A-ZÀ-Ú\s']+$/;
    return regex.test(nome);
}

function mascaraNome(e) {
    let value = e.target.value;
    value = value.replace(/[^a-zA-ZÀ-ÿ\s']/g, '');
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
        divPixCampos.style.display = 'block';
        divTransferenciaCampos.style.display = 'none';
        pixInput.required = false;
        nomeBeneficiario.required = false;
        dadosTransferencia.value = '';
        dadosTransferencia.required = false;
        document.getElementById('radioMesmoTitular').checked = true;
        toggleTipoBeneficiario();
    } else if (tipoPagamento === 'transferencia') {
        divPixCampos.style.display = 'none';
        divTransferenciaCampos.style.display = 'block';
        dadosTransferencia.required = true;
        pixInput.value = '';
        pixInput.required = false;
        nomeBeneficiario.value = '';
        nomeBeneficiario.required = false;
        document.getElementById('divCpfTerceiros').style.display = 'none';
        document.getElementById('cpfTerceiros').value = '';
        document.getElementById('cpfTerceiros').required = false;
        document.getElementById('cpfTerceiros').classList.remove('is-invalid', 'is-valid');
    }
}

// ========== TOGGLE TIPO BENEFICIÁRIO ==========
function toggleTipoBeneficiario() {
    const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked').value;
    const nomeBeneficiario = document.getElementById('nomeBeneficiario');
    const divCpfTerceiros = document.getElementById('divCpfTerceiros');
    const cpfTerceiros = document.getElementById('cpfTerceiros');
    
    if (tipoBeneficiario === 'mesmo_titular') {
        const nomeCliente = document.getElementById('nome').value;
        nomeBeneficiario.value = nomeCliente;
        nomeBeneficiario.readOnly = true;
        nomeBeneficiario.style.backgroundColor = '#f8f9fa';
        divCpfTerceiros.style.display = 'none';
        cpfTerceiros.value = '';
        cpfTerceiros.required = false;
        cpfTerceiros.classList.remove('is-invalid', 'is-valid');
    } else if (tipoBeneficiario === 'terceiros') {
        nomeBeneficiario.readOnly = false;
        nomeBeneficiario.style.backgroundColor = '';
        nomeBeneficiario.value = '';
        nomeBeneficiario.focus();
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
        if (elemento) {
            if (manual) {
                elemento.readOnly = false;
                elemento.style.backgroundColor = '';
            } else {
                const cep = document.getElementById('cep').value.replace(/\D/g, '');
                if (cep.length === 8) {
                    elemento.readOnly = false;
                    elemento.style.backgroundColor = '';
                } else {
                    elemento.readOnly = true;
                    elemento.style.backgroundColor = '#f8f9fa';
                }
            }
        }
    });
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

// ========== SETUP EVENT LISTENERS ==========
function setupEventListeners() {
    // Form submit
    const formEmprestimo = document.getElementById('formEmprestimo');
    if (formEmprestimo) {
        formEmprestimo.addEventListener('submit', salvarContrato);
    }
    
    // Upload areas
    const uploadFicha = document.getElementById('uploadFicha');
    const uploadDocumento = document.getElementById('uploadDocumento');
    
    if (uploadFicha) {
        uploadFicha.addEventListener('click', () => {
            document.getElementById('fichaCliente')?.click();
        });
    }
    
    if (uploadDocumento) {
        uploadDocumento.addEventListener('click', () => {
            document.getElementById('documentoCliente')?.click();
        });
    }
    
    // File inputs
    const fichaCliente = document.getElementById('fichaCliente');
    const documentoCliente = document.getElementById('documentoCliente');
    
    if (fichaCliente) {
        fichaCliente.addEventListener('change', function(e) {
            previewImagem(e.target, 'previewFicha', 'uploadFicha');
        });
    }
    
    if (documentoCliente) {
        documentoCliente.addEventListener('change', function(e) {
            previewImagem(e.target, 'previewDocumento', 'uploadDocumento');
        });
    }
    
    // Máscaras e validações de nome
    const nomeInput = document.getElementById('nome');
    if (nomeInput) {
        nomeInput.addEventListener('input', function(e) {
            mascaraNome(e);
            const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
            if (tipoBeneficiario && tipoBeneficiario.value === 'mesmo_titular') {
                const nomeBeneficiario = document.getElementById('nomeBeneficiario');
                if (nomeBeneficiario) nomeBeneficiario.value = this.value;
            }
        });
        
        nomeInput.addEventListener('blur', function() {
            const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
            if (tipoBeneficiario && tipoBeneficiario.value === 'mesmo_titular') {
                const nomeBeneficiario = document.getElementById('nomeBeneficiario');
                if (nomeBeneficiario) nomeBeneficiario.value = this.value;
            }
            
            const nome = this.value.trim();
            if (nome.length < 3) {
                this.classList.add('is-invalid');
            } else if (!validarNome(nome)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }
    
    const nomeBeneficiario = document.getElementById('nomeBeneficiario');
    if (nomeBeneficiario) {
        nomeBeneficiario.addEventListener('input', mascaraNome);
    }
    
    // Máscaras CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', mascaraCPF);
        cpfInput.addEventListener('blur', function() {
            const cpf = this.value.replace(/\D/g, '');
            if (cpf.length === 11 && !validarCPF(cpf)) {
                this.classList.add('is-invalid');
                const cpfFeedback = document.getElementById('cpfFeedback');
                if (cpfFeedback) cpfFeedback.textContent = 'CPF inválido!';
            } else if (cpf.length === 11) {
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
            }
        });
    }
    
    const cpfTerceirosInput = document.getElementById('cpfTerceiros');
    if (cpfTerceirosInput) {
        cpfTerceirosInput.addEventListener('input', mascaraCPF);
        cpfTerceirosInput.addEventListener('blur', function() {
            const cpf = this.value.replace(/\D/g, '');
            const tipoBeneficiario = document.querySelector('input[name="tipoBeneficiario"]:checked');
            
            if (tipoBeneficiario && tipoBeneficiario.value === 'terceiros') {
                if (cpf.length === 11 && !validarCPF(cpf)) {
                    this.classList.add('is-invalid');
                    const cpfTerceirosFeedback = document.getElementById('cpfTerceirosFeedback');
                    if (cpfTerceirosFeedback) cpfTerceirosFeedback.textContent = 'CPF inválido!';
                } else if (cpf.length === 11) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                }
            }
        });
    }
    
    // Máscara telefone
    const numeroInput = document.getElementById('numero');
    if (numeroInput) {
        numeroInput.addEventListener('input', mascaraTelefone);
    }
    
    // Máscara CEP
    const cepInput = document.getElementById('cep');
    if (cepInput) {
        cepInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
        
        cepInput.addEventListener('blur', function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                buscarCEP();
            }
        });
    }
    
    // Tipo de venda
    const tipoVendaSelect = document.getElementById('tipoVenda');
    if (tipoVendaSelect) {
        tipoVendaSelect.addEventListener('change', function() {
            const tipo = this.value;
            const parcelasInput = document.getElementById('parcelas');
            if (parcelasInput) {
                if (tipo === 'cartao_credito_vista') {
                    parcelasInput.value = 1;
                    parcelasInput.readOnly = true;
                } else {
                    parcelasInput.readOnly = false;
                }
            }
            calcularValorParcela();
        });
    }
    
    // Parcelas
    const parcelasInput = document.getElementById('parcelas');
    if (parcelasInput) {
        parcelasInput.addEventListener('input', function(e) {
            let value = e.target.value;
            value = value.replace(/\D/g, '');
            
            if (value) {
                let numValue = parseInt(value);
                if (numValue > 120) numValue = 120;
                e.target.value = numValue;
            }
            
            calcularValorParcela();
        });
    }
    
    // Valores financeiros
    ['valorCartao', 'valorEmprestado'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', function(e) {
                let value = e.target.value;
                value = value.replace(/\D/g, '');
                
                if (value.length > 0) {
                    value = value.padStart(3, '0');
                    const inteiros = value.slice(0, -2);
                    const centavos = value.slice(-2);
                    const inteirosFormatado = parseInt(inteiros).toString();
                    e.target.value = `${inteirosFormatado},${centavos}`;
                } else {
                    e.target.value = '';
                }
                
                if (id === 'valorCartao') calcularValorParcela();
            });
            
            element.addEventListener('blur', function(e) {
                let value = e.target.value;
                
                if (value) {
                    value = value.replace(/\./g, '').replace(',', '.');
                    const numero = parseFloat(value) || 0;
                    e.target.value = numero.toFixed(2).replace('.', ',');
                }
                
                if (id === 'valorCartao') calcularValorParcela();
            });
        }
    });
    
    // Flag endereço manual
    const flagEnderecoManual = document.getElementById('flagEnderecoManual');
    if (flagEnderecoManual) {
        flagEnderecoManual.addEventListener('change', toggleEnderecoManual);
    }
    
    // Radio buttons
    document.querySelectorAll('input[name="tipoPagamento"]').forEach(radio => {
        radio.addEventListener('change', toggleTipoPagamento);
    });
    
    document.querySelectorAll('input[name="tipoBeneficiario"]').forEach(radio => {
        radio.addEventListener('change', toggleTipoBeneficiario);
    });
    
    // Bloquear abas se organização inativa
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
    
    // Busca em tempo real
    document.querySelectorAll('#searchCPF, #searchNome, #searchTelefone, #searchContrato').forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                clearTimeout(window.timeoutBusca);
                window.timeoutBusca = setTimeout(buscarContratos, 500);
            });
        }
    });
    
    const searchCartaoRetido = document.getElementById('searchCartaoRetido');
    if (searchCartaoRetido) {
        searchCartaoRetido.addEventListener('change', buscarContratos);
    }
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
        
        document.getElementById('endereco').value = data.logradouro || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('cidade').value = data.localidade || '';
        document.getElementById('estado').value = data.uf || '';
        document.getElementById('numeroEndereco').focus();
        
        feedback.textContent = 'CEP encontrado!';
        feedback.className = 'form-text text-success';
        
        const camposEndereco = ['endereco', 'numeroEndereco', 'bairro', 'complemento', 'cidade', 'estado'];
        camposEndereco.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.readOnly = false;
                elemento.style.backgroundColor = '';
            }
        });
        
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
    
    function getValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value : defaultValue;
    }
    
    function parseValor(valorStr) {
        if (!valorStr) return 0;
        const limpo = valorStr.replace(/\./g, '').replace(',', '.');
        return parseFloat(limpo) || 0;
    }
    
    // Validar nome
    const nome = getValue('nome').trim();
    if (!nome || nome.length < 3) {
        mostrarStatus('Nome do cliente é obrigatório e deve ter pelo menos 3 caracteres!', 'danger');
        document.getElementById('nome')?.focus();
        return;
    }
    
    // Validar CPF
    const cpf = getValue('cpf').replace(/\D/g, '');
    if (!validarCPF(cpf)) {
        mostrarStatus('CPF do cliente inválido!', 'danger');
        document.getElementById('cpf')?.focus();
        return;
    }
    
    // Validar data
    const dataContrato = getValue('dataContrato');
    if (!dataContrato) {
        mostrarStatus('Data do contrato é obrigatória!', 'danger');
        document.getElementById('dataContrato')?.focus();
        return;
    }
    
    // Validar tipo de venda
    const tipoVenda = getValue('tipoVenda');
    if (!tipoVenda) {
        mostrarStatus('Tipo de Venda é obrigatório!', 'danger');
        document.getElementById('tipoVenda')?.focus();
        return;
    }
    
    const tipoPagamentoRadio = document.querySelector('input[name="tipoPagamento"]:checked');
    const tipoPagamento = tipoPagamentoRadio ? tipoPagamentoRadio.value : 'pix';
    
    const tipoBeneficiarioRadio = document.querySelector('input[name="tipoBeneficiario"]:checked');
    const tipoBeneficiario = (tipoPagamento === 'pix' && tipoBeneficiarioRadio) ? tipoBeneficiarioRadio.value : null;
    let cpfTerceiros = '';
    
    if (tipoPagamento === 'pix' && tipoBeneficiario === 'terceiros') {
        cpfTerceiros = getValue('cpfTerceiros').replace(/\D/g, '');
        
        if (!cpfTerceiros) {
            mostrarStatus('CPF do terceiro é obrigatório!', 'danger');
            document.getElementById('cpfTerceiros')?.focus();
            return;
        }
        
        if (!validarCPF(cpfTerceiros)) {
            mostrarStatus('CPF do terceiro inválido!', 'danger');
            document.getElementById('cpfTerceiros')?.focus();
            return;
        }
        
        if (cpfTerceiros === cpf) {
            mostrarStatus('O CPF do terceiro não pode ser igual ao CPF do cliente!', 'danger');
            document.getElementById('cpfTerceiros')?.focus();
            return;
        }
    }
    
    if (tipoPagamento === 'transferencia') {
        const dadosTransferencia = getValue('dadosTransferencia').trim();
        if (!dadosTransferencia) {
            mostrarStatus('Informe os detalhes da transferência!', 'danger');
            document.getElementById('dadosTransferencia')?.focus();
            return;
        }
    }
    
    const bancoSelecionado = getValue('banco');
    if (!bancoSelecionado) {
        mostrarStatus('Banco é obrigatório!', 'danger');
        document.getElementById('banco')?.focus();
        return;
    }
    
    const valorCartaoStr = getValue('valorCartao');
    const valorCartao = parseValor(valorCartaoStr);
    if (!valorCartaoStr || valorCartao <= 0) {
        mostrarStatus('Valor do Cartão é obrigatório e deve ser maior que zero!', 'danger');
        document.getElementById('valorCartao')?.focus();
        return;
    }
    
    const parcelasValue = getValue('parcelas');
    const parcelas = parseInt(parcelasValue);
    if (isNaN(parcelas) || parcelas < 1 || parcelas > 120) {
        mostrarStatus('Quantidade de parcelas deve ser entre 1 e 120!', 'danger');
        document.getElementById('parcelas')?.focus();
        return;
    }
    
    const valorEmprestadoStr = getValue('valorEmprestado');
    const valorEmprestado = parseValor(valorEmprestadoStr);
    if (!valorEmprestadoStr || valorEmprestado <= 0) {
        mostrarStatus('Valor Emprestado é obrigatório e deve ser maior que zero!', 'danger');
        document.getElementById('valorEmprestado')?.focus();
        return;
    }
    
    if (valorEmprestado > valorCartao) {
        mostrarStatus('Valor Emprestado não pode ser maior que o Valor do Cartão!', 'danger');
        document.getElementById('valorEmprestado')?.focus();
        return;
    }
    
    const btnSubmit = document.getElementById('btnSubmit');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';
    }
    
    try {
        const enderecoCompleto = {
            cep: getValue('cep'),
            logradouro: getValue('endereco'),
            numero: getValue('numeroEndereco'),
            bairro: getValue('bairro'),
            complemento: getValue('complemento'),
            cidade: getValue('cidade'),
            estado: getValue('estado'),
            completo: `${getValue('endereco')}, ${getValue('numeroEndereco')} - ${getValue('bairro')}, ${getValue('cidade')}/${getValue('estado')}`
        };
        
        const cartaoRetidoCheckbox = document.getElementById('cartaoRetido');
        const cartaoRetido = cartaoRetidoCheckbox ? cartaoRetidoCheckbox.checked : false;
        const bandeiraSelecionada = getValue('bandeiraCartao');
        const bandeiraFinal = bandeiraSelecionada === 'Outros' ? 
            getValue('bandeiraOutros') : bandeiraSelecionada;
        
        const dadosCartaoRetido = cartaoRetido ? {
            retido: true,
            bandeira: bandeiraFinal,
            ultimosDigitos: getValue('ultimosDigitos'),
            dataRetirada: getValue('dataRetirada'),
            observacao: getValue('observacaoCartao'),
            dataDevolucao: null,
            statusDevolucao: 'retido'
        } : {
            retido: false
        };
        
        const bancoElement = document.getElementById('banco');
        const bancoFinal = bancoSelecionado === 'outros' ? 
            getValue('bancoOutros') : 
            (bancoElement ? bancoElement.options[bancoElement.selectedIndex]?.text : '');
        
        const valorParcelas = parcelas > 0 ? valorCartao / parcelas : 0;
        
        const dadosPagamento = {
            tipo: tipoPagamento
        };
        
        if (tipoPagamento === 'pix') {
            dadosPagamento.pix = getValue('pix');
            dadosPagamento.beneficiario = {
                tipo: tipoBeneficiario || 'mesmo_titular',
                nome: getValue('nomeBeneficiario')
            };
            
            if (tipoBeneficiario === 'terceiros') {
                dadosPagamento.beneficiario.cpf = cpfTerceiros;
            }
        } else if (tipoPagamento === 'transferencia') {
            dadosPagamento.dadosTransferencia = getValue('dadosTransferencia');
        }
        
        const dadosContrato = {
            numeroContrato: getValue('numeroContrato'),
            statusValorCartao: getValue('statusValorCartao', 'processamento'),
            statusValorEmprestado: getValue('statusValorEmprestado', 'processamento'),
            tipoVenda: tipoVenda,
            tipoVendaNome: tipoVendaMap[tipoVenda] || tipoVenda,
            dataContrato: dataContrato,
            nome: nome.toUpperCase(),
            cpf: cpf,
            telefone: getValue('numero').replace(/\D/g, ''),
            endereco: enderecoCompleto,
            pagamento: dadosPagamento,
            banco: bancoFinal,
            valorCartao: valorCartao,
            parcelas: parcelas,
            valorParcelas: valorParcelas,
            valorEmprestado: valorEmprestado,
            lucro: valorCartao - valorEmprestado,
            cartaoRetido: dadosCartaoRetido,
            dataCadastro: firebase.firestore.FieldValue.serverTimestamp(),
            dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const fichaFile = document.getElementById('fichaCliente')?.files[0];
        const docFile = document.getElementById('documentoCliente')?.files[0];
        
        if (fichaFile) {
            dadosContrato.fichaUrl = await uploadImagemParaImgBB(fichaFile);
        }
        if (docFile) {
            dadosContrato.documentoUrl = await uploadImagemParaImgBB(docFile);
        }
        
        await db.collection('contratos').add(dadosContrato);
        contratosExistentes.push(dadosContrato.numeroContrato);
        
        if (cartaoRetido) {
            mostrarStatus('✅ Contrato cadastrado com sucesso! Cartão registrado como RETIDO.', 'warning');
        } else {
            mostrarStatus('✅ Contrato cadastrado com sucesso!', 'success');
        }
        
        limparFormulario();
        gerarNumeroContrato();
        
    } catch (error) {
        console.error('Erro ao salvar contrato:', error);
        mostrarStatus('❌ Erro ao cadastrar: ' + error.message, 'danger');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="bi bi-check-circle"></i> Cadastrar Contrato';
        }
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
    const cpf = document.getElementById('searchCPF')?.value.replace(/\D/g, '') || '';
    const nome = (document.getElementById('searchNome')?.value || '').toUpperCase();
    const telefone = document.getElementById('searchTelefone')?.value.replace(/\D/g, '') || '';
    const contrato = document.getElementById('searchContrato')?.value || '';
    const statusCartao = document.getElementById('searchStatusCartao')?.value || '';
    const statusEmprestado = document.getElementById('searchStatusEmprestado')?.value || '';
    const tipoVenda = document.getElementById('searchTipoVenda')?.value || '';
    const dataInicio = document.getElementById('searchDataInicio')?.value || '';
    const dataFim = document.getElementById('searchDataFim')?.value || '';
    const cartaoRetido = document.getElementById('searchCartaoRetido')?.checked || false;
    
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
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="14" class="text-center py-4">Nenhum contrato encontrado</td></tr>';
            return;
        }
        
        let totalCartoes = 0, totalEmprestado = 0, totalLucro = 0, totalCartoesRetidos = 0;
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            
            const statusCartaoClass = `status-cartao-${dados.statusValorCartao || 'processamento'}`;
            const statusCartaoTexto = {
                'processamento': 'Processamento',
                'recebido': 'Recebido',
                'cancelado': 'Cancelado'
            }[dados.statusValorCartao] || 'Processamento';
            
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
            
            const valorCartaoFormatado = (dados.valorCartao || 0).toFixed(2).replace('.', ',');
            const valorParcelaFormatado = (dados.valorParcelas || 0).toFixed(2).replace('.', ',');
            const valorEmprestadoFormatado = (dados.valorEmprestado || 0).toFixed(2).replace('.', ',');
            
            tbody.innerHTML += `
                <tr class="${rowClass}">
                    <td><strong>${dados.numeroContrato}</strong></td>
                    <td>${dados.nome}</td>
                    <td class="cpf-mask">${mascararCPF(dados.cpf)}</td>
                    <td class="tel-mask">${mascararTelefone(dados.telefone)}</td>
                    <td><span class="tipo-venda-badge ${tipoVendaClass}">${tipoVendaNome}</span></td>
                    <td>R$ ${valorCartaoFormatado}</td>
                    <td>R$ ${valorParcelaFormatado}</td>
                    <td>R$ ${valorEmprestadoFormatado}</td>
                    <td>${dados.parcelas || 0}x</td>
                    <td>${cartaoInfo}</td>
                    <td><span class="badge badge-status ${statusCartaoClass}">${statusCartaoTexto}</span></td>
                    <td><span class="badge badge-status ${statusEmprestadoClass}">${statusEmprestadoTexto}</span></td>
                    <td>${data}</td>
                    <td style="white-space: nowrap;">
                        <div class="d-flex gap-1 align-items-center">
                            <button class="btn btn-info btn-sm" onclick="verDetalhes('${doc.id}')" title="Ver detalhes">
                                <i class="bi bi-eye"></i>
                            </button>
                            
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-warning btn-sm dropdown-toggle" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" title="Alterar Status Cartão">
                                    <i class="bi bi-credit-card"></i>
                                </button>
                                <ul class="dropdown-menu" style="z-index: 99999 !important;">
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); event.preventDefault(); atualizarStatusCartao('${doc.id}', 'recebido'); return false;">
                                        <i class="bi bi-check-circle text-success"></i> Recebido
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); event.preventDefault(); atualizarStatusCartao('${doc.id}', 'cancelado'); return false;">
                                        <i class="bi bi-x-circle text-danger"></i> Cancelar
                                    </a></li>
                                </ul>
                            </div>
                            
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-info btn-sm dropdown-toggle" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false" title="Alterar Status Empréstimo">
                                    <i class="bi bi-cash"></i>
                                </button>
                                <ul class="dropdown-menu" style="z-index: 99999 !important;">
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); event.preventDefault(); atualizarStatusEmprestado('${doc.id}', 'pago'); return false;">
                                        <i class="bi bi-check-circle text-success"></i> Pago
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="event.stopPropagation(); event.preventDefault(); atualizarStatusEmprestado('${doc.id}', 'cancelado'); return false;">
                                        <i class="bi bi-x-circle text-danger"></i> Cancelar
                                    </a></li>
                                </ul>
                            </div>
                            
                            ${dados.cartaoRetido?.retido && dados.cartaoRetido?.statusDevolucao === 'retido' ? `
                                <button class="btn btn-success btn-sm" onclick="registrarDevolucao('${doc.id}')" title="Registrar devolução">
                                    <i class="bi bi-arrow-return-left"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
        
        const totalCartoesFormatado = totalCartoes.toFixed(2).replace('.', ',');
        const totalEmprestadoFormatado = totalEmprestado.toFixed(2).replace('.', ',');
        
        tbody.innerHTML += `
            <tr class="table-active fw-bold">
                <td colspan="5">TOTAIS (${snapshot.size} contratos | ${totalCartoesRetidos} cartões retidos)</td>
                <td>R$ ${totalCartoesFormatado}</td>
                <td></td>
                <td>R$ ${totalEmprestadoFormatado}</td>
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
        if (!doc.exists) return;
        
        const dados = doc.data();
        const modalBody = document.getElementById('detalhesContrato');
        if (!modalBody) return;
        
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
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ========== RELATÓRIOS ==========
function atualizarCamposRelatorio() {
    const tipo = document.getElementById('relatorioTipo')?.value;
    if (!tipo) return;
    
    const relatorioMes = document.getElementById('relatorioMes');
    const relatorioDataInicio = document.getElementById('relatorioDataInicio');
    const relatorioDataFim = document.getElementById('relatorioDataFim');
    const divTipoVendaRelatorio = document.getElementById('divTipoVendaRelatorio');
    
    if (relatorioMes) relatorioMes.style.display = tipo === 'mensal' ? 'block' : 'none';
    if (relatorioDataInicio) relatorioDataInicio.style.display = tipo === 'periodo' ? 'block' : 'none';
    if (relatorioDataFim) relatorioDataFim.style.display = tipo === 'periodo' ? 'block' : 'none';
    if (divTipoVendaRelatorio) divTipoVendaRelatorio.style.display = tipo === 'tipo_venda' ? 'block' : 'none';
}

async function gerarRelatorio() {
    const tipo = document.getElementById('relatorioTipo')?.value;
    if (!tipo) return;
    
    let query = db.collection('contratos');
    
    if (tipo === 'mensal') {
        const mes = document.getElementById('relatorioMes')?.value;
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
        const inicio = document.getElementById('relatorioDataInicio')?.value;
        const fim = document.getElementById('relatorioDataFim')?.value;
        if (inicio) query = query.where('dataContrato', '>=', inicio);
        if (fim) query = query.where('dataContrato', '<=', fim);
    } else if (tipo === 'tipo_venda') {
        const tipoVenda = document.getElementById('relatorioTipoVenda')?.value;
        if (tipoVenda) query = query.where('tipoVenda', '==', tipoVenda);
    }
    
    query = query.orderBy('dataContrato', 'desc');
    
    try {
        const snapshot = await query.get();
        const tbody = document.getElementById('dadosRelatorio');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalCartoes = 0, totalEmprestado = 0, totalLucro = 0;
        let cartoesRetidosPendentes = 0, cartoesDevolvidos = 0, cartoesRetidosTotal = 0;
        
        const porTipoVenda = {};
        
        snapshot.forEach(doc => {
            const dados = doc.data();
            
            totalCartoes += dados.valorCartao || 0;
            totalEmprestado += dados.valorEmprestado || 0;
            totalLucro += dados.lucro || 0;
            
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
                    <td>${statusCartaoTexto} / ${statusEmprestadoTexto}</td>
                    <td>${dados.dataContrato}</td>
                </tr>
            `;
        });
        
        if (tipo === 'completo' && Object.keys(porTipoVenda).length > 0) {
            tbody.innerHTML += `
                <tr class="table-secondary fw-bold">
                    <td colspan="11">RESUMO POR TIPO DE VENDA</td>
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
                        <td colspan="3"></td>
                    </tr>
                `;
            });
        }
        
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
    
    if (!statusDiv || !statusMessage) return;
    
    statusDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    statusMessage.innerHTML = mensagem;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function limparFormulario() {
    const form = document.getElementById('formEmprestimo');
    if (form) form.reset();
    
    const previewFicha = document.getElementById('previewFicha');
    const previewDocumento = document.getElementById('previewDocumento');
    if (previewFicha) previewFicha.style.display = 'none';
    if (previewDocumento) previewDocumento.style.display = 'none';
    
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
    
    document.getElementById('flagEnderecoManual').checked = false;
    document.getElementById('radioMesmoTitular').checked = true;
    document.getElementById('radioPix').checked = true;
    
    document.getElementById('statusValorCartao').value = 'processamento';
    document.getElementById('statusValorEmprestado').value = 'processamento';
    
    document.getElementById('cpfTerceiros').value = '';
    document.getElementById('dadosTransferencia').value = '';
    document.getElementById('nomeBeneficiario').readOnly = true;
    document.getElementById('nomeBeneficiario').style.backgroundColor = '#f8f9fa';
    
    gerarNumeroContrato();
}

function desabilitarSistema() {
    const tabButtons = document.querySelectorAll('#myTab .nav-link');
    tabButtons.forEach(button => {
        if (button.id !== 'cadastro-tab') {
            button.classList.add('disabled');
            button.setAttribute('disabled', 'disabled');
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';
        }
    });
    
    const inputs = document.querySelectorAll('#formEmprestimo input, #formEmprestimo select, #formEmprestimo button, #formEmprestimo textarea');
    inputs.forEach(input => {
        input.disabled = true;
        input.style.pointerEvents = 'none';
    });
    
    document.querySelectorAll('.upload-area').forEach(area => {
        area.style.pointerEvents = 'none';
        area.style.opacity = '0.5';
        area.style.cursor = 'not-allowed';
    });
}
