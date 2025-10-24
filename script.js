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
        console.log('Conexão com Supabase bem-sucedida:', data);
    } catch (err) {
        console.error('Erro ao conectar com Supabase:', err.message);
    }
}
testSupabase();

// Aguardar o DOM carregar completamente antes de definir elementos
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const tabButtons = document.querySelectorAll('.tab-button');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toastContainer = document.getElementById('toast-container');

    // Sistema de Toast Notifications
    function showToast(type, title, message) {
        if (!toastContainer) {
            console.error('Erro: toastContainer não encontrado no DOM.');
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
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });
        
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
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
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
            
            if (rememberMe) {
                localStorage.setItem('auth_remember', 'true');
            }
            
            showToast('success', 'Login realizado!', 'Redirecionando para o painel...');
            
            setTimeout(() => {
                window.location.href = '../site-completo/index.html';
            }, 1500);
            
        } catch (error) {
            console.error('Erro no login:', error.message);
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

        console.log('Tentativa de cadastro:', { name, email, password, confirmPassword, acceptTerms });

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
            // Verificar se o e-mail já existe
            const { data: existingUser, error: checkError } = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .single();

            if (existingUser) {
                showToast('error', 'Erro', 'Este e-mail já está registrado.');
                return;
            }
            if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw new Error(checkError.message);
            }

            // Cadastrar usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (authError) {
                console.error('Erro na autenticação:', authError.message);
                throw new Error(authError.message);
            }

            if (!authData.user) {
                console.error('Usuário não criado:', authData);
                throw new Error('Falha ao criar usuário. Tente novamente.');
            }

            console.log('Usuário criado com sucesso:', authData.user.id);

            // Inserir na tabela usuarios
            const { error: profileError } = await supabase
                .from('usuarios')
                .insert([
                    {
                        id: authData.user.id,
                        email: email,
                        nome: name,
                        tipo: 'cliente',
                    },
                ]);

            if (profileError) {
                console.error('Erro ao inserir na tabela usuarios:', profileError.message);
                throw new Error(profileError.message);
            }

            console.log('Registro inserido na tabela usuarios');
            showToast('success', 'Conta criada!', 'Verifique seu e-mail para confirmar o cadastro.');

            // Limpar formulário
            registerForm.reset();

            // Mudar para tab de login após 2 segundos
            setTimeout(() => {
                tabButtons[0].click();
                showToast('info', 'Faça login', 'Agora você pode fazer login com sua nova conta.');
            }, 2000);

        } catch (error) {
            console.error('Erro no cadastro:', error.message);
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
            console.error('Erro no login com Google:', error.message);
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
            console.error('Erro ao recuperar senha:', error.message);
            showToast('error', 'Erro', '