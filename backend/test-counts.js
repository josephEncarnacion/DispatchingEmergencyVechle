const dbOperation = require('./dbfiles/dbOperation');

async function testCounts() {
    try {
        console.log('Testing total counts...');
        
        const complaintsCount = await dbOperation.getTotalComplaintsCount();
        console.log('Total complaints:', complaintsCount);
        
        const emergenciesCount = await dbOperation.getTotalEmergenciesCount();
        console.log('Total emergencies:', emergenciesCount);
        
        console.log('Test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testCounts();

