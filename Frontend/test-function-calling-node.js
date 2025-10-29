// Simple test for function calling without browser dependencies
const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Key
const API_KEY = 'AIzaSyAjCLlJHuJymK3q94RRJvGk52qIlBXAUwg';

async function testFunctionCalling() {
    try {
        console.log('🚀 Starting Function Calling Test...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{
                functionDeclarations: [{
                    name: 'create_project',
                    description: 'Creates a new project with tasks, lists, and additional components. Use this when the user asks to create, build, or set up a project.',
                    parameters: {
                        type: 'object',
                        properties: {
                            project_name: {
                                type: 'string',
                                description: 'A clear, concise name for the project'
                            },
                            project_description: {
                                type: 'string',
                                description: 'A brief description of what the project is about'
                            },
                            lists: {
                                type: 'array',
                                description: 'Array of task lists/categories for organizing project tasks'
                            }
                        },
                        required: ['project_name', 'project_description', 'lists']
                    }
                }]
            }]
        });

        const testPrompt = `I want to create a project for building a mobile task management app called "TaskMaster Pro". 

The app should include:
- User authentication
- Task creation and editing
- Priority levels and due dates
- Team collaboration features
- Progress tracking
- Notifications

Please organize this into phases like Planning, Development, Testing, and Deployment with specific tasks for each phase.

Create the complete project structure for me.`;

        console.log('📝 Sending prompt to Gemini...');
        console.log('💬 Prompt:', testPrompt.substring(0, 100) + '...');

        const result = await model.generateContent(testPrompt);
        const response = result.response;

        console.log('📨 Response received!');

        // Check for function calls
        const functionCalls = response.functionCalls?.();
        
        if (functionCalls && functionCalls.length > 0) {
            console.log('🎉 SUCCESS: Function calls detected!');
            console.log('📞 Number of function calls:', functionCalls.length);
            
            functionCalls.forEach((functionCall, index) => {
                console.log(`\n🔧 Function ${index + 1}:`);
                console.log('  Name:', functionCall.name);
                console.log('  Arguments:', JSON.stringify(functionCall.args, null, 2));
            });
            
            return { success: true, functionCalls };
        } else {
            console.log('❌ NO FUNCTION CALLS DETECTED');
            console.log('📄 Direct response:', response.text());
            return { success: false, response: response.text() };
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        return { success: false, error: error.message };
    }
}

// Test with confirmation flow
async function testConfirmationFlow() {
    try {
        console.log('\n🔄 Testing Confirmation Flow...');
        
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: [{
                functionDeclarations: [{
                    name: 'create_project',
                    description: 'Creates a new project with tasks, lists, and additional components. Use this when the user asks to create, build, or set up a project.',
                    parameters: {
                        type: 'object',
                        properties: {
                            project_name: {
                                type: 'string',
                                description: 'A clear, concise name for the project'
                            },
                            project_description: {
                                type: 'string',
                                description: 'A brief description of what the project is about'
                            },
                            lists: {
                                type: 'array',
                                description: 'Array of task lists/categories'
                            }
                        },
                        required: ['project_name', 'project_description', 'lists']
                    }
                }]
            }]
        });

        // Simulate conversation
        const conversation = [
            {
                role: 'user',
                parts: [{ text: 'I want to build an e-commerce website for selling handmade crafts' }]
            }
        ];

        console.log('👤 Step 1: User mentions project idea...');
        let result = await model.generateContent(conversation);
        let response = result.response.text();
        console.log('🤖 AI Response 1:', response);

        // Add AI response to conversation
        conversation.push({
            role: 'model',
            parts: [{ text: response }]
        });

        // User confirms
        conversation.push({
            role: 'user',
            parts: [{ text: 'Yes, please go ahead and create the complete project structure for this e-commerce website.' }]
        });

        console.log('👤 Step 2: User confirms project creation...');
        
        result = await model.generateContent(conversation);
        response = result.response;

        const functionCalls = response.functionCalls?.();
        
        if (functionCalls && functionCalls.length > 0) {
            console.log('🎉 SUCCESS: Function call triggered after confirmation!');
            
            functionCalls.forEach((functionCall, index) => {
                console.log(`\n🔧 Function ${index + 1}:`);
                console.log('  Name:', functionCall.name);
                console.log('  Arguments:', JSON.stringify(functionCall.args, null, 2));
            });
            
            return { success: true, functionCalls };
        } else {
            console.log('❌ NO FUNCTION CALL after confirmation');
            console.log('📄 Response:', response.text());
            return { success: false, response: response.text() };
        }

    } catch (error) {
        console.error('❌ Error in confirmation flow:', error.message);
        return { success: false, error: error.message };
    }
}

// Run both tests
async function runAllTests() {
    console.log('🧪 Starting Function Calling Tests\n');
    
    const test1 = await testFunctionCalling();
    const test2 = await testConfirmationFlow();
    
    console.log('\n📊 Test Results Summary:');
    console.log('Direct Function Call Test:', test1.success ? '✅ PASSED' : '❌ FAILED');
    console.log('Confirmation Flow Test:', test2.success ? '✅ PASSED' : '❌ FAILED');
    
    if (test1.success || test2.success) {
        console.log('\n🎉 Function calling is working! At least one test passed.');
    } else {
        console.log('\n⚠️ Function calling may not be working properly. Both tests failed.');
    }
}

module.exports = { testFunctionCalling, testConfirmationFlow, runAllTests };

// Run if called directly
if (require.main === module) {
    runAllTests();
}