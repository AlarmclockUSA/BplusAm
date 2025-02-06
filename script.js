// API Configuration
const API_CONFIG = {
    STAGING_URL: 'https://api.brilliantplus.app',
    PRODUCTION_URL: 'https://api.brilliantplus.app',
    ENDPOINTS: {
        CREATE_CONSULTANT: '/api/Consultants/CreateConsultant'
    }
};

// Initialize the form display
function initializeForm() {
    // Show the first step by default
    showStep(1);

    // Make sure the form container is visible
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.style.display = 'block';
        formContainer.style.opacity = '1';
    }

    // Initialize Google Places Autocomplete
    initializeGooglePlaces();

    // Add input event listeners for validation
    initializeValidation();

    // Initialize form event listeners
    initializeFormEventListeners();
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('step') === 'thank-you') {
        // Hide the content column for thank you page
        const contentColumn = document.querySelector('.content-column');
        if (contentColumn) {
            contentColumn.style.display = 'none';
        }
        
        // Show mock data for testing
        showSuccess('testUser123', 'TestPass123!');
    } else {
        // Initialize the form normally
        initializeForm();
    }
});

// Initialize authentication tokens
const authTokens = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNSIsInVuaXF1ZV9uYW1lIjoiTWF0dEhCcmlsbGlhbnQiLCJyb2xlIjoiQVBJIFVzZXIiLCJSb2xlSUQiOiI2IiwiTGFuZ3VhZ2VJRCI6IjEiLCJGaXJzdE5hbWUiOiJNYXR0IiwiUGVyc29uVHlwZUlEIjoiMyIsIkRhdGVGb3JtYXQiOiJNTS9kZC95eXl5IiwiQnVzaW5lc3NVbml0c19FbmFibGVkIjoiMCIsIm5iZiI6MTczODg2MTM5NSwiZXhwIjoxNzM4OTQ3Nzk1LCJpYXQiOjE3Mzg4NjEzOTV9.pri6_DR0AX8n-qXu_rxA1c3_WwRjMSJ7RaZ_b5prtyo',
    refresh_token: 'iHiJqqEMRuJDCIGNtraOtuUfn8+8sdHcmb2Wn4Xbfhq4dcDKLGI7LH8TS4Uct5qcQzpmNVwaSbtXGp9gl0LvDQ==',
    token_type: 'bearer',
    expires_in: 86399,
    expires_at: new Date('2025-02-07T17:03:15Z')
};

// Initialize all event listeners
function initializeFormEventListeners() {
    // ... rest of your existing code ...
}

// Validate address fields
function validateAddressFields() {
    const addressFields = ['city', 'province', 'postalCode', 'country'];
    let isValid = true;

    addressFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
        }
    });

    return isValid;
}

// Store form data between steps
let formData = {};

// Step 1: Basic Information Form
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get all required inputs
    const requiredInputs = this.querySelectorAll('[required]');
    let isValid = true;

    // Check each required field
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }
    });

    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        isValid = false;
        termsCheckbox.parentElement.classList.add('invalid');
    } else {
        termsCheckbox.parentElement.classList.remove('invalid');
    }

    if (!isValid) {
        showError('Please fill in all required fields and accept the Terms of Service.');
        return;
    }

    // Store step 1 data
    formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        street1: document.getElementById('street1').value,
        street2: document.getElementById('street2').value,
        city: document.getElementById('city').value,
        postalCode: document.getElementById('postalCode').value,
        country: document.getElementById('country').value,
        province: document.getElementById('province').value
    };

    // Generate and set username
    const username = generateUsername(formData.email);
    document.getElementById('username').value = username;

    // Show step 2
    showStep(2);
});

