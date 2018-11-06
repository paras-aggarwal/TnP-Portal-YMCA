# Placement-Portal
Training and Placement Cell Portal

## Get Started
This Project is designed and Developed for Training and Placement Cell, LNMIIT jaipur.Students can Register for company placement process through this portal.The Training and Placement officer can find or able to filter students according to company requirement.

### Prerequisites

```

(1) Node.Js
(2) MongoDb
(3) Express
(4) Angular.Js
```

### DataBase Design

(1)User

```

email: {
	type: String,
	unique: true
},
rollno: {
	type: String
},
password: {
	type: String
},
user_level: {
	type: String,
	default:'student'/'Admin'
},
name: String,
branch: String,
gender: String,
date_of_birth: {
	type: Date,
	default: Date.now
},
phone_no: {
	phone_no1: Number,
	phone_no2: Number
},
spi:{
	spi_1: Number,
	spi_2: Number,
	spi_3: Number,
	spi_4: Number,
	spi_5: Number,
	spi_6: Number,
	spi_7: Number,
	spi_8: Number,
},
cpi: Number,
percent_10_type: String,
percent_10_value: Number,
percent_12_type: String,
percent_12_value: Number,
skills: [String],
application: [String],
offers: [String],
offer_level: Number,
register_level:{
	type: Number,
	default: 0
},
status: {
	type: String,
	default: 'registered'					//active,registered,suspended
}

```

(2)Company

```

_id: Schema.ObjectId,
name: String,
position: {

},
branch: [String],
criteria: {
	percent_10: Number,
	percent_12: Number,
	cpi: Number
},
process: {

},
type: {

},
attachments: [],
schedule: {},
additional_details: String,

eligible_students: {},
registered_students: {},
offered: {},
status: {}

```
(3)Skills

```

_id: Schema.ObjectId,

```
(4)Application

```

_id: Schema.ObjectId,

```
(2)Offers

```

_id: Schema.ObjectId,

```

### Dummy Database
Dummy database can be found in /database folder.
Generated Using [json-generator.com](https://www.json-generator.com/)

### Developers
 * **Shree Ram Bansal** [Linkedin](https://www.linkedin.com/in/shree-ram-b-a48786104/) [Facebook](https://www.facebook.com/shreeram.bansal)
 * **Jiten Singn Sadhwani** [Linkedin](https://www.linkedin.com/in/jiten-singh-sadhwani-1b109b10b/) [Facebook](https://www.facebook.com/sadhwani.jiten)
 * **Mudit Garg** [Linkedin](https://www.linkedin.com/in/mudit-garg8560/) [Facebook](https://www.facebook.com/mudit.garg.50)

### License
This Project is under License.
