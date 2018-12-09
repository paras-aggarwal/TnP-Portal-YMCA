var mongoose = require('mongoose');

var CompanySchema = mongoose.Schema({
	name: String,
	position: String,
	package: Number,
	type: String,
	criteria: {
		percent_10:
		{
			type:Number,
			default:0
		},
		percent_12:
		{
			type:Number,
			default:0
		},
		percent_diploma:
		{
			type:Number,
			default:0
		},
		cpi:
		{
			type:Number,
			default:0
		},
		backlogs:
		{
			type:Number,
			default:0
		},
		branch:
		{
			type:[String],
			default:["CE","IT","ECE","ME","EIC","EL"]
		}
	},
	position_details: String,
	schedule: String,
	additional_details: String,
	eligible_students: [String],
	registered_students: [String],
	offered: [String],
	status: {
		type: String,
		default: "Open"
	}
});

var Company = module.exports = mongoose.model('Company', CompanySchema);

module.exports.createCompany = function(newCompany,callback){
	newCompany.save(callback);
}

module.exports.getUserByOppurtunity = function(CurrUser,callback){
	Company.find(
	{
	  "criteria.percent_10":{$lte:CurrUser.percent_10_value},
	  "criteria.percent_12":{$lte:CurrUser.percent_12_value},
	  "criteria.percent_diploma":{$lte:CurrUser.percent_diploma_value},
	  "criteria.cpi":{$lte:CurrUser.cpi},
	}, callback)
}

module.exports.updateEligibleStudents = function(companyName, students, callback){
	Company.update({name: companyName}, {$set: {eligible_students: students}}, callback);
}
module.exports.updateOfferedStudents = function(companyId, students, callback){
	Company.update({_id: companyId}, {$push: {offered: students}}, callback);
}
module.exports.getAllCompanies = function(CurrUser, callback){
	Company.find(callback);
}
module.exports.getCompanyByid = function(id, callback){
	Company.findById(id, callback);
}

module.exports.updateUsersForRegisteration = function(cid, currUser, callback){
	console.log(cid);
	console.log(currUser.email);
	Company.update({_id: cid}, {$push: {registered_students: currUser.email}}, callback);
}
