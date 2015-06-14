ark.directive('searchEditor', function() {
  var index = 0;
  var query = "";

  return function(scope, element, attrs) {
    scope.searchEditor = function(mode){
      const MODE = {
        next:{
          methodName:"indexOf",
          offset:1
        },
        prev:{
          methodName:"lastIndexOf",
          offset:-1
        }
      };

      const method = MODE[mode].methodName;
      const offset = MODE[mode].offset;

      index = $(element).val()[method](scope.searchQuery, index + offset);

      console.log(index);
      console.log(MODE[mode]);

      if(index === -1){
        return;
      }

      element[0].focus();
      element[0].setSelectionRange(index, index + scope.searchQuery.length);
    }
  };
});
