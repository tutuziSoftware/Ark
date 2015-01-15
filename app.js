angular.module('fx0', []).controller("saveController", ['$scope', '$http', function($scope, $http){
  console.log($http);
  initOauth($http);
  fetchGists();
  
  //---private-----------------------------------------------------------------------------------------------
  var selectedGist = {
    gistId:null,
    file:null
  };
  
  //---$scope------------------------------------------------------------------------------------------------
  $scope.showGists = true;
  $scope.showSearch = false;
  $scope.showEditor = false;
  $scope.offline = false;
  
  $scope.selectGists = function(gistId, file){
    selectedGist.gistId = gistId;
    selectedGist.file = file;
    
    $http({
      url:file.raw_url
    }).success(function(text){
      new Storage(gistId+file.raw_url).setItem(text);
      
      $scope.editor = text;
      $scope.showEditor = true;
    }).error(function(){
      new Storage(gistId+file.raw_url).getItem().then(function(text){
        $scope.editor = text;
        $scope.showEditor = true;
      }).catch(function(){
        $scope.offline = true;
        $scope.showEditor = false;
      });
    });
  };
  
  $scope.saveGist = function(){
    new Storage("accessToken").getItem().then(function(accessToken){
      console.log(accessToken);

      var files = {};

      files[selectedGist.file.filename] = {
        content:$scope.editor
      };

      $http({
        url:"https://api.github.com/gists/"+selectedGist.gistId,
        method:"PATCH",
        data:{
          files:files
        },
        headers: {
          Authorization: "token "+accessToken
        }
      }).success(function(){
        console.log(arguments);
      }).error(function(){
        console.log(arguments);
      });
    });
  };
  
  //---functions---------------------------------------------------------------------------------------------
  
  /**
   * githubのOAuth承認を行います。
   */
  function initOauth($http){
    const APP_ID = "b3acd7e486cdddfc9a7d";
  
    new Storage("accessToken").getItem()
      .then(initUserData.bind(this, $http))
      .catch(function(){
        window.open("https://github.com/login/oauth/authorize?client_id=b3acd7e486cdddfc9a7d&scope=gist", "_blank");

        var code = prompt('codeを入力してください');
        
        console.log($http);

        $http({
          url:"https://github.com/login/oauth/access_token",
          method:"POST",
          data:{
            client_id:APP_ID,
            client_secret:"c59721ff0a3e25b174570e43da4070cca81fabb9",
            code:code
          }
        })
        .success(function(param){
          console.log(param);
          var accessToken = param.match(/access_token=([^&]*)/)[1];

          if(accessToken != void 0){
            console.log(accessToken);
            new Storage("accessToken").setItem(accessToken).then(function(){
              initUserData($http);
            });
          }
        })
        .error(function(data, status){
          console.log(data, status);
        });
      });
  }
  
  function initUserData($http){
    console.log("initUserData");
    new Storage("accessToken").getItem().then(function(accessToken){
      $http({
        url:"https://api.github.com/user?access_token="+accessToken,
        method:"GET"
      }).success(function(data){
        new Storage("userId").setItem(data.login);
      }).error(function(data){
        console.log(data);
      });
    });
  }
  
  function fetchGists(){
    new Storage("userId").getItem().then(function(userId){
      $http({
        url:"https://api.github.com/users/"+userId+"/gists",
        method:"GET"
      }).success(function(gists){
        $scope.offline = false;

        new Storage("gist").setItem(gists);
        $scope.gists = gists;
      }).error(function(){
        $scope.offline = true;

        new Storage("gist").getItem().then(function(gists){
          $scope.gists = gists;
        });
      });
    });
  }
}]);











/**
 * 永続ストレージにアクセスする為のクラスです。
 */
function Storage(key){
  this._key = key;
}
Storage.prototype.setItem = function(text){
  console.log(this._key, text);
  return localforage.setItem(this._key, text);
};
/**
 * データを取得します。
 * データが存在しない場合、Promiseはcatchを返します。
 */
Storage.prototype.getItem = function(){
  var self = this;
  
  return new Promise(function (resolve, reject){
    localforage.getItem(self._key).then(function(data){
      if(data == null){
        reject();
      }else{
        resolve(data);
      }
    });
  });
};