// Configuração do Supabase
const SUPABASE_URL = 'https://whxlgangulxkmrrzoygu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeGxnYW5ndWx4a21ycnpveWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDU3MDcsImV4cCI6MjA3NjI4MTcwN30.j5mnEJN9If4QbB_okYEvWMzH_faQWgWg7B1MlqpuJrI';

// Inicializar Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Testar conexão com Supabase
async function testSupabase() {
    try {
        const { data, error } = await supabase.from('usuarios').select('email').limit(1);
        if (error) throw error;
        console.log('Conexão com Supabase OK:', data);
    } catch (err) {
        console.error('Erro ao conectar com Supabase:', err.message);
    }
}
testSupabase();

// Aguardar o DOM
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toastContainer = document.getElementById('toast-container');

    // Sistema de Toast (substituindo emojis por texto para evitar erro de codificação)
    function showToast(type, title, message) {
        if (!toastContainer) {
            console.error('Erro: toastContainer não encontrado.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'Sucesso', error: 'Erro', info: 'Info' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">X</button>
        `;
        toastContainer.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
        setTimeout(() => removeToast(toast), 5000);
    }

    function removeToast(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }

    // Alternar tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loginForm.classList.toggle('active', tab === 'login');
            registerForm.classList.toggle('active', tab === 'register');
        });
    });

    // Validação de email
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Loading do botão
    function setButtonLoading(button, isLoading) {
        button.classList.toggle('loading', isLoading);
        button.disabled = isLoading;
    }

    // Cadastro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Evento de submit do cadastro disparado'); // Log para depuração

        const submitBtn = registerForm.querySelector('.btn-submit');
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const acceptTerms = document.getElementById('accept-terms').checked;

        console.log('Dados do formulário:', { name, email, password, confirmPassword, acceptTerms }); // Log dos valores

        // Validações
        if (name.length < 3) {
            console.log('Erro: Nome curto');
            return showToast('error', 'Erro', 'Nome deve ter pelo menos 3 caracteres.');
        }
        if (!isValidEmail(email)) {
            console.log('Erro: E-mail inválido');
            return showToast('error', 'Erro', 'E-mail inválido.');
        }
        if (password.length < 6) {
            console.log('Erro: Senha curta');
            return showToast('error', 'Erro', 'Senha deve ter 6+ caracteres.');
        }
        if (password !== confirmPassword) {
            console.log('Erro: Senhas não coincidem');
            return showToast('error', 'Erro', 'Senhas não coincidem.');
        }
        if (!acceptTerms) {
            console.log('Erro: Termos não aceitos');
            return showToast('error', 'Erro', 'Aceite os termos.');
        }

        setButtonLoading(submitBtn, true);

        try {
            console.log('Verificando e-mail duplicado...');
            const { data: existing, error: checkError } = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Erro ao verificar e-mail:', checkError.message);
                throw new Error('Erro ao verificar e-mail: ' + checkError.message);
            }
            if (existing) {
                console.log('E-mail já cadastrado');
                return showToast('error', 'Erro', 'Este e-mail já está cadastrado.');
            }

            console.log('Criando usuário no Supabase Auth...');
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });

            if (authError) {
                console.error('Erro no signUp:', authError.message);
                throw new Error(authError.message);
            }
            if (!authData.user) {
                console.error('Usuário não criado:', authData);
                throw new Error('Falha ao criar usuário.');
            }

            console.log('Usuário criado com ID:', authData.user.id);

            console.log('Inserindo na tabela usuarios...');
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert({ id: authData.user.id, email, nome: name, tipo: 'cliente' });

            if (insertError) {
                console.error('Erro ao inserir na tabela usuarios:', insertError.message);
                throw new Error(insertError.message);
            }

            console.log('Usuário inserido na tabela usuarios');
            showToast('success', 'Conta criada!', 'Confirme seu e-mail para ativar sua conta.');
            registerForm.reset();

            setTimeout(() => {
                tabButtons[0].click();
                showToast('info', 'Pronto!', 'Faça login com sua nova conta.');
            }, 2000);

        } catch (error) {
            console.error('Erro geral no cadastro:', error.message);
            showToast('error', 'Erro no cadastro', error.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Login com email/senha (mantido igual)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('.btn-submit');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!isValidEmail(email)) return showToast('error', 'Erro', 'E-mail inválido.');
        if (password.length < 6) return showToast('error', 'Erro', 'Senha deve ter 6+ caracteres.');

        setButtonLoading(submitBtn, true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (rememberMe) localStorage.setItem('auth_remember', 'true');
            showToast('success', 'Sucesso!', 'Redirecionando...');

            setTimeout(() => {
                window.location.href = '../site-completo/index.html';
            }, 1500);
        } catch (error) {
            showToast('error', 'Erro no login', error.message);
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Login com Google
    document.querySelector('.btn-google').addEventListener('click', async () => {
        try {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/site-completo/index.html`
                }
            });
        } catch (error) {
            showToast('error', 'Erro', 'Falha no login com Google.');
        }
    });

    // Esqueceu a senha
    document.querySelector('.forgot-password').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();

        if (!isValidEmail(email)) {
            return showToast('error', 'Erro', 'Insira um e-mail válido primeiro.');
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            if (error) throw error;
            showToast('success', 'E-mail enviado!', 'Verifique sua caixa de entrada.');
        } catch (error) {
            showToast('error', 'Erro', error.message);
        }
    });
});