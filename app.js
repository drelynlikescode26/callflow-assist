// Call Flow Assistant - Main Application Logic
class CallFlowAssistant {
    // Animation constants
    static BUTTON_ANIMATION_DELAY = 100; // milliseconds per button
    static BUTTON_ANIMATION_OFFSET = 10; // pixels
    static NAVIGATION_DELAY_MS = 200;
    static SCRIPT_TRANSITION_DELAY = 150;

    constructor() {
        this.callFlowData = null;
        this.currentState = null;
        this.history = [];
        this.init();
    }

    async init() {
        try {
            await this.loadCallFlowData();
            this.setupEventListeners();
            this.startCall();
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showError('Failed to load call flow data. Please refresh the page.');
        }
    }

    async loadCallFlowData() {
        try {
            const response = await fetch('callflow-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.callFlowData = await response.json();
        } catch (error) {
            console.error('Error loading call flow data:', error);
            throw error;
        }
    }

    setupEventListeners() {
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.resetCall());
    }

    startCall() {
        this.history = [];
        const startStateId = this.callFlowData.startState || 'opening';
        this.navigateToState(startStateId);
    }

    navigateToState(stateId) {
        const state = this.callFlowData.states[stateId];
        
        if (!state) {
            console.error(`State not found: ${stateId}`);
            this.showError('Invalid state. Resetting call.');
            setTimeout(() => this.resetCall(), 2000);
            return;
        }

        this.currentState = state;
        this.history.push(stateId);
        this.render();
    }

    render() {
        this.updateProgress();
        this.updateScript();
        this.updateOptions();
    }

    updateProgress() {
        const progressEl = document.getElementById('progress');
        const stateType = this.getStateType(this.currentState.id);
        const progressText = this.getProgressText(stateType);
        progressEl.textContent = progressText;
    }

    getStateType(stateId) {
        if (stateId === 'opening') return 'opening';
        if (stateId.includes('service')) return 'service_type';
        if (stateId.includes('age') || stateId.includes('senior')) return '55+';
        if (stateId.includes('close') || stateId.includes('success')) return 'close';
        return 'in_progress';
    }

    getProgressText(stateType) {
        const progressMap = {
            'opening': '🔹 Opening',
            'service_type': '🔹 Service Type',
            '55+': '🔹 Senior Discount',
            'close': '✅ Closing',
            'in_progress': '🔹 In Progress'
        };
        return progressMap[stateType] || 'In Progress';
    }

    updateScript() {
        const scriptTextEl = document.getElementById('scriptText');
        const scriptCard = scriptTextEl.parentElement;
        
        // Remove previous state classes
        scriptCard.classList.remove('success', 'callback');
        
        // Add appropriate class based on state
        if (this.currentState.id.includes('success')) {
            scriptCard.classList.add('success');
        } else if (this.currentState.id.includes('callback')) {
            scriptCard.classList.add('callback');
        }
        
        // Update text with a slight animation
        scriptTextEl.style.opacity = '0';
        setTimeout(() => {
            scriptTextEl.textContent = this.currentState.script;
            scriptTextEl.style.opacity = '1';
        }, CallFlowAssistant.SCRIPT_TRANSITION_DELAY);
    }

    updateOptions() {
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        if (!this.currentState.options || this.currentState.options.length === 0) {
            return;
        }

        this.currentState.options.forEach((option, index) => {
            const button = this.createOptionButton(option, index);
            optionsContainer.appendChild(button);
        });
    }

    createOptionButton(option, index) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option.text;
        button.setAttribute('data-next', option.next);
        
        // Add slight stagger to button appearance
        button.style.opacity = '0';
        button.style.transform = `translateY(${CallFlowAssistant.BUTTON_ANIMATION_OFFSET}px)`;
        setTimeout(() => {
            button.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, CallFlowAssistant.BUTTON_ANIMATION_DELAY * index);
        
        button.addEventListener('click', () => {
            this.handleOptionClick(option.next);
        });
        
        return button;
    }

    handleOptionClick(nextStateId) {
        if (!nextStateId) {
            console.error('No next state specified');
            return;
        }
        
        // Add a small delay for better UX
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.style.opacity = '0.5');
        
        setTimeout(() => {
            this.navigateToState(nextStateId);
        }, CallFlowAssistant.NAVIGATION_DELAY_MS);
    }

    resetCall() {
        this.startCall();
    }

    showError(message) {
        const scriptTextEl = document.getElementById('scriptText');
        scriptTextEl.textContent = message;
        scriptTextEl.style.color = '#dc3545';
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CallFlowAssistant();
});
