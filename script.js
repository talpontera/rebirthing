document.addEventListener('DOMContentLoaded', function() {
    // Sessions Data
    const upcomingSessions = [
        
        {
            date: '14.12.24',
            type: 'שבת ערב',
            icon: 'moon',
            time: '19:30-22:00'
        },
        {
            date: '27.12.24',
            type: 'שישי צהריים',
            icon: 'sun',
            time: '11:30-14:00'
        },
        {
            date: '4.1.25',
            type: 'חמישי ערב',
            icon: 'moon',
            time: '19:30-22:00'
        },
        {
            date: '11.1.25',
            type: 'חמישי ערב',
            icon: 'moon',
            time: '19:30-22:00'
        }
    ];

    // Render sessions
    function renderSessions() {
        const sessionsGrid = document.querySelector('.sessions-grid');
        if (!sessionsGrid) return;

        // Render sessions grid
        sessionsGrid.innerHTML = upcomingSessions.map(session => `
            <div class="session-card">
                <div class="session-date">${session.date}</div>
                <div class="session-details">
                    <div class="session-type">
                        <i class="fas fa-${session.icon}"></i>
                        <span>${session.type}</span>
                    </div>
                    <div class="session-time">
                        <i class="far fa-clock"></i>
                        <span>${session.time}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Update radio buttons in the form
        const radioGroup = document.querySelector('.radio-group');
        if (radioGroup) {
            radioGroup.innerHTML = upcomingSessions.map((session, index) => `
                <label class="radio-label">
                    <input type="radio" name="session" value="${session.date}" ${index === 0 ? 'required' : ''}>
                    <span>${session.date} | ${session.type} | ${session.time}</span>
                </label>
            `).join('');
        }
    }

    // Initialize sessions
    renderSessions();

    // Constants
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwA8qXPJqwAZToVQINyQtz1xcq9QzGfEuMFruO25-QntaUj7okKBWxUPNexat9d8U4/exec';
    
    // DOM Elements
    const form = document.getElementById('registrationForm');
    const submitButton = form.querySelector('.submit-button');
    
    // Form Validation Functions
    const validators = {
        phone: (phone) => /^05\d{8}$/.test(phone),
        email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        name: (name) => name.trim().length >= 2 && /^[\u0590-\u05FFa-zA-Z\s]{2,}$/.test(name)
    };
    
    // UI Helper Functions
    function showError(inputElement, message) {
        clearError(inputElement);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.opacity = '0';
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
        
        requestAnimationFrame(() => {
            errorDiv.style.opacity = '1';
            errorDiv.style.display = 'block';
        });
    }

    function clearError(inputElement) {
        const errorDiv = inputElement.nextElementSibling;
        if (errorDiv?.classList.contains('error-message')) {
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }

    function showSuccess(message) {
        // Remove any existing success message
        const existingSuccess = form.querySelector('.form-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Hide submit button
        submitButton.style.display = 'none';

        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.textContent = message;
        
        // Insert after submit button
        submitButton.parentNode.insertBefore(successDiv, submitButton.nextSibling);
        
        // Force reflow
        successDiv.offsetHeight;
        
        // Show the message
        successDiv.classList.add('visible');

        // Remove after 60 seconds (1 minute) and show button again
        setTimeout(() => {
            successDiv.classList.remove('visible');
            setTimeout(() => {
                successDiv.remove();
                submitButton.style.display = 'block';
            }, 300);
        }, 60000);
    }

    // Form Submission Handler
    async function handleSubmit(event) {
        event.preventDefault();
        let isValid = true;
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            session: document.querySelector('input[name="session"]:checked')?.value,
            experience: document.querySelector('input[name="experience"]:checked')?.value,
            health: document.querySelector('input[name="health"]:checked')?.value,
            healthInfo: document.getElementById('health-info').value,
            submissionDate: new Date().toISOString()
        };

        // Validate all required fields
        if (!validators.name(formData.name)) {
            showError(document.getElementById('name'), 'נא להזין שם מלא בעברית או באנגלית');
            isValid = false;
        }
        if (!validators.phone(formData.phone)) {
            showError(document.getElementById('phone'), 'נא להזין מספר טלפון נייד תקין');
            isValid = false;
        }
        if (!validators.email(formData.email)) {
            showError(document.getElementById('email'), 'נא להזין כתובת אימייל תקינה');
            isValid = false;
        }
        if (!formData.session) {
            showError(document.querySelector('input[name="session"]'), 'נא לבחור מועד');
            isValid = false;
        }

        if (isValid) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            try {
                // Save to Google Sheets
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData),
                    mode: 'no-cors'
                });

                showSuccess('תודה על ההרשמה! ניצור איתך קשר בהקדם');
                form.reset();
                resetHealthInfoField();
            } catch (error) {
                console.error('Submission error:', error);
                showError(submitButton, 'אירעה שגיאה בשליחת הטופס. אנא נסו שוב.');
            } finally {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        }
    }

    // Helper Functions
    function resetHealthInfoField() {
        const healthInfoGroup = document.getElementById('health-info').closest('.form-group');
        if (healthInfoGroup) {
            healthInfoGroup.style.display = 'none';
        }
    }

    // Event Listeners
    form.addEventListener('submit', handleSubmit);

    document.querySelectorAll('input[name="health"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const healthInfoGroup = document.getElementById('health-info').closest('.form-group');
            healthInfoGroup.style.display = this.value === 'other' ? 'block' : 'none';
            healthInfoGroup.style.opacity = this.value === 'other' ? '1' : '0';
        });
    });
}); 