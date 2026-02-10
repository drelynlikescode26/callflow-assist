// Enhanced AT&T Call Flow Assistant - State Machine Implementation
class CallFlowAssistant {
    // Animation constants
    static BUTTON_ANIMATION_DELAY = 100;
    static BUTTON_ANIMATION_OFFSET = 10;
    static NAVIGATION_DELAY_MS = 200;
    static SCRIPT_TRANSITION_DELAY = 150;

    constructor() {
        this.callFlowData = null;
        this.context = {
            leadType: null,
            is55Plus: false,
            upgradeEligible: null,
            customerName: '',
            notes: ''
        };
        this.currentNodeId = null;
        this.history = [];
        this.init();
    }

    async init() {
        try {
            await this.loadCallFlowData();
            this.setupEventListeners();
            this.showSetupScreen();
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
        // Setup screen listeners
        this.setupLeadTypeButtons();
        this.setupUpgradeButtons();
        this.setup55PlusToggle();
        
        // Start call button
        const startCallBtn = document.getElementById('startCallBtn');
        startCallBtn.addEventListener('click', () => this.startCall());
        
        // Footer buttons
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => this.resetCall());
        
        const backBtn = document.getElementById('backBtn');
        backBtn.addEventListener('click', () => this.goBack());
        
        const newCallBtn = document.getElementById('newCallBtn');
        newCallBtn.addEventListener('click', () => this.resetCall());
    }

