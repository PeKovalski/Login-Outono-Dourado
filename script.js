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

// ... (o restante do código até o evento de submit do registerForm)

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
            throw new Error(authError.message);
        }

        // Verificar se o usuário foi criado
        if (!authData.user) {
            throw new Error('Falha ao criar usuário. Tente novamente.');
        }

        // Inserir na tabela usuarios
        const { error: profileError } = await supabase
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id, // Usar o ID do usuário criado
                    email: email,
                    nome: name,
                    tipo: 'cliente',
                },
            ]);

        if (profileError) {
            throw new Error(profileError.message);
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
        console.error('Erro no cadastro:', error.message);
        showToast('error', 'Erro no cadastro', error.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});