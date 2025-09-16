// Wait for the DOM to be fully loaded before running scripts
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize Lucide icons
    lucide.createIcons();

    // How it works section logic
    const steps = document.querySelectorAll('.step-indicator');
    const visuals = document.querySelectorAll('.step-visual');

    steps.forEach(step => {
        step.addEventListener('click', () => {
            steps.forEach(s => s.classList.remove('active'));
            visuals.forEach(v => v.classList.add('hidden'));
            step.classList.add('active');
            const stepId = step.id;
            const visualId = `step-visual-${stepId.split('-')[1]}`;
            const targetVisual = document.getElementById(visualId);
            if (targetVisual) {
                targetVisual.classList.remove('hidden');
            }
        });
    });

    // Chatbot Logic
    const chatBubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    const toggleChatWindow = () => {
        if (chatWindow.classList.contains('opacity-0')) {
            chatWindow.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
            chatBubble.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
        } else {
            chatWindow.classList.add('scale-95', 'opacity-0', 'pointer-events-none');
            chatBubble.classList.remove('scale-95', 'opacity-0', 'pointer-events-none');
        }
    };

    chatBubble.addEventListener('click', toggleChatWindow);
    closeChat.addEventListener('click', toggleChatWindow);
    
    const appendMessage = (message, sender, isTyping = false) => {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('flex', 'mb-4', 'fade-in');

        const messageBubble = document.createElement('div');
        messageBubble.classList.add('p-3', 'rounded-lg', 'max-w-xs', 'shadow');

        if (sender === 'user') {
            messageWrapper.classList.add('justify-end');
            messageBubble.classList.add('bg-white', 'text-[#3f352e]');
            messageBubble.textContent = message;
        } else {
            messageBubble.classList.add('bg-[#f3e9e0]', 'text-[#3f352e]');
             if (isTyping) {
                messageBubble.id = 'typing-indicator';
                messageBubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            } else {
                messageBubble.textContent = message;
            }
        }
        
        messageWrapper.appendChild(messageBubble);
        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSendMessage = async () => {
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        appendMessage(userInput, 'user');
        chatInput.value = '';
        appendMessage('', 'bot', true);

        const systemPrompt = `You are an AI assistant for an online marketplace that connects local artisans with customers. Your role is to provide helpful, friendly, and accurate answers about:
Artisan crafts (history, techniques, cultural value, materials).
The products listed on the website (descriptions, uses, care instructions).
The artisans themselves (stories, backgrounds, inspiration – if provided in the database).
The buying/selling process (how customers can order, payment methods, shipping, returns).
Guiding customers to the right categories or products.
Answering general questions about art and crafts in simple, engaging language.
Tone & Style: Friendly, supportive, and professional. Use simple, easy-to-understand explanations. Encourage curiosity about art and handmade crafts. Always aim to promote the value of local artisan work.
Important Rules: If you don’t know a specific detail about a product, politely guide the customer to check with the artisan or support team. Do not make up information about artisans or their products. Keep responses clear and concise, but engaging. Encourage customers to explore the marketplace and support local artisans.`;

        // =================================================================
        // === IMPORTANT: PASTE YOUR GOOGLE AI API KEY HERE ===
        // =================================================================
        const apiKey = "";
        // =================================================================

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userInput }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };
        
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const result = await response.json();
            const botResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to answer that. Could you ask in another way?";
            
            document.getElementById('typing-indicator')?.parentElement.remove();
            appendMessage(botResponse, 'bot');

        } catch (error) {
            console.error("Chatbot API error:", error);
            document.getElementById('typing-indicator')?.parentElement.remove();
            appendMessage("I'm having a little trouble connecting right now. Please check the API key or try again in a moment.", 'bot');
        }
    };
    
    sendButton.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    // ADD THIS NEW CODE TO THE BOTTOM OF script.js

    // --- NEW FEATURE: Customer Design Upload ---

    const uploadBox = document.getElementById('image-upload-box');
    const fileInput = document.getElementById('design-upload-input');
    const imagePreview = document.getElementById('image-preview');
    const analyzeButton = document.getElementById('analyze-button');
    const submitButton = document.getElementById('submit-button');
    const aiInstructions = document.getElementById('ai-instructions');
    const aiResults = document.getElementById('ai-results');
    const aiDescription = document.getElementById('ai-description');
    const aiTags = document.getElementById('ai-tags');
    const loader = document.getElementById('loader');
    const analyzeButtonText = document.getElementById('analyze-button-text');

    let imageDataBase64 = null;

    // Trigger file input when the box is clicked
    uploadBox.addEventListener('click', () => fileInput.click());

    // Handle the file selection
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            
            // Convert to Base64 for the API
            imageDataBase64 = e.target.result.split(',')[1];

            // Enable the analyze button
            analyzeButton.disabled = false;
            aiInstructions.classList.add('hidden');
            aiResults.classList.add('hidden');
            submitButton.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    });

    // Handle the "Analyze with AI" button click
    analyzeButton.addEventListener('click', async () => {
        if (!imageDataBase64) {
            alert("Please upload an image first.");
            return;
        }

        // Show loading state
        loader.classList.remove('hidden');
        analyzeButtonText.textContent = 'Analyzing...';
        analyzeButton.disabled = true;

        // --- AI API Call ---
        const apiKey = ""; // IMPORTANT: Make sure your key is here!
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const prompt = `Analyze this image of a customer's design idea, likely for jewelry or a craft item. Provide a short, appealing description for an artisan to read, and a list of 5-7 relevant tags. Format the output exactly like this:
Description: [Your generated description here]
Tags: [tag1], [tag2], [tag3], ...`;

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: imageDataBase64
                        }
                    }
                ]
            }]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiText) {
                // Parse the response
                const descriptionMatch = aiText.match(/Description: (.*)/);
                const tagsMatch = aiText.match(/Tags: (.*)/);

                const description = descriptionMatch ? descriptionMatch[1].trim() : "Could not generate a description.";
                const tags = tagsMatch ? tagsMatch[1].split(',').map(tag => tag.trim()) : [];

                // Display the results
                aiDescription.textContent = description;
                aiTags.innerHTML = ''; // Clear previous tags
                tags.forEach(tag => {
                    const tagElement = document.createElement('span');
                    tagElement.className = 'tag-pill';
                    tagElement.textContent = tag;
                    aiTags.appendChild(tagElement);
                });

                aiResults.classList.remove('hidden');
                submitButton.classList.remove('hidden');
            } else {
                 aiDescription.textContent = "Sorry, I couldn't analyze the image. Please try another one.";
                 aiResults.classList.remove('hidden');
            }

        } catch (error) {
            console.error("AI Image Analysis Error:", error);
            aiDescription.textContent = "An error occurred while contacting the AI. Please check the console and try again.";
            aiResults.classList.remove('hidden');
        } finally {
            // Hide loading state
            loader.classList.add('hidden');
            analyzeButtonText.textContent = 'Analyze with AI';
            analyzeButton.disabled = false; // Re-enable in case they want to re-analyze
        }
    });

    // Handle the "Submit to Artisans" button click
    submitButton.addEventListener('click', () => {
        alert("Thank you! Your design has been shared with our artisan community. Those who can create it will be in touch soon!");
        // Here you would normally send the data to a backend server
    });

// The final }); from the original script should be after this block

});