    setupLeadTypeButtons() {
        const buttons = document.querySelectorAll('[data-lead-type]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.context.leadType = btn.dataset.leadType;
                this.validateSetupForm();
            });
        });
    }

    setupUpgradeButtons() {
        const buttons = document.querySelectorAll('[data-upgrade]');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.context.upgradeEligible = btn.dataset.upgrade;
                this.validateSetupForm();
            });
        });
    }

    setup55PlusToggle() {
        const toggle = document.getElementById('is55Plus');
        toggle.addEventListener('change', () => {
            this.context.is55Plus = toggle.checked;
        });
    }

    validateSetupForm() {
        const startCallBtn = document.getElementById('startCallBtn');
        const isValid = this.context.leadType !== null;
        startCallBtn.disabled = !isValid;
    }

    showSetupScreen() {
        document.getElementById('setupScreen').classList.remove('hidden');
        document.getElementById('callScreen').classList.add('hidden');
        document.getElementById('summaryScreen').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'none';
    }

    showCallScreen() {
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('callScreen').classList.remove('hidden');
        document.getElementById('summaryScreen').classList.add('hidden');
        document.getElementById('backBtn').style.display = 'block';
    }

    showSummaryScreen() {
        document.getElementById('setupScreen').classList.add('hidden');
        document.getElementById('callScreen').classList.add('hidden');
        document.getElementById('summaryScreen').classList.remove('hidden');
        this.renderSummary();
    }

    startCall() {
        // Capture optional fields
        this.context.customerName = document.getElementById('customerName').value.trim();
        this.context.notes = document.getElementById('setupNotes').value.trim();
        
        // Initialize call notes with setup notes
        if (this.context.notes) {
            document.getElementById('callNotes').value = this.context.notes;
        }
        
        this.history = [];
        this.showCallScreen();
        
        // Navigate to first node
        const startNodeId = this.callFlowData.startNode || 'permission_check';
        this.navigateToNode(startNodeId);
    }

    navigateToNode(nodeId) {
        // Handle special navigation for "unknown" lead type
        if (nodeId === 'lead_specific_pitch' && this.context.leadType === 'unknown') {
            nodeId = 'unknown_qualifier';
        }
        
        const node = this.callFlowData.nodes[nodeId];
        
        if (!node) {
            console.error(`Node not found: ${nodeId}`);
            this.showError('Invalid node. Restarting call.');
            setTimeout(() => this.resetCall(), 2000);
            return;
        }

        // Add to history for back button
        this.history.push(nodeId);
        this.currentNodeId = nodeId;
        
        this.render();
    }

    render() {
        this.updateProgress();
        this.updateScript();
        this.updateOptions();
    }

    updateProgress() {
        const progressEl = document.getElementById('progress');
        const node = this.callFlowData.nodes[this.currentNodeId];
        const progressText = this.getProgressText(node.type);
        progressEl.textContent = progressText;
    }

    getProgressText(nodeType) {
        const progressMap = {
            'permission': '🔹 Opening',
            'intro': '🔹 Introduction',
            'pitch': '🔹 Value Pitch',
            'details': '🔹 Details',
            'qualifier': '🔹 Qualifying',
            'transition': '🔹 Transition to Close',
            'close': '✅ Closing',
            'success': '✅ Success!',
            'reschedule': '📅 Rescheduling'
        };
        return progressMap[nodeType] || '🔹 In Progress';
    }

    updateScript() {
        const scriptTextEl = document.getElementById('scriptText');
        const scriptCard = scriptTextEl.parentElement;
        const node = this.callFlowData.nodes[this.currentNodeId];
        
        // Remove previous state classes
        scriptCard.classList.remove('success', 'reschedule');
        
        // Add appropriate class based on node type
        if (node.type === 'success') {
            scriptCard.classList.add('success');
        } else if (node.type === 'reschedule') {
            scriptCard.classList.add('reschedule');
        }
        
        // Process script with dynamic content
        let script = this.processScript(node);
        
        // Update text with animation
        scriptTextEl.style.opacity = '0';
        setTimeout(() => {
            scriptTextEl.textContent = script;
            scriptTextEl.style.opacity = '1';
        }, CallFlowAssistant.SCRIPT_TRANSITION_DELAY);
    }

    processScript(node) {
        let script = node.script;
        
        // Handle dynamic content based on lead type
        if (node.dynamicContent && this.context.leadType) {
            const leadType = this.context.leadType;
            if (node.dynamicContent[leadType]) {
                script = node.dynamicContent[leadType];
            }
        }
        
        // Replace pricing placeholders
        script = script.replace('{{WIRELESS_PRICE}}', this.callFlowData.pricing.wireless.perLine);
        script = script.replace('{{FIBER_PRICE}}', this.callFlowData.pricing.fiber.starting);
        
        // Add 55+ conditional inserts
        if (this.context.is55Plus) {
            const insert55Plus = this.context.leadType === 'wireless' || this.context.leadType === 'both'
                ? this.callFlowData.conditionalInserts['55plus'].wireless
                : this.callFlowData.conditionalInserts['55plus'].fiber;
            script = script.replace('{{55PLUS_WIRELESS}}', insert55Plus);
            script = script.replace('{{55PLUS_FIBER}}', insert55Plus);
        } else {
            script = script.replace('{{55PLUS_WIRELESS}}', '');
            script = script.replace('{{55PLUS_FIBER}}', '');
        }
        
        // Add upgrade info for wireless leads
        if ((this.context.leadType === 'wireless' || this.context.leadType === 'both') && 
            this.context.upgradeEligible && this.context.upgradeEligible !== 'not_sure') {
            const upgradeInfo = this.callFlowData.pricing.upgrades[this.context.upgradeEligible];
            script = script.replace('{{UPGRADE_INFO}}', upgradeInfo);
            script = script.replace('{{UPGRADE_DETAILS}}', upgradeInfo);
        } else {
            script = script.replace('{{UPGRADE_INFO}}', '');
            script = script.replace('{{UPGRADE_DETAILS}}', '');
        }
        
        // Add summary for confirmation
        if (script.includes('{{SUMMARY}}')) {
            const summary = this.generateSummaryText();
            script = script.replace('{{SUMMARY}}', summary);
        }
        
        // Clean up any remaining placeholders and warn about them
        const remainingPlaceholders = script.match(/\{\{[^}]+\}\}/g);
        if (remainingPlaceholders) {
            console.warn('Unprocessed placeholders found:', remainingPlaceholders);
        }
        script = script.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim();
        
        return script;
    }

    generateSummaryText() {
        const parts = [];
        
        if (this.context.customerName) {
            parts.push(`Customer: ${this.context.customerName}`);
        }
        
        if (this.context.leadType) {
            const leadTypeMap = {
                'wireless': 'Wireless Service',
                'fiber': 'Fiber Internet',
                'both': 'Wireless + Fiber Bundle',
                'unknown': 'General Inquiry'
            };
            parts.push(`Interest: ${leadTypeMap[this.context.leadType]}`);
        }
        
        if (this.context.is55Plus) {
            parts.push('55+ Discount Eligible');
        }
        
        if (this.context.upgradeEligible && this.context.upgradeEligible !== 'not_sure') {
            const upgradeMap = {
                'iphone': 'iPhone',
                'android': 'Android'
            };
            parts.push(`Upgrade: ${upgradeMap[this.context.upgradeEligible] || this.context.upgradeEligible}`);
        }
        
        return parts.length > 0 ? '\n\n' + parts.join(' | ') : '';
    }

    updateOptions() {
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';
        
        const node = this.callFlowData.nodes[this.currentNodeId];
        
        if (!node.options || node.options.length === 0) {
            // Show summary if it's a success or close node
            if (node.type === 'success' || node.type === 'close') {
                setTimeout(() => this.showSummaryScreen(), 2000);
            }
            return;
        }

        node.options.forEach((option, index) => {
            const button = this.createOptionButton(option, index);
            optionsContainer.appendChild(button);
        });
    }

    createOptionButton(option, index) {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.textContent = option.text;
        
        // Add animation
        button.style.opacity = '0';
        button.style.transform = `translateY(${CallFlowAssistant.BUTTON_ANIMATION_OFFSET}px)`;
        setTimeout(() => {
            button.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, CallFlowAssistant.BUTTON_ANIMATION_DELAY * index);
        
        button.addEventListener('click', () => {
            this.handleOptionClick(option);
        });
        
        return button;
    }

    handleOptionClick(option) {
        // Update context if option specifies it
        if (option.updateContext) {
            Object.assign(this.context, option.updateContext);
        }
        
        if (!option.next) {
            console.error('No next node specified');
            return;
        }
        
        // Add visual feedback
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.style.opacity = '0.5');
        
        setTimeout(() => {
            this.navigateToNode(option.next);
        }, CallFlowAssistant.NAVIGATION_DELAY_MS);
    }

    goBack() {
        if (this.history.length > 1) {
            // Remove current node
            this.history.pop();
            // Get previous node
            const previousNodeId = this.history.pop();
            this.navigateToNode(previousNodeId);
        }
    }

    resetCall() {
        // Reset context
        this.context = {
            leadType: null,
            is55Plus: false,
            upgradeEligible: null,
            customerName: '',
            notes: ''
        };
        
        // Reset UI
        document.querySelectorAll('.setup-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('is55Plus').checked = false;
        document.getElementById('customerName').value = '';
        document.getElementById('setupNotes').value = '';
        document.getElementById('callNotes').value = '';
        document.getElementById('startCallBtn').disabled = true;
        
        this.history = [];
        this.showSetupScreen();
    }

    renderSummary() {
        const summaryContent = document.getElementById('summaryContent');
        
        const summaryHTML = `
            ${this.context.customerName ? `
                <div class="summary-item">
                    <span class="summary-label">Customer Name</span>
                    <div class="summary-value">${this.context.customerName}</div>
                </div>
            ` : ''}
            
            <div class="summary-item">
                <span class="summary-label">Lead Type</span>
                <div class="summary-value">${this.getLeadTypeLabel()}</div>
            </div>
            
            ${this.context.is55Plus ? `
                <div class="summary-item">
                    <span class="summary-label">Special Offers</span>
                    <div class="summary-value">55+ Discount Eligible</div>
                </div>
            ` : ''}
            
            ${this.context.upgradeEligible && this.context.upgradeEligible !== 'not_sure' ? `
                <div class="summary-item">
                    <span class="summary-label">Upgrade Eligibility</span>
                    <div class="summary-value">${this.getUpgradeLabel()}</div>
                </div>
            ` : ''}
            
            ${this.getCallNotes() ? `
                <div class="summary-item">
                    <span class="summary-label">Call Notes</span>
                    <div class="summary-value">${this.getCallNotes()}</div>
                </div>
            ` : ''}
            
            <div class="summary-highlight">
                ✅ Appointment scheduled! Customer will visit the store.<br>
                <strong>Ask for: Drelyn</strong>
            </div>
        `;
        
        summaryContent.innerHTML = summaryHTML;
    }

    getLeadTypeLabel() {
        const labels = {
            'wireless': 'Wireless Service',
            'fiber': 'Fiber Internet',
            'both': 'Wireless + Fiber Bundle',
            'unknown': 'General Inquiry'
        };
        return labels[this.context.leadType] || 'Unknown';
    }

    getUpgradeLabel() {
        const labels = {
            'iphone': 'iPhone',
            'android': 'Android',
            'not_sure': 'Not Sure'
        };
        return labels[this.context.upgradeEligible] || this.context.upgradeEligible;
    }

    getCallNotes() {
        return document.getElementById('callNotes').value.trim();
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
