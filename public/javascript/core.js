const lolRandom = angular.module('lolRandom', []);

lolRandom.controller('mainController', ['$scope', '$http', ($scope, $http) => {
  window.particlesJS.load('particles-js', 'assets/particlejs-config.json', () => {
    console.log('callback - particles.js config loaded');
  });
  $scope.champions = ''; // Response from API
  $scope.champion = '';  // Selected Champ. Either by random or click.

  $('.chosen-select').chosen();

  $scope.generate = () => {
    // var sendVar = {tags: $(".chosen-select").val()};
    $scope.champion = ''
    const sendVar = $('.chosen-select').val();
    $http.post('api/championsByRoles', sendVar)
    .then((body) => {
      $scope.champions = body.data;
      // $scope.alterData();
    });
  };
  // $scope.alterData = function() {
  //  console.log($scope.champions)
  //  angular.forEach($scope.champions, function(value, key) {
  //    angular.forEach(value.laneInfo, function(laneValue, laneKey){
  //      console.log(laneValue);
  //    });
  //  });
  // }
  $scope.championSelected = (champion) => {
    $scope.champion = champion;
  };

  $scope.randomize = () => {
    const numChampions = $scope.champions.length;
    const randomNum = Math.floor((Math.random() * numChampions));
    $scope.champion = $scope.champions[randomNum];
  };
}]);
