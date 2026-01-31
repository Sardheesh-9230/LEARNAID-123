const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/learnaid').then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({}, {strict: false}));
  const Subject = mongoose.model('Subject', new mongoose.Schema({}, {strict: false}));
  const QuestionWiseMarks = mongoose.model('QuestionWiseMarks', new mongoose.Schema({}, {strict: false}));
  const ImprovementTask = mongoose.model('ImprovementTask', new mongoose.Schema({}, {strict: false}));
  
  const studentId = '6758b0f0eb16e66cb8d16f15';
  
  console.log('=== STUDENT DATA CHECK ===');
  const student = await User.findById(studentId);
  console.log('Student:', student ? student.username : 'Not found');
  
  const subjects = await Subject.find({ students: studentId });
  console.log('\nSubjects assigned:', subjects.length);
  subjects.forEach(s => console.log('  -', s.name, s.code));
  
  const marks = await QuestionWiseMarks.find({ student: studentId });
  console.log('\nMarks/CIA records:', marks.length);
  marks.forEach(m => console.log('  - Exam:', m.examType, 'Marks:', m.obtainedMarks + '/' + m.totalMarks));
  
  const tasks = await ImprovementTask.find({ 'studentAssignments.student': studentId });
  console.log('\nImprovement tasks:', tasks.length);
  tasks.forEach(t => console.log('  - Task:', t.title, 'Type:', t.isMultiStudent ? 'Multi' : 'Single'));
  
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { 
  console.error(err); 
  process.exit(1); 
});
