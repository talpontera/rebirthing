document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const ZAPIER_WEBHOOK_URL = 'YOUR_ZAPIER_WEBHOOK_URL'; // Replace with your Zapier webhook URL
    
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Scroll reveal animation
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('scroll-reveal');
        observer.observe(section);
    });

    // Form validation
    function validatePhone(phone) {
        const phoneRegex = /^05\d{8}$/;
        return phoneRegex.test(phone);
    }

    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validateName(name) {
        return name.trim().length >= 2 && /^[\u0590-\u05FFa-zA-Z\s]{2,}$/.test(name);
    }

    function showError(inputElement, message) {
        clearError(inputElement);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.opacity = '0';
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
        
        // Trigger animation
        requestAnimationFrame(() => {
            errorDiv.style.opacity = '1';
            errorDiv.style.display = 'block';
        });
    }

    function clearError(inputElement) {
        const errorDiv = inputElement.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.remove();
            }, 300);
        }
    }

    // Show success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success';
        successDiv.textContent = message;
        form.insertBefore(successDiv, form.firstChild);
        
        successDiv.style.opacity = '0';
        requestAnimationFrame(() => {
            successDiv.style.display = 'block';
            successDiv.style.opacity = '1';
        });

        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                successDiv.remove();
            }, 300);
        }, 5000);
    }

    // Form submission handler with Zapier integration
    async function handleSubmit(event) {
        event.preventDefault();
        let isValid = true;
        const submitButton = form.querySelector('.submit-button');
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            session: document.querySelector('input[name="session"]:checked')?.value,
            experience: document.querySelector('input[name="experience"]:checked')?.value,
            health: document.querySelector('input[name="health"]:checked')?.value,
            healthInfo: document.getElementById('health-info').value,
            submissionDate: new Date().toISOString(),
            source: window.location.href
        };

        // Validate required fields
        if (!validateName(formData.name)) {
            showError(document.getElementById('name'), 'נא להזין שם מלא בעברית או באנגלית');
            isValid = false;
        }

        if (!validatePhone(formData.phone)) {
            showError(document.getElementById('phone'), 'נא להזין מספר טלפון נייד תקין');
            isValid = false;
        }

        if (!validateEmail(formData.email)) {
            showError(document.getElementById('email'), 'נא להזין כתובת אימייל תקינה');
            isValid = false;
        }

        if (!formData.session) {
            showError(document.querySelector('input[name="session"]').parentNode, 'נא לבחור מועד');
            isValid = false;
        }

        if (isValid) {
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            try {
                // Send data to Zapier
                const response = await fetch(ZAPIER_WEBHOOK_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                // Handle successful submission
                showSuccess('תודה על ההרשמה! ניצור איתך קשר בהקדם');
                form.reset();

                // Reset health info field visibility
                const healthInfoGroup = document.getElementById('health-info').closest('.form-group');
                healthInfoGroup.style.display = 'none';

                // Smooth scroll to success message
                window.scrollTo({
                    top: form.offsetTop - 100,
                    behavior: 'smooth'
                });

                // Optional: Track conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submission', {
                        'event_category': 'Forms',
                        'event_label': formData.session
                    });
                }

            } catch (error) {
                console.error('Submission error:', error);
                showError(submitButton, 'אירעה שגיאה בשליחת הטופס. אנא נסו שנית מאוחר יותר.');
            } finally {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        }
    }

    form.addEventListener('submit', handleSubmit);

    // Real-time validation
    const inputs = form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"]');
    inputs.forEach(input => {
        let timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                switch(this.id) {
                    case 'name':
                        if (this.value && !validateName(this.value)) {
                            showError(this, 'נא להזין שם מלא בעברית או באנגלית');
                        } else {
                            clearError(this);
                        }
                        break;
                    case 'phone':
                        if (this.value && !validatePhone(this.value)) {
                            showError(this, 'נא להזין מספר טלפון נייד תקין');
                        } else {
                            clearError(this);
                        }
                        break;
                    case 'email':
                        if (this.value && !validateEmail(this.value)) {
                            showError(this, 'נא להזין כתובת אימייל תקינה');
                        } else {
                            clearError(this);
                        }
                        break;
                }
            }, 500);
        });
    });

    // Show/hide additional health info field based on health selection
    document.querySelectorAll('input[name="health"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const healthInfoGroup = document.getElementById('health-info').closest('.form-group');
            if (this.value === 'other') {
                healthInfoGroup.style.display = 'block';
                healthInfoGroup.style.opacity = '1';
            } else {
                healthInfoGroup.style.opacity = '0';
                setTimeout(() => {
                    healthInfoGroup.style.display = 'none';
                }, 300);
            }
        });
    });

    // Create breathing circle
    const breathingCircle = document.createElement('div');
    breathingCircle.className = 'breathing-circle';
    document.body.appendChild(breathingCircle);

    // Add section dividers
    document.querySelectorAll('section').forEach(section => {
        const divider = document.createElement('div');
        divider.className = 'section-divider';
        section.parentNode.insertBefore(divider, section.nextSibling);
    });

    // Add musical notes to hero section
    const hero = document.querySelector('.hero');
    for (let i = 1; i <= 4; i++) {
        const note = document.createElement('div');
        note.className = `musical-note note-${i}`;
        note.innerHTML = '♪';
        hero.appendChild(note);
    }

    // Add breath indicators on scroll
    let timeout;
    window.addEventListener('scroll', () => {
        clearTimeout(timeout);
        
        timeout = setTimeout(() => {
            const indicator = document.createElement('div');
            indicator.className = 'breath-indicator';
            indicator.style.left = Math.random() * window.innerWidth + 'px';
            indicator.style.top = Math.random() * window.innerHeight + 'px';
            document.body.appendChild(indicator);
            
            setTimeout(() => {
                indicator.remove();
            }, 5000);
        }, 100);
    });

    // Add piano key animation to form inputs
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('focus', function() {
            const note = document.createElement('div');
            note.className = 'musical-note';
            note.innerHTML = '♪';
            note.style.left = Math.random() * 100 + '%';
            this.parentNode.appendChild(note);
            
            setTimeout(() => {
                note.remove();
            }, 4000);
        });
    });
}); 