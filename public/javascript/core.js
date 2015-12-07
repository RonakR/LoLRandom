var lolRandom = angular.module('lolRandom', []);

lolRandom.controller('mainController', function ($scope){
	$scope.testData = "testing";
	$(".chosen-select").chosen();
});