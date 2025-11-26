const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const departmentSchema = new mongoose.Schema({
  name: String,
  code: String,
  description: String,
  sections: [String],
  // ... other fields
}, { strict: false });

const Department = mongoose.model('Department', departmentSchema);

async function checkDepartments() {
  try {
    const departments = await Department.find({});
    console.log('\n=== DEPARTMENTS IN DATABASE ===');
    
    departments.forEach(dept => {
      console.log(`\nDepartment: ${dept.name} (${dept.code})`);
      console.log(`Sections:`, dept.sections || 'NOT SET');
      console.log(`All fields:`, Object.keys(dept.toObject()));
    });

    console.log(`\nTotal departments: ${departments.length}`);
    
    // Check if any department has sections
    const depsWithSections = departments.filter(d => d.sections && d.sections.length > 0);
    console.log(`Departments with sections: ${depsWithSections.length}`);
    
    if (depsWithSections.length === 0) {
      console.log('\n⚠️  NO DEPARTMENTS HAVE SECTIONS DATA!');
      console.log('This explains why the dropdown is empty.');
      
      // Show how to fix this
      console.log('\n💡 To fix this, you can either:');
      console.log('1. Update existing departments to add sections');
      console.log('2. Create new departments with sections');
      console.log('\nExample update command:');
      console.log('await Department.updateMany({}, { sections: ["A", "B"] });');
    }
    
  } catch (error) {
    console.error('Error checking departments:', error);
  } finally {
    mongoose.disconnect();
  }
}

checkDepartments();