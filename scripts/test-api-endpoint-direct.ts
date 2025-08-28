import fetch from 'node-fetch';

async function testAPIEndpoint() {
  try {
    console.log('🧪 Testing API endpoint directly...');

    // Test 1: Test the main tickets endpoint
    console.log('📋 Testing main tickets endpoint...');
    const ticketsResponse = await fetch('http://localhost:3000/api/admin/support-tickets');
    console.log('📡 Tickets response status:', ticketsResponse.status);
    const ticketsText = await ticketsResponse.text();
    console.log('📡 Tickets response text:', ticketsText.substring(0, 200) + '...');

    // Test 2: Test the message endpoint with GET
    console.log('💬 Testing message endpoint with GET...');
    const messageGetResponse = await fetch('http://localhost:3000/api/admin/support-tickets/1/message');
    console.log('📡 Message GET response status:', messageGetResponse.status);
    const messageGetText = await messageGetResponse.text();
    console.log('📡 Message GET response text:', messageGetText);

    // Test 3: Test the message endpoint with POST
    console.log('📤 Testing message endpoint with POST...');
    const messagePostResponse = await fetch('http://localhost:3000/api/admin/support-tickets/1/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test message from direct API test',
        senderId: 'test-user'
      }),
    });
    console.log('📡 Message POST response status:', messagePostResponse.status);
    const messagePostText = await messagePostResponse.text();
    console.log('📡 Message POST response text:', messagePostText);

    console.log('🎉 API endpoint test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPIEndpoint();
