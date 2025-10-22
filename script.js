// Configuração do Supabase
const SUPABASE_URL = 'https://whxlgangulxkmrrzoygu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoeGxnYW5ndWx4a21ycnpveWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDU3MDcsImV4cCI6MjA3NjI4MTcwN30.j5mnEJN9If4QbB_okYEvWMzH_faQWgWg7B1MlqpuJrI';

// Inicializar Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Aguardar o DOM carregar completamente antes de definir elementos
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM (agora dentro do DOMContentLoaded)
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toastContainer = document.getElementById('toast-container');

    // Sistema de Toast Notifications
    function showToast(type, title, message) {
        // Verificação de segurança: se toastContainer não existe, logar erro e sair
        if (!toastContainer) {
            console.error('Erro: toastContainer não encontrado no DOM. Verifique se <div id="toast-container"></div> existe no HTML.');
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remover ao clicar no X
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            removeToast(toast);
        }, 5000);
    }

    function removeToast(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    // Alternar entre tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            
            // Atualizar botões ativos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualizar formulários ativos
            if (tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    });

    // Validação de email
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // Loading state do botão
    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Login com email e senha
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('.btn-submit');
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        // Validação básica
        if (!isValidEmail(email)) {
            showToast('error', 'Erro de validação', 'Por favor, insira um e-mail válido.');
            return;
        }
        
        if (password.length < 6) {
            showToast('error', 'Erro de validação', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        setButtonLoading(submitBtn, true);
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) {
                throw error;
            }
            
            // Salvar token se "Lembrar-me" estiver marcado
            if (rememberMe) {
                localStorage.setItem('auth_remember', 'true');
            }
            
            showToast('success', 'Login realizado!', 'Redirecionando para o painel...');
            
            // Redirecionar após sucesso
            setTimeout(() => {
                window.location.href = '../site-completo/index.html';
            }, 1500);
            
        } catch (error) {
            console.error('Erro no login:', error);
            showToast('error', 'Erro no login', error.message || 'Ocorreu um erro ao fazer login. Tente novamente.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Cadastro de novo usuário
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = registerForm.querySelector('.btn-submit');
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const acceptTerms = document.getElementById('accept-terms').checked;
        
        // Validações
        if (name.length < 3) {
            showToast('error', 'Erro de validação', 'Nome deve ter pelo menos 3 caracteres.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showToast('error', 'Erro de validação', 'Por favor, insira um e-mail válido.');
            return;
        }
        
        if (password.length < 6) {
            showToast('error', 'Erro de validação', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('error', 'Erro de validação', 'As senhas não coincidem.');
            return;
        }
        
        if (!acceptTerms) {
            showToast('error', 'Erro de validação', 'Você deve aceitar os termos de uso.');
            return;
        }
        
        setButtonLoading(submitBtn, true);
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            // Criar registro na tabela de usuários
            const { error: profileError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        email: email,
                        nome: name,
                        tipo: 'cliente'
                    }
                ]);
                
            if (profileError) {
                throw profileError;
            }
            
            showToast('success', 'Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.');
            
            // Limpar formulário
            registerForm.reset();
            
            // Mudar para tab de login após 2 segundos
            setTimeout(() => {
                tabButtons[0].click();
                showToast('info', 'Faça login', 'Agora você pode fazer login com sua nova conta.');
            }, 2000);
            
        } catch (error) {
            console.error('Erro no cadastro:', error);
            showToast('error', 'Erro no cadastro', error.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.');
        } finally {
            setButtonLoading(submitBtn, false);
        }
    });

    // Login com Google
    document.querySelector('.btn-google').addEventListener('click', async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/site-completo/index.html'
                }
            });
            
            if (error) {
                throw error;
            }
            
        } catch (error) {
            console.error('Erro no login com Google:', error);
            showToast('error', 'Erro', 'Não foi possível fazer login com Google.');
        }
    });

    // Link "Esqueceu a senha?"
    document.querySelector('.forgot-password').addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        
        if (!isValidEmail(email)) {
            showToast('error', 'E-mail necessário', 'Por favor, insira seu e-mail no campo acima primeiro.');
            return;
        }
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password.html',
            });
            
            if (error) {
                throw error;
            }
            
            showToast('success', 'E-mail enviado', 'Verifique sua caixa de entrada para redefinir sua senha.');
            
        } catch (error) {
            console.error('Erro ao recuperar senha:', error);
            showToast('error', 'Erro', 'Não foi possível enviar o e-mail de recuperação.');
        }
    });

    // Verificar se usuário já está logado ao carregar a página
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Usuário já está logado, redirecionar
        showToast('info', 'Já autenticado', 'Redirecionando...');
        setTimeout(() => {
            window.location.href = '../site-completo/index.html';
        }, 1000);
    }

    // Monitorar mudanças na autenticação
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            console.log('Usuário logado:', session.user);
        } else if (event === 'SIGNED_OUT') {
            console.log('Usuário deslogado');
        }
    });

    // Prevenir múltiplos submits
    [loginForm, registerForm].forEach(form => {
        form.addEventListener('submit', (e) => {
            const submitBtn = form.querySelector('.btn-submit');
            if (submitBtn.classList.contains('loading')) {
                e.preventDefault();
            }
        });
    });

    console.log('🍂 Página de Login Outono Dourado carregada!');
    console.log('📝 Para habilitar a integração com Supabase:');
    console.log('1. Configure SUPABASE_URL e SUPABASE_ANON_KEY');
    console.log('2. Descomente as linhas marcadas com "Quando integrar com Supabase"');
});