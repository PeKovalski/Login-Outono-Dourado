// Configuração do Supabase
const SUPABASE_URL = 'https://whxlgangulxkmrrzoygu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeGxnYW5ndWx4a21ycnpveWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDU3MDcsImV4cCI6MjA3NjI4MTcwN30.j5mnEJN9If4QbB_okYEvWMzH_faQWgWg7B1MlqpuJrI';

// Inicializar Supabase
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Testar conexão com Supabase
async function testSupabase() {
    try {
        const { data, error } = await supabase.from('usuarios').select('email').limit(1);
        if (error) throw error;
        console.log('Conexão com Supabase bem-sucedida:', data);
    } catch (err) {
        console.error('Erro ao conectar com Supabase:', err.message);
    }
}
testSupabase();

// Aguardar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toastContainer = document.getElementById('toast-container');

    // Sistema de Toast
    function showToast(type, title, message) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: 'Checkmark', error: 'Cross', info: 'Info' };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
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

    // Login com email/senha
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = loginForm.querySelector('.btn-submit');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!isValidEmail(email)) return showToast('error', 'Erro', 'E-mail inválido.');
        if (password.length < 6) return showToast('error', 'Erro', 'Senha deve ter pelo menos 6 caracteres.');

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

    // Cadastro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = registerForm.querySelector('.btn-submit');
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const acceptTerms = document.getElementById('accept-terms').checked;

        if (name.length < 3) return showToast('error', 'Erro', 'Nome deve ter pelo menos 3 caracteres.');
        if (!isValidEmail(email)) return showToast('error', 'Erro', 'E-mail inválido.');
        if (password.length < 6) return showToast('error', 'Erro', 'Senha deve ter 6+ caracteres.');
        if (password !== confirmPassword) return showToast('error', 'Erro', 'Senhas não coincidem.');
        if (!acceptTerms) return showToast('error', 'Erro', 'Aceite os termos.');

        setButtonLoading(submitBtn, true);

        try {
            // Verificar duplicidade
            const { data: existing, error: checkError } = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .maybeSingle();

            if (existing) return showToast('error', 'Erro', 'Este e-mail já está cadastrado.');

            // Criar usuário
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: name } }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Falha ao criar usuário.');

            // Inserir na tabela usuarios
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert({ id: authData.user.id, email, nome: name, tipo: 'cliente' });

            if (insertError) throw insertError;

            showToast('success', 'Conta criada!', 'Confirme seu e-mail.');
            registerForm.reset();

            setTimeout(() => {
                tabButtons[0].click();
                showToast('info', 'Pronto!', 'Faça login com sua nova conta.');
            }, 2000);

        } catch (error) {
            showToast('error', 'Erro no cadastro', error.message);
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