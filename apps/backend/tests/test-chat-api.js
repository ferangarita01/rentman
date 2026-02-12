/**
 * Test Chat API Endpoints
 * Run: node test-chat-api.js
 */

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:8080';

async function testChatEndpoint() {
    console.log('\n🧪 Testing /api/chat endpoint...\n');

    const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: '¿Cuál es el estado de mi contrato actual?',
            context: {
                userName: 'Test User',
                currentContract: {
                    id: 'TEST-001',
                    type: 'delivery',
                    location: 'Ciudad de México',
                    status: 'active'
                }
            },
            history: []
        })
    });

    const data = await response.json();

    if (response.ok) {
        console.log('✅ Chat API working');
        console.log('📝 Response:', data.response.substring(0, 100) + '...');
        console.log('⏰ Timestamp:', data.timestamp);
    } else {
        console.error('❌ Chat API failed');
        console.error('Error:', data);
    }

    return response.ok;
}

async function testSuggestionsEndpoint() {
    console.log('\n🧪 Testing /api/suggestions endpoint...\n');

    const response = await fetch(`${BASE_URL}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: {
                userName: 'Test User',
                currentRental: {
                    id: 'TEST-001',
                    type: 'delivery'
                }
            }
        })
    });

    const data = await response.json();

    if (response.ok) {
        console.log('✅ Suggestions API working');
        console.log('💡 Suggestions:', data.suggestions);
    } else {
        console.error('❌ Suggestions API failed');
        console.error('Error:', data);
    }

    return response.ok;
}

async function runTests() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Rentman Chat API Tests');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Target: ${BASE_URL}`);

    try {
        const chatResult = await testChatEndpoint();
        const suggestionsResult = await testSuggestionsEndpoint();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Results:');
        console.log(`  Chat API: ${chatResult ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Suggestions API: ${suggestionsResult ? '✅ PASS' : '❌ FAIL'}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        process.exit(chatResult && suggestionsResult ? 0 : 1);
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('\nMake sure backend server is running:');
        console.error('  cd apps/backend');
        console.error('  npm start\n');
        process.exit(1);
    }
}

runTests();
