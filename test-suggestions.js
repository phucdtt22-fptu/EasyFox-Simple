// Test script để kiểm tra SuggestionAgent
require('dotenv').config();
const SuggestionAgent = require('./server/services/suggestionAgent.js');

async function testSuggestions() {
  console.log('🧪 Testing SuggestionAgent...');
  
  try {
    const agent = new SuggestionAgent();
    
    const userInfo = { id: 'test-user' };
    const lastMessage = {
      question: 'Tôi muốn tạo chiến dịch marketing cho quán cà phê',
      ai_response: 'Tôi sẽ giúp bạn tạo chiến dịch marketing cho quán cà phê. Hãy cho tôi biết thêm về đối tượng khách hàng mục tiêu của bạn.'
    };
    const businessContext = {
      notes: 'Quán cà phê nhỏ ở trung tâm thành phố, phục vụ sinh viên và dân văn phòng'
    };
    
    console.log('🎯 Testing with coffee shop context...');
    const result = await agent.generateSuggestions(userInfo, lastMessage, businessContext);
    
    console.log('✅ Test result:', result);
    
    if (result.success && result.suggestions.length > 0) {
      console.log('🎉 SUCCESS: Suggestions generated successfully!');
      result.suggestions.forEach((suggestion, i) => {
        console.log(`   ${i+1}. "${suggestion}"`);
      });
    } else {
      console.log('❌ FAILED: No suggestions generated');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSuggestions();
