var lolRandom = angular.module('lolRandom', []);

lolRandom.controller('mainController', ['$scope', '$http', 
	function ($scope, $http){
	$scope.testData = "testing";

	$(".chosen-select").chosen();
	$scope.testing = function(){
		console.log("tesging");
	};
	$scope.generate = function(){
		// var sendVar = {tags: $(".chosen-select").val()};
		var sendVar = $(".chosen-select").val();
		console.log(JSON.stringify(sendVar));
		$http.post('api/championsByRoles', sendVar)
			.success(function(data){
				console.log(data);
				$scope.champions = data;
			});	
	};
}]);