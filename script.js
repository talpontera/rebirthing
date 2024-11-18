document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/8063579/2rr7w8s/'; // Replace with your Zapier webhook URL
    
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

    // At the top of your file, add a function to validate the webhook URL
    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Add a function to handle the response
    async function handleResponse(response) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return response.json();
        }
        return response.text(); // Fallback to text if not JSON
    }

    // Add backup email submission function
    async function sendEmailBackup(formData) {
        const EMAIL_SERVICE_URL = 'https://formsubmit.co/sabag.tal@gmail.com'; // Replace with your email
        
        try {
            const response = await fetch(EMAIL_SERVICE_URL, {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    _subject: `הרשמה חדשה למפגש נשימות ופסנתר - ${formData.name}`,
                    _template: 'table'
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Backup email submission failed:', error);
            return false;
        }
    }

    // Update the handleSubmit function to include backup
    async function handleSubmit(event) {
        event.preventDefault();
        let isValid = true;
        const submitButton = form.querySelector('.submit-button');
        
        // Validate webhook URL
        if (!isValidUrl(ZAPIER_WEBHOOK_URL)) {
            console.error('Invalid webhook URL');
            showError(submitButton, 'שגיאת תצורה. אנא צרו קשר עם מנהל האתר.');
            return;
        }

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
                // Try Zapier first
                const response = await fetch(ZAPIER_WEBHOOK_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData),
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, text/plain, */*'
                    },
                    mode: 'cors',
                    credentials: 'omit'
                });

                if (!response.ok) {
                    // If Zapier fails, try email backup
                    const emailSent = await sendEmailBackup(formData);
                    
                    if (!emailSent) {
                        throw new Error('Both primary and backup submission failed');
                    }
                    
                    // If email backup succeeded
                    showSuccess('תודה על ההרשמה! ניצור איתך קשר בהקדם');
                    form.reset();
                    return;
                }

                const data = await handleResponse(response);

                // Success handling
                showSuccess('תודה על ההרשמה! ניצור איתך קשר בהקדם');
                form.reset();

                // Reset health info field visibility
                const healthInfoGroup = document.getElementById('health-info').closest('.form-group');
                if (healthInfoGroup) {
                    healthInfoGroup.style.display = 'none';
                }

                // Smooth scroll to success message
                window.scrollTo({
                    top: form.offsetTop - 100,
                    behavior: 'smooth'
                });

                // Track conversion if gtag is available
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'form_submission', {
                        'event_category': 'Forms',
                        'event_label': formData.session
                    });
                }

            } catch (error) {
                console.error('Submission error:', error);
                
                // Try email backup if not already tried
                if (!error.message.includes('Both primary and backup')) {
                    try {
                        const emailSent = await sendEmailBackup(formData);
                        if (emailSent) {
                            showSuccess('תודה על ההרשמה! ניצור איתך קשר בהקדם');
                            form.reset();
                            return;
                        }
                    } catch (backupError) {
                        console.error('Backup submission failed:', backupError);
                    }
                }
                
                // Show error message if both methods failed
                let errorMessage = 'אירעה שגיאה בשליחת הטופס. אנא צרו קשר איתנו בוואטסאפ או באימייל.';
                showError(submitButton, errorMessage);
                
                // Add WhatsApp fallback button
                const whatsappFallback = document.createElement('a');
                whatsappFallback.href = `https://wa.me/9720508494803?text=${encodeURIComponent(
                    `שלום, ניסיתי להירשם למפגש אך הייתה בעיה טכנית.
                    שם: ${formData.name}
                    טלפון: ${formData.phone}
                    אימייל: ${formData.email}
                    מועד: ${formData.session}`
                )}`;
                whatsappFallback.className = 'whatsapp-button';
                whatsappFallback.innerHTML = '<i class="fab fa-whatsapp"></i> שליחה בוואטסאפ';
                whatsappFallback.target = '_blank';
                
                submitButton.parentNode.insertBefore(whatsappFallback, submitButton.nextSibling);
                
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