var mongoose = require('mongoose');
var skillsSchema = mongoose.Schema({
	skill: {
		type: String,
		unique: true
	}
});
var skill = module.exports = mongoose.model('Skill', skillsSchema);
module.exports.CreateSkill = function(newSkill,callback){
	console.log(newSkill);
	newSkill.save(callback);
}