// Step 2: Account Setup Form
document.getElementById('accountSetupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate password requirements
    if (!validatePassword()) {
        showError('Please ensure all password requirements are met.');
        return;
    }

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        // Show loading state before API call
        toggleLoadingState(true);

        // Combine data from both steps
        const requestData = {
            "Person_Name": {
                "FirstName": formData.firstName,
                "LastName": formData.lastName
            },
            "Person_OtherInformation": {
                "ReplicatedSiteURL": generateReplicatedSiteURL(formData.firstName + formData.lastName),
                "TranslationLanguageID": 1,
                "ConsultantStatusID": 1,
                "ConsultantTypeID": 1,
                "Username": generateUsername(formData.email),
                "Password": password,
                "ConfirmPassword": password
            },
            "DoNotSendAutoresponder": false,
            "DoNotSendWebhook": false,
            "DisplayID": null,
            "Person_SponsorDisplayId": "1001",
            "Person_ContactInfo": {
                "Email": formData.email,
                "Person_Phones": [
                    {
                        "PhoneTypeID": 1,
                        "PhoneNumber": formData.phone.replace(/\D/g, ''),
                        "Primary": true
                    }
                ]
            },
            "Person_Addresses": [
                {
                    "NickName": "Home Address",
                    "FirstName": formData.firstName,
                    "LastName": formData.lastName,
                    "CountryID": getCountryID(formData.country),
                    "ProvinceID": getProvinceID(formData.province),
                    "Street1": formData.street1,
                    "Street2": formData.street2 || "",
                    "City": formData.city,
                    "PostalCode": formData.postalCode,
                    "Primary": true,
                    "Mailing": true
                }
            ]
        };

        console.log('Making API request:', sanitizeDataForLogging(requestData));

        const response = await fetch('/api/create-consultant', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API Response:', result);

        if (result.ResultCode === 0) {
            showSuccess(document.getElementById('username').value, password);
            return true;
        } else {
            const errorMessage = result.Notifications && result.Notifications.length > 0 
                ? result.Notifications[0].Message 
                : 'Failed to submit application. Please try again.';
            showError(errorMessage);
            return false;
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showError('An unexpected error occurred. Please try again.', {
            errorType: error.name,
            errorMessage: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        // Hide loading state after API call completes
        toggleLoadingState(false);
    }
});

// Remove duplicate event listener
const existingHandler = document.getElementById('applicationForm');
if (existingHandler) {
    existingHandler.removeEventListener('submit', existingHandler);
}

// Password validation
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordRequirements = document.querySelectorAll('.password-requirements li');

passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePasswordMatch);

function validatePassword() {
    const password = passwordInput.value;
    
    // Check each requirement
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };

    // Update requirement list UI
    passwordRequirements.forEach(item => {
        const requirement = item.dataset.requirement;
        if (requirements[requirement]) {
            item.classList.add('valid');
        } else {
            item.classList.remove('valid');
        }
    });

    // Return true if all requirements are met
    return Object.values(requirements).every(req => req);
}

function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword === '') {
        confirmPasswordInput.setCustomValidity('');
    } else if (password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else {
        confirmPasswordInput.setCustomValidity('');
    }
}

// Password visibility toggle
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Update icon (optional - if you want to change the icon)
        const path = this.querySelector('path');
        if (type === 'text') {
            path.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
        } else {
            path.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
        }
    });
});

// Username generation from email
const emailInput = document.querySelector('input[type="email"]');
const usernameInput = document.getElementById('username');

emailInput.addEventListener('input', function() {
    const email = this.value;
    if (email && email.includes('@')) {
        const username = email.split('@')[0].toLowerCase();
        usernameInput.value = username;
    } else {
        usernameInput.value = '';
    }
});

// Form submission handling
const accountSetupForm = document.getElementById('accountSetupForm');

accountSetupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate password requirements
    if (!validatePassword()) {
        alert('Please ensure all password requirements are met.');
        return;
    }
    
    // Validate password match
    if (passwordInput.value !== confirmPasswordInput.value) {
        alert('Passwords do not match.');
        return;
    }
    
    // If all validations pass, proceed with form submission
    // Add your form submission logic here
    console.log('Form submitted successfully');
});

