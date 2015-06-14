(function(marnie, modules){
    modules.forEach(function(module){
        module(marnie);
    });
})((function(){
    //init
    if('marnie' in this){
        var marnie = this['marnie'];
    }else{
        var marnie = {};
        this['marnie'] = marnie;
    }

    return marnie;
})(), [
    function(marnie){
        /**
         * とある範囲を指定します。
         * このクラスはイミュータブルです。
         * @param first
         * @param last
         * @param forEachCallback
         * @returns {marnie.Range}
         * @constructor
         */
        marnie.Range = function(first, last, forEachCallback){
            if(typeof first !== 'number' || typeof last !== 'number'){
                console.log('数値を指定してください');
                return;
            }
            if(this.constructor != marnie.Range){
                return new marnie.Range(first, last, forEachCallback);
            }

            if(first < last){
                this.FIRST = first;
                this.LAST = last;
            }else{
                var swap = first;
                this.FIRST = last;
                this.LAST = swap;
            }

            Object.freeze(this);

            if(typeof forEachCallback === 'function') this.forEach(forEachCallback);
        };

        //デフォルト値
        marnie.Range.prototype.FIRST = 0;
        marnie.Range.prototype.LAST = 0;

        /**
         * 範囲内の値を返します。
         * @param callback
         */
        marnie.Range.prototype.forEach = function(callback){
            if(typeof callback !== 'function'){
                console.log('関数を指定してください');
                return;
            }

            var index = 0;

            for(var count = this.FIRST ; count <= this.LAST ; count++, index++){
                callback(count, index);
            }
        };

        /**
         * 範囲内である場合、trueを返します。
         * @param check
         * @returns {boolean}
         */
        marnie.Range.prototype.on = function(check){
            return this.FIRST <= check && check <= this.LAST;
        }

        /**
         * 範囲外である場合、trueを返します。
         * @param check
         * @returns {boolean}
         */
        marnie.Range.prototype.out = function(check){
            return check < this.FIRST || this.LAST < check;
        }

        /**
         * 範囲内か範囲外を判定し、コールバックを実行します。
         * @param check
         */
        marnie.Range.prototype.route = function(check){
            //routeはcheckの値毎にインスタンスを生成する必要がある。
            //thisと関数を紐付けるとメモリリークになりそうなので可能な限り値を
            //オブジェクト内に収めるようにした。
            //
            //第二引数に{on:func, out:func}とする手もあるが、これだと複数の関数が同時に実行出来ない。
            //また、on()out()が分かれている為、onだけ実行したいという場合にも一応対応出来る。
            return {
                _CHECK:check,
                FIRST:this.FIRST,
                LAST:this.LAST,
                on:function(callback){
                    check = null;
                    if(marnie.Range.prototype.on.call(this, this._CHECK)){
                        callback();
                    }
                    return this;
                },
                out:function(callback){
                    check = null;
                    if(marnie.Range.prototype.out.call(this, this._CHECK)){
                        callback();
                    }
                    return this;
                }
            };
        };
    },
    function(marnie){
        /**
         * Modelを表現します。
         * @param firstData
         * @returns {MegaStructure} このオブジェクトはイミュータブルです。
         * @constructor
         */
        marnie.MegaStructure = function(firstData){
            if(this.constructor !== marnie.MegaStructure){
                return new marnie.MegaStructure(firstData);
            }

            var lastData;
            if(typeof firstData === 'function'){
                lastData = firstData();
            }else if(typeof firstData === 'object'){
                lastData = firstData;
                this._mahyado(lastData);
            }else{
                lastData = firstData;
            }

            this.data = lastData;

            Object.freeze(this);
        };
        marnie.MegaStructure.prototype._mahyado = function(object){
            if(typeof object === 'object' && Object.isFrozen(object) === false){
                Object.freeze(object);
                Object.keys(object).forEach(function(key){
                    this._mahyado(object[key]);
                }, this);
            }
        };
        /**
         * データに対して必要な処理を行います。
         *
         * nextLayer()の目的は、データと処理を分離する事です。
         * ここで言う処理はMVCにおけるどの層にも当てはまります。
         * nextLayer()のコールバックはビジネスロジックかもしれないし、Viewかもしれないし、Controllerかもしれません。
         * どのような動作をすべきかはユーザが決定すべき事柄です。
         *
         * @param callback(data, layer)
         *              data (*):      this.dataです
         *              layer(object): プロトタイプチェーンされたオブジェクトを返します。
         *                             nextが呼ばれると、前のオブジェクトをプロトタイプに入れた新しい空のオブジェクトを生成し、layerに設定します。
         * @returns {{nextLayer: Function}} このメソッドは状態を持つオブジェクトを生成します。
         */
        marnie.MegaStructure.prototype.nextLayer = function(callback){
            var self = this;
            var Layer = function(){};
            var layer = new Layer;

            callback(this.data, layer);
            //freezeするとプロトタイプチェーンのいっこ上のプロパティが更新出来なくなる。
            //Object.freeze(layer);

            return {
                nextLayer:function(callback){
                    Layer.prototype = layer;
                    layer = new Layer;

                    callback(self.data, layer);
                    //Object.freeze(layer);

                    return this;
                }
            };
        };
    },
    function(marnie){
        /**
         * 指定行数以上の関数を指定した場合、処理を行わないようにします。
         * 処理を行わない場合、このクラスはログにその旨を出力します。
         * @param f
         * @returns {Taboo}
         * @constructor
         */
        marnie.Taboo = function(f){
            if(typeof f !== 'function'){
                console.log('関数を指定してください');
                return;
            }
            if(this.constructor !== marnie.Taboo){
                return new marnie.Taboo(f);
            }

            if(this.isExecute(f)){
                f();
            }else{
                console.log('関数が' + this.LINE + '行を超えています。処理の分割を検討してください');
            }
        };

        marnie.Taboo.prototype.LINE = 100;

        marnie.Taboo.prototype.isExecute = function(f){
            var code = f.toString();
            var line = code.split('\n').length;

            return line <= this.LINE;
        };
    }
]);