
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const loginButton = document.getElementById('loginButton');
const loginMessage = document.getElementById('loginMessage');

// Show / hide password
togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.textContent = isPassword ? 'Hide' : 'Show';
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = '';
    loginMessage.className = '';

    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed.');
        }

        loginMessage.textContent = 'Login successful!';
        loginMessage.className = 'success';

        console.log('Logged in staff:', data.staff);

        // Redirect to Dashboard after successful login
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);

    } catch (error) {
        loginMessage.textContent = error.message;
        loginMessage.className = 'error';

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});