// Step navigation
function showStep(step) {
    // Update step indicator
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-step="${step}"]`).classList.add('active');

    // Hide all forms
    document.querySelectorAll('.step-form').forEach(form => {
        form.style.display = 'none';
        form.classList.remove('active');
    });

    // Show the current step form
    const currentForm = document.querySelector(`.step-form[data-step="${step}"]`);
    if (currentForm) {
        currentForm.style.display = 'block';
        // Add active class after a brief delay to trigger transition
        setTimeout(() => {
            currentForm.classList.add('active');
        }, 10);
    }
}

// Initialize back button functionality
document.addEventListener('DOMContentLoaded', function() {
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            showStep(1);
        });
    }
});

// Helper Functions
function generateReplicatedSiteURL(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15) + Math.floor(Math.random() * 1000);
}

function generateUsername(email) {
    return email.split('@')[0].replace(/[^a-z0-9]/gi, '') + 
           Math.floor(Math.random() * 100);
}

function getCountryID(countryName) {
    const countryMap = {
        'United States': 1,
        'US': 1
    };
    return countryMap[countryName] || 1;
}

function getProvinceID(provinceName) {
    if (!provinceName) return null;

    // Clean up the input
    const cleanName = provinceName.trim();

    // Handle state abbreviations
    const stateAbbreviations = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    // Updated map of state names to IDs with correct mappings
    const provinceMap = {
        'ALABAMA': 1, 'ALASKA': 2, 'ARIZONA': 3, 'ARKANSAS': 4,
        'CALIFORNIA': 5, 'COLORADO': 6, 'CONNECTICUT': 7, 'DELAWARE': 8,
        'FLORIDA': 9, 'GEORGIA': 10, 'HAWAII': 11, 'IDAHO': 12,
        'ILLINOIS': 13, 'INDIANA': 14, 'IOWA': 15, 'KANSAS': 16,
        'KENTUCKY': 17, 'LOUISIANA': 18, 'MAINE': 19, 'MARYLAND': 20,
        'MASSACHUSETTS': 21, 'MICHIGAN': 22, 'MINNESOTA': 23, 'MISSISSIPPI': 24,
        'MISSOURI': 25, 'MONTANA': 26, 'NEBRASKA': 27, 'NEVADA': 28,
        'NEW HAMPSHIRE': 29, 'NEW JERSEY': 30, 'NEW MEXICO': 31, 'NEW YORK': 32,
        'NORTH CAROLINA': 33, 'NORTH DAKOTA': 34, 'OHIO': 35, 'OKLAHOMA': 36,
        'OREGON': 37, 'PENNSYLVANIA': 38, 'RHODE ISLAND': 39, 'SOUTH CAROLINA': 40,
        'SOUTH DAKOTA': 41, 'TENNESSEE': 42, 'TEXAS': 43, 'UTAH': 44,
        'VERMONT': 45, 'VIRGINIA': 46, 'WASHINGTON': 47, 'WEST VIRGINIA': 48,
        'WISCONSIN': 49, 'WYOMING': 50
    };

    // First, try to match the exact input
    let id = provinceMap[cleanName.toUpperCase()];
    
    // If not found and it's a 2-letter code, try to convert it
    if (!id && cleanName.length === 2) {
        const fullName = stateAbbreviations[cleanName.toUpperCase()];
        if (fullName) {
            id = provinceMap[fullName.toUpperCase()];
        }
    }

    // Enhanced logging for debugging
    console.log('State/Province Resolution:', {
        received: provinceName,
        cleaned: cleanName,
        fullName: cleanName.length === 2 ? stateAbbreviations[cleanName.toUpperCase()] : cleanName,
        resolvedId: id,
        isAbbreviation: cleanName.length === 2
    });

    return id || null;
}

// Secure SSN handling
function sanitizeDataForLogging(data) {
    // Create a deep copy of the data
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    // Recursively remove SSN from any nested objects
    function removeSSN(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                removeSSN(obj[key]);
            } else if (key === 'SSN') {
                obj[key] = '***REDACTED***';
            }
        }
    }
    
    removeSSN(sanitizedData);
    return sanitizedData;
}

// UI Helper Functions
function toggleLoadingState(isLoading) {
    const submitButtons = document.querySelectorAll('.submit-button');
    submitButtons.forEach(button => {
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Creating account...';
        } else {
            button.disabled = false;
            button.textContent = button.closest('[data-step="1"]') ? 'Continue to Account Setup' : 'Create Account';
        }
    });
}

function showSuccess(username, password) {
    // Hide the content column
    const contentColumn = document.querySelector('.content-column');
    if (contentColumn) {
        contentColumn.style.display = 'none';
    }

    // Hide step indicator
    const stepIndicator = document.querySelector('.step-indicator');
    if (stepIndicator) {
        stepIndicator.style.display = 'none';
    }

    // Set the credentials in the thank you page
    document.getElementById('finalUsername').value = username;
    document.getElementById('finalPassword').value = password;
    
    // Show the thank you step
    document.querySelectorAll('.step-form').forEach(form => {
        form.style.display = 'none';
        form.classList.remove('active');
    });

    const thankYouStep = document.querySelector('.thank-you-step');
    if (thankYouStep) {
        thankYouStep.style.display = 'block';
        setTimeout(() => {
            thankYouStep.classList.add('active');
        }, 10);
    }
}

function showError(message, details = null) {
    let errorMessage = `Error: ${message}`;
    if (details) {
        errorMessage += '\n\nTechnical Details:\n' + 
            Object.entries(details)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
    }
    console.error(errorMessage);
    alert(errorMessage);
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    const button = element.nextElementSibling;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = 'Copy';
    }, 2000);
}

// Modal Functions
function openModal() {
    const modal = document.getElementById('termsModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(0)';
    }
}

function closeModal() {
    const modal = document.getElementById('termsModal');
    if (!modal) return;
    
    modal.style.opacity = '0';
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.transform = 'translateY(20px)';
    }
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Terms modal open button
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    // Close button in modal
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
        });
    });

    // Close on outside click
    window.addEventListener('click', function(event) {
        const termsModal = document.getElementById('termsModal');
        const successModal = document.getElementById('successModal');
        
        if (event.target === termsModal) {
            closeModal();
        } else if (event.target === successModal) {
            closeSuccessModal();
        }
    });
});

// Add CSS class for invalid inputs
const style = document.createElement('style');
style.textContent = `
    .invalid {
        border-color: #ff4444 !important;
        box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.1) !important;
    }
    .checkbox-label.invalid .checkbox-custom {
        border-color: #ff4444 !important;
    }
`;
document.head.appendChild(style); 