angular.module('fx0', []).controller("saveController", ['$scope', '$http', '$timeout', function($scope, $http, $timeout){
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
  
  $scope.selectGists = function(gist, file){
    selectedGist.gistId = gist.id;
    selectedGist.file = file;
    const editorSave = new Storage(selectedGist.gistId+file.filename);
    
    new Storage("accessToken").getItem().then(function(accessToken){
      $http({
        url:"https://api.github.com/gists/"+gist.id
      }).success(function(gist){
        var text = gist.files[file.filename].content;
        
        editorSave.getItem().then(function(savedText){
          //ローカルにデータ存在
          if(text == savedText){
            $scope.editor = text;
          }else{
            $scope.editor = savedText;
            $scope.showConflict = true;
          }
          
          $scope.showEditor = true;
          $scope.showGists = false;
          $scope.offline = false;
          $scope.$apply();
        }).catch(function(){
          //ローカルにデータなし、ネットワークからデータあり
          editorSave.setItem(text);
          $scope.editor = text;
          $scope.showEditor = true;
          $scope.showGists = false;
          $scope.offline = false;
          $scope.$apply();
        });
      }).error(function(){
        //通信エラー
        console.log("e");
        editorSave.getItem().then(function(text){
          $scope.editor = text;
          $scope.showEditor = true;
          $scope.showGists = false;
          $scope.offline = true;
          $scope.$apply();
        }).catch(function(){
          $scope.showEditor = false;
          $scope.showGists = true;
          $scope.offline = true;
          $scope.$apply();
        });
      });
    });
  };
  
  $scope.toggleGists = function(){
    $scope.saveGist();
    
    $scope.showEditor = !$scope.showEditor;
    $scope.showGists = !$scope.showGists;
    $scope.showConflict = false;
  };
  
  $scope.saveGist = function(){
    new Storage(selectedGist.gistId+selectedGist.file.filename).setItem($scope.editor);
    
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
        $scope.saved = true;
        $scope.showConflict = false;
        $timeout(function(){
          $scope.saved = false;
        }, 3000);
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
  
  /**
   * gistからデータを取得します。
   * この関数はuserId、accessTokenが存在しない場合、何も行いません。
   */
  function fetchGists(){
    new Storage("userId").getItem().then(function(userId){
      new Storage("accessToken").getItem().then(function(accessToken){
        $http({
          url:"https://api.github.com/users/"+userId+"/gists",
          method:"GET",
          headers: {
            Authorization: "token "+accessToken
          }
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