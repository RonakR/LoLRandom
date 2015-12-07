var lolRandom = angular.module('lolRandom', []);

lolRandom.controller('mainController', function ($scope, $http){
	$scope.testData = "testing";

	$scope.generate = function(){
		console.log("here");
		$http.post('/api/championsByRoles', $(".chosen-select").val())
			.success(function(data){
				console.log(data);
			});	
	};

	$(".chosen-select").chosen();
});