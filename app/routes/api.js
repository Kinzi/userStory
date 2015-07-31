var User = require('../models/user');
var Story = require('../models/story');
var config = require('../../config');
var secretKey = config.secretKey;
var jsonwebtoken = require('jsonwebtoken');

function createToken(user) {
	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresInMinute: 1440
	});

	return token;
}

module.exports = function(app, express, io) {
	var api = express.Router();

	api.get('/all_stories', function(req, res) {
		Story.find({}, function(err, stories) {
			if(err) {
				res.send(err);
				return;
			}
			res.json(stories);
		});
	});

	//SignUp and save new user to DB
	api.post('/signup', function(req, res) {
		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});

		var token = createToken(user);

		user.save(function(err) {
			if(err) {
				res.send(err);
				return;
			}

			res.json({
				success: true,
				message:'User has been created!',
				token: token
			});
		});
	});

	//Get Users from DB
	api.get('/users', function(req, res) {
		
		User.find({}, function(err, users) {
			if(err) {
				res.send(err);
				return;
			}
			res.json(users);
		});
	});

	//Login and get Token
	api.post('/login', function(req, res) {

		User.findOne({
			username: req.body.username
		}).select('name username password').exec(function(err, user) {
			if (err) throw err;

			if(!user) {
				res.send({message: "User doens't exist!"});
			} else if(user){

				var validPassword = user.comparePassword(req.body.password);

				if(!validPassword) {
					res.send({ message: "Invalid Password"});
				} else {
					var token = createToken(user);

					res.json({
						success: true,
						message: "Successfully logged in!",
						token: token
					});
				}
			}
		});
	});

	//Middleware to check for Token (signed up?)
	api.use(function(req, res, next) {
		console.log("Somebody just checked our app!");

		var token = req.body.token || req.param('token') || req.headers['x-access-token'];

		//check if token exists
		if(token) {
			jsonwebtoken.verify(token, secretKey, function(err, decoded) {
				if(err) {
					res.status(403).send({ success: false, message: "Failed authentification"});
				} else {
					req.decoded = decoded;
					next();
				}
			});
		} else {
			res.status(403).send({ success: false, message: "No token"});
		}
	});

	//If have token save/retrieve stories
	api.route('/')

		.post(function(req, res) {
			var story = new Story({
				creator: req.decoded.id,
				content: req.body.content
			});

			story.save(function(err, newStory) {
				if(err) {
					res.send(err);
					return
				}
				io.emit('story', newStory)
				res.json({message: "New Story created!"});
			});
		})

		.get(function(req, res) {
			Story.find({ creator: req.decoded.id }, function(err, stories) {

				if(err) {
					res.send(err);
					return;
				}

				res.json(stories);
			});
		});

	//Fetch user Data for FrontEnd
	api.get('/me', function(req, res) {
		res.json(req.decoder);
	});

	return api
}