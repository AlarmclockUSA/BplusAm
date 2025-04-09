// Initialize Stripe
const stripe = Stripe(window.stripePublishableKey);

let elements;
let emailAddress = '';

// Get affiliate data from URL parameters
const getAffiliateData = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        source: 'Ambassador Only Funnel',
        source_url: window.location.href,
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        referrer: document.referrer
    };
};

// Initialize Stripe Elements
const initialize = async () => {
    const response = await fetch("/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateData: getAffiliateData() }),
    });
    
    const { clientSecret } = await response.json();

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#2563eb',
        },
    };

    elements = stripe.elements({ appearance, clientSecret });

    const paymentElement = elements.create("payment");
    paymentElement.mount("#payment-element");
};

// Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const emailInput = document.querySelector("#email");
    emailAddress = emailInput.value;

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/success.html`,
            receipt_email: emailAddress,
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
}); 