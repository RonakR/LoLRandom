var lolRandom = angular.module('lolRandom', [])

lolRandom.controller('mainController', ['$scope', '$http',
  function ($scope, $http) {
    window.particlesJS.load('particles-js', 'assets/particlejs-config.json', function () {
      console.log('callback - particles.js config loaded')
    })
    $scope.champions = '' // Response from API
    $scope.champion = ''  // Selected Champ. Either by random or click.

    $('.chosen-select').chosen()

    $scope.generate = function () {
      // var sendVar = {tags: $(".chosen-select").val()};
      $scope.champion = ''
      var sendVar = $('.chosen-select').val()
      $http.post('api/championsByRoles', sendVar)
      .success(function (data) {
        $scope.champions = data
        // $scope.alterData();
      })
    }
    // $scope.alterData = function() {
    //  console.log($scope.champions)
    //  angular.forEach($scope.champions, function(value, key) {
    //    angular.forEach(value.laneInfo, function(laneValue, laneKey){
    //      console.log(laneValue);
    //    });
    //  });
    // }
    $scope.championSelected = function (champion) {
      $scope.champion = champion
    }
    $scope.randomize = function () {
      var numChampions = $scope.champions.length
      var randomNum = Math.floor((Math.random() * numChampions))
      $scope.champion = $scope.champions[randomNum]
    }
  }
])
