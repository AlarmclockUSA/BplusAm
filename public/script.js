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
        console.log('Stripe initialized with publishable key:', window.stripePublishableKey);

        // Try creating a card element directly without payment intent first
        try {
            console.log('Attempting to create card element first');
            const mountElement = document.querySelector('#payment-element');
            
            if (!mountElement) {
                throw new Error('Payment element mount target not found in DOM');
            }
            
            // Clear out any existing content
            mountElement.innerHTML = '';
            
            // Simple appearance object
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#7fb69e',
                    fontFamily: 'Inter, system-ui, sans-serif',
                },
            };
            
            // Create elements instance without client secret first
            elements = stripe.elements({appearance});
            
            // Create a card element instead of payment element
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        color: '#32325d',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        fontSize: '16px',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }
            });
            
            // Mount the card element
            cardElement.mount('#payment-element');
            console.log('Card element mounted successfully');
            return;
        } catch (cardError) {
            console.error('Error creating card element, falling back to payment intent:', cardError);
        }

        // If card element creation fails, try with payment intent as before
        console.log('Creating payment intent');
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
                borderRadius: '4px',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontWeightNormal: '500',
                spacingUnit: '4px'
            },
            rules: {
                '.Label': {
                    marginBottom: '8px',
                    fontSize: '14px'
                },
                '.Input': {
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    boxShadow: 'none'
                }
            }
        };

        console.log('Creating Stripe Elements with client secret');
        elements = stripe.elements({ appearance, clientSecret });

        console.log('Creating payment element');
        const paymentElement = elements.create("payment", {
            layout: {
                type: 'tabs',
                defaultCollapsed: false
            }
        });
        
        console.log('Mounting payment element to #payment-element');
        const mountElement = document.querySelector('#payment-element');
        if (!mountElement) {
            throw new Error('Payment element mount target not found in DOM');
        }
        
        // Clear out any existing content or error messages
        mountElement.innerHTML = '';
        
        paymentElement.mount("#payment-element");
        console.log('Stripe Elements mounted successfully');
        
        // Add some visual indication that the element loaded
        mountElement.style.transition = 'all 0.3s ease';
        mountElement.style.boxShadow = '0 0 0 2px rgba(127, 182, 158, 0.3)';
        setTimeout(() => {
            mountElement.style.boxShadow = 'none';
        }, 1500);
        
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        showMessage(`Error: ${error.message}`);
        
        // Show a visual fallback
        const mountElement = document.querySelector('#payment-element');
        if (mountElement) {
            mountElement.innerHTML = `
                <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; text-align: center; min-height: 150px; display: flex; flex-direction: column; justify-content: center;">
                    <p style="color: #f87171; margin: 0 0 10px 0;">Payment form could not be loaded</p>
                    <p style="margin: 0 0 15px 0;">Please try refreshing the page.</p>
                    <button onclick="location.reload()" style="background-color: #7fb69e; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Refresh Page</button>
                </div>
            `;
        }
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
    
    try {
        let error;
        
        // Check if we're using a card element or payment element
        const cardElement = elements && elements.getElement('card');
        
        if (cardElement) {
            // Card Element approach (no payment intent yet)
            console.log('Using card element approach');
            
            // Create a payment method with the card element
            const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.street,
                        line2: formData.apt || '',
                        city: formData.city,
                        postal_code: formData.zip,
                        country: formData.country,
                        state: formData.state
                    }
                }
            });
            
            if (createError) {
                error = createError;
            } else {
                // Create a payment intent on the server with the payment method
                const response = await fetch('/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        affiliateData: getAffiliateData(),
                        payment_method_id: paymentMethod.id
                    })
                });
                
                const result = await response.json();
                
                if (result.error) {
                    error = { message: result.error };
                } else if (result.clientSecret) {
                    // Confirm the payment
                    const { error: confirmError } = await stripe.confirmCardPayment(
                        result.clientSecret, {
                            payment_method: paymentMethod.id
                        }
                    );
                    
                    if (confirmError) {
                        error = confirmError;
                    } else {
                        // Success - redirect to success page
                        window.location.href = `/success.html?id=amb_${Math.random().toString(36).substr(2, 9)}`;
                        return;
                    }
                }
            }
        } else {
            // Payment Element approach (with existing payment intent)
            console.log('Using payment element approach');
            const { error: confirmError } = await stripe.confirmPayment({
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
            
            error = confirmError;
        }
        
        if (error) {
            if (error.type === "card_error" || error.type === "validation_error") {
                showMessage(error.message);
            } else {
                showMessage("An unexpected error occurred.");
            }
        }
    } catch (err) {
        console.error('Payment submission error:', err);
        showMessage("An unexpected error occurred. Please try again.");
    } finally {
        setLoading(false);
    }
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