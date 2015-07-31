angular.module('storyCtrl', ['storyService'])

.controller('StoryController', function(Story, socketio) {
	
	var vm = this;

	Story.getStory()
		.success(function(data) {
			vm.stories = data;
		});

	vm.createStory = function() {

	Story.create(vm.storyData)
		.success(function(data) {
			//clear from
			vm.storyData = '';

			vm.message = data.message;

			
		});
	};

	socketio.on('story', function(data) {
		vm.stories.push(data);
	})

})

.controller('AllStoriesController', function(stories, socketio) {
	var vm = this;

	vm.stories = stories.data;

	socketio.on('story', function(data) {
		vm.stories.push(data);
	});

});