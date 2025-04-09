let stripe;
let elements;
let formData = {};

// Get affiliate data
const getAffiliateData = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        source: 'Ambassador Only Funnel',
        source_url: window.location.href,
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || ''
    };
};

// Initialize Stripe Elements
const initialize = async () => {
    try {
        // Initialize Stripe instance
        if (!window.stripePublishableKey) {
            throw new Error('Stripe publishable key is missing');
        }
        
        stripe = Stripe(window.stripePublishableKey);
        console.log('Stripe initialized with publishable key');

        const response = await fetch("/create-payment-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                affiliateData: getAffiliateData()
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response not OK:', response.status, errorText);
            throw new Error(`Failed to create payment intent: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Payment intent response:', data);
        const { clientSecret } = data;
        
        if (!clientSecret) {
            throw new Error('No client secret returned from server');
        }

        console.log('Payment intent created successfully');

        const appearance = {
            theme: 'stripe',
            variables: {
                colorPrimary: '#7fb69e',
                fontFamily: 'Inter, system-ui, sans-serif',
            },
        };

        console.log('Creating Stripe Elements with client secret');
        elements = stripe.elements({ appearance, clientSecret });

        console.log('Creating payment element');
        const paymentElement = elements.create("payment");
        
        console.log('Mounting payment element to #payment-element');
        const mountElement = document.querySelector('#payment-element');
        if (!mountElement) {
            throw new Error('Payment element mount target not found in DOM');
        }
        paymentElement.mount("#payment-element");
        console.log('Stripe Elements mounted successfully');
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showMessage(`Error: ${error.message}`);
    }
};

// Collect form data
const collectFormData = () => {
    const fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'street',
        'apt',
        'city',
        'zip',
        'country',
        'state'
    ];

    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            formData[field] = element.value;
        }
    });
};

// Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    collectFormData();

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/success.html`,
            receipt_email: formData.email,
            payment_method_data: {
                billing_details: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.street,
                        line2: formData.apt,
                        city: formData.city,
                        postal_code: formData.zip,
                        country: formData.country,
                        state: formData.state
                    }
                }
            }
        },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
        showMessage(error.message);
    } else {
        showMessage("An unexpected error occurred.");
    }

    setLoading(false);
};

// UI helpers
const setLoading = (isLoading) => {
    const submitButton = document.querySelector("#submit-button");
    const spinner = document.querySelector("#spinner");
    const buttonText = document.querySelector("#button-text");

    if (isLoading) {
        submitButton.disabled = true;
        spinner.classList.remove("hidden");
        buttonText.classList.add("hidden");
    } else {
        submitButton.disabled = false;
        spinner.classList.add("hidden");
        buttonText.classList.remove("hidden");
    }
};

const showMessage = (messageText) => {
    const messageContainer = document.querySelector("#payment-message");
    messageContainer.classList.remove("hidden");
    messageContainer.textContent = messageText;

    setTimeout(() => {
        messageContainer.classList.add("hidden");
        messageContainer.textContent = "";
    }, 4000);
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

    // Populate state dropdown
    const stateSelect = document.querySelector("#state");
    if (stateSelect) {
        const states = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
        };

        Object.entries(states).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            stateSelect.appendChild(option);
        });
    }
}); 