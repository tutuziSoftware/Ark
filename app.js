angular.module('fx0', []).controller("saveController", function($scope, $http){
  initOauth($http);
  
  //---private-----------------------------------------------------------------------------------------------
  var editor = new Editor;
  
  //---$scope------------------------------------------------------------------------------------------------
  $scope.showSearch = false;
  
  editor.get(function(err, text){
    $scope.editor = text;
    $scope.$apply();
  });
  
  $scope.toggleGists = function(){
    $scope.showGists = !$scope.showGists;
  };
  
  $scope.test = function(){
    editor.write($scope.editor);
  };
  
  $scope.search = function(){};
  
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
        new Storage("userId").setItem(data.id);
      }).error(function(data){
        console.log(data);
      });
    });
  }
});








function Editor(){}

Editor.prototype.KEY = "editor";

Editor.prototype.write = function(text){
  console.log(this.KEY, text);
  localforage.setItem(this.KEY, text);
};

Editor.prototype.get = function(callback){
  localforage.getItem(this.KEY, callback);
};

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